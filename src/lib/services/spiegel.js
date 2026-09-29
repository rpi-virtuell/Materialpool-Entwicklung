/**
 * Der Spiegel: alle AMB-Events (kind:30142), die das Schaufenster braucht,
 * im Speicher und als Datei (Muster: oer-community, ADR-0028 dort).
 *
 * Ein Lauf baut einen vollständigen neuen Stand über ALLE konfigurierten
 * Relays und tauscht ihn atomar ein — Leser sehen nie einen halben Stand.
 * Gültig ist ein Lauf, wenn mindestens ein Relay geantwortet hat; ein
 * ungültiger Lauf ersetzt nichts und wird als Fehlschlag gemerkt, damit die
 * Fußzeile das Alter des angezeigten Stands nennen kann.
 *
 * Diese Datei ist die EINZIGE, die `services/relay.js` importiert
 * (test/architektur.test.js). Sie kennt die Oberfläche nicht.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { eventsHolen, eventsVonAllen } from './relay.js';

export { ABFRAGEGRUND_TEXT } from './relay.js';

/** @typedef {import('./relay.js').Event} Event */
/** @typedef {import('./relay.js').Abfragegrund} Abfragegrund */
/** @typedef {import('../konfig.js').Konfig} Konfig */

/** AMB-Metadaten als ersetzbares Event (edufeed-AMB-NIP). */
export const KIND_AMB = 30142;

/** Das AMB-Relay liefert je REQ höchstens so viele Events. */
export const SEITENGROESSE = 250;

/**
 * @typedef {object} Stand
 * @property {string} zeitpunkt
 * @property {number} dauerMs
 * @property {string[]} gefragteRelays
 * @property {string[]} nichtErreichbar
 * @property {{ materialien: number }} anzahl
 */
/**
 * @typedef {object} Inhalt
 * @property {Stand|null} stand
 * @property {Event[]} materialien           ein Event je (pubkey, d), jüngstes zuerst
 * @property {Record<string, string[]>} quellen  Event-id → Relays, die es lieferten
 */
/** @typedef {{ zeitpunkt: string, gefragteRelays: string[], grund: Abfragegrund }} Fehlschlag */

/** @returns {Inhalt} */
export function leererInhalt() {
  return { stand: null, materialien: [], quellen: {} };
}

/**
 * Filter der Hauptabfrage. Ohne QUELLE_AUTOREN kommt alles, was das Relay
 * bis zum Limit hergibt — bis feststeht, wer den Materialpool publiziert
 * (ADR-0003).
 * @param {Konfig} konfig
 * @returns {Record<string, unknown>}
 */
export function filterBauen(konfig) {
  /** @type {Record<string, unknown>} */
  const filter = { kinds: [KIND_AMB], limit: konfig.spiegelLimit };
  if (konfig.autoren.length > 0) filter.authors = konfig.autoren;
  // Mehrbuchstaben-Tagfilter des edufeed-AMB-Relays (khatru + Typesense);
  // Standard-Relays kennen ihn nicht, die konfigurierten schon (ADR-0004).
  if (konfig.faecher.length > 0) filter['#about:id'] = konfig.faecher;
  return filter;
}

/**
 * Blättert über `until`, bis eine Seite kleiner als die Seitengröße ist,
 * nichts Neues mehr kommt oder `limit` erreicht ist. `until` ist
 * einschließlich, darum die Deduplizierung nach id. Ein Relay, das nach
 * der ersten Seite ausfällt, gilt mit dem Teilstand als erreicht — besser
 * ein Teil als nichts; die nächste Runde holt den Rest.
 *
 * @param {typeof eventsHolen} holen
 * @param {number} limit  Höchstzahl Events je Relay insgesamt
 * @returns {typeof eventsHolen}
 */
export function seitenweise(holen, limit) {
  return async (url, filter, optionen) => {
    /** @type {Map<string, Event>} */
    const gesehen = new Map();
    /** @type {number|undefined} */
    let until;
    let erreicht = false;
    while (gesehen.size < limit) {
      const groesse = Math.min(SEITENGROESSE, limit - gesehen.size);
      const seite = await holen(url, { ...filter, limit: groesse, ...(until === undefined ? {} : { until }) }, optionen);
      if (!seite.erreicht) break;
      erreicht = true;
      let neu = 0;
      for (const e of seite.events) {
        if (!gesehen.has(e.id)) {
          gesehen.set(e.id, e);
          neu++;
        }
      }
      if (seite.events.length < groesse || neu === 0) break;
      until = Math.min(...seite.events.map((e) => e.created_at));
    }
    return { erreicht, events: [...gesehen.values()] };
  };
}

/**
 * Ersetzbare Events (NIP-01): je (pubkey, d) gilt nur das jüngste;
 * bei gleichem `created_at` die kleinere `id`. Ergebnis jüngstes zuerst.
 * @param {Event[]} events
 * @returns {Event[]}
 */
export function ersetzbareZusammenfassen(events) {
  /** @type {Map<string, Event>} */
  const nachAdresse = new Map();
  for (const e of events) {
    const d = e.tags.find((t) => t[0] === 'd')?.[1] ?? '';
    const schluessel = `${e.pubkey}:${d}`;
    const vorhanden = nachAdresse.get(schluessel);
    const juenger =
      !vorhanden ||
      e.created_at > vorhanden.created_at ||
      (e.created_at === vorhanden.created_at && e.id < vorhanden.id);
    if (juenger) nachAdresse.set(schluessel, e);
  }
  return [...nachAdresse.values()].sort((a, b) => b.created_at - a.created_at);
}

