/**
 * Typ- und Stufen-Mappings des Materialpool-2.0-Prototyps (ADR-0004).
 * Reine Daten und Zuordnungen, keine Farben — die stehen in `farben.js`.
 */

/** @typedef {'plan'|'ab'|'proj'|'uebung'|'video'|'audio'|'webseite'|'sonstiges'} TypKey */
/** @typedef {'elem'|'sek1'|'sek2'|'bbs'|'unbekannt'} StufeKey */
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

/** @type {StufeKey[]} */
export const STUFEN_REIHENFOLGE = ['elem', 'sek1', 'sek2', 'bbs', 'unbekannt'];

/** Die Kacheln der Startseite — nie „unbekannt“. @type {StufeKey[]} */
export const STUFEN_SICHTBAR = ['elem', 'sek1', 'sek2', 'bbs'];

/** @type {Record<StufeKey, string>} */
export const STUFEN_LABEL = {
  elem: 'Elementar- & Primarbereich',
  sek1: 'Sekundarstufe I',
  sek2: 'Sekundarstufe II',
  bbs: 'Berufsbildung',
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
  Berufsbildung: 'bbs'
});

/** KIM-educationalLevel-URI (letzter Pfadteil) → Stufe. */
const KIM_LEVEL_ZU_STUFE = /** @type {Record<string, StufeKey>} */ ({
  level_0: 'elem',
  level_1: 'elem',
  level_2: 'sek1',
  level_3: 'sek2',
  level_4: 'sek2'
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
 * Erster Begriff, der eine bekannte Stufe ergibt — nach Label, sonst
 * nach KIM-URI. Nichts Bekanntes → „unbekannt“.
 * @param {Begriff[]} begriffe
 * @returns {{ key: StufeKey, label: string }}
 */
export function stufeAusBegriffen(begriffe) {
  for (const b of begriffe) {
    const key = LEVEL_ZU_STUFE[b.label] ?? KIM_LEVEL_ZU_STUFE[pfadteil(b.id)];
    if (key) return stufe(key);
  }
  return stufe('unbekannt');
}

/**
 * Erster Begriff, der einen bekannten Typ ergibt — nach Label, sonst nach
 * HCRT-URI. Sonst „sonstiges“ mit dem ersten Label, oder „Material“.
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
