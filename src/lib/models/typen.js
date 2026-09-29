/**
 * Typ- und Stufen-Mappings des Materialpool-2.0-Prototyps (ADR-0004).
 * Reine Daten und Zuordnungen, keine Farben — die stehen in `farben.js`.
 */

/** @typedef {'plan'|'ab'|'proj'|'uebung'|'video'|'audio'|'webseite'|'sonstiges'} TypKey */
/** @typedef {'elem'|'sek1'|'sek2'|'bbs'|'fortbildung'|'hochschule'|'unbekannt'} StufeKey */
/** @typedef {import('./material.js').Begriff} Begriff */

/** Icon je Typ (Tabler-Name, gerendert als Inline-SVG in Icon.svelte). */
export const TYPEN = /** @type {Record<TypKey, { icon: string }>} */ ({
  plan: { icon: 'notebook' },
  ab: { icon: 'file-text' },
  proj: { icon: 'bulb' },
  uebung: { icon: 'pencil' },
  video: { icon: 'video' },
  audio: { icon: 'headphones' },
  webseite: { icon: 'world' },
  sonstiges: { icon: 'file' }
});

/** @type {TypKey[]} */
export const TYP_REIHENFOLGE = /** @type {TypKey[]} */ (Object.keys(TYPEN));

/** Anzeigename je Typ für die Facette „Materialart“. @type {Record<TypKey, string>} */
export const TYP_LABEL = {
  plan: 'Unterrichtsplanung',
  ab: 'Arbeitsmaterial',
  proj: 'Projektarbeit',
  uebung: 'Übung',
  video: 'Video',
  audio: 'Audio',
  webseite: 'Webseite',
  sonstiges: 'Sonstiges'
};

/** learningResourceType-Label → Typ; alles andere ist „sonstiges“. */
export const LRT_ZU_TYP = /** @type {Record<string, TypKey>} */ ({
  Arbeitsmaterial: 'ab',
  Arbeitsblatt: 'ab',
  Unterrichtsplanung: 'plan',
  Unterrichtsstunde: 'plan',
  Textdokument: 'plan',
  Lehrbuch: 'plan',
  Projektarbeit: 'proj',
  Übung: 'uebung',
  Video: 'video',
  Audio: 'audio',
  Webseite: 'webseite'
});

/** Letzter Pfadteil einer HCRT-URI → Typ, wenn kein Label da ist. */
const HCRT_ZU_TYP = /** @type {Record<string, TypKey>} */ ({
  worksheet: 'ab',
  lesson_plan: 'plan',
  text: 'plan',
  textbook: 'plan',
  script: 'plan',
  drill_and_practice: 'uebung',
  video: 'video',
  audio: 'audio',
  web_page: 'webseite',
  portal: 'webseite'
});

/**
 * Reihenfolge in Facetten. `fortbildung` und `hochschule` kommen im
 * Materialpool-Bestand vor (KIM level_C, level_A) und stehen darum in der
 * Facette — aber nicht als Kachel der Startseite (Prototyp).
 * @type {StufeKey[]}
 */
export const STUFEN_REIHENFOLGE = ['elem', 'sek1', 'sek2', 'bbs', 'fortbildung', 'hochschule', 'unbekannt'];

/** Die Kacheln der Startseite — nie „unbekannt“. @type {StufeKey[]} */
export const STUFEN_SICHTBAR = ['elem', 'sek1', 'sek2', 'bbs'];

/** @type {Record<StufeKey, string>} */
export const STUFEN_LABEL = {
  elem: 'Elementar- & Primarbereich',
  sek1: 'Sekundarstufe I',
  sek2: 'Sekundarstufe II',
  bbs: 'Berufsbildung',
  fortbildung: 'Fortbildung',
  hochschule: 'Hochschule',
  unbekannt: 'Stufe nicht angegeben'
};

