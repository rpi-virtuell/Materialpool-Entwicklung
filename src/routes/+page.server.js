import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { KONTO_COOKIE, kontoLesen } from '$lib/routen/konto.js';
import { MERKLISTE_COOKIE, merklisteLesen, merkSchluessel } from '$lib/routen/merkliste.js';
import { startseiteLaden } from '$lib/routen/startseite.js';
import { linkpruefungHolen } from '$lib/services/linkpruefung.js';
import { meldungenHolen } from '$lib/services/meldungen.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ parent, cookies }) {
  const { ci } = await parent();
  const spiegel = spiegelHolen();
  const meldungen = meldungenHolen();
  return startseiteLaden({
    inhalt: spiegel.lesen(),
    fehlschlag: spiegel.letzterFehlschlag(),
    relays: konfigLesen(env).relays,
    palette: ci?.palette,
    konto: kontoLesen(cookies.get(KONTO_COOKIE)),
    merkKeys: merklisteLesen(cookies.get(MERKLISTE_COOKIE)),
    weg: linkpruefungHolen().weg,
    verborgen: (m) => meldungen.verborgen(merkSchluessel(m))
  });
}
