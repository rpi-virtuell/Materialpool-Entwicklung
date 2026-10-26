/**
 * Meldefunktion (ADR-0011) für Detail- und Redaktionsseite: Formular
 * prüfen, Spam erkennen, Hinweise und E-Mail-Text bilden, Meldungen je
 * Material gruppieren. Ohne JavaScript: Das Formular ist ein POST, der
 * Schutz steckt im Fangfeld und im signierten Zeitstempel. Reine
 * Funktionen, kennt keine Komponente.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { eingabePruefen, grundLabel, GRUENDE, standVon } from '../models/meldung.js';
import { materialienVon } from './bestand.js';
import { merkSchluessel } from './merkliste.js';

/** @typedef {import('../models/material.js').Material} Material */
/** @typedef {import('../models/meldung.js').Meldung} Meldung */
/** @typedef {import('../models/meldung.js').Stand} Stand */
/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */

export const GEMELDET_COOKIE = 'gemeldet';
export const REDAKTION_COOKIE = 'redaktion';
/** 100 Schlüssel à 12 Zeichen bleiben im Cookie unter 2 kB. */
const GEMELDET_MAX = 100;
const SCHLUESSEL = /^[0-9a-f]{12}$/;
/** Menschen brauchen für Grund und Begründung länger als drei Sekunden. */
const MINDESTZEIT_MS = 3000;
const STEMPEL_DAUER_MS = 24 * 60 * 60 * 1000;

/** @param {string} text @param {string} geheimnis */
const signatur = (text, geheimnis) => createHmac('sha256', geheimnis).update(text).digest('hex');

