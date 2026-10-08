/**
 * Daten der Seite „Ausgeblendete Materialien“ (ADR-0010): Was die
 * Link-Prüfung ausgeblendet hat, mit totem Link, Status und Datum —
 * damit jemand bei den Anbietern nachfragen kann. Reine Funktion.
 */
import { ausgeblendet } from '../models/linkstatus.js';
import { materialienVon } from './bestand.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../models/linkstatus.js').Linkeintrag} Linkeintrag */

/**
 * @param {{ inhalt: Inhalt, eintrag: (url: string|null) => Linkeintrag|undefined }} eingabe
 */
export function ausgeblendeteLaden({ inhalt, eintrag }) {
  const eintraege = materialienVon(inhalt).flatMap((material) => {
    const e = eintrag(material.url);
    if (!e || !ausgeblendet(e) || !material.url) return [];
    return [{ material, url: material.url, status: e.status, wegSeit: e.wegSeit ?? e.geprueft, geprueft: e.geprueft }];
  });
  // Zuletzt ausgeblendet zuerst: Das Neue will man sehen.
  eintraege.sort((x, y) => y.wegSeit.localeCompare(x.wegSeit));
  return { eintraege };
}
