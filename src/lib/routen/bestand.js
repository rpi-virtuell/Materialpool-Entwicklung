/**
 * Materialien eines Spiegelstands, einmal berechnet je Stand. Der Spiegel
 * tauscht seinen Inhalt atomar als neues Objekt ein; solange dasselbe
 * Objekt gelesen wird, bleibt die Umwandlung der Events gültig. Bei 7.700
 * Events spart das je Anfrage die komplette Neuberechnung.
 */
import { materialAusEvent } from '../models/material.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../models/material.js').Material} Material */

/** @type {WeakMap<Inhalt, Material[]>} */
const speicher = new WeakMap();

/**
 * @param {Inhalt} inhalt
 * @returns {Material[]}
 */
export function materialienVon(inhalt) {
  let materialien = speicher.get(inhalt);
  if (!materialien) {
    materialien = inhalt.materialien.map(materialAusEvent);
    speicher.set(inhalt, materialien);
  }
  return materialien;
}
