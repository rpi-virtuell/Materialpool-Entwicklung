import { json, error } from '@sveltejs/kit';
import { eventFinden } from '$lib/routen/material.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/**
 * Entwickleransicht: das rohe Event samt Herkunft. Läuft durch dieselbe
 * Suche wie die Seite — keine zweite Implementierung.
 * @type {import('./$types').RequestHandler}
 */
export function GET({ params }) {
  const treffer = eventFinden({ inhalt: spiegelHolen().lesen(), d: params.kennung });
  if (!treffer) error(404, 'Kein Material mit dieser Kennung im Spiegel.');
  return json(treffer);
}
