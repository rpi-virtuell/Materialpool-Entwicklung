/**
 * Daten der Seite „Ausgeblendete Materialien“ (ADR-0010): Was die
 * Link-Prüfung ausgeblendet hat, mit totem Link, Status und Datum —
 * damit jemand bei den Anbietern nachfragen kann. Dazu, was nach Meldungen
 * ausgeblendet ist (ADR-0011). Reine Funktion.
 */
import { ausgeblendet } from '../models/linkstatus.js';
import { ausgeblendet as gemeldetAusgeblendet } from '../models/meldung.js';
import { materialienVon } from './bestand.js';
import { faelleBilden } from './meldungen.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../models/linkstatus.js').Linkeintrag} Linkeintrag */
/** @typedef {import('../models/meldung.js').Meldung} Meldung */

/**
 * @param {{ inhalt: Inhalt, eintrag: (url: string|null) => Linkeintrag|undefined, meldungen?: Meldung[] }} eingabe
 */
export function ausgeblendeteLaden({ inhalt, eintrag, meldungen = [] }) {
  const eintraege = materialienVon(inhalt).flatMap((material) => {
    const e = eintrag(material.url);
    if (!e || !ausgeblendet(e) || !material.url) return [];
    return [{ material, url: material.url, status: e.status, wegSeit: e.wegSeit ?? e.geprueft, geprueft: e.geprueft }];
  });
  // Zuletzt ausgeblendet zuerst: Das Neue will man sehen.
  eintraege.sort((x, y) => y.wegSeit.localeCompare(x.wegSeit));
  const gemeldet = faelleBilden(inhalt, meldungen)
    .filter((f) => gemeldetAusgeblendet(f.stand))
    .sort((x, y) => (y.stand.seit ?? '').localeCompare(x.stand.seit ?? ''));
  return { eintraege, gemeldet };
}
