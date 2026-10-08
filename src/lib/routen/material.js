/**
 * Ein einzelnes Material aus dem Spiegel, adressiert über (pubkey, d)
 * (ADR-0009): die Kennung (URL-kodiertes `d`) und, wenn mehrere Schlüssel
 * dieses `d` publizieren, `?von=<pubkey>`. Beide Routen — Seite und /json
 * — laufen hier durch und reichen `params.kennung` so weiter, wie
 * SvelteKit es liefert: schon dekodiert, also gleich `d`.
 */
import { coverFarben } from '../models/farben.js';
import { TYPEN } from '../models/typen.js';
import { adressenVon, materialImBestand } from './bestand.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/relay.js').Event} Event */

/**
 * Welches Event `/m/<d>` ohne `von` meint, wenn mehrere Schlüssel dasselbe
 * `d` publizieren: zuerst die Schlüssel aus QUELLE_VORRANG in ihrer
 * Reihenfolge, sonst das früheste Event — wer zuerst publiziert, behält die
 * Adresse. Nie das jüngste: Sonst übernähme jeder Schlüssel eine Adresse,
 * indem er sie einfach neu publiziert.
 * @param {Event[]} kandidaten  nicht leer
 * @param {string[]} vorrang
 * @returns {Event}
 */
export function vorzugWaehlen(kandidaten, vorrang) {
  for (const schluessel of vorrang) {
    const treffer = kandidaten.find((e) => e.pubkey === schluessel);
    if (treffer) return treffer;
  }
  return kandidaten.reduce((a, b) => (b.created_at < a.created_at || (b.created_at === a.created_at && b.id < a.id) ? b : a));
}

/**
 * @typedef {object} Adresse
 * @property {Inhalt} inhalt
 * @property {string} d                 `params.kennung`, schon dekodiert
 * @property {string|null} [von]        `?von=`: Hex-Pubkey; anderes findet nichts
 * @property {string[]} [vorrang]       QUELLE_VORRANG
 */

/**
 * @param {Adresse} eingabe
 * @returns {{ event: Event, relays: string[] }|null}
 */
export function eventFinden({ inhalt, d, von = null, vorrang = [] }) {
  if (typeof d !== 'string') return null;
  const kandidaten = adressenVon(inhalt).get(d) ?? [];
  if (kandidaten.length === 0) return null;
  let event;
  if (von !== null) {
    event = kandidaten.find((e) => e.pubkey === von.toLowerCase());
    if (!event) return null;
  } else {
    event = vorzugWaehlen(kandidaten, vorrang);
  }
  return { event, relays: inhalt.quellen[event.id] ?? [] };
}

/**
 * Material samt Cover-Farben und Typ-Icon — die Detailseite trägt dasselbe
 * Cover wie die Karte, von der man kommt (Prototyp Materialpool 2.0).
 * @param {Adresse} eingabe
 * @returns {{ material: import('../models/material.js').Material, relays: string[], cover: { ink: string, tint: string }, icon: string }|null}
 */
export function materialLaden(eingabe) {
  const treffer = eventFinden(eingabe);
  if (!treffer) return null;
  const material = materialImBestand(eingabe.inhalt, treffer.event);
  return { material, relays: treffer.relays, cover: coverFarben(material), icon: TYPEN[material.typ.key].icon };
}

/** Seiten, auf die „Zurück“ führen darf: Liste, Merkliste, Startseite. */
const ZURUECK_ERLAUBT = /^\/(materialien|merkliste)?$/;

/**
 * Ziel von „Zurück“ ohne JavaScript: die eigene Seite, von der man kam
 * (Referer), mit allen Filtern — sonst die Liste. Die Detailseite selbst
 * zählt nicht: Nach dem Merken ist sie ihr eigener Referer.
 * @param {string|null} referer
 * @param {string} origin    eigene Herkunft, z. B. https://material.rpi-virtuell.net
 * @param {string} hier      Pfad der Detailseite
 */
export function zurueckZiel(referer, origin, hier) {
  if (!referer) return '/materialien';
  try {
    const url = new URL(referer);
    if (url.origin !== origin || url.pathname === hier || !ZURUECK_ERLAUBT.test(url.pathname)) return '/materialien';
    return `${url.pathname}${url.search}`;
  } catch {
    return '/materialien';
  }
}
