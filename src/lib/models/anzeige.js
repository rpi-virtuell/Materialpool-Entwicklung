/**
 * Werte aus den Events, so geschrieben, wie man sie auf Deutsch liest.
 * Das Event bleibt unverändert; geändert wird nur die Anzeige (CLAUDE.md).
 */

/**
 * ISO-Datum deutsch, so genau, wie es im Event steht: „2017-08-01“ →
 * „01.08.2017“, „2017-08“ → „08/2017“, „2017“ bleibt. Anderes bleibt stehen.
 * @param {string} iso
 */
export function datumDeutsch(iso) {
  const tag = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (tag) return `${tag[3]}.${tag[2]}.${tag[1]}`;
  const monat = /^(\d{4})-(\d{2})$/.exec(iso);
  if (monat) return `${monat[2]}/${monat[1]}`;
  return iso;
}

/** @type {Intl.DisplayNames|null} */
let namen = null;

/**
 * Sprachkürzel beim deutschen Namen: „de“ → „Deutsch“. Unbekanntes
 * bleibt, wie es ist.
 * @param {string} kuerzel
 */
export function spracheName(kuerzel) {
  if (!kuerzel) return kuerzel;
  namen ??= new Intl.DisplayNames(['de'], { type: 'language', fallback: 'none' });
  try {
    return namen.of(kuerzel) ?? kuerzel;
  } catch {
    return kuerzel;
  }
}
