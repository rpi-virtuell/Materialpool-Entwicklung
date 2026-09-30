/**
 * Suche in eigenen Worten, Ablauf ohne JavaScript (Prototyp Materialpool
 * 2.0): Schickt jemand einen Satz ab, leitet der Server auf die gedeutete
 * Suche um — Themenwörter als `q`, Zielgruppe, Materialart und Fach als
 * Facetten, der Satz als `frage`, ersetzte Facetten als `vorher`. Die
 * Liste zeigt dann, wie er verstanden wurde, mit „Rückgängig“ zum
 * Wortlaut (`wortlaut`), der nicht noch einmal gedeutet wird. `frage`
 * reist über Seiten und Facetten mit, solange die Suche aus ihr folgt
 * (`listenPfad`). Reine Funktionen, kennt keine Komponente.
 */
import { deuteSuche, deutungPruefen } from '../models/deutung.js';
import { FACH_LABEL, STUFEN_LABEL, TYP_LABEL } from '../models/typen.js';
import { filterLesen, leereWahl, listenPfad } from './uebersicht.js';

/** @type {Record<'stufe'|'typ'|'fach', Record<string, string>>} */
const LABEL = { stufe: STUFEN_LABEL, typ: TYP_LABEL, fach: FACH_LABEL };

/**
 * Länger wird keine Umleitung: Node nimmt höchstens 16 KB Kopfzeilen an,
 * eine längere Location endete beim nächsten Aufruf in 431.
 */
export const UMLEITUNG_MAX = 4000;

/**
 * Wohin ein abgeschickter Satz führt; null, wenn nichts zu deuten ist.
 * Was der Satz nennt, ersetzt die jeweilige Facette ganz („für Kinder“
 * schlägt eine vorher gewählte Stufe), nicht Erwähntes bleibt. Was
 * ersetzt wurde, merkt sich `vorher`.
 * @param {URLSearchParams} params
 * @returns {string|null}
 */
export function frageUmleitung(params) {
  const filter = filterLesen(params);
  if (!filter.q || filter.wortlaut === filter.q || params.has('frage')) return null;
  const d = deuteSuche(filter.q);
  if (!d.istSatz) return null;
  const vorher = leereWahl();
  if (d.stufen.length > 0) vorher.stufen = filter.stufen;
  if (d.typen.length > 0) vorher.typen = filter.typen;
  if (d.faecher.length > 0) vorher.faecher = filter.faecher;
  const ziel = listenPfad({
    ...filter,
    q: d.begriffe.join(' '),
    stufen: d.stufen.length > 0 ? d.stufen : filter.stufen,
    typen: d.typen.length > 0 ? d.typen : filter.typen,
    faecher: d.faecher.length > 0 ? d.faecher : filter.faecher,
    wortlaut: '',
    frage: filter.q,
    vorher,
    seite: 1
  });
  return ziel.length > UMLEITUNG_MAX ? null : ziel;
}

/**
 * Der Hinweis „… haben wir so verstanden“ — nur, wenn die Deutung von
 * `frage` noch genau diese Suche ergibt; ein beliebiger Text in `frage`
 * wird so nicht als Verständnis ausgegeben. „Rückgängig“ nimmt die
 * gedeuteten Facetten weg, bringt die ersetzten zurück und sucht nach
 * dem Wortlaut.
 * @param {URLSearchParams} params
 */
export function frageHinweis(params) {
  const filter = filterLesen(params);
  const d = deutungPruefen(filter.frage, filter);
  if (!d) return null;
  /** @template {string} T @param {T[]} jetzt @param {string[]} gedeutet @param {T[]} vorher */
  const zurueckWahl = (jetzt, gedeutet, vorher) => [...new Set([...jetzt.filter((w) => !gedeutet.includes(w)), ...vorher])];
  const zurueck = {
    ...filter,
    q: filter.frage,
    wortlaut: filter.frage,
    stufen: zurueckWahl(filter.stufen, d.stufen, filter.vorher.stufen),
    typen: zurueckWahl(filter.typen, d.typen, filter.vorher.typen),
    faecher: zurueckWahl(filter.faecher, d.faecher, filter.vorher.faecher),
    frage: '',
    vorher: leereWahl(),
    seite: 1
  };
  return {
    text: filter.frage,
    teile: d.erkannt.map((e) => ({ woerter: e.woerter, label: LABEL[e.facette][e.wert] })),
    themen: d.begriffe,
    rueckgaengigPfad: listenPfad(zurueck)
  };
}
