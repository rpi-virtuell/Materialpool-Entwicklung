/**
 * Regeln der Link-Prüfung (ADR-0010), reine Funktionen: Wann ist ein Link
 * weg, wann wird ein Material ausgeblendet, wann wird neu geprüft. Das
 * Anfragen selbst macht `services/linkpruefung.js`.
 */

/** @typedef {'ok'|'weg'|'unklar'} Bewertung */

/**
 * @typedef {object} Linkeintrag
 * @property {number|null} status   letzter HTTP-Status, null ohne Antwort
 * @property {Bewertung} bewertung  letzte Bewertung
 * @property {number} wegInFolge    „weg“ hintereinander; „ok“ setzt zurück
 * @property {string} geprueft      ISO-Zeitpunkt der letzten Prüfung
 * @property {string|null} [wegSeit]  ISO-Zeitpunkt des ersten „weg“ dieser Folge; „ok“ löscht ihn
 */

/** Ab so vielen „weg“ hintereinander ist ein Material ausgeblendet. */
export const WEG_SCHWELLE = 2;

/**
 * Nur 404 und 410 sagen eindeutig „gibt es nicht“. 403, 429, 5xx und
 * keine Antwort sind unklar: Server sperren Prüfprogramme aus oder sind
 * kurz weg.
 * @param {number|null} status
 * @returns {Bewertung}
 */
export function bewerten(status) {
  if (status === 404 || status === 410) return 'weg';
  if (status !== null && status >= 200 && status < 400) return 'ok';
  return 'unklar';
}

/**
 * @param {Linkeintrag|undefined} alt
 * @param {Bewertung} bewertung
 * @param {number|null} status
 * @param {number} jetzt  ms seit 1970
 * @returns {Linkeintrag}
 */
export function fortschreiben(alt, bewertung, status, jetzt) {
  const bisher = alt?.wegInFolge ?? 0;
  const wegInFolge = bewertung === 'weg' ? bisher + 1 : bewertung === 'ok' ? 0 : bisher;
  const geprueft = new Date(jetzt).toISOString();
  const wegSeit = wegInFolge === 0 ? null : (alt?.wegSeit ?? geprueft);
  return { status, bewertung, wegInFolge, geprueft, wegSeit };
}

/** @param {Linkeintrag|undefined} eintrag */
export function ausgeblendet(eintrag) {
  return (eintrag?.wegInFolge ?? 0) >= WEG_SCHWELLE;
}

/**
 * Nie geprüft: sofort. Nach einem „weg“ schon nach `nachpruefMs`, damit
 * ein toter Link nicht eine Woche auf seine Bestätigung wartet; sonst nach
 * `intervallMs`.
 * @param {Linkeintrag|undefined} eintrag
 * @param {number} jetzt
 * @param {{ intervallMs: number, nachpruefMs: number }} regeln
 */
export function faellig(eintrag, jetzt, regeln) {
  if (!eintrag) return true;
  const abstand = eintrag.wegInFolge > 0 ? regeln.nachpruefMs : regeln.intervallMs;
  return jetzt - Date.parse(eintrag.geprueft) >= abstand;
}

/** @param {unknown} url */
export function pruefbar(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}
