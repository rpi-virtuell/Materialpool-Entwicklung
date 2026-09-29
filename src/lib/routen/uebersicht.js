/**
 * Daten der Liste (/materialien) aus dem Spiegel. Kennt keine Komponente.
 * Facetten und Sortierung nach Abschnitt 7 des Prototyps (ADR-0004):
 * ODER innerhalb einer Facette, UND dazwischen; Zähler je Facette ohne
 * die eigene Facette. Alles reine Funktionen.
 */
import { ABFRAGEGRUND_TEXT } from '../services/spiegel.js';
import { coverFarben } from '../models/farben.js';
import { materialAusEvent } from '../models/material.js';
import { STUFEN_LABEL, STUFEN_REIHENFOLGE, TYP_LABEL, TYP_REIHENFOLGE, TYPEN } from '../models/typen.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/spiegel.js').Fehlschlag} Fehlschlag */
/** @typedef {import('../models/material.js').Material} Material */
/** @typedef {import('../models/typen.js').StufeKey} StufeKey */
/** @typedef {import('../models/typen.js').TypKey} TypKey */
/** @typedef {'empfohlen'|'neu'|'titel'|'anbieter'} Sortierung */

/**
 * @typedef {object} Filter
 * @property {string} q
 * @property {StufeKey[]} stufen
 * @property {TypKey[]} typen
 * @property {string[]} schlagworte
 * @property {Sortierung} sortierung
 */

/** @type {{ key: Sortierung, label: string }[]} */
export const SORTIERUNGEN = [
  { key: 'empfohlen', label: 'Empfohlen' },
  { key: 'neu', label: 'Neu' },
  { key: 'titel', label: 'Titel' },
  { key: 'anbieter', label: 'Anbieter' }
];

/** Höchstzahl der Schlagwort-Chips. */
export const SCHLAGWORTE_MAX = 12;

/** @returns {Filter} */
export function leererFilter() {
  return { q: '', stufen: [], typen: [], schlagworte: [], sortierung: 'empfohlen' };
}

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
 * Pfad der Liste mit Query-Parametern; leere Werte und die
 * Standardsortierung fallen weg. Facetten wiederholen ihren Parameter.
 * @param {Partial<Filter>} filter
 */
export function listenPfad(filter = {}) {
  const p = new URLSearchParams();
  if (filter.q) p.set('q', filter.q);
  for (const s of filter.stufen ?? []) p.append('stufe', s);
  for (const t of filter.typen ?? []) p.append('typ', t);
  for (const w of filter.schlagworte ?? []) p.append('t', w);
  if (filter.sortierung && filter.sortierung !== 'empfohlen') p.set('sort', filter.sortierung);
  const s = p.toString();
  return s ? `/materialien?${s}` : '/materialien';
}

/**
 * Query-Parameter → Filter. Unbekannte Werte zählen als kein Filter.
 * @param {URLSearchParams} params
 * @returns {Filter}
 */
export function filterLesen(params) {
  /** @template T @param {string} name @param {readonly T[]} erlaubt @returns {T[]} */
  const bekannte = (name, erlaubt) =>
    [...new Set(params.getAll(name))].flatMap((v) => {
      const treffer = erlaubt.find((e) => e === v);
      return treffer === undefined ? [] : [treffer];
    });
  const sortierung = SORTIERUNGEN.find((s) => s.key === params.get('sort'))?.key ?? 'empfohlen';
  return {
    q: (params.get('q') ?? '').trim(),
    stufen: bekannte('stufe', STUFEN_REIHENFOLGE),
    typen: bekannte('typ', TYP_REIHENFOLGE),
    schlagworte: [...new Set(params.getAll('t').map((w) => w.trim()).filter(Boolean))],
    sortierung
  };
}

/** @param {Material} m @param {string} q kleingeschrieben */
function passtZuText(m, q) {
  if (!q) return true;
  return [m.name, m.beschreibung, m.herkunft, ...m.schlagworte].join(' ').toLowerCase().includes(q);
}

/** @param {Material} m @param {Omit<Filter, 'q'|'sortierung'>} f */
function passtZuFacetten(m, f) {
  if (f.stufen.length > 0 && !f.stufen.includes(m.stufe.key)) return false;
  if (f.typen.length > 0 && !f.typen.includes(m.typ.key)) return false;
  if (f.schlagworte.length > 0 && !f.schlagworte.some((w) => m.themen.includes(w))) return false;
  return true;
}

/**
 * Textsuche UND Facetten (ODER innerhalb, UND dazwischen). Reine Funktion.
 * @param {Material[]} materialien
 * @param {Filter} filter
 */
export function filterAnwenden(materialien, filter) {
  const q = filter.q.toLowerCase();
  return materialien.filter((m) => passtZuText(m, q) && passtZuFacetten(m, filter));
}

/**
 * @typedef {object} Facettenwert
 * @property {string} key
 * @property {string} label
 * @property {number} anzahl   Treffer, wenn dieser Wert (zusätzlich) aktiv wäre — ohne die eigene Facette gezählt
 * @property {boolean} aktiv
 * @property {boolean} leer    anzahl 0 und nicht aktiv → kein Link (is-leer)
 * @property {string|null} pfad  schaltet den Wert um
 */

/**
 * @template {string} K
 * @param {Material[]} materialien
 * @param {Filter} filter
 * @param {'stufen'|'typen'|'schlagworte'} facette
 * @param {(m: Material) => string[]} werteVon
 * @param {K[]} reihenfolge
 * @param {(key: K) => string} labelVon
 * @returns {Facettenwert[]}
 */
