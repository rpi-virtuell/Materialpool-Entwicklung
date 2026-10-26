/**
 * Meldungen (ADR-0011): Was Besucherinnen und Besucher zu einem Material
 * gemeldet haben und was die Redaktion entschieden hat. Der Stand liegt in
 * einer JSON-Datei und überlebt Neustarts; jede Änderung wird sofort
 * geschrieben, nacheinander. Die Regeln stehen in `models/meldung.js`.
 * Kennt die Oberfläche nicht.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ausgeblendet, entscheiden, standVon } from '../models/meldung.js';

/** @typedef {import('../models/meldung.js').Meldung} Meldung */
/** @typedef {import('../models/meldung.js').Stand} Stand */

/** @type {Meldung[]} */
let alle = [];
/** @type {Map<string, Meldung[]>} */
let nachMaterial = new Map();
/** Schlüssel der ausgeblendeten Materialien — die Liste fragt je Material. */
let verborgen = new Set();
let an = false;
let pfad = '';
/** Schreibvorgänge nacheinander, damit kein älterer Stand einen neueren überschreibt. */
let schreiben = Promise.resolve();
/**
 * Signiert den Zeitstempel im Meldeformular (routen/meldungen.js). Neu je
 * Prozess: Nach einem Neustart bittet ein offenes Formular einmal um
 * erneutes Absenden — mehr Schaden richtet ein verlorenes Geheimnis nicht an.
 */
const GEHEIMNIS = randomBytes(32).toString('hex');

export function formularGeheimnis() {
  return GEHEIMNIS;
}

/** @param {Meldung[]} neu */
function einsetzen(neu) {
  alle = neu;
  nachMaterial = new Map();
  for (const m of alle) {
    const liste = nachMaterial.get(m.material);
    if (liste) liste.push(m);
    else nachMaterial.set(m.material, [m]);
  }
  verborgen = new Set([...nachMaterial].filter(([, liste]) => ausgeblendet(standVon(liste))).map(([key]) => key));
}

/** @param {string} key */
const vonMaterial = (key) => nachMaterial.get(key) ?? [];

/** Lesezugriff für Routen. */
export function meldungenHolen() {
  return {
    an,
    alle: () => alle,
    vonMaterial,
    /** @param {string} key @returns {Stand} */
    stand: (key) => standVon(vonMaterial(key)),
    /** @param {string} key */
    verborgen: (key) => an && verborgen.has(key)
  };
}

/** @param {string} datei @returns {Promise<Meldung[]>} */
async function vonPlatteLesen(datei) {
  try {
    const daten = JSON.parse(await readFile(datei, 'utf8'));
    if (Array.isArray(daten?.meldungen)) return daten.meldungen;
  } catch {
    // Keine oder kaputte Datei: Es beginnt leer.
  }
  return [];
}

function aufPlatteSchreiben() {
  const stand = JSON.stringify({ meldungen: alle });
  schreiben = schreiben.then(async () => {
    try {
      await mkdir(dirname(pfad), { recursive: true });
      await writeFile(`${pfad}.tmp`, stand);
      await rename(`${pfad}.tmp`, pfad);
    } catch (fehler) {
      console.warn(`Meldungen: Stand konnte nicht nach ${pfad} geschrieben werden:`, fehler);
    }
  });
  return schreiben;
}

/**
 * Liest den Stand beim Start. Wirft nie.
 * @param {{ an: boolean, pfad: string }} einstellungen
 */
export async function meldungenStarten(einstellungen) {
  an = einstellungen.an;
  pfad = einstellungen.pfad;
  einsetzen(an ? await vonPlatteLesen(pfad) : []);
}

/**
 * Legt eine Meldung ab und gibt den neuen Stand ihres Materials zurück.
 * @param {Meldung} meldung
 * @returns {Promise<Stand>}
 */
export async function meldungAblegen(meldung) {
  einsetzen([...alle, meldung]);
  await aufPlatteSchreiben();
  return standVon(vonMaterial(meldung.material));
}

/**
 * @param {string} material @param {unknown} entscheidung @param {number} jetzt
 */
export async function meldungEntscheiden(material, entscheidung, jetzt) {
  einsetzen(entscheiden(alle, material, entscheidung, jetzt));
  await aufPlatteSchreiben();
}

/** Nur für Tests: Zustand verwerfen. */
export function meldungenZuruecksetzen() {
  einsetzen([]);
  an = false;
  pfad = '';
}
