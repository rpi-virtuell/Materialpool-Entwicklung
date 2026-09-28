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
    expect(k.spiegelPfad).toBe('daten/spiegel.json');
    expect(k.spiegelIntervallS).toBe(600);
    expect(k.spiegelStartwartezeitS).toBe(20);
    expect(k.spiegelLimit).toBe(500);
  });

  it('nimmt Autoren als Hex-Liste, kleingeschrieben', () => {
    const k = konfigLesen({ RELAYS: 'wss://a/', QUELLE_AUTOREN: `${HEX.toUpperCase()}, ${'b'.repeat(64)}` });
    expect(k.autoren).toEqual([HEX, 'b'.repeat(64)]);
  });

  it('lehnt einen Autor ab, der kein Hex-Schlüssel ist', () => {
    expect(() => konfigLesen({ RELAYS: 'wss://a/', QUELLE_AUTOREN: 'npub1abc' })).toThrow(/QUELLE_AUTOREN/);
  });

  it('bricht bei unbrauchbarer Ganzzahl ab statt still auf den Standard zu fallen', () => {
    expect(() => konfigLesen({ RELAYS: 'wss://a/', SPIEGEL_LIMIT: 'viele' })).toThrow(/SPIEGEL_LIMIT/);
    expect(() => konfigLesen({ RELAYS: 'wss://a/', SPIEGEL_INTERVALL_S: '0' })).toThrow(/SPIEGEL_INTERVALL_S/);
  });
});
