import { describe, expect, it } from 'vitest';
import { SUCHTEXT_MAX } from '../models/text.js';
import { frageHinweis, frageUmleitung, UMLEITUNG_MAX } from './frage.js';
import { filterLesen, listenPfad } from './uebersicht.js';

/** @param {string} query */
const p = (query) => new URLSearchParams(query);

describe('frageUmleitung', () => {
  it('macht aus einem Satz Filter und Themenwörter und merkt sich die Frage', () => {
    expect(frageUmleitung(p('q=Ich+suche+ein+Video+zu+Ostern+f%C3%BCr+meine+Konfis')))
      .toBe('/materialien?q=Ostern&stufe=sek1&typ=video&frage=Ich+suche+ein+Video+zu+Ostern+f%C3%BCr+meine+Konfis');
  });
  it('ersetzt nur die Facetten, die der Satz nennt; die übrigen bleiben', () => {
    expect(frageUmleitung(p('q=Videos+f%C3%BCr+Kinder+zu+Ostern&stufe=sek2&fach=katholisch&seite=4')))
      .toBe('/materialien?q=Ostern&stufe=elem&typ=video&fach=katholisch&frage=Videos+f%C3%BCr+Kinder+zu+Ostern&vorher=stufe%3Dsek2');
  });
  it('lässt Stichwortsuchen, schon gedeutete Seiten und den Wortlaut in Ruhe', () => {
    expect(frageUmleitung(p('q=Martin+Luther'))).toBeNull();
    expect(frageUmleitung(p(''))).toBeNull();
    expect(frageUmleitung(p('q=Ostern&stufe=sek1&typ=video&frage=Video+zu+Ostern+f%C3%BCr+Konfis'))).toBeNull();
    expect(frageUmleitung(p('q=Video+zu+Ostern+f%C3%BCr+Konfis&wortlaut=Video+zu+Ostern+f%C3%BCr+Konfis'))).toBeNull();
  });
  it('deutet höchstens SUCHTEXT_MAX Zeichen und leitet nie auf eine überlange Adresse um', () => {
    const lang = frageUmleitung(p(`q=${encodeURIComponent('Ich suche ein Video über Ostern für Kinder '.repeat(400))}`));
    expect(lang).not.toBeNull();
    expect(/** @type {string} */ (lang).length).toBeLessThanOrEqual(UMLEITUNG_MAX);
    expect(new URL(`http://x${lang}`).searchParams.get('frage')?.length).toBeLessThanOrEqual(SUCHTEXT_MAX);
    const vieleSchlagworte = Array.from({ length: 400 }, (_, i) => `t=Schlagwort${i}`).join('&');
    expect(frageUmleitung(p(`q=Video+zu+Ostern+f%C3%BCr+Konfis&${vieleSchlagworte}`))).toBeNull();
  });
  it('deutet einen neuen Satz, auch wenn ein früherer im Wortlaut stand', () => {
    expect(frageUmleitung(p('q=Film+%C3%BCber+Taufe+f%C3%BCr+Kinder&wortlaut=Video+zu+Ostern+f%C3%BCr+Konfis')))
      .toBe('/materialien?q=Taufe&stufe=elem&typ=video&frage=Film+%C3%BCber+Taufe+f%C3%BCr+Kinder');
  });
});

