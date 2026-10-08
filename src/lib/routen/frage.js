/**
 * Suche in eigenen Worten, Ablauf ohne JavaScript (Prototyp Materialpool
 * 2.0): Schickt jemand einen Satz ab, leitet der Server auf die gedeutete
 * Suche um — Themenwörter als `q`, Zielgruppe, Materialart und Fach als
 * Facetten, der Satz als `frage`. Die Liste zeigt dann, wie er verstanden
 * wurde, mit „Rückgängig“ zum Wortlaut (`wortlaut`), der nicht noch einmal
 * gedeutet wird. Reine Funktionen, kennt keine Komponente.
 */
import { deuteSuche } from '../models/deutung.js';
import { FACH_LABEL, STUFEN_LABEL, TYP_LABEL } from '../models/typen.js';
import { filterLesen, listenPfad } from './uebersicht.js';

/** @type {Record<'stufe'|'typ'|'fach', Record<string, string>>} */
const LABEL = { stufe: STUFEN_LABEL, typ: TYP_LABEL, fach: FACH_LABEL };

/** @param {string} pfad @param {string} frage */
function mitFrage(pfad, frage) {
  return `${pfad}${pfad.includes('?') ? '&' : '?'}${new URLSearchParams({ frage })}`;
}

/**
 * Wohin ein abgeschickter Satz führt; null, wenn nichts zu deuten ist.
 * Was der Satz nennt, ersetzt die jeweilige Facette ganz („für Kinder“
 * schlägt eine vorher gewählte Stufe), nicht Erwähntes bleibt.
 * @param {URLSearchParams} params
 * @returns {string|null}
 */
export function frageUmleitung(params) {
  const filter = filterLesen(params);
  if (!filter.q || filter.wortlaut === filter.q || params.has('frage')) return null;
  const d = deuteSuche(filter.q);
  if (!d.istSatz) return null;
  const gedeutet = {
    ...filter,
    q: d.begriffe.join(' '),
    stufen: d.stufen.length > 0 ? d.stufen : filter.stufen,
    typen: d.typen.length > 0 ? d.typen : filter.typen,
    faecher: d.faecher.length > 0 ? d.faecher : filter.faecher,
    wortlaut: '',
    seite: 1
  };
  return mitFrage(listenPfad(gedeutet), filter.q);
}

/**
 * Der Hinweis „… haben wir so verstanden“, solange die Suche noch die
 * gedeutete ist. „Rückgängig“ nimmt die gedeuteten Facetten weg und sucht
 * nach dem Wortlaut.
 * @param {URLSearchParams} params
 */
export function frageHinweis(params) {
  const text = (params.get('frage') ?? '').trim();
  if (!text) return null;
  const filter = filterLesen(params);
  const d = deuteSuche(text);
  if (!d.istSatz || filter.q !== d.begriffe.join(' ')) return null;
  const zurueck = {
    ...filter,
    q: text,
    wortlaut: text,
    stufen: filter.stufen.filter((s) => !d.stufen.includes(s)),
    typen: filter.typen.filter((t) => !d.typen.includes(t)),
    faecher: filter.faecher.filter((f) => !d.faecher.includes(f)),
    seite: 1
  };
  return {
    text,
    teile: d.erkannt.map((e) => ({ woerter: e.woerter, label: LABEL[e.facette][e.wert] })),
    themen: d.begriffe,
    rueckgaengigPfad: listenPfad(zurueck)
  };
}
