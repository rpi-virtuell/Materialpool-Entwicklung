import { ausgeblendeteLaden } from '$lib/routen/ausgeblendet.js';
import { linkpruefungHolen } from '$lib/services/linkpruefung.js';
import { meldungenHolen } from '$lib/services/meldungen.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/**
 * Was die Link-Prüfung ausgeblendet hat (ADR-0010), damit jemand bei den
 * Anbietern nachfragen kann — und was nach Meldungen fehlt (ADR-0011).
 * @type {import('./$types').PageServerLoad}
 */
export function load() {
  const meldungen = meldungenHolen();
  return ausgeblendeteLaden({
    inhalt: spiegelHolen().lesen(),
    eintrag: linkpruefungHolen().eintrag,
    meldungen: meldungen.an ? meldungen.alle() : []
  });
}
