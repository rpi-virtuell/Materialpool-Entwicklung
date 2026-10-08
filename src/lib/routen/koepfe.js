/**
 * Kopfzeilen jeder Antwort, gesetzt in `hooks.server.js`. Reine
 * Funktionen, kennt keine Komponente.
 */
import { CI_PARAMETER } from './farbschalter.js';
import { KONTO_COOKIE } from './konto.js';
import { MERKLISTE_COOKIE } from './merkliste.js';

/**
 * Content-Security-Policy: Es gibt kein Client-JavaScript (`csr = false`),
 * also darf kein Skript laufen — auch keins, das über Event-Daten in die
 * Seite geriete. Styles stehen in eigenen Dateien, in `<style>`-Blöcken und
 * als Inline-Variablen (`--kachel-color`), darum `'unsafe-inline'` nur für
 * Styles. Bilder kommen von den Adressen der Materialien, auch `http:`.
 */
export const SICHERHEITSRICHTLINIE = [
  "default-src 'self'",
  "script-src 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: http: data:",
  "font-src 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'"
].join('; ');

/**
 * Mit Konto-, Farb- oder Merklisten-Cookie ist die Seite persönlich
 * (Begrüßung, Profil, Farbe, Gemerktes): Kein gemeinsamer Cache darf sie
 * speichern und anderen zeigen.
 * `Vary: Cookie` sagt dasselbe jedem Cache, der den Cookie nicht kennt.
 * @param {{ entwicklung?: boolean, cookie?: (name: string) => string|undefined }} [lage]
 *   `entwicklung`: im Dev-Server braucht Vite eigene Skripte
 * @returns {Record<string, string>}
 */
export function antwortKoepfe(lage = {}) {
  /** @type {Record<string, string>} */
  const koepfe = { vary: 'Cookie' };
  if (!lage.entwicklung) koepfe['content-security-policy'] = SICHERHEITSRICHTLINIE;
  if ([KONTO_COOKIE, CI_PARAMETER, MERKLISTE_COOKIE].some((name) => lage.cookie?.(name))) koepfe['cache-control'] = 'private, no-store';
  return koepfe;
}
