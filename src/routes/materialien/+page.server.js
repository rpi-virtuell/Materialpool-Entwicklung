import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { filterLesen, listeLaden } from '$lib/routen/uebersicht.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export function load({ url }) {
  const spiegel = spiegelHolen();
  return listeLaden({
    inhalt: spiegel.lesen(),
    fehlschlag: spiegel.letzterFehlschlag(),
    relays: konfigLesen(env).relays,
    filter: filterLesen(url.searchParams)
  });
}
