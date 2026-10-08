/**
 * Prototypische Kontoebene (Prototyp Materialpool 2.0, Christina,
 * 28.09.2026; ADR-0006): Wer angemeldet ist, sagt einmal, wo er oder sie
 * arbeitet — danach stellt die Liste die passenden Stufen und das Fach von
 * selbst ein, statt bei jedem Besuch erneut danach zu fragen.
 *
 * Es gibt kein echtes Konto und kein Passwort. Name und Profil liegen nur
 * in einem Cookie dieses Browsers (routen/konto.js); der Server speichert
 * nichts. Reine Daten und Regeln, kennt keine Komponente.
 */
import { FACH_REIHENFOLGE, STUFEN_REIHENFOLGE } from './typen.js';

/** @typedef {import('./typen.js').StufeKey} StufeKey */
/** @typedef {import('./typen.js').FachKey} FachKey */

/**
 * @typedef {object} Konto
 * @property {boolean} angemeldet
 * @property {string} name
 * @property {string} bundesland      gespeichert, derzeit nirgends verwendet — die Materialdaten haben keine Länderangabe
 * @property {string[]} bereiche      Schlüssel aus BEREICH_GRUPPEN
 * @property {FachKey[]} faecher      gilt nur mit einem Schulbereich
 * @property {string} bereichAnderes  Freitext, grenzt nichts ein
 * @property {string} fachAnderes     Freitext, grenzt nichts ein
 */

export const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen',
  'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland',
  'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
];

/**
 * @typedef {object} Bereich
 * @property {string} key
 * @property {string} label
 * @property {string} ort                ergänzt die Begrüßung („für deine Arbeit ___“)
 * @property {StufeKey[]|null} stufen    was der Bereich in der Liste vorab einstellt; null = keine Eingrenzung
 */

/**
 * Bereiche nach den Einsatzorten der Startseite, „Schule“ aber nach Stufe
 * aufgeteilt: Eine Grundschul- und eine Oberstufenlehrkraft suchen völlig
 * Verschiedenes, „Schule“ allein hätte nichts eingegrenzt. Die Stufen
 * folgen den Alterskacheln (fortbildung = Erwachsene). Gemeinde hat bewusst keine —
 * Gemeindearbeit reicht von der Krabbelgruppe bis zum Seniorenkreis.
 * Konfi- und Jugendarbeit heißen im Ort „mit Konfis“/„mit Jugendlichen“ —
 * „deine Arbeit in der Jugendarbeit“ doppelt sich.
 * @type {{ key: string, label: string, ort?: string, mitFach?: boolean, bereiche: Bereich[] }[]}
 */
export const BEREICH_GRUPPEN = [
  {
    key: 'schule',
    label: 'Schule',
    ort: 'in der Schule',
    // Nur hier fragt das Profil nach dem Fach — in Kita und Gemeinde
    // unterrichtet niemand ein Fach.
    mitFach: true,
    bereiche: [
      { key: 'grundschule', label: 'Grundschule', ort: 'in der Grundschule', stufen: ['elem'] },
      { key: 'sek1', label: 'Sekundarstufe I', ort: 'in der Sekundarstufe I', stufen: ['sek1'] },
      { key: 'sek2', label: 'Sekundarstufe II', ort: 'in der Oberstufe', stufen: ['sek2'] },
      { key: 'berufsschule', label: 'Berufsschule', ort: 'in der Berufsschule', stufen: ['bbs'] }
    ]
  },
  {
    key: 'kirche',
    label: 'Kirche und Gemeinde',
    bereiche: [
      { key: 'kita', label: 'Kita', ort: 'in der Kita', stufen: ['elem'] },
      { key: 'gemeinde', label: 'Gemeinde', ort: 'in der Gemeinde', stufen: null },
      { key: 'konfi', label: 'Konfi-Arbeit', ort: 'mit Konfis', stufen: ['sek1'] },
      { key: 'jugend', label: 'Jugendarbeit', ort: 'mit Jugendlichen', stufen: ['sek1', 'sek2'] },
      { key: 'erwachsene', label: 'Erwachsenenbildung', ort: 'in der Erwachsenenbildung', stufen: ['fortbildung'] }
    ]
  }
];

const BEREICHE = BEREICH_GRUPPEN.flatMap((g) => g.bereiche);
export const BEREICH_KEYS = BEREICHE.map((b) => b.key);
/** Bereiche, bei denen das Profil nach dem Fach fragt (für das CSS der Profilseite). */
export const BEREICHE_MIT_FACH = BEREICH_GRUPPEN.filter((g) => g.mitFach).flatMap((g) => g.bereiche.map((b) => b.key));

/** @type {Konto} */
export const LEERES_KONTO = { angemeldet: false, name: '', bundesland: '', bereiche: [], faecher: [], bereichAnderes: '', fachAnderes: '' };

/** @param {string[]} keys */
export function bereicheFuer(keys) {
  return BEREICHE.filter((b) => keys.includes(b.key));
}

/**
 * Vereinigung der Stufen aller gewählten Bereiche. Ist ein Bereich ohne
 * Eingrenzung dabei (Gemeinde), bleibt die Liste ganz offen — sonst würde
 * „Gemeinde + Kita“ die Gemeindearbeit auf Kindermaterial beschränken.
 * @param {Konto} konto
 * @returns {StufeKey[]}
 */
function profilStufen(konto) {
  const gewaehlt = bereicheFuer(konto.bereiche);
  if (gewaehlt.length === 0 || gewaehlt.some((b) => !b.stufen)) return [];
  const stufen = new Set(gewaehlt.flatMap((b) => b.stufen ?? []));
  // In der Reihenfolge der Liste, nicht in der des Anklickens.
  return STUFEN_REIHENFOLGE.filter((s) => stufen.has(s));
}

/** @param {Konto} konto */
export function fragtNachFach(konto) {
  return konto.bereiche.some((b) => BEREICHE_MIT_FACH.includes(b));
}

/**
 * Was die Liste aus dem Profil vorab einstellt, je Facette. Die gewählten
 * Fächer bleiben gespeichert, wenn jemand die Schulbereiche abwählt — sie
 * gelten dann nur nicht und kommen mit dem nächsten Schulbereich zurück.
 * @param {Konto|null|undefined} konto
 * @returns {{ stufen: StufeKey[], faecher: FachKey[] }}
 */
export function profilFilter(konto) {
  if (!konto?.angemeldet) return { stufen: [], faecher: [] };
  return {
    stufen: profilStufen(konto),
    faecher: fragtNachFach(konto) ? FACH_REIHENFOLGE.filter((f) => konto.faecher.includes(f)) : []
  };
}

/**
 * „in der Grundschule und in der Kita“. Zwei oder mehr Schulstufen fassen
 * sich zu „in der Schule“ zusammen — „in der Sekundarstufe I und in der
 * Oberstufe“ sagt dasselbe umständlicher.
 * @param {Konto} konto
 */
export function profilOrt(konto) {
  const orte = BEREICH_GRUPPEN.flatMap((gruppe) => {
    const gewaehlt = gruppe.bereiche.filter((b) => konto.bereiche.includes(b.key));
    if (gruppe.ort && gewaehlt.length > 1) return [gruppe.ort];
    return gewaehlt.map((b) => b.ort);
  });
  if (orte.length <= 1) return orte[0] ?? '';
  return `${orte.slice(0, -1).join(', ')} und ${orte[orte.length - 1]}`;
}

/** Erster Vorname für Begrüßung und Kopfzeile. @param {Konto} konto */
export function vorname(konto) {
  return konto.name.trim().split(/\s+/)[0] ?? '';
}
