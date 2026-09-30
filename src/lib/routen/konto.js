/**
 * Kontoebene ohne JavaScript (ADR-0006): Das Profil liegt als JSON in einem
 * Cookie dieses Browsers, Formulare schicken es per POST, Einstiege in die
 * Liste tragen `profil=1` und bekommen Stufe und Fach daraus voreingestellt.
 * Reine Funktionen, kennt keine Komponente.
 */
import {
  BEREICH_GRUPPEN, BEREICH_KEYS, BUNDESLAENDER, fragtNachFach, LEERES_KONTO, profilFilter
} from '../models/konto.js';
import { FACH_LABEL, FACH_REIHENFOLGE, STUFEN_LABEL } from '../models/typen.js';

/** @typedef {import('../models/konto.js').Konto} Konto */
/** @typedef {import('./uebersicht.js').Filter} Filter */

export const KONTO_COOKIE = 'konto';
/** Ein Jahr, wie der Farbschalter. */
export const KONTO_COOKIE_DAUER_S = 60 * 60 * 24 * 365;
const NAME_MAX = 60;
const ANDERES_MAX = 80;

/** @param {unknown} v @param {number} max */
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
/** @template T @param {unknown} v @param {readonly T[]} erlaubt @returns {T[]} */
const nurBekannte = (v, erlaubt) => (Array.isArray(v) ? erlaubt.filter((e) => v.includes(e)) : []);

/**
 * Cookie → Konto. Unbekannte Werte fallen weg, Kaputtes heißt: nicht
 * angemeldet. Nie raten. Abgemeldet bleibt das Profil erhalten (wie im
 * Prototyp) und kommt mit der nächsten Anmeldung zurück.
 * @param {string|undefined} roh
 * @returns {Konto}
 */
export function kontoLesen(roh) {
  if (!roh) return LEERES_KONTO;
  /** @type {Record<string, unknown>} */
  let d;
  try {
    d = JSON.parse(roh);
  } catch {
    return LEERES_KONTO;
  }
  const name = text(d?.name, NAME_MAX);
  if (!name) return LEERES_KONTO;
  const bundesland = typeof d.bundesland === 'string' && BUNDESLAENDER.includes(d.bundesland) ? d.bundesland : '';
  return {
    angemeldet: d.angemeldet === true,
    name,
    bundesland,
    bereiche: nurBekannte(d.bereiche, BEREICH_KEYS),
    faecher: nurBekannte(d.faecher, FACH_REIHENFOLGE),
    bereichAnderes: text(d.bereichAnderes, ANDERES_MAX),
    fachAnderes: text(d.fachAnderes, ANDERES_MAX)
  };
}

/** @param {Konto} konto */
export function kontoSchreiben(konto) {
  return JSON.stringify(konto);
}

/**
 * @param {unknown} name
 * @param {Konto} bisher  ein früheres Profil bleibt erhalten
 * @returns {Konto|null}  null ohne Namen
 */
export function anmelden(name, bisher) {
  const n = text(name, NAME_MAX);
  return n ? { ...bisher, angemeldet: true, name: n } : null;
}

/** Abmelden: Das Profil bleibt in diesem Browser, gilt aber nicht mehr. @param {Konto} konto @returns {Konto} */
export function abmelden(konto) {
  return { ...konto, angemeldet: false };
}

/**
 * Profilformular → Konto. Der Fach-Abschnitt ist ohne Schulbereich nur per
 * CSS ausgeblendet; seine Felder kommen trotzdem mit, gewählte Fächer
 * bleiben also gespeichert (profilFilter lässt sie dann nur nicht gelten).
 * @param {FormData} formular
 * @param {Konto} bisher
 * @returns {Konto}
 */