/** educationalLevel-Label → Stufe; alles andere ist „unbekannt“. */
export const LEVEL_ZU_STUFE = /** @type {Record<string, StufeKey>} */ ({
  Primarbereich: 'elem',
  Primarstufe: 'elem',
  Elementarbereich: 'elem',
  'Sekundarbereich I': 'sek1',
  'Sekundarstufe I': 'sek1',
  'Sekundarbereich II': 'sek2',
  'Sekundarstufe II': 'sek2',
  'Postsekundarer nicht-tertiärer Bereich': 'sek2',
  Berufsbildung: 'bbs',
  Fortbildung: 'fortbildung',
  Hochschule: 'hochschule'
});

/** KIM-educationalLevel-URI (letzter Pfadteil) → Stufe. */
const KIM_LEVEL_ZU_STUFE = /** @type {Record<string, StufeKey>} */ ({
  level_0: 'elem',
  level_1: 'elem',
  level_2: 'sek1',
  level_3: 'sek2',
  level_4: 'sek2',
  level_A: 'hochschule',
  level_C: 'fortbildung'
});

/** @param {string} uri */
function pfadteil(uri) {
  const teile = uri.replace(/[/#]+$/, '').split(/[/#]/);
  return teile[teile.length - 1] ?? '';
}

/** @param {StufeKey} key */
function stufe(key) {
  return { key, label: STUFEN_LABEL[key] };
}

/**
 * Alle Stufen, die die Begriffe ergeben — nach Label, sonst nach KIM-URI —
 * dedupliziert in STUFEN_REIHENFOLGE. Echte Materialien tragen oft mehrere
 * Bildungsstufen. Nichts Bekanntes → ['unbekannt'].
 * @param {Begriff[]} begriffe
 * @returns {StufeKey[]}
 */
export function stufenAusBegriffen(begriffe) {
  const keys = new Set(
    begriffe.flatMap((b) => {
      const key = LEVEL_ZU_STUFE[b.label] ?? KIM_LEVEL_ZU_STUFE[pfadteil(b.id)];
      return key ? [key] : [];
    })
  );
  const geordnet = STUFEN_REIHENFOLGE.filter((k) => keys.has(k));
  return geordnet.length > 0 ? geordnet : ['unbekannt'];
}

/**
 * Die erste (niedrigste) Stufe mit Label — für Karte und Detail.
 * @param {Begriff[]} begriffe
 * @returns {{ key: StufeKey, label: string }}
 */
export function stufeAusBegriffen(begriffe) {
  return stufe(stufenAusBegriffen(begriffe)[0]);
}

/**
 * Alle Typen, die die Begriffe ergeben — nach Label, sonst nach HCRT-URI —
 * dedupliziert in TYP_REIHENFOLGE. Nichts Bekanntes → ['sonstiges'].
 * @param {Begriff[]} begriffe
 * @returns {TypKey[]}
 */
export function typenAusBegriffen(begriffe) {
  const keys = new Set(
    begriffe.flatMap((b) => {
      const key = LRT_ZU_TYP[b.label] ?? HCRT_ZU_TYP[pfadteil(b.id)];
      return key ? [key] : [];
    })
  );
  const geordnet = TYP_REIHENFOLGE.filter((k) => keys.has(k));
  return geordnet.length > 0 ? geordnet : ['sonstiges'];
}

/**
 * Erster Begriff, der einen bekannten Typ ergibt, mit seinem Label — für
 * Karte und Detail. Sonst „sonstiges“ mit dem ersten Label, oder „Material“.
 * @param {Begriff[]} begriffe
 * @returns {{ key: TypKey, label: string }}
 */
export function typAusBegriffen(begriffe) {
  for (const b of begriffe) {
    const key = LRT_ZU_TYP[b.label] ?? HCRT_ZU_TYP[pfadteil(b.id)];
    if (key) return { key, label: b.label };
  }
  return { key: 'sonstiges', label: begriffe[0]?.label ?? 'Material' };
}
