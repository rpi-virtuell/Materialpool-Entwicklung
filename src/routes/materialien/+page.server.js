import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { frageHinweis, frageUmleitung } from '$lib/routen/frage.js';
import { filterLesen, listeLaden } from '$lib/routen/uebersicht.js';
import { relaySuche, spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
  // Ein Satz in eigenen Worten wird zur gedeuteten Suche (routen/frage.js).
  const ziel = frageUmleitung(url.searchParams);
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
    frage: frageHinweis(url.searchParams)
  });
}
