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
 * Jedes Event wird vorher geprüft (`services/pruefung.js`, ADR-0008):
 * Form, id, Signatur und, mit QUELLE_AUTOREN, der Schlüssel.
 *
 * Diese Datei ist die EINZIGE, die `services/relay.js` importiert
 * (test/architektur.test.js). Sie kennt die Oberfläche nicht.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { kuerzen, SUCHTEXT_MAX } from '../models/text.js';
import { eventsPruefen, formGueltig, formUndAutorGueltig } from './pruefung.js';
import { ABFRAGEGRUND_TEXT as RELAYGRUND_TEXT, eventsHolen, eventsVonAllen } from './relay.js';

/** @typedef {import('./relay.js').Event} Event */
/** @typedef {import('./relay.js').Abfragegrund} Abfragegrund */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {Abfragegrund|'lauf-abgebrochen'} Laufgrund */

/** Warum eine Abfrage oder ein Lauf nichts lieferte, als Satz. @type {Record<Exclude<Laufgrund, null>, string>} */
export const ABFRAGEGRUND_TEXT = {
  ...RELAYGRUND_TEXT,
  'lauf-abgebrochen': 'Der letzte Lauf des Spiegels ist mit einem Fehler abgebrochen (siehe Server-Log).'
};

/** AMB-Metadaten als ersetzbares Event (edufeed-AMB-NIP). */
export const KIND_AMB = 30142;

/** Das AMB-Relay liefert je REQ höchstens so viele Events. */
export const SEITENGROESSE = 250;

/** Höchstzahl Treffer einer Volltextsuche (NIP-50) — das Relay-Maximum. */
export const SUCHE_LIMIT = 250;

/** Wie viele Suchanfragen der Zwischenspeicher hält. */
export const SUCHE_SPEICHER_MAX = 200;

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
/** @typedef {{ zeitpunkt: string, gefragteRelays: string[], grund: Laufgrund }} Fehlschlag */

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
 * Nur geprüfte Events weiterreichen (ADR-0008). Außen um das Blättern, weil
 * das Blättern an der vollen Seite des Relays erkennt, ob es weitergeht.
 * @param {typeof eventsHolen} holen
 * @param {Konfig} konfig
 * @returns {typeof eventsHolen}
 */
export function geprueft(holen, konfig) {
  return async (url, filter, optionen) => {
    const antwort = await holen(url, filter, optionen);
    return { ...antwort, events: await eventsPruefen(antwort.events, konfig.autoren) };
  };
}

/**
 * Blättert über `until`, bis eine Seite kleiner als die Seitengröße ist
 * oder `limit` erreicht ist. `until` ist einschließlich, darum die
 * Deduplizierung nach id. Bringt eine volle Seite nichts Neues, teilen sich
 * mehr als 250 Events dieselbe Sekunde (Import): Dann geht es unterhalb
 * dieser Sekunde weiter, mit Warnung — was dort über der Seitengröße liegt,
 * fehlt. Rückt `until` nicht vor (Relay ohne `until`), endet es. Ein Relay, das nach
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
      // Unlesbares zählt für die volle Seite, aber nicht für `until`.
      const lesbar = seite.events.filter(formGueltig);
      for (const e of lesbar) {
        if (!gesehen.has(e.id)) {
          gesehen.set(e.id, e);
          neu++;
        }
      }
      if (seite.events.length < groesse || lesbar.length === 0) break;
      const aeltestes = Math.min(...lesbar.map((e) => e.created_at));
      if (neu > 0) {
        until = aeltestes;
        continue;
      }
      if (until !== undefined && aeltestes - 1 >= until) break;
      console.warn(`Spiegel: ${url} hat mehr als ${groesse} Events mit created_at ${aeltestes}; Events dieser Sekunde können fehlen.`);
      until = aeltestes - 1;
    }
    return { erreicht, events: [...gesehen.values()] };
  };
}

/**
 * Ersetzbare Events (NIP-01): je (pubkey, d) gilt nur das jüngste;
 * bei gleichem `created_at` die kleinere `id`. Ergebnis jüngstes zuerst —
 * oder, mit `reihenfolgeBehalten`, in der Reihenfolge des ersten
 * Auftretens (Relevanz einer Suche).
 * @param {Event[]} events
 * @param {{ reihenfolgeBehalten?: boolean }} [optionen]
 * @returns {Event[]}
 */
export function ersetzbareZusammenfassen(events, optionen = {}) {
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
  const werte = [...nachAdresse.values()];
  return optionen.reihenfolgeBehalten ? werte : werte.sort((a, b) => b.created_at - a.created_at);
}

// ── Volltextsuche am Relay (NIP-50, ADR-0005) ────────────────────────────

/**
 * @typedef {object} Suchergebnis
 * @property {Event[]} events        relevanzsortiert, je (pubkey, d) eines
 * @property {string[]} gefragteRelays
 * @property {Abfragegrund} grund    gesetzt, wenn keine belastbare Antwort kam
 */

/** @type {Map<string, { zeitpunkt: number, ergebnis: Suchergebnis }>} */
let sucheSpeicher = new Map();
/** Suchen, die gerade laufen: dieselbe öffnet keine zweiten Verbindungen. @type {Map<string, Promise<Suchergebnis>>} */
let sucheLaufend = new Map();

