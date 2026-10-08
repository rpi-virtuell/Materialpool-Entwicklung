/**
 * Kleine Textregeln für Eingaben aus Adresse, Formular und Cookie. Reine
 * Funktionen, kennt keine Komponente.
 */

/**
 * Höchstlänge eines Suchtexts in Zeichen. Länger sucht niemand von Hand;
 * die Grenze hält Relay-Anfragen, Deutung und Umleitungsadressen klein.
 */
export const SUCHTEXT_MAX = 200;

/**
 * Höchstens `max` Zeichen, gezählt in Codepoints — `slice` auf der
 * Zeichenkette zerbräche ein Emoji in eine halbe Surrogat-Hälfte.
 * @param {string} text @param {number} max
 */
export function kuerzen(text, max) {
  if (text.length <= max) return text;
  const zeichen = Array.from(text);
  return zeichen.length <= max ? text : zeichen.slice(0, max).join('');
}
