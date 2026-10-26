import { afterEach, describe, expect, it } from 'vitest';
import { postEinstellen, postVerschicken } from './post.js';

const aus = { versand: false, an: '', von: '', host: '', port: 587, benutzer: '', kennwort: '' };
const an = { versand: true, an: 'redaktion@example.org', von: 'materialpool@example.org', host: 'smtp.example.org', port: 587, benutzer: 'mp', kennwort: 'pw' };

afterEach(() => postEinstellen(aus));

describe('postVerschicken (ADR-0011)', () => {
  it('ohne MAIL_VERSAND=an: schreibt die E-Mail ins Protokoll, verschickt nichts', async () => {
    const zeilen = /** @type {string[]} */ ([]);
    postEinstellen(aus, { protokoll: (z) => zeilen.push(z), transport: () => { throw new Error('darf nicht verschicken'); } });
    expect(await postVerschicken({ betreff: 'Meldung zu „Erntedank“', text: 'Grund: Lizenz falsch' })).toBe('protokoll');
    expect(zeilen.join('\n')).toContain('Meldung zu „Erntedank“');
    expect(zeilen.join('\n')).toContain('Grund: Lizenz falsch');
  });

  it('mit Versand: schickt an MAIL_AN, von MAIL_VON', async () => {
    const gesendet = /** @type {any[]} */ ([]);
    /** @type {any[]} */
    const einstellungen = [];
    postEinstellen(an, {
      protokoll: () => {},
      transport: (e) => {
        einstellungen.push(e);
        return { sendMail: async (/** @type {any} */ brief) => { gesendet.push(brief); } };
      }
    });
    expect(await postVerschicken({ betreff: 'B', text: 'T' })).toBe('gesendet');
    expect(gesendet).toEqual([{ from: 'materialpool@example.org', to: 'redaktion@example.org', subject: 'B', text: 'T' }]);
    expect(einstellungen[0]).toMatchObject({ host: 'smtp.example.org', port: 587, auth: { user: 'mp', pass: 'pw' } });
  });

  it('scheitert der Versand, steht die E-Mail im Protokoll — nichts geht still verloren, nichts wirft', async () => {
    const zeilen = /** @type {string[]} */ ([]);
    postEinstellen(an, {
      protokoll: (z) => zeilen.push(z),
      transport: () => ({ sendMail: async () => { throw new Error('Verbindung abgelehnt'); } })
    });
    expect(await postVerschicken({ betreff: 'B', text: 'Begründung X' })).toBe('fehler');
    expect(zeilen.join('\n')).toContain('Verbindung abgelehnt');
    expect(zeilen.join('\n')).toContain('Begründung X');
  });
});
