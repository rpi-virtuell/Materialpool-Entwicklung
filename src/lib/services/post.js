/**
 * E-Mail an die Redaktion (ADR-0011). Ohne MAIL_VERSAND=an steht sie nur
 * im Protokoll des Servers — so läuft die Meldefunktion lokal und live,
 * bevor die Zugangsdaten auf dem Server liegen. Scheitert der Versand,
 * steht sie ebenfalls dort: Nichts geht still verloren, nichts wirft.
 * Kennt die Oberfläche nicht.
 */

/** @typedef {import('../konfig.js').Konfig['post']} Post */
/** @typedef {{ sendMail: (brief: { from: string, to: string, subject: string, text: string }) => Promise<unknown> }} Transport */
/** @typedef {(einstellungen: { host: string, port: number, secure: boolean, auth?: { user: string, pass: string } }) => Transport|Promise<Transport>} TransportBauen */

/**
 * Erst beim ersten Versand geladen: Ohne MAIL_VERSAND=an braucht es nodemailer nie.
 * @type {TransportBauen}
 */
const nodemailerTransport = (einstellungen) => import('nodemailer').then((n) => n.createTransport(einstellungen));

/** @type {Post} */
let post = { versand: false, an: '', von: '', host: '', port: 587, benutzer: '', kennwort: '' };
/** @type {(zeile: string) => void} */
let protokoll = (zeile) => console.info(zeile);
/** @type {TransportBauen} */
let transportBauen = nodemailerTransport;
/** @type {Promise<Transport>|null} */
let transport = null;

/**
 * @param {Post} einstellungen
 * @param {{ protokoll?: (zeile: string) => void, transport?: TransportBauen }} [ersatz]  für Tests
 */
export function postEinstellen(einstellungen, ersatz = {}) {
  post = einstellungen;
  protokoll = ersatz.protokoll ?? ((zeile) => console.info(zeile));
  transportBauen = ersatz.transport ?? nodemailerTransport;
  transport = null;
}

/** @param {{ betreff: string, text: string }} brief @param {string} kopf */
function insProtokoll({ betreff, text }, kopf) {
  protokoll(`── ${kopf} ──\nAn: ${post.an || '(MAIL_AN nicht gesetzt)'}\nBetreff: ${betreff}\n\n${text}\n──`);
}

/**
 * @param {{ betreff: string, text: string }} brief
 * @returns {Promise<'protokoll'|'gesendet'|'fehler'>}
 */
export async function postVerschicken(brief) {
  if (!post.versand) {
    insProtokoll(brief, 'E-Mail an die Redaktion (nicht verschickt, MAIL_VERSAND ist nicht an)');
    return 'protokoll';
  }
  try {
    transport ??= Promise.resolve(
      transportBauen({
        host: post.host,
        port: post.port,
        // 465 spricht von Anfang an verschlüsselt, 587 wechselt per STARTTLS.
        secure: post.port === 465,
        ...(post.benutzer ? { auth: { user: post.benutzer, pass: post.kennwort } } : {})
      })
    );
    await (await transport).sendMail({ from: post.von, to: post.an, subject: brief.betreff, text: brief.text });
    return 'gesendet';
  } catch (fehler) {
    transport = null;
    insProtokoll(brief, `E-Mail an die Redaktion konnte nicht verschickt werden: ${fehler instanceof Error ? fehler.message : String(fehler)}`);
    return 'fehler';
  }
}
