/**
 * Link-Prüfung (ADR-0010): Ein Hintergrundlauf neben dem Spiegel fragt je
 * Takt einige fällige Links an und merkt sich das Ergebnis. Die Regeln —
 * wann ein Link weg ist, wann ein Material ausgeblendet wird — stehen in
 * `models/linkstatus.js`. Der Stand liegt in einer JSON-Datei und
 * überlebt Neustarts. Kennt die Oberfläche nicht.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ausgeblendet, bewerten, faellig, fortschreiben, pruefbar } from '../models/linkstatus.js';

/** @typedef {import('../models/linkstatus.js').Linkeintrag} Linkeintrag */
/** @typedef {Map<string, Linkeintrag>} Zustand */
/** @typedef {{ an: boolean, pfad: string, intervallS: number, taktS: number, jeTakt: number }} Einstellungen */

/** Je Anfrage höchstens so lange warten. */
const ZEITLIMIT_MS = 15_000;
/** Ein „weg“ wird nach einem Tag noch einmal geprüft (ADR-0010). */
const NACHPRUEF_MS = 24 * 60 * 60 * 1000;
const KOPF = { 'user-agent': 'Materialpool-Linkpruefung (+https://material.rpi-virtuell.net)' };

/**
 * Status einer Adresse, null ohne Antwort. `HEAD` spart die Übertragung;
 * lehnt der Server es ab (405, 501) oder meldet er „weg“, fragt `GET`
 * nach — manche Server beantworten `HEAD` falsch, und ein Material soll
 * nicht an einem solchen Fehler verschwinden.
 * @param {string} url
 * @param {typeof fetch} [holen]
 * @returns {Promise<number|null>}
 */
export async function linkAnfragen(url, holen = fetch) {
  /** @param {'HEAD'|'GET'} method */
  const anfragen = async (method) => {
    try {
      const antwort = await holen(url, { method, redirect: 'follow', headers: KOPF, signal: AbortSignal.timeout(ZEITLIMIT_MS) });
      await antwort.body?.cancel().catch(() => {});
      return antwort.status;
    } catch {
      return null;
    }
  };
  const kopf = await anfragen('HEAD');
  if (kopf !== null && [404, 405, 410, 501].includes(kopf)) return anfragen('GET');
  return kopf;
}

/**
 * Ein Takt: höchstens `jeTakt` fällige Links nacheinander prüfen. Links,
 * die kein Material mehr hat, fallen aus dem Zustand. Gibt einen neuen
 * Zustand zurück.
 * @param {{ urls: string[], zustand: Zustand, jetzt: number, regeln: { intervallMs: number, nachpruefMs: number }, jeTakt: number, holen?: typeof fetch }} eingabe
 * @returns {Promise<Zustand>}
 */
export async function taktLaufen({ urls, zustand, jetzt, regeln, jeTakt, holen = fetch }) {
  const gueltig = [...new Set(urls.filter(pruefbar))];
  /** @type {Zustand} */
  const neu = new Map();
  for (const url of gueltig) {
    const eintrag = zustand.get(url);
    if (eintrag) neu.set(url, eintrag);
  }
  const dran = gueltig.filter((url) => faellig(neu.get(url), jetzt, regeln)).slice(0, jeTakt);
  for (const url of dran) {
    const status = await linkAnfragen(url, holen);
    neu.set(url, fortschreiben(neu.get(url), bewerten(status), status, jetzt));
  }
  return neu;
}

/** @type {Zustand} */
let zustand = new Map();
let an = false;
let laeuft = false;
/** @type {ReturnType<typeof setInterval>|null} */
let zeitgeber = null;

/** Lesezugriff für Routen. */
export function linkpruefungHolen() {
  return {
    /** @param {string|null} url */
    weg: (url) => an && url !== null && ausgeblendet(zustand.get(url))
  };
}

/** @param {string} pfad @returns {Promise<Zustand>} */
async function vonPlatteLesen(pfad) {
  try {
    const daten = JSON.parse(await readFile(pfad, 'utf8'));
    if (daten && typeof daten === 'object' && !Array.isArray(daten)) return new Map(Object.entries(daten));
  } catch {
    // Keine oder kaputte Datei: Die Prüfung beginnt von vorn.
  }
  return new Map();
}

/** @param {string} pfad @param {Zustand} z */
async function aufPlatteSchreiben(pfad, z) {
  await mkdir(dirname(pfad), { recursive: true });
  await writeFile(`${pfad}.tmp`, JSON.stringify(Object.fromEntries(z)));
  await rename(`${pfad}.tmp`, pfad);
}

/**
 * Startet die Prüfung mit dem Prozess. `urlsHolen` liefert je Takt die
 * Links des aktuellen Spiegelstands. Ein Takt beginnt erst, wenn der
 * vorige fertig ist. Wirft nie.
 * @param {Einstellungen} einstellungen
 * @param {() => string[]} urlsHolen
 */
export async function linkpruefungStarten(einstellungen, urlsHolen) {
  an = einstellungen.an;
  if (!an) return;
  zustand = await vonPlatteLesen(einstellungen.pfad);
  const regeln = { intervallMs: einstellungen.intervallS * 1000, nachpruefMs: NACHPRUEF_MS };
  const takt = async () => {
    if (laeuft) return;
    laeuft = true;
    try {
      zustand = await taktLaufen({ urls: urlsHolen(), zustand, jetzt: Date.now(), regeln, jeTakt: einstellungen.jeTakt });
      await aufPlatteSchreiben(einstellungen.pfad, zustand).catch((fehler) => {
        console.warn(`Link-Prüfung: Stand konnte nicht nach ${einstellungen.pfad} geschrieben werden:`, fehler);
      });
    } catch (fehler) {
      console.warn('Link-Prüfung: Takt abgebrochen:', fehler);
    } finally {
      laeuft = false;
    }
  };
  zeitgeber = setInterval(takt, einstellungen.taktS * 1000);
  zeitgeber.unref?.();
}

/** Nur für Tests: Zustand verwerfen und Zeitgeber anhalten. */
export function linkpruefungZuruecksetzen() {
  zustand = new Map();
  an = false;
  laeuft = false;
  if (zeitgeber) clearInterval(zeitgeber);
  zeitgeber = null;
}
