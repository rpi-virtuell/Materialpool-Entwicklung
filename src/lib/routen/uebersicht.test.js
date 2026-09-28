import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { leererInhalt } from '../services/spiegel.js';
import { leerstandErklaeren, startLaden } from './uebersicht.js';

const relays = ['wss://amb-relay.edufeed.org/'];

describe('leerstandErklaeren — nie eine leere Liste ohne Erklärung', () => {
  it('schweigt, wenn Material da ist', () => {
    const inhalt = { ...leererInhalt(), materialien: beispiele };
    expect(leerstandErklaeren(inhalt, null, relays)).toBeNull();
  });
  it('nennt den Fehlschlag samt Relays', () => {
    const fehlschlag = { zeitpunkt: 'x', gefragteRelays: relays, grund: /** @type {const} */ ('kein-relay-erreichbar') };
    expect(leerstandErklaeren(leererInhalt(), fehlschlag, relays)).toMatch(/Kein Relay war erreichbar.*amb-relay/);
  });
  it('erklärt den fehlenden ersten Lauf', () => {
    expect(leerstandErklaeren(leererInhalt(), null, relays)).toMatch(/noch keinen Stand/);
  });
  it('erklärt eine belastbare leere Antwort mit Hinweis auf QUELLE_AUTOREN', () => {
    const inhalt = {
      ...leererInhalt(),
      stand: { zeitpunkt: 'x', dauerMs: 1, gefragteRelays: relays, nichtErreichbar: [], anzahl: { materialien: 0 } }
    };
    expect(leerstandErklaeren(inhalt, null, relays)).toMatch(/QUELLE_AUTOREN/);
  });
});

describe('startLaden', () => {
  it('liefert Materialien in Spiegelreihenfolge und breites Layout', () => {
    const daten = startLaden({ inhalt: { ...leererInhalt(), materialien: beispiele }, fehlschlag: null, relays });
    expect(daten.materialien.map((m) => m.name)).toEqual(['Abraham — eine kindgerechte Erzählung', 'Material ohne Labels']);
    expect(daten.leerstand).toBeNull();
    expect(daten.breit).toBe(true);
  });
});
