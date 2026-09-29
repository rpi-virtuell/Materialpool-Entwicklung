/**
 * Saisonale Schlagworte nach dem Kirchenjahr (Prototyp, Abschnitt 5.4).
 * Monat 0-basiert wie `Date#getMonth`.
 */

/** @type {{ monate: number[], keywords: string[] }[]} */
export const SAISON = [
  { monate: [0], keywords: ['epiphanias', 'sternsinger', 'weihnacht'] },
  { monate: [1, 2], keywords: ['passion', 'fasten', 'buß'] },
  { monate: [2, 3], keywords: ['ostern', 'auferstehung', 'karfreitag', 'palmsonntag', 'gründonnerstag'] },
  { monate: [4, 5], keywords: ['pfingsten', 'himmelfahrt', 'heiliger geist', 'trinitat'] },
  { monate: [8, 9], keywords: ['erntedank', 'schöpfung'] },
  { monate: [9, 10], keywords: ['reformation', 'luther', 'allerheilig'] },
  { monate: [10], keywords: ['ewigkeitssonntag', 'totensonntag', 'volkstrauertag'] },
  { monate: [10, 11], keywords: ['advent'] },
  { monate: [11], keywords: ['weihnacht', 'krippe', 'heilig abend', 'nikolaus'] }
];

/** @param {Date} [datum] */
export function saisonKeywords(datum = new Date()) {
  const monat = datum.getMonth();
  return SAISON.filter((s) => s.monate.includes(monat)).flatMap((s) => s.keywords);
}

/**
 * Ein Schlagwort passt zur Saison, wenn es (kleingeschrieben) eines der
 * aktuellen Keywords enthält.
 * @param {string} wort @param {string[]} keywords
 */
export function passtZurSaison(wort, keywords) {
  const w = wort.toLowerCase();
  return keywords.some((k) => w.includes(k));
}
