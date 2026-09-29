import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { materialAusEvent } from '../models/material.js';
import { leererInhalt } from '../services/spiegel.js';
import {
  aktiveFilter, facettenBilden, filterAnwenden, filterLesen, leererFilter, leerstandErklaeren,
  listeLaden, listenPfad, SORTIERUNGEN, sortieren
} from './uebersicht.js';

const relays = ['wss://amb-relay.edufeed.org/'];
const materialien = beispiele.map(materialAusEvent);
/** @param {Partial<import('./uebersicht.js').Filter>} teil */
const filter = (teil = {}) => ({ ...leererFilter(), ...teil });

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
  it('baut Pfade ohne leere Parameter, mehrfach je Facette, und liest sie zurück', () => {
    expect(listenPfad()).toBe('/materialien');
    expect(listenPfad({ q: 'Erntedank', stufen: ['elem'] })).toBe('/materialien?q=Erntedank&stufe=elem');
    const voll = filter({ q: 'x', stufen: ['elem', 'sek1'], typen: ['video'], schlagworte: ['kita'], sortierung: 'neu' });
    expect(listenPfad(voll)).toBe('/materialien?q=x&stufe=elem&stufe=sek1&typ=video&t=kita&sort=neu');
    expect(filterLesen(new URLSearchParams(listenPfad(voll).slice(13)))).toEqual(voll);
  });
  it('lässt die Standardsortierung im Pfad weg und ignoriert Unbekanntes', () => {
    expect(listenPfad(filter({ sortierung: 'empfohlen' }))).toBe('/materialien');
    expect(filterLesen(new URLSearchParams('q=+Ostern+&stufe=hochschule&typ=nix&sort=nix'))).toEqual(filter({ q: 'Ostern' }));
  });
});

describe('filterAnwenden', () => {
  it('sucht kleingeschrieben in Titel, Beschreibung, Herkunft und Schlagworten', () => {
    expect(filterAnwenden(materialien, filter({ q: 'ERNTEDANK' })).map((m) => m.name)).toEqual(['Erntedank feiern in der Kita']);
    expect(filterAnwenden(materialien, filter({ q: 'rpi-virtuell' }))).toHaveLength(2);
    expect(filterAnwenden(materialien, filter({ q: 'gibtesnicht' }))).toEqual([]);
  });
  it('ODER innerhalb einer Facette, UND dazwischen', () => {
    expect(filterAnwenden(materialien, filter({ stufen: ['elem'] }))).toHaveLength(2);
    expect(filterAnwenden(materialien, filter({ stufen: ['elem', 'bbs'] }))).toHaveLength(3);
    expect(filterAnwenden(materialien, filter({ stufen: ['elem'], typen: ['plan'] }))).toHaveLength(2);
    expect(filterAnwenden(materialien, filter({ stufen: ['elem'], typen: ['video'] }))).toHaveLength(0);
    expect(filterAnwenden(materialien, filter({ typen: ['video', 'sonstiges'] }))).toHaveLength(2);
    expect(filterAnwenden(materialien, filter({ schlagworte: ['kita'] }))).toHaveLength(1);
    expect(filterAnwenden(materialien, filter({ q: 'abraham', stufen: ['bbs'] }))).toEqual([]);
  });
  it('lässt ohne Filter alles durch', () => {
    expect(filterAnwenden(materialien, filter())).toHaveLength(materialien.length);
  });
});

describe('facettenBilden', () => {
  it('zählt je Facette ohne die eigene Facette, in fester Reihenfolge', () => {
    const f = facettenBilden(materialien, filter({ stufen: ['elem'] }));
    expect(f.typen.map((o) => o.key)).toEqual(['plan', 'ab', 'proj', 'uebung', 'video', 'audio', 'webseite', 'sonstiges']);
    // Stufe elem aktiv: Typen werden innerhalb elem gezählt …
    expect(f.typen.find((o) => o.key === 'plan')?.anzahl).toBe(2);
    expect(f.typen.find((o) => o.key === 'video')?.anzahl).toBe(0);
    // … die Stufen-Facette selbst aber ohne den Stufenfilter.
    expect(f.stufen.map((o) => [o.key, o.anzahl])).toEqual([['elem', 2], ['sek1', 0], ['sek2', 0], ['bbs', 1], ['unbekannt', 1]]);
    expect(f.stufen[0].aktiv).toBe(true);
  });
  it('markiert leere Chips und baut Umschalt-Pfade', () => {
    const f = facettenBilden(materialien, filter({ stufen: ['elem'] }));
    const video = f.typen.find((o) => o.key === 'video');
    expect(video?.leer).toBe(true);
    expect(video?.pfad).toBeNull();
    expect(f.typen.find((o) => o.key === 'plan')?.pfad).toBe('/materialien?stufe=elem&typ=plan');
    expect(f.stufen[0].pfad).toBe('/materialien');
    expect(f.stufen[3].pfad).toBe('/materialien?stufe=elem&stufe=bbs');
  });
  it('zeigt höchstens zwölf Schlagworte, aktive zuerst, dann nach Häufigkeit', () => {
    const viele = Array.from({ length: 20 }, (_, i) => ({ ...materialien[0], id: `m${i}`, themen: [`w${i}`, 'gemeinsam'] }));
    const f = facettenBilden(viele, filter({ schlagworte: ['w19'] }));
    expect(f.schlagworte).toHaveLength(12);
    expect(f.schlagworte[0]).toMatchObject({ key: 'w19', aktiv: true, anzahl: 1 });
    // ohne die eigene Facette gezählt: „gemeinsam“ steht in allen 20
    expect(f.schlagworte[1]).toMatchObject({ key: 'gemeinsam', anzahl: 20, aktiv: false });
  });
});

