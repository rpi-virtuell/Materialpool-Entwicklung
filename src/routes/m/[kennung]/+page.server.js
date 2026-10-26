import { randomUUID } from 'node:crypto';
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { imLetztenTag } from '$lib/models/meldung.js';
import { materialLaden, zurueckZiel } from '$lib/routen/material.js';
import {
  GEMELDET_COOKIE, gemeldetLesen, gemeldetMerken, meldenBilden, meldenVerarbeiten, meldungsBrief, stempelAusstellen
} from '$lib/routen/meldungen.js';
import { MERKLISTE_COOKIE, merklisteLesen, merkSchluessel } from '$lib/routen/merkliste.js';
import { linkpruefungHolen } from '$lib/services/linkpruefung.js';
import { formularGeheimnis, meldungAblegen, meldungenHolen } from '$lib/services/meldungen.js';
import { postVerschicken } from '$lib/services/post.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/** Ein Jahr, wie die Merkliste. */
const GEMELDET_DAUER_S = 60 * 60 * 24 * 365;

/** @param {{ kennung: string }} params @param {URL} url */
function finden(params, url) {
  const treffer = materialLaden({
    inhalt: spiegelHolen().lesen(),
    d: params.kennung,
    von: url.searchParams.get('von'),
    vorrang: konfigLesen(env).vorrang
  });
  if (!treffer) {
    error(404, `Kein Material mit dieser Kennung im Spiegel. Der Spiegel kennt nur, was die konfigurierten Relays geliefert haben.`);
  }
  return treffer;
}

/** @type {import('./$types').PageServerLoad} */
export function load({ params, cookies, request, url }) {
  const treffer = finden(params, url);
  const schluessel = merkSchluessel(treffer.material);
  const meldungen = meldungenHolen();
  return {
    ...treffer,
    // „Zurück“ ohne JavaScript: auf die Liste, Merkliste oder Startseite, von der man kam.
    zurueck: zurueckZiel(request.headers.get('referer'), url.origin, url.pathname),
    merken: { schluessel, gemerkt: merklisteLesen(cookies.get(MERKLISTE_COOKIE)).includes(schluessel) },
    // Link-Prüfung (ADR-0010): erreichbar bleibt die Seite, nur ohne „Material öffnen“.
    linkWeg: linkpruefungHolen().weg(treffer.material.url),
    // Meldefunktion (ADR-0011): Hinweis je Stand und das Formular.
    melden: meldenBilden({
      material: treffer.material,
      stand: meldungen.stand(schluessel),
      gemeldetHier: gemeldetLesen(cookies.get(GEMELDET_COOKIE)).includes(schluessel),
      an: meldungen.an,
      stempel: stempelAusstellen(formularGeheimnis(), Date.now())
    })
  };
}

/**
 * Meldung abschicken (ADR-0011): ablegen, der Redaktion schreiben, dann
 * zurück auf die Detailseite (Post/Redirect/Get). Bei Fehlern rendert die
 * Seite das Formular aufgeklappt mit der Eingabe.
 * @type {import('./$types').Actions}
 */
export const actions = {
  melden: async ({ request, params, url, cookies }) => {
    const { material } = finden(params, url);
    const meldungen = meldungenHolen();
    if (!meldungen.an) error(404, 'Die Meldefunktion ist abgeschaltet.');
    const formular = await request.formData();
    const schluessel = merkSchluessel(material);
    const gemeldet = gemeldetLesen(cookies.get(GEMELDET_COOKIE));
    const jetzt = Date.now();
    const ergebnis = meldenVerarbeiten({
      formular: {
        grund: formular.get('grund'),
        begruendung: formular.get('begruendung'),
        falle: formular.get('webseite'),
        stempel: formular.get('stempel')
      },
      material,
      schonGemeldet: gemeldet.includes(schluessel),
      heute: imLetztenTag(meldungen.alle(), jetzt),
      jeTag: konfigLesen(env).meldungen.jeTag,
      geheimnis: formularGeheimnis(),
      jetzt,
      id: randomUUID()
    });
    if (ergebnis.art === 'fehler') return fail(ergebnis.status, { melden: { fehler: ergebnis.fehler, werte: ergebnis.werte } });
    if (ergebnis.art === 'ablegen') {
      const stand = await meldungAblegen(ergebnis.meldung);
      // Nicht abwarten: Der Versand wirft nie und steht sonst im Protokoll.
      void postVerschicken(meldungsBrief({ meldung: ergebnis.meldung, stand, origin: url.origin }));
    }
    cookies.set(GEMELDET_COOKIE, JSON.stringify(gemeldetMerken(gemeldet, schluessel)), { path: '/', httpOnly: true, sameSite: 'lax', maxAge: GEMELDET_DAUER_S });
    redirect(303, `${material.pfad}#melden`);
  }
};
