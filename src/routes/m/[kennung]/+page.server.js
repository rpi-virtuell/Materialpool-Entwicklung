import { error } from '@sveltejs/kit';
import { materialLaden } from '$lib/routen/material.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
  const treffer = materialLaden({ inhalt: spiegelHolen().lesen(), kennung: params.kennung });
  if (!treffer) {
    error(404, `Kein Material mit dieser Kennung im Spiegel. Der Spiegel kennt nur, was die konfigurierten Relays geliefert haben.`);
  }
  return treffer;
}
