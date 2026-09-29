/**
 * Daten der Startseite aus dem Spiegel (ADR-0004): Themen-Chips,
 * Stufen-Kacheln, Empfehlung, Statushinweis. Reine Funktionen, kennt
 * keine Komponente.
 */
import { coverFarben, hash, kontrastText, STUFEN_FARBE_DEFAULT } from '../models/farben.js';
import { materialAusEvent } from '../models/material.js';
import { passtZurSaison, saisonKeywords } from '../models/saison.js';
import { STUFEN_LABEL, STUFEN_SICHTBAR, TYPEN } from '../models/typen.js';
import { leerstandErklaeren, listenPfad } from './uebersicht.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/spiegel.js').Fehlschlag} Fehlschlag */
/** @typedef {import('../models/material.js').Material} Material */
/** @typedef {import('../models/typen.js').StufeKey} StufeKey */

/** Höchstzahl der Themen-Chips. */
export const THEMEN_ANZAHL = 6;

/**
 * @typedef {object} Thema
 * @property {string} wort
 * @property {number} anzahl
 * @property {boolean} saisonal
 * @property {string} pfad
 */
/**
 * @typedef {object} Stufe
 * @property {StufeKey} key
 * @property {string} label
 * @property {string} pfad
 * @property {string} farbe   Hex für --kachel-color
 * @property {string} text    Hex für --kachel-text
 */
/**
 * @typedef {object} Empfehlung
 * @property {string} id
 * @property {string} name
 * @property {string} beschreibung
 * @property {string} pfad
 * @property {string|null} bild
 * @property {string} icon
 * @property {{ ink: string, tint: string }} cover
 */

/**
 * Themen zählen: saisonale zuerst, dann die übrigen; jede Gruppe absteigend
 * nach Häufigkeit, bei Gleichstand alphabetisch (stabil).
 * @param {{ themen: string[] }[]} materialien
 * @param {string[]} keywords
 * @returns {Omit<Thema, 'pfad'>[]}
 */
export function themenZaehlen(materialien, keywords) {
  /** @type {Map<string, number>} */
  const zaehler = new Map();
  for (const m of materialien) {
    for (const wort of m.themen) zaehler.set(wort, (zaehler.get(wort) ?? 0) + 1);
  }
  const alle = [...zaehler].map(([wort, anzahl]) => ({ wort, anzahl, saisonal: passtZurSaison(wort, keywords) }));
  /** @param {typeof alle} gruppe */
  const sortiert = (gruppe) =>
    gruppe.sort((a, b) => b.anzahl - a.anzahl || a.wort.localeCompare(b.wort, 'de'));
  return [...sortiert(alle.filter((t) => t.saisonal)), ...sortiert(alle.filter((t) => !t.saisonal))];
}

/**
 * Kandidaten A: saisonal und Bild; B: Bild; C: alle. Aus der ersten
 * nicht-leeren Menge ein Element, deterministisch je Tag — jede Anfrage
 * desselben Tages zeigt dieselbe Empfehlung.
 * @param {Material[]} materialien
 * @param {Date} heute
 * @returns {Material|null}
 */
export function empfehlungWaehlen(materialien, heute) {
  if (materialien.length === 0) return null;
  const keywords = saisonKeywords(heute);
  const mitBild = materialien.filter((m) => m.bild);
  const saisonal = mitBild.filter((m) => m.themen.some((t) => passtZurSaison(t, keywords)));
  const kandidaten = saisonal.length > 0 ? saisonal : mitBild.length > 0 ? mitBild : materialien;
  const tag = heute.toISOString().slice(0, 10);
  return kandidaten[hash(tag, kandidaten.length)];
}

/**
 * @param {{ inhalt: Inhalt, fehlschlag: Fehlschlag|null, relays: string[], heute?: Date, palette?: Record<StufeKey, string> }} eingabe
 * @returns {{ themen: Thema[], stufen: Stufe[], empfehlung: Empfehlung|null, status: { text: string, warnung: boolean }|null }}
 */
export function startseiteLaden({ inhalt, fehlschlag, relays, heute = new Date(), palette = STUFEN_FARBE_DEFAULT }) {
  const materialien = inhalt.materialien.map(materialAusEvent);
  const keywords = saisonKeywords(heute);

  const themen = themenZaehlen(materialien, keywords)
    .slice(0, THEMEN_ANZAHL)
    .map((t) => ({ ...t, pfad: listenPfad({ q: t.wort }) }));

  const stufen = STUFEN_SICHTBAR.map((key) => ({
    key,
    label: STUFEN_LABEL[key],
    pfad: listenPfad({ stufe: key }),
    farbe: palette[key],
    text: kontrastText(palette[key])
  }));

  const gewaehlt = empfehlungWaehlen(materialien, heute);
  const empfehlung = gewaehlt
    ? {
        id: gewaehlt.id,
        name: gewaehlt.name,
        beschreibung: gewaehlt.beschreibung,
        pfad: gewaehlt.pfad,
        bild: gewaehlt.bild,
        icon: TYPEN[gewaehlt.typ.key].icon,
        cover: coverFarben(gewaehlt)
      }
    : null;

  /** @type {{ text: string, warnung: boolean }|null} */
  let status = null;
  if (!empfehlung) {
    const laedtNoch = inhalt.stand === null && fehlschlag === null;
    status = laedtNoch
      ? { text: 'Materialien werden geladen …', warnung: false }
      : { text: leerstandErklaeren(inhalt, fehlschlag, relays) ?? '', warnung: true };
  }

  return { themen, stufen, empfehlung, status };
}
