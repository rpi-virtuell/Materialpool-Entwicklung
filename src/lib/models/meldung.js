/**
 * Regeln der Meldefunktion (ADR-0011), reine Funktionen: Was eine gültige
 * Meldung ist, wann ein Material markiert oder ausgeblendet ist, was eine
 * Entscheidung der Redaktion bewirkt. Speichern macht
 * `services/meldungen.js`.
 */

/** @typedef {'lizenz'|'inhalt'|'angaben'|'sonstiges'} Grund */
/** @typedef {'bestaetigen'|'verwerfen'|'einblenden'} Entscheidung */

/**
 * Gespeichert wird nur, was die Redaktion zum Entscheiden braucht — nichts
 * über die meldende Person (ADR-0011).
 * @typedef {object} Meldung
 * @property {string} id
 * @property {string} material      Schlüssel des Materials (`merkSchluessel`, über pubkey und d)
 * @property {string} titel         Titel zur Zeit der Meldung, falls das Material später fehlt
 * @property {string} pfad          Detailseite, z. B. /m/erntedank
 * @property {Grund} grund
 * @property {string} begruendung
 * @property {string} zeit          ISO-Zeitpunkt der Meldung
 * @property {'offen'|'bestaetigt'} status
 * @property {string} [entschieden] ISO-Zeitpunkt der Bestätigung
 */

/**
 * @typedef {object} Stand
 * @property {'keine'|'gemeldet'|'vorlaeufig'|'bestaetigt'} stand
 * @property {number} offen         offene Meldungen
 * @property {string[]} gruende     Bezeichnungen, ohne Doppel
 * @property {string|null} seit     erste offene Meldung, bei bestätigt die Bestätigung
 */

/** @type {{ key: Grund, label: string }[]} */
export const GRUENDE = [
  { key: 'lizenz', label: 'Lizenz falsch' },
  { key: 'inhalt', label: 'Inhalt problematisch' },
  { key: 'angaben', label: 'Link oder Angaben falsch' },
  { key: 'sonstiges', label: 'Sonstiges' }
];

/** Ab so vielen offenen Meldungen ist ein Material vorläufig ausgeblendet. */
export const AUSBLEND_SCHWELLE = 2;
export const BEGRUENDUNG_MAX = 1000;

/** @param {string} key */
export function grundLabel(key) {
  return GRUENDE.find((g) => g.key === key)?.label ?? 'Sonstiges';
}

/**
 * @param {{ grund: unknown, begruendung: unknown }} eingabe
 * @returns {{ ok: true, werte: { grund: Grund, begruendung: string }, fehler?: undefined }
 *   | { ok: false, werte: { grund: string, begruendung: string }, fehler: string }}
 */
export function eingabePruefen({ grund, begruendung }) {
  const g = typeof grund === 'string' ? grund : '';
  const text = typeof begruendung === 'string' ? begruendung.trim() : '';
  const werte = { grund: g, begruendung: text };
  const bekannt = GRUENDE.find((x) => x.key === g);
  if (!bekannt) return { ok: false, werte, fehler: 'Bitte wähle einen Grund aus.' };
  if (text === '') return { ok: false, werte, fehler: 'Bitte schreib kurz eine Begründung dazu.' };
  if (text.length > BEGRUENDUNG_MAX) return { ok: false, werte, fehler: 'Die Begründung darf höchstens 1.000 Zeichen lang sein.' };
  return { ok: true, werte: { grund: bekannt.key, begruendung: text } };
}

/**
 * Stand eines Materials aus seinen Meldungen.
 * @param {Meldung[]} meldungen  nur die dieses Materials
 * @returns {Stand}
 */
export function standVon(meldungen) {
  const offen = meldungen.filter((m) => m.status === 'offen');
  const bestaetigt = meldungen.filter((m) => m.status === 'bestaetigt');
  const gruende = [...new Set((bestaetigt.length > 0 ? bestaetigt : offen).map((m) => grundLabel(m.grund)))];
  if (bestaetigt.length > 0) {
    return { stand: 'bestaetigt', offen: offen.length, gruende, seit: bestaetigt[0].entschieden ?? bestaetigt[0].zeit };
  }
  if (offen.length === 0) return { stand: 'keine', offen: 0, gruende: [], seit: null };
  const seit = offen.map((m) => m.zeit).sort()[0];
  return { stand: offen.length >= AUSBLEND_SCHWELLE ? 'vorlaeufig' : 'gemeldet', offen: offen.length, gruende, seit };
}

/** @param {Stand} stand */
export function ausgeblendet(stand) {
  return stand.stand === 'vorlaeufig' || stand.stand === 'bestaetigt';
}

/**
 * Entscheidung der Redaktion zu einem Material. Bestätigen behält die
 * Meldungen als Grund des Ausblendens; verwerfen löscht die offenen,
 * einblenden alle (ADR-0011: verworfene Meldungen bleiben nicht liegen).
 * @param {Meldung[]} alle
 * @param {string} material
 * @param {unknown} entscheidung
 * @param {number} jetzt  ms seit 1970
 * @returns {Meldung[]}
 */
export function entscheiden(alle, material, entscheidung, jetzt) {
  const hier = (/** @type {Meldung} */ m) => m.material === material;
  if (entscheidung === 'bestaetigen') {
    const entschieden = new Date(jetzt).toISOString();
    return alle.map((m) => (hier(m) && m.status === 'offen' ? { ...m, status: /** @type {const} */ ('bestaetigt'), entschieden } : m));
  }
  if (entscheidung === 'verwerfen') return alle.filter((m) => !(hier(m) && m.status === 'offen'));
  if (entscheidung === 'einblenden') return alle.filter((m) => !hier(m));
  return alle;
}

/**
 * Meldungen der letzten 24 Stunden — für die Tagesgrenze.
 * @param {Meldung[]} alle @param {number} jetzt
 */
export function imLetztenTag(alle, jetzt) {
  const grenze = jetzt - 24 * 60 * 60 * 1000;
  return alle.filter((m) => Date.parse(m.zeit) > grenze).length;
}
