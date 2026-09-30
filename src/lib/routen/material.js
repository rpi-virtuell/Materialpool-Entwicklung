/**
 * Ein einzelnes Material aus dem Spiegel, adressiert über (pubkey, d)
 * (ADR-0008): die Kennung (URL-kodiertes `d`) und, wenn mehrere Schlüssel
 * dieses `d` publizieren, `?von=<pubkey>`. Beide Routen — Seite und /json
 * — laufen hier durch und reichen `params.kennung` so weiter, wie
 * SvelteKit es liefert: schon dekodiert, also gleich `d`.
 */
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
 * @param {Adresse} eingabe
 * @returns {{ material: import('../models/material.js').Material, relays: string[] }|null}
 */
export function materialLaden(eingabe) {
  const treffer = eventFinden(eingabe);
  if (!treffer) return null;
  return { material: materialImBestand(eingabe.inhalt, treffer.event), relays: treffer.relays };
}
