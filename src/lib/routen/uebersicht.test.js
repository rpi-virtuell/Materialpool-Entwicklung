import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { materialAusEvent } from '../models/material.js';
import { leererInhalt } from '../services/spiegel.js';
import { aktiveFilter, filterAnwenden, filterLesen, leerstandErklaeren, listeLaden, listenPfad } from './uebersicht.js';

const relays = ['wss://amb-relay.edufeed.org/'];
const materialien = beispiele.map(materialAusEvent);

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

describe('listenPfad und filterLesen', () => {
  it('baut Pfade ohne leere Parameter und liest sie zurück', () => {
    expect(listenPfad()).toBe('/materialien');
    expect(listenPfad({ q: 'Erntedank', stufe: 'elem' })).toBe('/materialien?q=Erntedank&stufe=elem');
    expect(filterLesen(new URLSearchParams('q=+Ostern+&stufe=sek1'))).toEqual({ q: 'Ostern', stufe: 'sek1' });
    expect(filterLesen(new URLSearchParams('stufe=hochschule'))).toEqual({ q: '', stufe: null });
  });
});

describe('filterAnwenden', () => {
  it('sucht kleingeschrieben in Titel, Beschreibung, Herkunft und Schlagworten', () => {
    expect(filterAnwenden(materialien, { q: 'ERNTEDANK', stufe: null }).map((m) => m.name)).toEqual(['Erntedank feiern in der Kita']);
    expect(filterAnwenden(materialien, { q: 'rpi-virtuell', stufe: null })).toHaveLength(2);
    expect(filterAnwenden(materialien, { q: 'luther', stufe: null })).toHaveLength(1);
    expect(filterAnwenden(materialien, { q: 'gibtesnicht', stufe: null })).toEqual([]);
  });
  it('filtert nach Stufe und kombiniert mit UND', () => {
    expect(filterAnwenden(materialien, { q: '', stufe: 'elem' })).toHaveLength(2);
    expect(filterAnwenden(materialien, { q: 'abraham', stufe: 'elem' })).toHaveLength(1);
    expect(filterAnwenden(materialien, { q: 'abraham', stufe: 'bbs' })).toEqual([]);
  });
  it('lässt ohne Filter alles durch', () => {
    expect(filterAnwenden(materialien, { q: '', stufe: null })).toHaveLength(materialien.length);
  });
});

describe('aktiveFilter', () => {
  it('liefert je Filter eine Pille mit Entfernen-Pfad', () => {
    expect(aktiveFilter({ q: 'Ostern', stufe: 'sek1' })).toEqual([
      { art: 'q', label: '„Ostern“', entfernenPfad: '/materialien?stufe=sek1' },
      { art: 'stufe', label: 'Sekundarstufe I', entfernenPfad: '/materialien?q=Ostern' }
    ]);
    expect(aktiveFilter({ q: '', stufe: null })).toEqual([]);
  });
});

describe('listeLaden', () => {
  it('liefert Karten in Spiegelreihenfolge mit Icon und Cover-Farben', () => {
    const daten = listeLaden({ inhalt: { ...leererInhalt(), materialien: beispiele }, fehlschlag: null, relays });
    expect(daten.karten.map((k) => k.material.name)[0]).toBe('Abraham — eine kindgerechte Erzählung');
    expect(daten.karten).toHaveLength(4);
    expect(daten.gesamt).toBe(4);
    expect(daten.karten[0].icon).toBe('notebook');
    expect(daten.karten[0].cover.ink).toMatch(/^#/);
    expect(daten.leerstand).toBeNull();
    expect(daten.pillen).toEqual([]);
  });
  it('wendet den Filter an und behält gesamt', () => {
    const daten = listeLaden({ inhalt: { ...leererInhalt(), materialien: beispiele }, fehlschlag: null, relays, filter: { q: 'kita', stufe: null } });
    expect(daten.karten).toHaveLength(1);
    expect(daten.gesamt).toBe(4);
    expect(daten.pillen[0].label).toBe('„kita“');
  });
});
