import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { ciFarbeLesen } from '$lib/models/farben.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ url }) {
  const spiegel = spiegelHolen();
  const inhalt = spiegel.lesen();
  const fehlschlag = spiegel.letzterFehlschlag();
  return {
    // CI-Farbe zur Laufzeit (Prototyp 9), serverseitig gelesen: ?primaryColor=%23RRGGBB
    ci: ciFarbeLesen(url.searchParams.get('primaryColor')),
    spiegelstand: {
      zeitpunkt: inhalt.stand?.zeitpunkt ?? null,
      anzahl: inhalt.stand?.anzahl.materialien ?? 0,
      // Nur wenn der letzte Lauf scheiterte, ist das Alter eine Nachricht.
      veraltet: fehlschlag !== null,
      relays: konfigLesen(env).relays
    }
  };
}
