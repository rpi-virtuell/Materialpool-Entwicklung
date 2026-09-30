import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { ciFarbeLesen } from '$lib/models/farben.js';
import { vorname } from '$lib/models/konto.js';
import { CI_PARAMETER, farbschalterBilden, farbwahlLesen } from '$lib/routen/farbschalter.js';
import { KONTO_COOKIE, kontoLesen, mitProfil } from '$lib/routen/konto.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/** Ein Jahr: Die ausprobierte Farbe bleibt, bis jemand zurücksetzt. */
const CI_COOKIE_DAUER_S = 60 * 60 * 24 * 365;

/** @type {import('./$types').LayoutServerLoad} */
export function load({ url, cookies }) {
  const spiegel = spiegelHolen();
  const inhalt = spiegel.lesen();
  const fehlschlag = spiegel.letzterFehlschlag();
  // CI-Farbe zur Laufzeit (Prototyp 9), serverseitig gelesen:
  // ?primaryColor=%23RRGGBB oder der Farbschalter; gemerkt im Cookie.
  const wahl = farbwahlLesen(url.searchParams, cookies.get(CI_PARAMETER));
  if (wahl.cookie === 'setzen' && wahl.farbe) {
    cookies.set(CI_PARAMETER, wahl.farbe, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: CI_COOKIE_DAUER_S });
  } else if (wahl.cookie === 'loeschen') {
    cookies.delete(CI_PARAMETER, { path: '/' });
  }
  // Kontoebene (ADR-0006): nur, was die Kopfzeile braucht.
  const konto = kontoLesen(cookies.get(KONTO_COOKIE));
  return {
    kopf: { angemeldet: konto.angemeldet, vorname: vorname(konto), stoebernPfad: mitProfil('/materialien', konto) },
    ci: ciFarbeLesen(wahl.farbe),
    farbschalter: farbschalterBilden(url, wahl.farbe),
    spiegelstand: {
      zeitpunkt: inhalt.stand?.zeitpunkt ?? null,
      anzahl: inhalt.stand?.anzahl.materialien ?? 0,
      // Nur wenn der letzte Lauf scheiterte, ist das Alter eine Nachricht.
      veraltet: fehlschlag !== null,
      relays: konfigLesen(env).relays
    }
  };
}