/**
 * Baut einen neuen Stand über alle Relays. Reine Funktion bis auf die
 * Relay-Abfrage, die sich für Tests durch `holen` ersetzen lässt.
 *
 * @param {Konfig} konfig
 * @param {{ holen?: typeof eventsHolen }} [optionen]
 * @returns {Promise<{ ok: boolean, inhalt: Inhalt|null, gefragteRelays: string[], grund: Abfragegrund }>}
 */
export async function standAufbauen(konfig, optionen = {}) {
  const begonnen = Date.now();
  const ergebnis = await eventsVonAllen(konfig.relays, filterBauen(konfig), {
    holen: seitenweise(optionen.holen ?? eventsHolen, konfig.spiegelLimit)
  });
  if (ergebnis.grund !== null) {
    return { ok: false, inhalt: null, gefragteRelays: ergebnis.gefragt, grund: ergebnis.grund };
  }
  const materialien = ersetzbareZusammenfassen(
    ergebnis.events.filter((e) => e.kind === KIND_AMB)
  );
  /** @type {Inhalt} */
  const inhalt = {
    stand: {
      zeitpunkt: new Date().toISOString(),
      dauerMs: Date.now() - begonnen,
      gefragteRelays: ergebnis.gefragt,
      nichtErreichbar: ergebnis.fehler,
      anzahl: { materialien: materialien.length }
    },
    materialien,
    quellen: ergebnis.quellen
  };
  return { ok: true, inhalt, gefragteRelays: ergebnis.gefragt, grund: null };
}

// ── Prozessweiter Spiegel ────────────────────────────────────────────────

/** @type {Inhalt} */
let aktuell = leererInhalt();
/** @type {Fehlschlag|null} */
let fehlschlag = null;
/** @type {Promise<void>|null} */
let bereit = null;
/** @type {ReturnType<typeof setInterval>|null} */
let zeitgeber = null;

/** Lesezugriff für Routen: immer der letzte gültige Stand. */
export function spiegelHolen() {
  return {
    lesen: () => aktuell,
    letzterFehlschlag: () => fehlschlag
  };
}

/** @param {string} pfad @returns {Promise<Inhalt|null>} */
async function vonPlatteLesen(pfad) {
  try {
    const daten = JSON.parse(await readFile(pfad, 'utf8'));
    if (daten && Array.isArray(daten.materialien) && daten.stand) {
      return { stand: daten.stand, materialien: daten.materialien, quellen: daten.quellen ?? {} };
    }
  } catch {
    // Keine oder kaputte Datei: der erste Lauf baut den Stand neu.
  }
  return null;
}

/** @param {string} pfad @param {Inhalt} inhalt */
async function aufPlatteSchreiben(pfad, inhalt) {
  await mkdir(dirname(pfad), { recursive: true });
  const vorlaeufig = `${pfad}.tmp`;
  await writeFile(vorlaeufig, JSON.stringify(inhalt));
  await rename(vorlaeufig, pfad);
}

/**
 * Ein Lauf: neuen Stand bauen, bei Erfolg einwechseln und sichern.
 * @param {Konfig} konfig
 * @param {{ holen?: typeof eventsHolen }} [optionen]
 * @returns {Promise<boolean>} ob der Lauf gültig war
 */
export async function einmalLaufen(konfig, optionen = {}) {
  const ergebnis = await standAufbauen(konfig, optionen);
  if (ergebnis.ok && ergebnis.inhalt) {
    aktuell = ergebnis.inhalt;
    fehlschlag = null;
    try {
      await aufPlatteSchreiben(konfig.spiegelPfad, aktuell);
    } catch (fehler) {
      console.warn(`Spiegel: Stand konnte nicht nach ${konfig.spiegelPfad} geschrieben werden:`, fehler);
    }
    return true;
  }
  fehlschlag = {
    zeitpunkt: new Date().toISOString(),
    gefragteRelays: ergebnis.gefragteRelays,
    grund: ergebnis.grund
  };
  return false;
}

/**
 * Startet den Spiegel mit dem Prozess: gesicherten Stand laden, ersten Lauf
 * anstoßen, höchstens SPIEGEL_STARTWARTEZEIT_S darauf warten, dann
 * regelmäßig neu laufen.
 * @param {Konfig} konfig
 * @param {{ holen?: typeof eventsHolen }} [optionen]
 */
export function spiegelStarten(konfig, optionen = {}) {
  bereit = (async () => {
    const gesichert = await vonPlatteLesen(konfig.spiegelPfad);
    if (gesichert) aktuell = gesichert;
    const ersterLauf = einmalLaufen(konfig, optionen).catch(() => false);
    const frist = new Promise((erledigt) =>
      setTimeout(erledigt, konfig.spiegelStartwartezeitS * 1000)
    );
    await Promise.race([ersterLauf, frist]);
    zeitgeber = setInterval(() => {
      einmalLaufen(konfig, optionen).catch(() => {});
    }, konfig.spiegelIntervallS * 1000);
    zeitgeber.unref?.();
  })();
  return bereit;
}

/** Wartet auf den Start, falls einer läuft. */
export async function spiegelBereit() {
  if (bereit) await bereit;
}

/** Nur für Tests: Speicherstand verwerfen und Zeitgeber anhalten. */
export function spiegelZuruecksetzen() {
  aktuell = leererInhalt();
  fehlschlag = null;
  bereit = null;
  if (zeitgeber) clearInterval(zeitgeber);
  zeitgeber = null;
}
