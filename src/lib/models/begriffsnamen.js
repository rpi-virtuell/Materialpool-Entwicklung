/**
 * Deutsche Namen (prefLabel) der KIM-Vokabulare, für Events, die nur die
 * `:id` eines Begriffs mitbringen und kein `:prefLabel` — sonst stünde auf
 * der Detailseite „text“ oder „level_A“. Übernommen, nicht ausgedacht:
 *
 * - Ressourcentyp: https://w3id.org/kim/hcrt/scheme (26 Begriffe)
 * - Bildungsstufe: https://w3id.org/kim/educationalLevel/ (12 Begriffe)
 *
 * beide vollständig, Stand 2026-10-08, und aus der Hochschulfächersystematik
 * (https://w3id.org/kim/hochschulfaechersystematik/) die Fächergruppe
 * Geisteswissenschaften (n1) mit allen Studienbereichen sowie den Fächern
 * unter den Theologien (n02, n03, n18), Stand 2026-10-09.
 *
 * Dazu `educationalLevel/adult_education`: steht in keinem Vokabular,
 * kommt aber in Events vor und ist eindeutig.
 */

const HCRT = 'https://w3id.org/kim/hcrt/';
const STUFE = 'https://w3id.org/kim/educationalLevel/';
const HOCHSCHUL = 'https://w3id.org/kim/hochschulfaechersystematik/';

/** @type {Record<string, string>} */
const HOCHSCHULFACH = {
  n1: 'Geisteswissenschaften',
  n01: 'Geisteswissenschaften allgemein',
  n02: 'Evangelische Theologie, -Religionslehre',
  n053: 'Evang. Theologie, -Religionslehre',
  n161: 'Diakoniewissenschaft',
  n544: 'Evang. Religionspädagogik, kirchliche Bildungsarbeit',
  n03: 'Katholische Theologie, -Religionslehre',
  n086: 'Kath. Theologie, -Religionslehre',
  n162: 'Caritaswissenschaft',
  n545: 'Kath. Religionspädagogik, kirchliche Bildungsarbeit',
  n04: 'Philosophie',
  n05: 'Geschichte',
  n06: 'Informations- und Bibliothekswissenschaften',
  n07: 'Allgemeine und vergleichende Literatur- und Sprachwissenschaft',
  n08: 'Altphilologie (klassische Philologie), Neugriechisch',
  n09: 'Germanistik (Deutsch, germanische Sprachen ohne Anglistik)',
  n10: 'Anglistik, Amerikanistik',
  n11: 'Romanistik',
  n12: 'Slawistik, Baltistik, Finno-Ugristik',
  n13: 'Sonstige Sprach- und Kulturwissenschaften',
  n14: 'Kulturwissenschaften i.e.S.',
  n18: 'Islamische Studien/Islamische Theologie',
  n292: 'Islamische Studien/Islamische Theologie',
  n030010001: 'Islamische Studien/Islamische Theologie',
  n19: 'Medienwissenschaft'
};

/** @type {Record<string, string>} */
const RESSOURCENTYP = {
  application: 'Softwareanwendung',
  assessment: 'Lernkontrolle',
  audio: 'Audio',
  case_study: 'Fallstudie',
  course: 'Kurs',
  data: 'Daten',
  diagram: 'Diagramm',
  drill_and_practice: 'Übung',
  educational_game: 'Lernspiel',
  experiment: 'Experiment',
  image: 'Abbildung',
  index: 'Nachschlagewerk',
  lesson_plan: 'Unterrichtsplanung',
  map: 'Karte',
  portal: 'Portal',
  questionnaire: 'Fragebogen',
  script: 'Skript',
  sheet_music: 'Musiknoten',
  simulation: 'Simulation',
  slide: 'Präsentation',
  text: 'Textdokument',
  textbook: 'Lehrbuch',
  video: 'Video',
  web_page: 'Webseite',
  worksheet: 'Arbeitsmaterial',
  other: 'Sonstiges'
};

/** @type {Record<string, string>} */
const BILDUNGSSTUFE = {
  level_0: 'Elementarbereich',
  level_1: 'Primarbereich',
  level_2: 'Sekundarbereich I',
  level_3: 'Sekundarbereich II',
  level_4: 'Postsekundarer nicht-tertiärer Bereich',
  level_5: 'Kurzes tertiäres Bildungsprogramm',
  level_A: 'Hochschule',
  level_6: 'Bachelor oder äquivalent',
  level_7: 'Master oder äquivalent',
  level_8: 'Promotion oder äquivalent',
  level_B: 'Vorbereitungsdienst',
  level_C: 'Fortbildung',
  adult_education: 'Erwachsenenbildung'
};

/** @type {Map<string, string>} */
const NAMEN = new Map([
  ...Object.entries(RESSOURCENTYP).map(([k, v]) => /** @type {[string, string]} */ ([`${HCRT}${k}`, v])),
  ...Object.entries(BILDUNGSSTUFE).map(([k, v]) => /** @type {[string, string]} */ ([`${STUFE}${k}`, v])),
  ...Object.entries(HOCHSCHULFACH).map(([k, v]) => /** @type {[string, string]} */ ([`${HOCHSCHUL}${k}`, v]))
]);

/**
 * Deutscher Name eines Begriffs aus den KIM-Vokabularen, sonst null.
 * Ein abschließender Schrägstrich zählt nicht.
 * @param {string} uri
 * @returns {string|null}
 */
export function begriffsname(uri) {
  return NAMEN.get(uri.replace(/\/+$/, '')) ?? null;
}