export function profilAusFormular(formular, bisher) {
  const alle = (/** @type {string} */ name) => formular.getAll(name).filter((v) => typeof v === 'string');
  const bundesland = String(formular.get('bundesland') ?? '');
  return {
    ...bisher,
    bundesland: BUNDESLAENDER.includes(bundesland) ? bundesland : '',
    bereiche: nurBekannte(alle('bereich'), BEREICH_KEYS),
    faecher: nurBekannte(alle('fach'), FACH_REIHENFOLGE),
    bereichAnderes: text(formular.get('bereichAnderes'), ANDERES_MAX),
    fachAnderes: text(formular.get('fachAnderes'), ANDERES_MAX)
  };
}

/**
 * Einstieg in die Liste mit `profil=1`: Stufe und Fach aus dem Profil,
 * soweit die Adresse sie nicht schon nennt — eine Kachel der Startseite ist
 * eine ausdrückliche Wahl und schlägt die Stufe aus dem Profil. Ohne
 * `profil` null (nichts zu tun).
 * @param {URLSearchParams} params
 * @param {Konto} konto
 * @returns {URLSearchParams|null}
 */
export function profilEinsetzen(params, konto) {
  if (!params.has('profil')) return null;
  const neu = new URLSearchParams(params);
  neu.delete('profil');
  const { stufen, faecher } = profilFilter(konto);
  if (!neu.has('stufe')) for (const s of stufen) neu.append('stufe', s);
  if (!neu.has('fach')) for (const f of faecher) neu.append('fach', f);
  return neu;
}

/** @param {string[]} a @param {string[]} b */
const gleich = (a, b) => b.length > 0 && a.length === b.length && b.every((w) => a.includes(w));

/**
 * Nennt nur, was noch genau so aus dem Profil steht — wer an einer Facette
 * dreht, filtert dort selbst.
 * @param {Filter} filter
 * @param {Konto} konto
 * @returns {string|null}
 */
export function profilHinweis(filter, konto) {
  const profil = profilFilter(konto);
  const was = [gleich(filter.stufen, profil.stufen) && 'Stufe', gleich(filter.faecher, profil.faecher) && 'Fach'].filter(Boolean);
  if (was.length === 0) return null;
  return `${was.join(' und ')} ${was.length > 1 ? 'sind' : 'ist'} aus deinem Profil voreingestellt.`;
}

/**
 * Einstiegs-Link in die Liste, mit Profil, wenn jemand angemeldet ist.
 * @param {string} pfad
 * @param {Konto} konto
 */
export function mitProfil(pfad, konto) {
  if (!konto.angemeldet) return pfad;
  return `${pfad}${pfad.includes('?') ? '&' : '?'}profil=1`;
}

/**
 * Daten der Profilseite.
 * @param {Konto} konto
 */
export function kontoSeite(konto) {
  const { stufen, faecher } = profilFilter(konto);
  const voreingestellt = [...stufen.map((s) => STUFEN_LABEL[s]), ...faecher.map((f) => FACH_LABEL[f])];
  const folge =
    voreingestellt.length > 0
      ? `Beim Stöbern stellen wir dir vorab ein: ${voreingestellt.join(', ')}. Du kannst das dort jederzeit wegklicken.`
      : konto.bereiche.includes('gemeinde')
        ? 'Für deine Auswahl grenzen wir beim Stöbern nichts ein – Gemeindearbeit reicht über alle Altersgruppen.'
        : konto.bereichAnderes
          ? 'Deine eigene Angabe können wir beim Stöbern noch nicht einstellen – dort siehst du erst einmal alles.'
          : 'Sobald du einen Bereich wählst, grenzt die Liste beim Stöbern von selbst darauf ein.';
  return {
    konto,
    bundeslaender: BUNDESLAENDER,
    gruppen: BEREICH_GRUPPEN.map((g) => ({
      key: g.key,
      label: g.label,
      mitFach: Boolean(g.mitFach),
      bereiche: g.bereiche.map((b) => ({ key: b.key, label: b.label, gewaehlt: konto.bereiche.includes(b.key) }))
    })),
    faecher: FACH_REIHENFOLGE.map((key) => ({ key, label: FACH_LABEL[key], gewaehlt: konto.faecher.includes(key) })),
    fragtNachFach: fragtNachFach(konto),
    folge,
    stoebernPfad: mitProfil('/materialien', konto)
  };
}
