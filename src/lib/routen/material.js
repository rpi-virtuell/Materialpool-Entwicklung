/**
 * Ein einzelnes Material aus dem Spiegel, adressiert über die Kennung
 * (URL-kodiertes `d`). Beide Routen — Seite und /json — laufen hier durch
 * und reichen `params.kennung` so weiter, wie SvelteKit es liefert: schon
 * dekodiert, also gleich `d`.
 */
import { materialAusEvent } from '../models/material.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/relay.js').Event} Event */

/**
 * @param {{ inhalt: Inhalt, d: string }} eingabe
 * @returns {{ event: Event, relays: string[] }|null}
 */
export function eventFinden({ inhalt, d }) {
  if (typeof d !== 'string') return null;
  const event = inhalt.materialien.find((e) => (e.tags.find((t) => t[0] === 'd')?.[1] ?? '') === d);
  if (!event) return null;
  return { event, relays: inhalt.quellen[event.id] ?? [] };
}

/**
 * @param {{ inhalt: Inhalt, d: string }} eingabe
 * @returns {{ material: import('../models/material.js').Material, relays: string[] }|null}
 */
export function materialLaden(eingabe) {
  const treffer = eventFinden(eingabe);
  if (!treffer) return null;
  return { material: materialAusEvent(treffer.event), relays: treffer.relays };
}
