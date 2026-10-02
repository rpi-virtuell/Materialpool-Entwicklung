import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { frageHinweis, frageUmleitung } from '$lib/routen/frage.js';
import { KONTO_COOKIE, kontoLesen, profilEinsetzen, profilHinweis } from '$lib/routen/konto.js';
import { MERKLISTE_COOKIE, merklisteLesen } from '$lib/routen/merkliste.js';
import { filterLesen, listeLaden, listenPfad } from '$lib/routen/uebersicht.js';
import { relaySuche, spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, cookies }) {
  const konto = kontoLesen(cookies.get(KONTO_COOKIE));
  // Einstieg mit profil=1: Stufe und Fach aus dem Profil (ADR-0006), dann
  // ein Satz in eigenen Worten (routen/frage.js) — „für Kinder“ schlägt
  // die Stufe aus dem Profil. Beides endet in einer Umleitung auf die
  // fertige Adresse, damit Links und Zurück-Knopf stimmen.
  const mitProfil = profilEinsetzen(url.searchParams, konto);
  const params = mitProfil ?? url.searchParams;
  const ziel = frageUmleitung(params) ?? (mitProfil ? listenPfad(filterLesen(params)) : null);
  if (ziel) redirect(303, ziel);

  const konfig = konfigLesen(env);
  const spiegel = spiegelHolen();
  const filter = filterLesen(url.searchParams);
  // Suchtext → Volltextsuche am Relay (NIP-50, ADR-0005); Facetten und
  // Seiten arbeiten auf den Treffern. Ohne Text bleibt alles im Spiegel.
  const suche = filter.q ? await relaySuche(konfig, filter.q) : null;
  return listeLaden({
    inhalt: spiegel.lesen(),
    fehlschlag: spiegel.letzterFehlschlag(),
    relays: konfig.relays,
    filter,
    suche,
    frage: frageHinweis(url.searchParams),
    profilHinweis: profilHinweis(filter, konto),
    merkKeys: merklisteLesen(cookies.get(MERKLISTE_COOKIE))
  });
}
