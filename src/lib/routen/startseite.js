/**
 * Daten der Startseite aus dem Spiegel (ADR-0004): Themen-Chips,
 * Stufen-Kacheln, Empfehlung, Statushinweis. Reine Funktionen, kennt
 * keine Komponente.
 */
import { coverFarben, hash, kontrastText, STUFEN_FARBE_DEFAULT } from '../models/farben.js';
import { passtZurSaison, saisonKeywords } from '../models/saison.js';
import { LEERES_KONTO, profilFilter, profilOrt, vorname } from '../models/konto.js';
import { FACH_LABEL, STUFEN_LABEL, STUFEN_LABEL_ALTER, STUFEN_SICHTBAR, TYPEN } from '../models/typen.js';
import { materialienVon } from './bestand.js';
import { mitProfil } from './konto.js';
import { filterAnwenden, leerstandErklaeren, leererFilter, listenPfad, sortieren } from './uebersicht.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../models/konto.js').Konto} Konto */
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

/** Karten in „Neu für deine Arbeit …“ (Prototyp). */
export const FUER_DICH_ANZAHL = 3;

/**
 * „Neu für deine Arbeit …“: Kennt das Profil Stufen, fragen die
 * Alterskacheln nur ab, was schon feststeht — an ihre Stelle tritt das
 * Neueste aus dem eigenen Bereich. Ohne Stufen (Gemeinde, nur „Anderes“)
 * bleibt das Alter der beste Einstieg, die Kacheln also auch.
 * @param {Material[]} materialien
 * @param {Konto} konto
 */
function fuerDichBilden(materialien, konto) {
  const { stufen, faecher } = profilFilter(konto);
  if (stufen.length === 0) return null;
  const filter = { ...leererFilter(), stufen, faecher, sortierung: /** @type {const} */ ('neu') };
  const treffer = sortieren(filterAnwenden(materialien, filter), 'neu');
  return {
    ort: profilOrt(konto),
    profil: [...stufen.map((s) => STUFEN_LABEL[s]), ...faecher.map((f) => FACH_LABEL[f])],
    karten: treffer.slice(0, FUER_DICH_ANZAHL).map((material) => ({ material, icon: TYPEN[material.typ.key].icon, cover: coverFarben(material) })),
    anzahl: treffer.length,
    allePfad: listenPfad(filter)
  };
}

/**
 * @param {{ inhalt: Inhalt, fehlschlag: Fehlschlag|null, relays: string[], heute?: Date, palette?: Record<StufeKey, string>, konto?: Konto }} eingabe
 */
export function startseiteLaden({ inhalt, fehlschlag, relays, heute = new Date(), palette = STUFEN_FARBE_DEFAULT, konto = LEERES_KONTO }) {
  const materialien = materialienVon(inhalt);
  const keywords = saisonKeywords(heute);

  // Einstiege in die Liste tragen angemeldet das Profil (routen/konto.js).
  const themen = themenZaehlen(materialien, keywords)
    .slice(0, THEMEN_ANZAHL)
    .map((t) => ({ ...t, pfad: mitProfil(listenPfad({ q: t.wort }), konto) }));

  /** @type {Stufe[]} */
  const stufen = STUFEN_SICHTBAR.map((key) => ({
    key,
    label: STUFEN_LABEL_ALTER[key] ?? STUFEN_LABEL[key],
    pfad: mitProfil(listenPfad({ stufen: [key] }), konto),
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

  // Persönlich ist allein die Begrüßung; die Überschrift wechselt auch
  // angemeldet durch alle Orte. Der Ort sagt mehr als das Bundesland.
  const begruessung = konto.angemeldet
    ? { vorname: vorname(konto), ort: profilOrt(konto), profilText: konto.bereiche.length > 0 ? 'Profil ändern' : 'Profil ausfüllen' }
    : null;

  return {
    themen,
    stufen,
    empfehlung,
    status,
    begruessung,
    fuerDich: fuerDichBilden(materialien, konto),
    browsePfad: mitProfil('/materialien', konto),
    sucheMitProfil: konto.angemeldet
  };
}
