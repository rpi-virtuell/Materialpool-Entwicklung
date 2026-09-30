import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { KONTO_COOKIE, kontoLesen } from '$lib/routen/konto.js';
import { startseiteLaden } from '$lib/routen/startseite.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ parent, cookies }) {
  const { ci } = await parent();
  const spiegel = spiegelHolen();
  return startseiteLaden({
    inhalt: spiegel.lesen(),
    fehlschlag: spiegel.letzterFehlschlag(),
    relays: konfigLesen(env).relays,
    palette: ci?.palette,
    konto: kontoLesen(cookies.get(KONTO_COOKIE))
  });
}
