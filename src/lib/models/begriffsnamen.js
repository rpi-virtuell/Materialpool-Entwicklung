/**
 * Deutsche Namen (prefLabel) der KIM-Vokabulare, für Events, die nur die
 * `:id` eines Begriffs mitbringen und kein `:prefLabel` — sonst stünde auf
 * der Detailseite „text“ oder „level_A“. Übernommen, nicht ausgedacht:
 *
 * - Ressourcentyp: https://w3id.org/kim/hcrt/scheme (26 Begriffe)
 * - Bildungsstufe: https://w3id.org/kim/educationalLevel/ (12 Begriffe)
 *
 * beide vollständig, Stand 2026-10-08. Was dort nicht steht (z. B.
 * `educationalLevel/adult_education`), bekommt keinen Namen von hier.
 */

const HCRT = 'https://w3id.org/kim/hcrt/';
const STUFE = 'https://w3id.org/kim/educationalLevel/';

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
  level_C: 'Fortbildung'
};

/** @type {Map<string, string>} */
const NAMEN = new Map([
  ...Object.entries(RESSOURCENTYP).map(([k, v]) => /** @type {[string, string]} */ ([`${HCRT}${k}`, v])),
  ...Object.entries(BILDUNGSSTUFE).map(([k, v]) => /** @type {[string, string]} */ ([`${STUFE}${k}`, v]))
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