/** @param {string} a @param {string} b */
function gleich(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Zeitstempel fürs Formular, signiert — sonst setzte ein Programm einfach
 * einen alten ein.
 * @param {string} geheimnis @param {number} jetzt
 */
export function stempelAusstellen(geheimnis, jetzt) {
  return `${jetzt}.${signatur(String(jetzt), geheimnis)}`;
}

/**
 * @param {unknown} stempel @param {string} geheimnis @param {number} jetzt
 * @returns {'ok'|'zu-schnell'|'abgelaufen'}  „abgelaufen“ auch bei falscher Signatur, etwa nach einem Neustart
 */
export function stempelPruefen(stempel, geheimnis, jetzt) {
  if (typeof stempel !== 'string') return 'abgelaufen';
  const [zeit, sig] = stempel.split('.');
  if (!zeit || !sig || !gleich(sig, signatur(zeit, geheimnis))) return 'abgelaufen';
  const alter = jetzt - Number(zeit);
  if (alter > STEMPEL_DAUER_MS) return 'abgelaufen';
  return alter < MINDESTZEIT_MS ? 'zu-schnell' : 'ok';
}

/** @param {string|undefined} roh @returns {string[]} */
export function gemeldetLesen(roh) {
  if (!roh) return [];
  try {
    const d = JSON.parse(roh);
    if (!Array.isArray(d)) return [];
    return [...new Set(d.filter((k) => typeof k === 'string' && SCHLUESSEL.test(k)))].slice(0, GEMELDET_MAX);
  } catch {
    return [];
  }
}

/** @param {string[]} keys @param {string} key */
export function gemeldetMerken(keys, key) {
  return [key, ...keys.filter((k) => k !== key)].slice(0, GEMELDET_MAX);
}

/**
 * @typedef {{ art: 'ablegen', meldung: Meldung }
 *   | { art: 'still' }
 *   | { art: 'fehler', status: 400|429, fehler: string, werte: { grund: string, begruendung: string } }} Ergebnis
 */

/**
 * Was mit einem abgeschickten Formular geschieht. „still“: verwerfen, aber
 * wie Erfolg antworten — ein Spam-Programm soll nicht lernen, woran es
 * scheitert, und wer schon gemeldet hat, zählt nicht doppelt (ADR-0011).
 * @param {{
 *   formular: { grund: unknown, begruendung: unknown, falle: unknown, stempel: unknown },
 *   material: Material, schonGemeldet: boolean, heute: number, jeTag: number,
 *   geheimnis: string, jetzt: number, id: string
 * }} eingabe
 * @returns {Ergebnis}
 */
export function meldenVerarbeiten({ formular, material, schonGemeldet, heute, jeTag, geheimnis, jetzt, id }) {
  if (typeof formular.falle === 'string' && formular.falle.trim() !== '') return { art: 'still' };
  const stempel = stempelPruefen(formular.stempel, geheimnis, jetzt);
  if (stempel === 'zu-schnell' || schonGemeldet) return { art: 'still' };
  const geprueft = eingabePruefen(formular);
  if (stempel === 'abgelaufen') {
    return { art: 'fehler', status: 400, fehler: 'Das Formular war zu lange offen. Bitte schick es noch einmal ab.', werte: geprueft.werte };
  }
  if (!geprueft.ok) return { art: 'fehler', status: 400, fehler: geprueft.fehler, werte: geprueft.werte };
  if (heute >= jeTag) {
    return { art: 'fehler', status: 429, fehler: 'Heute sind schon sehr viele Meldungen eingegangen. Bitte versuch es morgen noch einmal.', werte: geprueft.werte };
  }
  return {
    art: 'ablegen',
    meldung: {
      id,
      material: merkSchluessel(material),
      titel: material.name,
      pfad: material.pfad,
      grund: geprueft.werte.grund,
      begruendung: geprueft.werte.begruendung,
      zeit: new Date(jetzt).toISOString(),
      status: 'offen'
    }
  };
}

/** @param {Stand} stand */
function hinweisVon(stand) {
  if (stand.stand === 'gemeldet') return 'Zu diesem Material liegt eine Meldung vor. Die Redaktion prüft sie.';
  if (stand.stand === 'vorlaeufig') return 'Dieses Material wurde mehrfach gemeldet und ist ausgeblendet, bis die Redaktion es geprüft hat.';
  if (stand.stand === 'bestaetigt') return `Die Redaktion hat dieses Material ausgeblendet. Grund: ${stand.gruende.join(', ')}.`;
  return null;
}

/**
 * Meldeteil der Detailseite. Die Aktion hängt sich an die Adresse an,
 * statt sie zu ersetzen: `?/melden` allein verlöre ein `?von=`.
 * @param {{ material: Material, stand: Stand, gemeldetHier: boolean, an: boolean, stempel: string,
 *   ruecklauf?: { fehler: string, werte: { grund: string, begruendung: string } }|null }} eingabe
 */
export function meldenBilden({ material, stand, gemeldetHier, an, stempel, ruecklauf = null }) {
  if (!an) return null;
  const formular = stand.stand === 'bestaetigt' || gemeldetHier
    ? null
    : {
        aktion: `${material.pfad}${material.pfad.includes('?') ? '&' : '?'}/melden`,
        stempel,
        gruende: GRUENDE,
        werte: ruecklauf?.werte ?? { grund: '', begruendung: '' },
        fehler: ruecklauf?.fehler ?? null,
        offen: ruecklauf !== null
      };
  return {
    hinweis: hinweisVon(stand),
    ausgeblendet: stand.stand === 'vorlaeufig' || stand.stand === 'bestaetigt',
    gemeldetHier,
    formular
  };
}

/**
 * E-Mail an die Redaktion zu einer neuen Meldung.
 * @param {{ meldung: Meldung, stand: Stand, origin: string }} eingabe
 */
export function meldungsBrief({ meldung, stand, origin }) {
  const wirkung = stand.stand === 'vorlaeufig'
    ? `${stand.offen} offene Meldungen — das Material ist vorläufig ausgeblendet, bis du entscheidest.`
    : 'Erste offene Meldung — das Material trägt einen Hinweis und bleibt sichtbar.';
  return {
    betreff: `Meldung zu „${meldung.titel}“: ${grundLabel(meldung.grund)}`,
    text: [
      `Zum Material „${meldung.titel}“ ist eine Meldung eingegangen.`,
      '',
      `Grund: ${grundLabel(meldung.grund)}`,
      'Begründung:',
      meldung.begruendung,
      '',
      `Stand: ${wirkung}`,
      '',
      `Material: ${origin}${meldung.pfad}`,
      `Bestätigen oder verwerfen: ${origin}/redaktion`,
      '',
      'Diese E-Mail hat der Materialpool automatisch verschickt. Wer gemeldet hat, ist nicht bekannt.'
    ].join('\n')
  };
}

/** @type {WeakMap<Inhalt, Map<string, Material>>} */
const nachSchluessel = new WeakMap();

/** @param {Inhalt} inhalt */
function materialNachSchluessel(inhalt) {
  let index = nachSchluessel.get(inhalt);
  if (!index) {
    index = new Map(materialienVon(inhalt).map((m) => [merkSchluessel(m), m]));
    nachSchluessel.set(inhalt, index);
  }
  return index;
}

/**
 * @typedef {object} Fall
 * @property {string} schluessel
 * @property {string} titel
 * @property {string} pfad
 * @property {string|null} herkunft   null, wenn das Material nicht mehr im Spiegel ist
 * @property {Stand} stand
 * @property {{ id: string, grund: string, begruendung: string, zeit: string }[]} meldungen
 */

/**
 * Meldungen je Material, ausgeblendete zuerst, dann die am längsten
 * wartenden. Titel und Pfad aus dem Spiegel, sonst wie gemeldet.
 * @param {Inhalt} inhalt @param {Meldung[]} meldungen
 * @returns {Fall[]}
 */
export function faelleBilden(inhalt, meldungen) {
  /** @type {Map<string, Meldung[]>} */
  const gruppen = new Map();
  for (const m of meldungen) gruppen.set(m.material, [...(gruppen.get(m.material) ?? []), m]);
  const index = materialNachSchluessel(inhalt);
  const faelle = [...gruppen].map(([schluessel, liste]) => {
    const material = index.get(schluessel);
    const letzte = liste[liste.length - 1];
    return {
      schluessel,
      titel: material?.name ?? letzte.titel,
      pfad: material?.pfad ?? letzte.pfad,
      herkunft: material?.herkunft ?? null,
      stand: standVon(liste),
      meldungen: liste.map((m) => ({ id: m.id, grund: grundLabel(m.grund), begruendung: m.begruendung, zeit: m.zeit }))
    };
  });
  const rang = (/** @type {Fall} */ f) => (f.stand.stand === 'vorlaeufig' ? 0 : 1);
  return faelle.sort((x, y) => rang(x) - rang(y) || (x.stand.seit ?? '').localeCompare(y.stand.seit ?? ''));
}

/**
 * Redaktionsseite: offene Fälle zum Entscheiden, bestätigte zum Wieder-Einblenden.
 * @param {{ inhalt: Inhalt, meldungen: Meldung[] }} eingabe
 */
export function redaktionLaden({ inhalt, meldungen }) {
  const faelle = faelleBilden(inhalt, meldungen);
  return {
    offen: faelle.filter((f) => f.stand.stand === 'gemeldet' || f.stand.stand === 'vorlaeufig'),
    ausgeblendet: faelle
      .filter((f) => f.stand.stand === 'bestaetigt')
      .sort((x, y) => (y.stand.seit ?? '').localeCompare(x.stand.seit ?? ''))
  };
}

/**
 * Was das Cookie der Redaktion trägt: nie das Kennwort selbst.
 * @param {string} kennwort
 */
export function zugangsMarke(kennwort) {
  return createHash('sha256').update(`materialpool-redaktion\n${kennwort}`).digest('hex');
}

/**
 * Ohne Kennwort ist die Seite vorerst offen (ADR-0011).
 * @param {string} kennwort @param {string|undefined} marke
 */
export function zugangErlaubt(kennwort, marke) {
  if (kennwort === '') return true;
  return typeof marke === 'string' && gleich(marke, zugangsMarke(kennwort));
}