describe('frageHinweis', () => {
  it('zeigt, wie die Frage verstanden wurde, und bietet Rückgängig an', () => {
    const ziel = /** @type {string} */ (frageUmleitung(p('q=Ich+suche+ein+Video+zu+Ostern+f%C3%BCr+meine+Konfis&fach=katholisch')));
    const hinweis = frageHinweis(new URL(`http://x${ziel}`).searchParams);
    expect(hinweis).toEqual({
      text: 'Ich suche ein Video zu Ostern für meine Konfis',
      teile: [{ woerter: 'Video', label: 'Video' }, { woerter: 'Konfis', label: 'Sekundarstufe I' }],
      themen: ['Ostern'],
      rueckgaengigPfad: '/materialien?q=Ich+suche+ein+Video+zu+Ostern+f%C3%BCr+meine+Konfis&fach=katholisch&wortlaut=Ich+suche+ein+Video+zu+Ostern+f%C3%BCr+meine+Konfis'
    });
  });
  it('führt Rückgängig zum Wortlaut, der nicht noch einmal gedeutet wird', () => {
    const ziel = /** @type {string} */ (frageUmleitung(p('q=Videos+f%C3%BCr+Kinder+zu+Ostern')));
    const zurueck = /** @type {NonNullable<ReturnType<typeof frageHinweis>>} */ (frageHinweis(new URL(`http://x${ziel}`).searchParams)).rueckgaengigPfad;
    const params = new URL(`http://x${zurueck}`).searchParams;
    expect(frageUmleitung(params)).toBeNull();
    // Facetten und Seiten behalten den Wortlaut, damit nichts zurückspringt.
    expect(listenPfad({ ...filterLesen(params), stufen: ['elem'] })).toContain('wortlaut=');
  });
  it('schweigt ohne Frage oder wenn die Suche inzwischen eine andere ist', () => {
    expect(frageHinweis(p('q=Ostern'))).toBeNull();
    expect(frageHinweis(p('q=Pfingsten&frage=Video+zu+Ostern+f%C3%BCr+Konfis'))).toBeNull();
  });
  it('zeigt einen Satz nur, wenn seine Deutung genau diese Suche ergibt', () => {
    // Gleiche Themenwörter, aber die gedeuteten Facetten fehlen: untergeschoben.
    expect(frageHinweis(p('q=Ostern&frage=Video+zu+Ostern+f%C3%BCr+Konfis'))).toBeNull();
    expect(frageHinweis(p('q=Ostern&stufe=sek1&frage=Video+zu+Ostern+f%C3%BCr+Konfis'))).toBeNull();
    expect(frageHinweis(p('q=Ostern&frage=Ostern'))).toBeNull();
    expect(frageHinweis(p('q=Ostern&stufe=sek1&typ=video&frage=Video+zu+Ostern+f%C3%BCr+Konfis'))).not.toBeNull();
  });
  it('bringt mit Rückgängig die Facetten zurück, die der Satz ersetzt hat', () => {
    const ziel = /** @type {string} */ (frageUmleitung(p('q=Videos+f%C3%BCr+Kinder+zu+Ostern&stufe=sek2&fach=katholisch')));
    const zurueck = new URL(`http://x${frageHinweis(new URL(`http://x${ziel}`).searchParams)?.rueckgaengigPfad}`).searchParams;
    expect(zurueck.getAll('stufe')).toEqual(['sek2']);
    expect(zurueck.getAll('typ')).toEqual([]);
    expect(zurueck.getAll('fach')).toEqual(['katholisch']);
    expect(zurueck.get('q')).toBe('Videos für Kinder zu Ostern');
    expect(zurueck.has('frage')).toBe(false);
    expect(zurueck.has('vorher')).toBe(false);
  });
});

describe('frage reist mit', () => {
  const ziel = /** @type {string} */ (frageUmleitung(p('q=Videos+f%C3%BCr+Kinder+zu+Ostern&stufe=sek2')));
  const filter = filterLesen(new URL(`http://x${ziel}`).searchParams);
  /** @param {string} pfad */
  const hinweisAuf = (pfad) => frageHinweis(new URL(`http://x${pfad}`).searchParams);

  it('auf Seite 2 und nach einem weiteren Facetten-Chip, samt vorher', () => {
    for (const pfad of [listenPfad({ ...filter, seite: 2 }), listenPfad({ ...filter, faecher: ['evangelisch'] }), listenPfad({ ...filter, stufen: ['elem', 'sek1'] })]) {
      expect(pfad).toContain('frage=Videos+f%C3%BCr+Kinder+zu+Ostern');
      expect(pfad).toContain('vorher=stufe%3Dsek2');
      expect(hinweisAuf(pfad)?.text).toBe('Videos für Kinder zu Ostern');
    }
  });
  it('nicht mehr, sobald eine gedeutete Facette oder der Suchtext wegfällt', () => {
    for (const pfad of [listenPfad({ ...filter, typen: [] }), listenPfad({ ...filter, q: 'Pfingsten' }), listenPfad({ ...filter, q: '' })]) {
      expect(pfad).not.toContain('frage=');
      expect(pfad).not.toContain('vorher=');
    }
  });
});
