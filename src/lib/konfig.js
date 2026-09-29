/**
 * @typedef {object} Konfig
 * @property {string[]} relays               wss-Adressen, mindestens eine (Pflicht)
 * @property {string[]} autoren              Hex-Pubkeys der Quelle; leer = alle Autoren (ADR-0003, offen)
 * @property {string[]} faecher              URIs für `#about:id`; leer = kein Fachfilter (ADR-0004)
 * @property {string} spiegelPfad            JSON-Datei des Spiegels
 * @property {number} spiegelIntervallS      Abstand zwischen zwei Läufen
 * @property {number} spiegelStartwartezeitS wie lange der Start auf den ersten Lauf wartet
 * @property {number} spiegelLimit           Höchstzahl Events je Relay (blätternd zu je 250)
 */

const HEX64 = /^[0-9a-f]{64}$/;

/**
 * Positive Ganzzahl aus der Umgebung, mit Standard. Ein gesetzter, aber
 * unbrauchbarer Wert bricht ab — stiller Rückfall auf den Standard würde
 * eine Fehlkonfiguration verstecken.
 * @param {string|undefined} roh @param {number} standard @param {string} name
 */
function positiveGanzzahl(roh, standard, name) {
  const text = (roh ?? '').trim();
  if (text === '') return standard;
  const wert = Number(text);
  if (!Number.isInteger(wert) || wert <= 0) {
    throw new Error(`${name} muss eine positive Ganzzahl sein, ist aber "${text}".`);
  }
  return wert;
}

/**
 * Relays sprechen verschlüsselt (wss). Unverschlüsselt (ws) ist allein für
 * ein Mock-Relay auf der eigenen Maschine erlaubt — für lokale Prüfungen
 * des gebauten Servers ohne Netz (test/mock-relay.mjs).
 * @param {string} adresse
 */
export function relayAdresseErlaubt(adresse) {
  if (adresse.startsWith('wss://')) return true;
  return /^ws:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?(\/|$)/.test(adresse);
}

/**
 * Komma-getrennte Liste, getrimmt, ohne Leereinträge.
 * @param {string|undefined} roh
 */
function liste(roh) {
  return (roh ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

/**
 * Liest die Konfiguration und bricht bei fehlendem Pflichtwert ab.
 * Lieber hier abbrechen als später leere Seiten liefern (CLAUDE.md).
 *
 * @param {Record<string, string|undefined>} quelle
 * @returns {Konfig}
 */
export function konfigLesen(quelle) {
  const relays = liste(quelle.RELAYS);
  if (relays.length === 0) {
    throw new Error(
      'RELAYS fehlt. Mindestens ein Relay angeben, komma-getrennt — ' +
        'z. B. wss://amb-relay.edufeed.org/ (siehe .env.example).'
    );
  }
  const falsch = relays.filter((r) => !relayAdresseErlaubt(r));
  if (falsch.length > 0) {
    throw new Error(
      `RELAYS: keine wss-Adresse: ${falsch.join(', ')} ` +
        '(ws:// ist nur für ein Mock-Relay auf 127.0.0.1 oder localhost erlaubt).'
    );
  }

  const autoren = liste(quelle.QUELLE_AUTOREN).map((a) => a.toLowerCase());
  const keinSchluessel = autoren.filter((a) => !HEX64.test(a));
  if (keinSchluessel.length > 0) {
    throw new Error(
      `QUELLE_AUTOREN: kein 64-stelliger Hex-Schlüssel: ${keinSchluessel.join(', ')}`
    );
  }

  const faecher = liste(quelle.QUELLE_FAECHER);
  const keineUri = faecher.filter((f) => !/^https?:\/\//.test(f));
  if (keineUri.length > 0) {
    throw new Error(`QUELLE_FAECHER: keine URI: ${keineUri.join(', ')}`);
  }

  return {
    relays,
    autoren,
    faecher,
    spiegelPfad: (quelle.SPIEGEL_PFAD ?? '').trim() || 'daten/spiegel.json',
    spiegelIntervallS: positiveGanzzahl(quelle.SPIEGEL_INTERVALL_S, 600, 'SPIEGEL_INTERVALL_S'),
    spiegelStartwartezeitS: positiveGanzzahl(
      quelle.SPIEGEL_STARTWARTEZEIT_S, 20, 'SPIEGEL_STARTWARTEZEIT_S'
    ),
    spiegelLimit: positiveGanzzahl(quelle.SPIEGEL_LIMIT, 10000, 'SPIEGEL_LIMIT')
  };
}
