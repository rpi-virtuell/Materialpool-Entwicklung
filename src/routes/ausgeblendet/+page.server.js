import { ausgeblendeteLaden } from '$lib/routen/ausgeblendet.js';
import { linkpruefungHolen } from '$lib/services/linkpruefung.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/**
 * Was die Link-Prüfung ausgeblendet hat (ADR-0010), damit jemand bei den
 * Anbietern nachfragen kann.
 * @type {import('./$types').PageServerLoad}
 */
export function load() {
  return ausgeblendeteLaden({ inhalt: spiegelHolen().lesen(), eintrag: linkpruefungHolen().eintrag });
}
