import { describe, expect, it } from 'vitest';
import { konfigLesen } from './konfig.js';

const HEX = 'a'.repeat(64);

describe('konfigLesen', () => {
  it('bricht ohne RELAYS ab und nennt die Vorlage', () => {
    expect(() => konfigLesen({})).toThrow(/RELAYS fehlt/);
  });

  it('lehnt Relays ohne wss ab', () => {
    expect(() => konfigLesen({ RELAYS: 'https://amb-relay.edufeed.org/' })).toThrow(/keine wss-Adresse/);
    expect(() => konfigLesen({ RELAYS: 'ws://amb-relay.edufeed.org/' })).toThrow(/keine wss-Adresse/);
  });

  it('erlaubt ws:// allein für ein Mock-Relay auf der eigenen Maschine', () => {
    expect(konfigLesen({ RELAYS: 'ws://127.0.0.1:3790/' }).relays).toEqual(['ws://127.0.0.1:3790/']);
    expect(konfigLesen({ RELAYS: 'ws://localhost:3790' }).relays).toEqual(['ws://localhost:3790']);
    expect(() => konfigLesen({ RELAYS: 'ws://127.0.0.1.example.org/' })).toThrow(/keine wss-Adresse/);
  });

  it('liefert Standardwerte, wenn nur RELAYS gesetzt ist', () => {
    const k = konfigLesen({ RELAYS: 'wss://a/, wss://b/' });
    expect(k.relays).toEqual(['wss://a/', 'wss://b/']);
    expect(k.autoren).toEqual([]);
    expect(k.faecher).toEqual([]);
    expect(k.vorrang).toEqual([]);
    expect(k.spiegelPfad).toBe('daten/spiegel.json');
    expect(k.spiegelIntervallS).toBe(600);
    expect(k.spiegelStartwartezeitS).toBe(20);
    expect(k.spiegelLimit).toBe(10000);
  });

  it('nimmt Autoren als Hex-Liste, kleingeschrieben', () => {
    const k = konfigLesen({ RELAYS: 'wss://a/', QUELLE_AUTOREN: `${HEX.toUpperCase()}, ${'b'.repeat(64)}` });
    expect(k.autoren).toEqual([HEX, 'b'.repeat(64)]);
  });

  it('lehnt einen Autor ab, der kein Hex-Schlüssel ist', () => {
    expect(() => konfigLesen({ RELAYS: 'wss://a/', QUELLE_AUTOREN: 'npub1abc' })).toThrow(/QUELLE_AUTOREN/);
  });

  it('nimmt QUELLE_VORRANG wie QUELLE_AUTOREN als Hex-Liste und lehnt anderes ab', () => {
    expect(konfigLesen({ RELAYS: 'wss://a/', QUELLE_VORRANG: `${HEX.toUpperCase()},${'b'.repeat(64)}` }).vorrang).toEqual([HEX, 'b'.repeat(64)]);
    expect(() => konfigLesen({ RELAYS: 'wss://a/', QUELLE_VORRANG: 'npub1abc' })).toThrow(/QUELLE_VORRANG/);
  });

  it('nimmt Fächer als URI-Liste und lehnt anderes ab', () => {
    const k = konfigLesen({ RELAYS: 'wss://a/', QUELLE_FAECHER: 'http://w3id.org/kim/schulfaecher/s1024, https://w3id.org/kim/schulfaecher/s1026' });
    expect(k.faecher).toEqual(['http://w3id.org/kim/schulfaecher/s1024', 'https://w3id.org/kim/schulfaecher/s1026']);
    expect(() => konfigLesen({ RELAYS: 'wss://a/', QUELLE_FAECHER: 's1024' })).toThrow(/QUELLE_FAECHER/);
  });

  it('Link-Prüfung (ADR-0010): an mit Standardwerten, abschaltbar, Unbrauchbares bricht ab', () => {
    const k = konfigLesen({ RELAYS: 'wss://a/' });
    expect(k.linkpruefung).toEqual({ an: true, pfad: 'daten/linkpruefung.json', intervallS: 604800, taktS: 60, jeTakt: 20 });
    expect(konfigLesen({ RELAYS: 'wss://a/', LINKPRUEFUNG: 'aus' }).linkpruefung.an).toBe(false);
    expect(konfigLesen({ RELAYS: 'wss://a/', LINKPRUEFUNG_JE_TAKT: '5' }).linkpruefung.jeTakt).toBe(5);
    expect(() => konfigLesen({ RELAYS: 'wss://a/', LINKPRUEFUNG: 'vielleicht' })).toThrow(/LINKPRUEFUNG/);
    expect(() => konfigLesen({ RELAYS: 'wss://a/', LINKPRUEFUNG_TAKT_S: '0' })).toThrow(/LINKPRUEFUNG_TAKT_S/);
  });

  it('Vorschaubilder sind aus, bis VORSCHAUBILDER=an gesetzt ist', () => {
    expect(konfigLesen({ RELAYS: 'wss://a/' }).vorschaubilder).toBe(false);
    expect(konfigLesen({ RELAYS: 'wss://a/', VORSCHAUBILDER: 'an' }).vorschaubilder).toBe(true);
    expect(konfigLesen({ RELAYS: 'wss://a/', VORSCHAUBILDER: 'aus' }).vorschaubilder).toBe(false);
    expect(() => konfigLesen({ RELAYS: 'wss://a/', VORSCHAUBILDER: 'ja' })).toThrow(/VORSCHAUBILDER/);
  });

  it('Meldungen (ADR-0011): an mit Standardwerten, ohne Kennwort, abschaltbar', () => {
    expect(konfigLesen({ RELAYS: 'wss://a/' }).meldungen).toEqual({ an: true, pfad: 'daten/meldungen.json', jeTag: 30, kennwort: '' });
    expect(konfigLesen({ RELAYS: 'wss://a/', MELDUNGEN: 'aus' }).meldungen.an).toBe(false);
    expect(konfigLesen({ RELAYS: 'wss://a/', REDAKTION_KENNWORT: ' geheim ' }).meldungen.kennwort).toBe('geheim');
    expect(() => konfigLesen({ RELAYS: 'wss://a/', MELDUNGEN: 'ja' })).toThrow(/MELDUNGEN/);
    expect(() => konfigLesen({ RELAYS: 'wss://a/', MELDUNGEN_JE_TAG: '0' })).toThrow(/MELDUNGEN_JE_TAG/);
  });

  it('E-Mail nur ins Protokoll, bis MAIL_VERSAND=an; dann brechen fehlende Angaben ab', () => {
    expect(konfigLesen({ RELAYS: 'wss://a/' }).post).toEqual({ versand: false, an: '', von: '', host: '', port: 587, benutzer: '', kennwort: '' });
    const voll = { RELAYS: 'wss://a/', MAIL_VERSAND: 'an', MAIL_AN: 'redaktion@example.org', MAIL_VON: 'materialpool@example.org', SMTP_HOST: 'smtp.example.org' };
    expect(konfigLesen({ ...voll, SMTP_PORT: '465', SMTP_BENUTZER: 'mp', SMTP_KENNWORT: 'pw' }).post).toEqual({
      versand: true, an: 'redaktion@example.org', von: 'materialpool@example.org', host: 'smtp.example.org', port: 465, benutzer: 'mp', kennwort: 'pw'
    });
    for (const fehlt of ['MAIL_AN', 'MAIL_VON', 'SMTP_HOST']) {
      expect(() => konfigLesen({ ...voll, [fehlt]: '' })).toThrow(new RegExp(fehlt));
    }
    expect(() => konfigLesen({ RELAYS: 'wss://a/', MAIL_VERSAND: 'vielleicht' })).toThrow(/MAIL_VERSAND/);
  });

  it('bricht bei unbrauchbarer Ganzzahl ab statt still auf den Standard zu fallen', () => {
    expect(() => konfigLesen({ RELAYS: 'wss://a/', SPIEGEL_LIMIT: 'viele' })).toThrow(/SPIEGEL_LIMIT/);
    expect(() => konfigLesen({ RELAYS: 'wss://a/', SPIEGEL_INTERVALL_S: '0' })).toThrow(/SPIEGEL_INTERVALL_S/);
  });
});
