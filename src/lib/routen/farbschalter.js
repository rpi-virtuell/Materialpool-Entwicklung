/**
 * Farbschalter (Prototyp Materialpool 2.0): CI-Farbe zum Ausprobieren,
 * ohne JavaScript. Ein GET-Formular schickt `primaryColor`; der Server
 * merkt sich die Farbe in einem Cookie, damit sie beim Weiterklicken
 * bleibt. Reine Funktionen, kennt keine Komponente.
 */
import { STANDARD_CI } from '../models/farben.js';

/** Name des Cookies und des Query-Parameters. */
export const CI_PARAMETER = 'primaryColor';

/** @param {string|null|undefined} roh */
function gueltig(roh) {
  return roh && /^#[0-9a-fA-F]{6}$/.test(roh) ? roh.toLowerCase() : null;
}

/**
 * Welche Farbe gilt und was mit dem Cookie geschieht. Hex-Feld und
 * Farbfeld schicken beide `primaryColor` (in dieser Reihenfolge); es gilt
 * der erste gültige Wert, der sich von der angezeigten Farbe unterscheidet
 * — das ist das Feld, das geändert wurde. Angezeigt war die Farbe aus dem
 * Cookie, ohne Cookie das Standardblau. Leer oder unbrauchbar heißt:
 * zurücksetzen.
 * @param {URLSearchParams} params
 * @param {string|undefined} cookie
 * @returns {{ farbe: string|null, cookie: 'setzen'|'loeschen'|null }}
 */
export function farbwahlLesen(params, cookie) {
  const bisher = gueltig(cookie);
  if (!params.has(CI_PARAMETER)) return { farbe: bisher, cookie: null };
  const werte = params.getAll(CI_PARAMETER).map(gueltig).filter((w) => w !== null);
  if (werte.length === 0) return { farbe: null, cookie: 'loeschen' };
  const angezeigt = bisher ?? STANDARD_CI;
  return { farbe: werte.find((w) => w !== angezeigt) ?? werte[0], cookie: 'setzen' };
}

/**
 * Daten des Formulars: Ziel ist die aktuelle Seite, ihre übrigen
 * Parameter reisen als versteckte Felder mit (ohne `seite` — eine neue
 * Farbe beginnt oben). Führende Schrägstriche fallen auf einen zusammen:
 * Ein Pfad `//evil.example` wäre als `action` eine fremde Adresse.
 * @param {URL} url
 * @param {string|null} farbe
 */
export function farbschalterBilden(url, farbe) {
  /** @type {[string, string][]} */
  const felder = [...url.searchParams].filter(([name]) => name !== CI_PARAMETER && name !== 'seite');
  const zuruecksetzen = new URLSearchParams(felder);
  zuruecksetzen.append(CI_PARAMETER, '');
  const pfad = url.pathname.replace(/^\/+/, '/');
  return {
    aktion: pfad,
    farbe: farbe ?? STANDARD_CI,
    felder,
    zuruecksetzenPfad: `${pfad}?${zuruecksetzen}`,
    gesetzt: farbe !== null
  };
}
