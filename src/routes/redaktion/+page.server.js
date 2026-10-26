import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { ausgeblendeteLaden } from '$lib/routen/ausgeblendet.js';
import { REDAKTION_COOKIE, redaktionLaden, zugangErlaubt, zugangsMarke } from '$lib/routen/meldungen.js';
import { linkpruefungHolen } from '$lib/services/linkpruefung.js';
import { meldungEntscheiden, meldungenHolen } from '$lib/services/meldungen.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** 30 Tage angemeldet, dann wieder das Kennwort. */
const ZUGANG_DAUER_S = 60 * 60 * 24 * 30;
const SCHLUESSEL = /^[0-9a-f]{12}$/;

const kennwort = () => konfigLesen(env).meldungen.kennwort;

/**
 * Redaktionsseite (ADR-0011): nie zwischenspeichern, nie in Suchmaschinen.
 * @type {import('./$types').PageServerLoad}
 */
export function load({ cookies, setHeaders }) {
  setHeaders({ 'cache-control': 'private, no-store' });
  const k = kennwort();
  if (!zugangErlaubt(k, cookies.get(REDAKTION_COOKIE))) return { zugang: false, kennwortNoetig: true, offen: [], ausgeblendet: [], toteLinks: [] };
  const inhalt = spiegelHolen().lesen();
  return {
    zugang: true,
    kennwortNoetig: k !== '',
    ...redaktionLaden({ inhalt, meldungen: meldungenHolen().alle() }),
    // Tote Links (ADR-0010, Nachtrag 2026-10-26): nur noch hier.
    toteLinks: ausgeblendeteLaden({ inhalt, eintrag: linkpruefungHolen().eintrag }).eintraege
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  anmelden: async ({ request, cookies }) => {
    const k = kennwort();
    const eingabe = (await request.formData()).get('kennwort');
    if (k !== '' && (typeof eingabe !== 'string' || !zugangErlaubt(k, zugangsMarke(eingabe)))) {
      return fail(403, { fehler: 'Das Kennwort stimmt nicht.' });
    }
    cookies.set(REDAKTION_COOKIE, zugangsMarke(k), { path: '/redaktion', httpOnly: true, sameSite: 'strict', maxAge: ZUGANG_DAUER_S });
    redirect(303, '/redaktion');
  },
  abmelden: ({ cookies }) => {
    cookies.delete(REDAKTION_COOKIE, { path: '/redaktion' });
    redirect(303, '/redaktion');
  },
  entscheiden: async ({ request, cookies }) => {
    if (!zugangErlaubt(kennwort(), cookies.get(REDAKTION_COOKIE))) error(403, 'Bitte zuerst das Kennwort der Redaktion eingeben.');
    const formular = await request.formData();
    const material = formular.get('material');
    if (typeof material !== 'string' || !SCHLUESSEL.test(material)) error(400, 'Unbekanntes Material.');
    await meldungEntscheiden(material, formular.get('entscheidung'), Date.now());
    redirect(303, '/redaktion');
  }
};
