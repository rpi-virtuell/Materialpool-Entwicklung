/**
 * Materialien eines Spiegelstands, einmal berechnet je Stand. Der Spiegel
 * tauscht seinen Inhalt atomar als neues Objekt ein; solange dasselbe
 * Objekt gelesen wird, bleibt die Umwandlung der Events gültig. Bei 7.700
 * Events spart das je Anfrage die komplette Neuberechnung.
 *
 * Adressiert ist ein Material über (pubkey, d) (ADR-0008): Dasselbe `d`
 * kann jeder Schlüssel publizieren. Ist es im Bestand mehrdeutig, nennen
 * die Pfade den Schlüssel (`?von=`); sonst bleiben sie, wie sie waren.
 */
import { materialAusEvent, mitVon } from '../models/material.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/relay.js').Event} Event */
/** @typedef {import('../models/material.js').Material} Material */

/** @type {WeakMap<Inhalt, Material[]>} */
const speicher = new WeakMap();
/** @type {WeakMap<Inhalt, Map<string, Event[]>>} */
const adressen = new WeakMap();

/** @param {Event} e */
export function dVon(e) {
  return e.tags.find((t) => t[0] === 'd')?.[1] ?? '';
}

/**
 * `d` → Events des Bestands mit diesem `d`, je Schlüssel eines.
 * @param {Inhalt} inhalt
 * @returns {Map<string, Event[]>}
 */
export function adressenVon(inhalt) {
  let nachD = adressen.get(inhalt);
  if (!nachD) {
    nachD = new Map();
    for (const e of inhalt.materialien) {
      const d = dVon(e);
      const liste = nachD.get(d);
      if (liste) liste.push(e);
      else nachD.set(d, [e]);
    }
    adressen.set(inhalt, nachD);
  }
  return nachD;
}

/**
 * Braucht der Pfad zu diesem Event den Schlüssel? Ja, wenn `/m/<d>` allein
 * mehr als ein Event meinen könnte — oder ein anderes als dieses (ein
 * Suchtreffer, dessen `d` im Bestand ein anderer Schlüssel hält).
 * @param {Inhalt} inhalt @param {Event} e
 */
export function vonNoetig(inhalt, e) {
  const kandidaten = adressenVon(inhalt).get(dVon(e)) ?? [];
  return kandidaten.length > 1 || (kandidaten.length === 1 && kandidaten[0].pubkey !== e.pubkey);
}

/**
 * Ein Event als Material, mit Pfaden im Licht dieses Bestands.
 * @param {Inhalt} inhalt @param {Event} e
 * @returns {Material}
 */
export function materialImBestand(inhalt, e) {
  const m = materialAusEvent(e);
  return vonNoetig(inhalt, e) ? mitVon(m) : m;
}

/**
 * @param {Inhalt} inhalt
 * @returns {Material[]}
 */
export function materialienVon(inhalt) {
  let materialien = speicher.get(inhalt);
  if (!materialien) {
    materialien = inhalt.materialien.map((e) => materialImBestand(inhalt, e));
    speicher.set(inhalt, materialien);
  }
  return materialien;
}
