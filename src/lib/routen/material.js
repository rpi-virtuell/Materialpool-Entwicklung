/**
 * Ein einzelnes Material aus dem Spiegel, adressiert über die Kennung
 * (URL-kodiertes `d`). Beide Routen — Seite und /json — laufen hier durch.
 */
import { coverFarben } from '../models/farben.js';
import { dAusKennung, materialAusEvent } from '../models/material.js';
import { TYPEN } from '../models/typen.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/relay.js').Event} Event */

/**
 * @param {{ inhalt: Inhalt, kennung: string }} eingabe
 * @returns {{ event: Event, relays: string[] }|null}
 */
export function eventFinden({ inhalt, kennung }) {
  const d = dAusKennung(kennung);
  if (d === null) return null;
  const event = inhalt.materialien.find((e) => (e.tags.find((t) => t[0] === 'd')?.[1] ?? '') === d);
  if (!event) return null;
  return { event, relays: inhalt.quellen[event.id] ?? [] };
}

/**
 * Material samt Cover-Farben und Typ-Icon — die Detailseite trägt dasselbe
 * Cover wie die Karte, von der man kommt (Prototyp Materialpool 2.0).
 * @param {{ inhalt: Inhalt, kennung: string }} eingabe
 * @returns {{ material: import('../models/material.js').Material, relays: string[], cover: { ink: string, tint: string }, icon: string }|null}
 */
export function materialLaden(eingabe) {
  const treffer = eventFinden(eingabe);
  if (!treffer) return null;
  const material = materialAusEvent(treffer.event);
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
