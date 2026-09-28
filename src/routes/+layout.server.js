import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
  const spiegel = spiegelHolen();
  const inhalt = spiegel.lesen();
  const fehlschlag = spiegel.letzterFehlschlag();
  return {
    spiegelstand: {
      zeitpunkt: inhalt.stand?.zeitpunkt ?? null,
      anzahl: inhalt.stand?.anzahl.materialien ?? 0,
      // Nur wenn der letzte Lauf scheiterte, ist das Alter eine Nachricht.
      veraltet: fehlschlag !== null,
      relays: konfigLesen(env).relays
    }
  };
}
