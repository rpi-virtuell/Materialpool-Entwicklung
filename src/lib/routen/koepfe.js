/**
 * Kopfzeilen jeder Antwort, gesetzt in `hooks.server.js`. Reine
 * Funktionen, kennt keine Komponente.
 */

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
 * @param {{ entwicklung?: boolean }} [lage]  im Dev-Server braucht Vite eigene Skripte
 * @returns {Record<string, string>}
 */
export function antwortKoepfe(lage = {}) {
  /** @type {Record<string, string>} */
  const koepfe = {};
  if (!lage.entwicklung) koepfe['content-security-policy'] = SICHERHEITSRICHTLINIE;
  return koepfe;
}
