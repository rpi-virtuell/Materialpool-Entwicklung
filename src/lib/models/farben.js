/**
 * Farbdaten des Materialpool-2.0-Prototyps (ADR-0004): Cover-Farben je
 * Typ, Stufen-Palette, CI-Farbe. Werden als Inline-Variablen gerendert
 * (`--cover-ink`, `--cover-tint`, `--kachel-color`, `--kachel-text`).
 *
 * Dies ist die EINZIGE JavaScript-Datei mit Hex-Werten; alle anderen
 * Farben sind Token in src/app.css (test/architektur.test.js).
 */

/** @typedef {import('./typen.js').TypKey} TypKey */
/** @typedef {import('./typen.js').StufeKey} StufeKey */

/** Tinte und drei Tönungen je Typ. @type {Record<TypKey, { ink: string, tints: string[] }>} */
export const COVER = {
  plan: { ink: '#355982', tints: ['#E9EEF3', '#D9E1EA', '#C5D1E0'] },
  ab: { ink: '#814B35', tints: ['#F3ECE9', '#EADED9', '#E0CDC5'] },
  proj: { ink: '#6B3582', tints: ['#F0E9F3', '#E5D9EA', '#D8C5E0'] },
  uebung: { ink: '#2C6B4D', tints: ['#E9F3EF', '#D9EAE2', '#C5E0D3'] },
  video: { ink: '#823545', tints: ['#F3E9EB', '#EAD9DC', '#E0C5CA'] },
  audio: { ink: '#72592F', tints: ['#F3F0E9', '#EAE4D9', '#E0D6C5'] },
  webseite: { ink: '#2F6572', tints: ['#E9F1F3', '#D9E7EA', '#C5DAE0'] },
  sonstiges: { ink: '#515867', tints: ['#EDEEF0', '#E0E1E4', '#CFD1D5'] }
};

/** Stufen-Palette ohne CI-Farbe. @type {Record<StufeKey, string>} */
export const STUFEN_FARBE_DEFAULT = {
  elem: '#7FB0D9',
  sek1: '#4A85B8',
  sek2: '#1D5A8C',
  bbs: '#123F63',
  fortbildung: '#6B7F93',
  hochschule: '#4F5D6B',
  unbekannt: '#9AA5AF'
};

const WEISS = '#ffffff';
const SCHWARZ = '#000000';
const TEXT_DUNKEL = '#16181b';
const TEXT_HELL = '#fff';

/** @param {string} hex → [r, g, b] in 0..255 */
function kanaele(hex) {
  return [0, 1, 2].map((i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16));
}

/** @param {number[]} rgb */
function hex(rgb) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Linearer RGB-Mix zweier Hex-Farben, t in [0, 1] (0 = a, 1 = b).
 * @param {string} a @param {string} b @param {number} t
 */
export function mix(a, b, t) {
  const ka = kanaele(a);
  const kb = kanaele(b);
  return hex(ka.map((v, i) => v + (kb[i] - v) * t));
}

/**
 * Textfarbe mit ausreichendem Kontrast auf einer Fläche: Weiß, wenn
 * Kontrast ≥ 4,5:1 (WCAG AA), sonst dunkel.
 * @param {string} flaeche Hex
 */
export function kontrastText(flaeche) {
  const linear = kanaele(flaeche).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return 1.05 / (L + 0.05) >= 4.5 ? TEXT_HELL : TEXT_DUNKEL;
}

/**
 * Stufen-Palette aus einer CI-Farbe.
 * @param {string} ci Hex
 * @returns {Record<StufeKey, string>}
 */
export function stufenPalette(ci) {
  return {
    elem: mix(ci, WEISS, 0.55),
    sek1: mix(ci, WEISS, 0.25),
    sek2: ci,
    bbs: mix(ci, SCHWARZ, 0.3),
    fortbildung: STUFEN_FARBE_DEFAULT.fortbildung,
    hochschule: STUFEN_FARBE_DEFAULT.hochschule,
    unbekannt: STUFEN_FARBE_DEFAULT.unbekannt
  };
}

/**
 * djb2-Hash modulo `mod`: deterministische Wahl aus einer kleinen Menge.
 * @param {string} s @param {number} mod
 */
export function hash(s, mod) {
  let h = 5381;
  for (const c of s) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return h % mod;
}

/**
 * Tinte vom Typ, Tönung stabil je id — Karten gleichen Typs sehen nicht
 * alle gleich aus.
 * @param {{ id: string, typ: { key: TypKey } }} material
 */
export function coverFarben(material) {
  const c = COVER[material.typ.key] ?? COVER.sonstiges;
  return { ink: c.ink, tint: c.tints[hash(material.id, c.tints.length)] };
}

/**
 * CI-Farbe aus `?primaryColor=%23RRGGBB`. Nur #RRGGBB gilt; alles andere
 * heißt Standardfarben.
 * @param {string|null|undefined} roh
 * @returns {{ blue: string, blueDark: string, palette: Record<StufeKey, string> }|null}
 */
export function ciFarbeLesen(roh) {
  if (!roh || !/^#[0-9a-fA-F]{6}$/.test(roh)) return null;
  const blue = roh.toLowerCase();
  return { blue, blueDark: mix(blue, SCHWARZ, 0.15), palette: stufenPalette(blue) };
}
