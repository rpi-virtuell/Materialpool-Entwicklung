/**
 * Merkliste (Prototyp Materialpool 2.0; ADR-0008): Wer ein Material
 * wiederfinden will, merkt es sich mit dem Lesezeichen auf Karte oder
 * Detailseite und findet es unter „Gemerkt“. Ohne JavaScript: Das
 * Lesezeichen ist ein POST-Formular, die Liste liegt als Cookie in diesem
 * Browser, unabhängig von der Anmeldung. Der Server speichert nichts.
 * Reine Funktionen, kennt keine Komponente.
 */
import { createHash } from 'node:crypto';
import { coverFarben } from '../models/farben.js';
import { TYPEN } from '../models/typen.js';
import { materialienVon } from './bestand.js';

/** @typedef {import('../models/material.js').Material} Material */
/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */

export const MERKLISTE_COOKIE = 'merkliste';
/** 200 Schlüssel à 12 Zeichen bleiben im Cookie deutlich unter 4 kB. */
export const MERKLISTE_MAX = 200;
const SCHLUESSEL = /^[0-9a-f]{12}$/;

/**
 * Kurzer, stabiler Schlüssel je Material: die ersten 12 Hex-Zeichen von
 * SHA-256 über `d` — dieselbe Adresse, über die die Detailseite das
 * Material findet. Die Event-id taugt nicht: Sie ändert sich mit jeder
 * neuen Fassung des ersetzbaren Events.
 * @param {Pick<Material, 'd'>} material
 */
export function merkSchluessel(material) {
  return createHash('sha256').update(material.d).digest('hex').slice(0, 12);
}

/** @param {string|undefined} roh @returns {string[]} */
export function merklisteLesen(roh) {
  if (!roh) return [];
  try {
    const d = JSON.parse(roh);
    if (!Array.isArray(d)) return [];
    return [...new Set(d.filter((k) => typeof k === 'string' && SCHLUESSEL.test(k)))].slice(0, MERKLISTE_MAX);
  } catch {
    return [];
  }
}

/** @param {string[]} keys */
export function merklisteSchreiben(keys) {
  return JSON.stringify(keys);
}

/**
 * Gemerkt → entfernen, sonst vorne anfügen. Unbrauchbare Schlüssel
 * ändern nichts.
 * @param {string[]} keys @param {unknown} key
 */
export function umschalten(keys, key) {
  if (typeof key !== 'string' || !SCHLUESSEL.test(key)) return keys;
  if (keys.includes(key)) return keys.filter((k) => k !== key);
  return [key, ...keys].slice(0, MERKLISTE_MAX);
}

/**
 * Wohin es nach dem Merken zurückgeht: nur auf eigene Seiten.
 * @param {unknown} roh
 */
export function zurueckPfad(roh) {
  return typeof roh === 'string' && roh.startsWith('/') && !roh.startsWith('//') ? roh : '/merkliste';
}

/** @type {WeakMap<Inhalt, Map<string, Material>>} */
const nachSchluessel = new WeakMap();

/** @param {Inhalt} inhalt */
function verzeichnis(inhalt) {
  let v = nachSchluessel.get(inhalt);
  if (!v) {
    v = new Map(materialienVon(inhalt).map((m) => [merkSchluessel(m), m]));
    nachSchluessel.set(inhalt, v);
  }
  return v;
}

/**
 * Karten eines Materials mit Merk-Angaben — für Liste, Startseite und
 * Merkliste dieselbe Form.
 * @param {Material} material
 * @param {string[]} keys
 */
export function karteMitMerken(material, keys) {
  const schluessel = merkSchluessel(material);
  return { material, icon: TYPEN[material.typ.key].icon, cover: coverFarben(material), merkSchluessel: schluessel, gemerkt: keys.includes(schluessel) };
}

/**
 * Die gemerkten Materialien in der Reihenfolge des Merkens. Was nicht mehr
 * im Spiegel steht, wird gezählt statt still verschluckt.
 * @param {{ inhalt: Inhalt, keys: string[] }} eingabe
 */
export function merklisteLaden({ inhalt, keys }) {
  const v = verzeichnis(inhalt);
  const gefunden = keys.flatMap((k) => {
    const m = v.get(k);
    return m ? [m] : [];
  });
  return { karten: gefunden.map((m) => karteMitMerken(m, keys)), fehlend: keys.length - gefunden.length };
}
