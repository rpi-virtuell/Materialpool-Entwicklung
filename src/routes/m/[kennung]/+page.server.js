import { error } from '@sveltejs/kit';
import { materialLaden, zurueckZiel } from '$lib/routen/material.js';
import { MERKLISTE_COOKIE, merklisteLesen, merkSchluessel } from '$lib/routen/merkliste.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/** @type {import('./$types').PageServerLoad} */
export function load({ params, cookies, request, url }) {
  const treffer = materialLaden({ inhalt: spiegelHolen().lesen(), kennung: params.kennung });
  if (!treffer) {
    error(404, `Kein Material mit dieser Kennung im Spiegel. Der Spiegel kennt nur, was die konfigurierten Relays geliefert haben.`);
  }
  const schluessel = merkSchluessel(treffer.material);
  return {
    ...treffer,
    // „Zurück“ ohne JavaScript: auf die Liste, Merkliste oder Startseite, von der man kam.
    zurueck: zurueckZiel(request.headers.get('referer'), url.origin, url.pathname),
    merken: { schluessel, gemerkt: merklisteLesen(cookies.get(MERKLISTE_COOKIE)).includes(schluessel) }
  };
}
