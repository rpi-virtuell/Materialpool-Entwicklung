/**
 * Prüfung jedes Events, bevor es in den Spiegel oder in Suchtreffer kommt
 * (ADR-0008): Form nach NIP-01, `id` gleich dem SHA-256 der Serialisierung,
 * Schnorr-Signatur (BIP-340) zum `pubkey`; mit QUELLE_AUTOREN nur diese
 * Schlüssel. Ein Relay kann liefern, was es will — erst die Prüfung macht
 * aus einem Event eine Aussage seines Schlüssels.
 *
 * Eine Signaturprüfung kostet rund 1,5 ms. Das Ergebnis je Paar aus id und
 * sig merkt sich der Prozess, damit ein Lauf alle zehn Minuten nur die
 * neuen Events prüft — auch die abgelehnten nur einmal.
 * Kennt die Oberfläche nicht; nur `services/spiegel.js` benutzt sie.
 */
import { createHash } from 'node:crypto';
import { schnorr } from '@noble/curves/secp256k1.js';

/** @typedef {import('./relay.js').Event} Event */

const HEX64 = /^[0-9a-f]{64}$/;
const HEX128 = /^[0-9a-f]{128}$/;

/** So viele geprüfte Events hält der Speicher; das älteste fällt zuerst. */
export const PRUEF_SPEICHER_MAX = 50000;

/** Nach so vielen Signaturen gibt die Prüfung die Ereignisschleife frei. */
const PRUEF_HAPPEN = 50;

/** `${id}${sig}` → echt oder nicht. @type {Map<string, boolean>} */
let geprueft = new Map();
let signaturen = 0;

/**
 * Form nach NIP-01. Was hier durchfällt, kann das Programm nicht lesen —
 * `tags: null` ließe sonst das Zusammenfassen werfen.
 * @param {unknown} e
 * @returns {e is Event}
 */
export function formGueltig(e) {
  if (typeof e !== 'object' || e === null) return false;
  const k = /** @type {Record<string, unknown>} */ (e);
  return (
    typeof k.id === 'string' && HEX64.test(k.id) &&
    typeof k.pubkey === 'string' && HEX64.test(k.pubkey) &&
    Number.isInteger(k.created_at) &&
    Number.isInteger(k.kind) &&
    Array.isArray(k.tags) &&
    k.tags.every((t) => Array.isArray(t) && t.every((w) => typeof w === 'string')) &&
    typeof k.content === 'string' &&
    typeof k.sig === 'string' && HEX128.test(k.sig)
  );
}

/** SHA-256 der Serialisierung `[0, pubkey, created_at, kind, tags, content]` (NIP-01). @param {Event} e */
export function eventId(e) {
  return createHash('sha256').update(JSON.stringify([0, e.pubkey, e.created_at, e.kind, e.tags, e.content])).digest('hex');
}

/** @param {Event} e */
const schluessel = (e) => `${e.id}${e.sig}`;

/**
 * `id` passt zum Inhalt und die Signatur zum Schlüssel. Die `id` wird
 * immer neu berechnet (billig); die Signatur nur, wenn dieses Paar aus id
 * und sig noch nicht geprüft ist.
 * @param {Event} e  mit gültiger Form
 */
export function signaturGueltig(e) {
  if (eventId(e) !== e.id) return false;
  const gemerkt = geprueft.get(schluessel(e));
  if (gemerkt !== undefined) return gemerkt;
  let echt = false;
  signaturen += 1;
  try {
    echt = schnorr.verify(Buffer.from(e.sig, 'hex'), Buffer.from(e.id, 'hex'), Buffer.from(e.pubkey, 'hex'));
  } catch {
    // Kein Punkt auf der Kurve o. Ä. — dann eben nicht echt.
  }
  if (geprueft.size >= PRUEF_SPEICHER_MAX) {
    const aeltester = geprueft.keys().next().value;
    if (aeltester !== undefined) geprueft.delete(aeltester);
  }
  geprueft.set(schluessel(e), echt);
  return echt;
}

/**
 * Form und, mit QUELLE_AUTOREN, der Schlüssel — ohne Signatur. Für den
 * gesicherten Stand, den der Spiegel selbst geprüft geschrieben hat.
 * @param {unknown} e @param {string[]} autoren  leer = alle
 * @returns {e is Event}
 */
export function formUndAutorGueltig(e, autoren) {
  return formGueltig(e) && (autoren.length === 0 || autoren.includes(e.pubkey));
}

/**
 * Nur die Events, die Form, Autorenfilter und Signatur bestehen.
 * Gibt zwischendurch die Ereignisschleife frei: Beim ersten Lauf sind es
 * über 8.000 Signaturen, die Anfragen sollen solange weiter beantwortet
 * werden.
 * @param {unknown[]} events
 * @param {string[]} autoren  leer = alle
 * @returns {Promise<Event[]>}
 */
export async function eventsPruefen(events, autoren) {
  /** @type {Event[]} */
  const gut = [];
  let seitPause = 0;
  for (const e of events) {
    if (!formUndAutorGueltig(e, autoren)) continue;
    const neu = !geprueft.has(schluessel(e));
    if (signaturGueltig(e)) gut.push(e);
    if (neu && ++seitPause >= PRUEF_HAPPEN) {
      seitPause = 0;
      await new Promise((weiter) => setImmediate(weiter));
    }
  }
  return gut;
}

/** Wie viele Signaturen der Prozess bisher gerechnet hat. */
export function signaturenGerechnet() {
  return signaturen;
}

/** Nur für Tests: gemerkte Prüfungen verwerfen. */
export function pruefungZuruecksetzen() {
  geprueft = new Map();
  signaturen = 0;
}