describe('sortieren', () => {
  it('empfohlen: Bild zählt doppelt, Lizenz einfach, dann jüngste zuerst', () => {
    const namen = sortieren(materialien, 'empfohlen').map((m) => m.name);
    expect(namen[0]).toBe('Abraham — eine kindgerechte Erzählung');
    expect(namen[1]).toBe('Erntedank feiern in der Kita');
    // Punktgleichstand (nur Lizenz): das jüngere zuerst
    expect(namen[2]).toBe('Material ohne Labels');
    expect(namen[3]).toBe('Reformation im Berufsschulunterricht');
  });
  it('neu, titel, anbieter', () => {
    expect(sortieren(materialien, 'neu').map((m) => m.createdAt)).toEqual([...materialien.map((m) => m.createdAt)].sort((a, b) => b - a));
    expect(sortieren(materialien, 'titel').map((m) => m.name)[0]).toBe('Abraham — eine kindgerechte Erzählung');
    expect(sortieren(materialien, 'anbieter').map((m) => m.herkunft)[0]).toBe('bbs-beispiel.de');
    expect(SORTIERUNGEN.map((s) => s.key)).toEqual(['empfohlen', 'neu', 'titel', 'anbieter']);
  });
  it('verändert die Eingabe nicht', () => {
    const kopie = [...materialien];
    sortieren(materialien, 'titel');
    expect(materialien).toEqual(kopie);
  });
});

describe('aktiveFilter', () => {
  it('liefert je aktivem Wert eine Pille mit Entfernen-Pfad', () => {
    expect(aktiveFilter(filter({ q: 'Ostern', stufen: ['sek1'], typen: ['video'], schlagworte: ['kita'] }))).toEqual([
      { art: 'q', label: '„Ostern“', entfernenPfad: '/materialien?stufe=sek1&typ=video&t=kita' },
      { art: 'typ', label: 'Video', entfernenPfad: '/materialien?q=Ostern&stufe=sek1&t=kita' },
      { art: 'stufe', label: 'Sekundarstufe I', entfernenPfad: '/materialien?q=Ostern&typ=video&t=kita' },
      { art: 't', label: 'kita', entfernenPfad: '/materialien?q=Ostern&stufe=sek1&typ=video' }
    ]);
    expect(aktiveFilter(filter())).toEqual([]);
  });
});

describe('listeLaden', () => {
  it('liefert Karten sortiert mit Icon, Cover-Farben, Facetten und Sortierungen', () => {
    const daten = listeLaden({ inhalt: { ...leererInhalt(), materialien: beispiele }, fehlschlag: null, relays });
    expect(daten.karten).toHaveLength(4);
    expect(daten.karten[0].material.name).toBe('Abraham — eine kindgerechte Erzählung');
    expect(daten.gesamt).toBe(4);
    expect(daten.karten[0].icon).toBe('notebook');
    expect(daten.karten[0].cover.ink).toMatch(/^#/);
    expect(daten.leerstand).toBeNull();
    expect(daten.pillen).toEqual([]);
    expect(daten.facetten.typen).toHaveLength(8);
    expect(daten.sortierungen.find((s) => s.aktiv)?.key).toBe('empfohlen');
    expect(daten.sortierungen.find((s) => s.key === 'titel')?.pfad).toBe('/materialien?sort=titel');
  });
  it('wendet Filter und Sortierung an und behält gesamt', () => {
    const daten = listeLaden({ inhalt: { ...leererInhalt(), materialien: beispiele }, fehlschlag: null, relays, filter: filter({ q: 'kita', sortierung: 'titel' }) });
    expect(daten.karten).toHaveLength(1);
    expect(daten.gesamt).toBe(4);
    expect(daten.pillen[0].label).toBe('„kita“');
    expect(daten.sortierungen.find((s) => s.aktiv)?.key).toBe('titel');
  });
});