/** Höchstens SUCHTEXT_MAX Zeichen, klein, Leerraum zusammengezogen. @param {string} text */
export function sucheSchluessel(text) {
  return kuerzen(text.trim(), SUCHTEXT_MAX).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Volltextsuche über alle konfigurierten Relays mit denselben Einschränkungen
 * wie der Spiegel (Autoren, Fächer). Das Relay sortiert nach Relevanz; die
 * Reihenfolge bleibt erhalten. Ergebnisse liegen SPIEGEL_INTERVALL_S im
 * Speicher, weil Facetten und Seitenumbruch dieselbe Suche wiederholen;
 * kommt dieselbe Suche, während sie noch läuft, wartet sie auf die erste.
 *
 * @param {Konfig} konfig
 * @param {string} text
 * @param {{ holen?: typeof eventsHolen, jetzt?: () => number, pruefen?: typeof geprueft }} [optionen]
 * @returns {Promise<Suchergebnis>}
 */
export async function relaySuche(konfig, text, optionen = {}) {
  const jetzt = optionen.jetzt ?? Date.now;
  const schluessel = sucheSchluessel(text);
  const frisch = konfig.spiegelIntervallS * 1000;
  const gemerkt = sucheSpeicher.get(schluessel);
  if (gemerkt && jetzt() - gemerkt.zeitpunkt < frisch) return gemerkt.ergebnis;
  const laufend = sucheLaufend.get(schluessel);
  if (laufend) return laufend;
  const suche = sucheAmRelay(konfig, schluessel, optionen).finally(() => sucheLaufend.delete(schluessel));
  sucheLaufend.set(schluessel, suche);
  return suche;
}

/**
 * @param {Konfig} konfig
 * @param {string} schluessel
 * @param {{ holen?: typeof eventsHolen, jetzt?: () => number, pruefen?: typeof geprueft }} optionen
 * @returns {Promise<Suchergebnis>}
 */
async function sucheAmRelay(konfig, schluessel, optionen) {
  const jetzt = optionen.jetzt ?? Date.now;
  const { limit: _limit, ...grund } = filterBauen(konfig);
  const ergebnis = await eventsVonAllen(
    konfig.relays,
    { ...grund, search: schluessel, limit: SUCHE_LIMIT },
    { holen: (optionen.pruefen ?? geprueft)(optionen.holen ?? eventsHolen, konfig), zeitschrankeMs: 6000 }
  );
  /** @type {Suchergebnis} */
  const antwort = {
    events: ersetzbareZusammenfassen(
      ergebnis.events.filter((e) => e.kind === KIND_AMB),
      { reihenfolgeBehalten: true }
    ),
    gefragteRelays: ergebnis.gefragt,
    grund: ergebnis.grund
  };
  if (antwort.grund === null) {
    if (sucheSpeicher.size >= SUCHE_SPEICHER_MAX) {
      const aeltester = sucheSpeicher.keys().next().value;
      if (aeltester !== undefined) sucheSpeicher.delete(aeltester);
    }
    sucheSpeicher.set(schluessel, { zeitpunkt: jetzt(), ergebnis: antwort });
  }
  return antwort;
}

/** Nur für Tests: Suchspeicher leeren. */
export function sucheZuruecksetzen() {
  sucheSpeicher = new Map();
  sucheLaufend = new Map();
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
    holen: geprueft(seitenweise(optionen.holen ?? eventsHolen, konfig.spiegelLimit), konfig)
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

/**
 * Der gesicherte Stand ist schon geprüft geschrieben; hier nur Form und
 * Autorenfilter (billig), falls sich QUELLE_AUTOREN seitdem geändert hat.
 * Die Signaturen prüft der nächste Lauf.
 * @param {Konfig} konfig @returns {Promise<Inhalt|null>}
 */
async function vonPlatteLesen(konfig) {
  try {
    const daten = JSON.parse(await readFile(konfig.spiegelPfad, 'utf8'));
    if (daten && Array.isArray(daten.materialien) && daten.stand) {
      /** @type {Event[]} */
      const materialien = daten.materialien.filter((/** @type {unknown} */ e) => formUndAutorGueltig(e, konfig.autoren));
      return { stand: daten.stand, materialien, quellen: daten.quellen ?? {} };
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
 * Ein Lauf: neuen Stand bauen, bei Erfolg einwechseln und sichern. Wirft
 * nie: Auch ein Programmfehler im Lauf wird als Fehlschlag gemerkt, sonst
 * bliebe der Spiegel stumm auf altem Stand stehen.
 * @param {Konfig} konfig
 * @param {{ holen?: typeof eventsHolen }} [optionen]
 * @returns {Promise<boolean>} ob der Lauf gültig war
 */
export async function einmalLaufen(konfig, optionen = {}) {
  let ergebnis;
  try {
    ergebnis = await standAufbauen(konfig, optionen);
  } catch (fehler) {
    console.warn('Spiegel: Lauf abgebrochen:', fehler);
    ergebnis = { ok: false, inhalt: null, gefragteRelays: konfig.relays, grund: /** @type {Laufgrund} */ ('lauf-abgebrochen') };
  }
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
 * anstoßen, dann regelmäßig neu laufen. Liegt ein gesicherter Stand vor,
 * geht der Server sofort damit ans Netz und der erste Lauf holt im
 * Hintergrund nach — ein Neustart kostet so keine Minute Wartezeit bei
 * 7.700 Events. Ohne Datei wartet der Start höchstens
 * SPIEGEL_STARTWARTEZEIT_S auf den ersten Lauf.
 * @param {Konfig} konfig
 * @param {{ holen?: typeof eventsHolen }} [optionen]
 */
export function spiegelStarten(konfig, optionen = {}) {
  bereit = (async () => {
    const gesichert = await vonPlatteLesen(konfig);
    if (gesichert) aktuell = gesichert;
    const ersterLauf = einmalLaufen(konfig, optionen).catch(() => false);
    if (!gesichert) {
      const frist = new Promise((erledigt) =>
        setTimeout(erledigt, konfig.spiegelStartwartezeitS * 1000)
      );
      await Promise.race([ersterLauf, frist]);
    }
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
