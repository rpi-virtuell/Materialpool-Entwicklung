import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { materialLaden } from '$lib/routen/material.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/** @type {import('./$types').PageServerLoad} */
export function load({ params, url }) {
  const treffer = materialLaden({
    inhalt: spiegelHolen().lesen(),
    d: params.kennung,
    von: url.searchParams.get('von'),
    vorrang: konfigLesen(env).vorrang
  });
  if (!treffer) {
    error(404, `Kein Material mit dieser Kennung im Spiegel. Der Spiegel kennt nur, was die konfigurierten Relays geliefert haben.`);
  }
  return treffer;
}