function facette(materialien, filter, facette, werteVon, reihenfolge, labelVon) {
  const q = filter.q.toLowerCase();
  const ohneEigene = { ...filter, [facette]: [] };
  const basis = materialien.filter((m) => passtZuText(m, q) && passtZuFacetten(m, ohneEigene));
  /** @type {Map<string, number>} */
  const zaehler = new Map();
  for (const m of basis) for (const w of werteVon(m)) zaehler.set(w, (zaehler.get(w) ?? 0) + 1);
  /** @type {string[]} */
  const aktive = filter[facette];
  return reihenfolge.map((key) => {
    const anzahl = zaehler.get(key) ?? 0;
    const aktiv = aktive.includes(key);
    const leer = anzahl === 0 && !aktiv;
    const umgeschaltet = aktiv ? aktive.filter((k) => k !== key) : [...aktive, key];
    return {
      key,
      label: labelVon(key),
      anzahl,
      aktiv,
      leer,
      pfad: leer ? null : listenPfad({ ...filter, [facette]: umgeschaltet })
    };
  });
}

/**
 * Facetten Materialart, Bildungsstufe, Schlagworte mit Zählern und
 * Umschalt-Pfaden. Schlagworte: aktive zuerst, dann nach Häufigkeit,
 * höchstens SCHLAGWORTE_MAX.
 * @param {Material[]} materialien
 * @param {Filter} filter
 */
export function facettenBilden(materialien, filter) {
  /** @type {Map<string, number>} */
  const alleWorte = new Map();
  for (const m of materialien) for (const w of m.themen) alleWorte.set(w, (alleWorte.get(w) ?? 0) + 1);
  const worteReihenfolge = [...alleWorte.keys()];
  const schlagworte = facette(materialien, filter, 'schlagworte', (m) => m.themen, worteReihenfolge, (w) => w)
    .sort((a, b) => Number(b.aktiv) - Number(a.aktiv) || b.anzahl - a.anzahl || a.key.localeCompare(b.key, 'de'))
    .slice(0, SCHLAGWORTE_MAX);
  return {
    typen: facette(materialien, filter, 'typen', (m) => [m.typ.key], TYP_REIHENFOLGE, (k) => TYP_LABEL[k]),
    stufen: facette(materialien, filter, 'stufen', (m) => [m.stufe.key], STUFEN_REIHENFOLGE, (k) => STUFEN_LABEL[k]),
    schlagworte
  };
}

/** @param {Material} m */
function empfehlungsScore(m) {
  return (m.bild ? 2 : 0) + (m.lizenzKuerzel ? 1 : 0);
}

/**
 * Sortiert eine Kopie. `empfohlen`: Bild zählt doppelt, Lizenz einfach,
 * dann jüngste zuerst. `titel` und `anbieter` nach deutscher Sortierung.
 * @param {Material[]} materialien
 * @param {Sortierung} sortierung
 */
export function sortieren(materialien, sortierung) {
  /** @param {string} a @param {string} b */
  const de = (a, b) => a.localeCompare(b, 'de');
  /** @type {Record<Sortierung, (a: Material, b: Material) => number>} */
  const vergleich = {
    empfohlen: (a, b) => empfehlungsScore(b) - empfehlungsScore(a) || b.createdAt - a.createdAt,
    neu: (a, b) => b.createdAt - a.createdAt,
    titel: (a, b) => de(a.name, b.name),
    anbieter: (a, b) => de(a.herkunft, b.herkunft) || de(a.name, b.name)
  };
  return [...materialien].sort(vergleich[sortierung]);
}

/**
 * Aktive Filter als Pillen mit Pfad, der genau diesen Wert entfernt.
 * @param {Filter} filter
 * @returns {{ art: 'q'|'typ'|'stufe'|'t', label: string, entfernenPfad: string }[]}
 */
export function aktiveFilter(filter) {
  /** @type {{ art: 'q'|'typ'|'stufe'|'t', label: string, entfernenPfad: string }[]} */
  const pillen = [];
  if (filter.q) pillen.push({ art: 'q', label: `„${filter.q}“`, entfernenPfad: listenPfad({ ...filter, q: '' }) });
  for (const t of filter.typen) {
    pillen.push({ art: 'typ', label: TYP_LABEL[t], entfernenPfad: listenPfad({ ...filter, typen: filter.typen.filter((k) => k !== t) }) });
  }
  for (const s of filter.stufen) {
    pillen.push({ art: 'stufe', label: STUFEN_LABEL[s], entfernenPfad: listenPfad({ ...filter, stufen: filter.stufen.filter((k) => k !== s) }) });
  }
  for (const w of filter.schlagworte) {
    pillen.push({ art: 't', label: w, entfernenPfad: listenPfad({ ...filter, schlagworte: filter.schlagworte.filter((k) => k !== w) }) });
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
 */
export function listeLaden({ inhalt, fehlschlag, relays, filter = leererFilter() }) {
  const alle = inhalt.materialien.map(materialAusEvent);
  const treffer = sortieren(filterAnwenden(alle, filter), filter.sortierung);
  return {
    karten: treffer.map((material) => ({ material, icon: TYPEN[material.typ.key].icon, cover: coverFarben(material) })),
    filter,
    pillen: aktiveFilter(filter),
    facetten: facettenBilden(alle, filter),
    sortierungen: SORTIERUNGEN.map((s) => ({ ...s, aktiv: s.key === filter.sortierung, pfad: listenPfad({ ...filter, sortierung: s.key }) })),
    gesamt: alle.length,
    leerstand: leerstandErklaeren(inhalt, fehlschlag, relays)
  };
}
