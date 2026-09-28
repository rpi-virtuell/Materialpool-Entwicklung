/**
 * Daten der Startseite aus dem Spiegel. Kennt keine Komponente.
 */
import { ABFRAGEGRUND_TEXT } from '../services/spiegel.js';
import { materialAusEvent } from '../models/material.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/spiegel.js').Fehlschlag} Fehlschlag */
/** @typedef {import('../models/material.js').Material} Material */

/**
 * Erklärt eine leere Liste — nie eine leere Liste ohne Erklärung (CLAUDE.md).
 * @param {Inhalt} inhalt
 * @param {Fehlschlag|null} fehlschlag
 * @param {string[]} relays
 * @returns {string|null}
 */
export function leerstandErklaeren(inhalt, fehlschlag, relays) {
  if (inhalt.materialien.length > 0) return null;
  if (fehlschlag?.grund) {
    return `${ABFRAGEGRUND_TEXT[fehlschlag.grund]} Gefragt: ${fehlschlag.gefragteRelays.join(', ')}.`;
  }
  if (inhalt.stand === null) {
    return `Der Spiegel hat noch keinen Stand. Erster Lauf gegen ${relays.join(', ')} läuft oder steht aus.`;
  }
  return `Die Relays ${inhalt.stand.gefragteRelays.join(', ')} haben geantwortet, aber kein Material (kind:30142) geliefert. Prüfen: QUELLE_AUTOREN in .env und ob dort schon publiziert wurde.`;
}

/**
 * @param {{ inhalt: Inhalt, fehlschlag: Fehlschlag|null, relays: string[] }} eingabe
 * @returns {{ materialien: Material[], leerstand: string|null, breit: true }}
 */
export function startLaden({ inhalt, fehlschlag, relays }) {
  return {
    materialien: inhalt.materialien.map(materialAusEvent),
    leerstand: leerstandErklaeren(inhalt, fehlschlag, relays),
    breit: true
  };
}
