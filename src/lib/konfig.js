/**
 * @typedef {object} Konfig
 * @property {string[]} relays               wss-Adressen, mindestens eine (Pflicht)
 * @property {string[]} autoren              Hex-Pubkeys der Quelle; leer = alle Autoren (ADR-0003, offen)
 * @property {string[]} faecher              URIs für `#about:id`; leer = kein Fachfilter (ADR-0004)
 * @property {string[]} vorrang              Hex-Pubkeys, die bei gleichem `d` ohne `?von=` gewinnen, in dieser Reihenfolge (ADR-0009)
 * @property {string} spiegelPfad            JSON-Datei des Spiegels
 * @property {number} spiegelIntervallS      Abstand zwischen zwei Läufen
 * @property {number} spiegelStartwartezeitS wie lange der Start auf den ersten Lauf wartet
 * @property {number} spiegelLimit           Höchstzahl Events je Relay (blätternd zu je 250)
 * @property {{ an: boolean, pfad: string, intervallS: number, taktS: number, jeTakt: number }} linkpruefung
 *   Link-Prüfung (ADR-0010): JSON-Datei, Abstand je Link, Takt und Links je Takt
 * @property {boolean} vorschaubilder       Bilder fremder Server zeigen; aus, bis VORSCHAUBILDER=an
 * @property {{ an: boolean, pfad: string, jeTag: number, kennwort: string }} meldungen
 *   Meldefunktion (ADR-0011): JSON-Datei, Höchstzahl je 24 Stunden, Kennwort der Redaktionsseite (leer = offen)
 * @property {{ versand: boolean, an: string, von: string, host: string, port: number, benutzer: string, kennwort: string }} post
 *   E-Mail an die Redaktion; ohne `versand` nur ins Protokoll
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
 * Schalter "an" oder "aus", leer heißt: Standard. Anderes bricht ab.
 * @param {string|undefined} roh @param {string} name
 * @returns {''|'an'|'aus'}
 */
function anAus(roh, name) {
  const wert = (roh ?? '').trim().toLowerCase();
  if (wert !== '' && wert !== 'an' && wert !== 'aus') {
    throw new Error(`${name} muss "an" oder "aus" sein, ist aber "${roh}".`);
  }
  return wert;
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
 * Hex-Pubkeys, kleingeschrieben; ein anderer Eintrag bricht ab.
 * @param {string|undefined} roh @param {string} name
 */
function schluessel(roh, name) {
  const werte = liste(roh).map((a) => a.toLowerCase());
  const keinSchluessel = werte.filter((a) => !HEX64.test(a));
  if (keinSchluessel.length > 0) {
    throw new Error(`${name}: kein 64-stelliger Hex-Schlüssel: ${keinSchluessel.join(', ')}`);
  }
  return werte;
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

  const autoren = schluessel(quelle.QUELLE_AUTOREN, 'QUELLE_AUTOREN');
  const vorrang = schluessel(quelle.QUELLE_VORRANG, 'QUELLE_VORRANG');

  const faecher = liste(quelle.QUELLE_FAECHER);
  const keineUri = faecher.filter((f) => !/^https?:\/\//.test(f));
  if (keineUri.length > 0) {
    throw new Error(`QUELLE_FAECHER: keine URI: ${keineUri.join(', ')}`);
  }

  const schalter = anAus(quelle.LINKPRUEFUNG, 'LINKPRUEFUNG');
  const bilder = anAus(quelle.VORSCHAUBILDER, 'VORSCHAUBILDER');

  // E-Mails an die Redaktion (ADR-0011): ohne MAIL_VERSAND=an nur ins
  // Protokoll. Ist der Versand an, muss alles da sein — sonst gingen
  // Meldungen still verloren.
  const post = {
    versand: anAus(quelle.MAIL_VERSAND, 'MAIL_VERSAND') === 'an',
    an: (quelle.MAIL_AN ?? '').trim(),
    von: (quelle.MAIL_VON ?? '').trim(),
    host: (quelle.SMTP_HOST ?? '').trim(),
    port: positiveGanzzahl(quelle.SMTP_PORT, 587, 'SMTP_PORT'),
    benutzer: (quelle.SMTP_BENUTZER ?? '').trim(),
    kennwort: (quelle.SMTP_KENNWORT ?? '').trim()
  };
  if (post.versand) {
    const fehlt = Object.entries({ MAIL_AN: post.an, MAIL_VON: post.von, SMTP_HOST: post.host }).filter(([, wert]) => wert === '').map(([name]) => name);
    if (fehlt.length > 0) throw new Error(`MAIL_VERSAND=an, aber es fehlt: ${fehlt.join(', ')} (siehe .env.example).`);
  }

  return {
    meldungen: {
      an: anAus(quelle.MELDUNGEN, 'MELDUNGEN') !== 'aus',
      pfad: (quelle.MELDUNGEN_PFAD ?? '').trim() || 'daten/meldungen.json',
      jeTag: positiveGanzzahl(quelle.MELDUNGEN_JE_TAG, 30, 'MELDUNGEN_JE_TAG'),
      // Leer: Die Redaktionsseite ist vorerst offen (ADR-0011).
      kennwort: (quelle.REDAKTION_KENNWORT ?? '').trim()
    },
    post,
    relays,
    autoren,
    faecher,
    vorrang,
    // Standard aus: bis Rechte und Datenschutz der fremden Bilder geklärt sind (2026-10-09).
    vorschaubilder: bilder === 'an',
    linkpruefung: {
      an: schalter !== 'aus',
      pfad: (quelle.LINKPRUEFUNG_PFAD ?? '').trim() || 'daten/linkpruefung.json',
      intervallS: positiveGanzzahl(quelle.LINKPRUEFUNG_INTERVALL_S, 7 * 24 * 60 * 60, 'LINKPRUEFUNG_INTERVALL_S'),
      taktS: positiveGanzzahl(quelle.LINKPRUEFUNG_TAKT_S, 60, 'LINKPRUEFUNG_TAKT_S'),
      jeTakt: positiveGanzzahl(quelle.LINKPRUEFUNG_JE_TAKT, 20, 'LINKPRUEFUNG_JE_TAKT')
    },
    spiegelPfad: (quelle.SPIEGEL_PFAD ?? '').trim() || 'daten/spiegel.json',
    spiegelIntervallS: positiveGanzzahl(quelle.SPIEGEL_INTERVALL_S, 600, 'SPIEGEL_INTERVALL_S'),
    spiegelStartwartezeitS: positiveGanzzahl(
      quelle.SPIEGEL_STARTWARTEZEIT_S, 20, 'SPIEGEL_STARTWARTEZEIT_S'
    ),
    spiegelLimit: positiveGanzzahl(quelle.SPIEGEL_LIMIT, 10000, 'SPIEGEL_LIMIT')
  };
}
