/**
 * Daten der Liste (/materialien) aus dem Spiegel. Kennt keine Komponente.
 * `filterAnwenden` ist rein und der Ansatzpunkt für weitere Facetten.
 */
import { ABFRAGEGRUND_TEXT } from '../services/spiegel.js';
import { coverFarben } from '../models/farben.js';
import { materialAusEvent } from '../models/material.js';
import { STUFEN_LABEL, STUFEN_REIHENFOLGE, TYPEN } from '../models/typen.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/spiegel.js').Fehlschlag} Fehlschlag */
/** @typedef {import('../models/material.js').Material} Material */
/** @typedef {import('../models/typen.js').StufeKey} StufeKey */

/** @typedef {{ q: string, stufe: StufeKey|null }} Filter */

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
 * Pfad der Liste mit Query-Parametern; leere Werte fallen weg.
 * @param {{ q?: string, stufe?: string|null }} filter
 */
export function listenPfad(filter = {}) {
  const p = new URLSearchParams();
  if (filter.q) p.set('q', filter.q);
  if (filter.stufe) p.set('stufe', filter.stufe);
  const s = p.toString();
  return s ? `/materialien?${s}` : '/materialien';
}

/**
 * Query-Parameter → Filter. Unbekannte Stufen zählen als kein Filter.
 * @param {URLSearchParams} params
 * @returns {Filter}
 */
export function filterLesen(params) {
  const q = (params.get('q') ?? '').trim();
  const stufeRoh = params.get('stufe') ?? '';
  const stufe = STUFEN_REIHENFOLGE.find((k) => k === stufeRoh) ?? null;
  return { q, stufe };
}

/**
 * Textfilter über Titel, Beschreibung, Herkunft und Schlagworte
 * (includes, kleingeschrieben) UND Stufe. Reine Funktion.
 * @param {Material[]} materialien
 * @param {Filter} filter
 */
export function filterAnwenden(materialien, filter) {
  const q = filter.q.toLowerCase();
  return materialien.filter((m) => {
    if (filter.stufe && m.stufe.key !== filter.stufe) return false;
    if (!q) return true;
    const text = [m.name, m.beschreibung, m.herkunft, ...m.schlagworte].join(' ').toLowerCase();
    return text.includes(q);
  });
}

/**
 * Aktive Filter als Pillen mit Pfad, der genau diesen Filter entfernt.
 * @param {Filter} filter
 * @returns {{ art: 'q'|'stufe', label: string, entfernenPfad: string }[]}
 */
export function aktiveFilter(filter) {
  /** @type {{ art: 'q'|'stufe', label: string, entfernenPfad: string }[]} */
  const pillen = [];
  if (filter.q) pillen.push({ art: 'q', label: `„${filter.q}“`, entfernenPfad: listenPfad({ stufe: filter.stufe }) });
  if (filter.stufe) {
    pillen.push({ art: 'stufe', label: STUFEN_LABEL[filter.stufe], entfernenPfad: listenPfad({ q: filter.q }) });
  }
  return pillen;
}

/**
 * @typedef {object} Karte
 * @property {Material} material
 * @property {string} icon
 * @property {{ ink: string, tint: string }} cover
 */

/**
 * @param {{ inhalt: Inhalt, fehlschlag: Fehlschlag|null, relays: string[], filter?: Filter }} eingabe
 * @returns {{ karten: Karte[], filter: Filter, pillen: ReturnType<typeof aktiveFilter>, gesamt: number, leerstand: string|null }}
 */
export function listeLaden({ inhalt, fehlschlag, relays, filter = { q: '', stufe: null } }) {
  const alle = inhalt.materialien.map(materialAusEvent);
  const treffer = filterAnwenden(alle, filter);
  return {
    karten: treffer.map((material) => ({ material, icon: TYPEN[material.typ.key].icon, cover: coverFarben(material) })),
    filter,
    pillen: aktiveFilter(filter),
    gesamt: alle.length,
    leerstand: leerstandErklaeren(inhalt, fehlschlag, relays)
  };
}
