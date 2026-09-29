import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { filterLesen, listeLaden } from '$lib/routen/uebersicht.js';
import { relaySuche, spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
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
    suche
  });
}
