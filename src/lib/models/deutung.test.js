import { describe, expect, it } from 'vitest';
import { deuteSuche } from './deutung.js';

describe('deuteSuche', () => {
  it('zerlegt einen Satz in Filter und Themenwörter', () => {
    const d = deuteSuche('Ich suche ein Video zu Ostern für meine Konfis');
    expect(d).toMatchObject({ typen: ['video'], stufen: ['sek1'], faecher: [], begriffe: ['Ostern'], istSatz: true });
    expect(d.erkannt).toEqual([
      { facette: 'typ', wert: 'video', woerter: 'Video' },
      { facette: 'stufe', wert: 'sek1', woerter: 'Konfis' }
    ]);
  });
  it('liest Wendungen, Klassen und Altersangaben', () => {
    expect(deuteSuche('Material für junge Erwachsene zum Thema Tod').stufen).toEqual(['sek2']);
    expect(deuteSuche('Arbeitsblatt Schöpfung Klasse 3').stufen).toEqual(['elem']);
    expect(deuteSuche('Gebete für 12-Jährige').stufen).toEqual(['sek1']);
    expect(deuteSuche('etwas zu Weihnachten für 8 Jahre').stufen).toEqual(['elem']);
  });
  it('nimmt das Fach nur, wenn die Konfession am Unterricht hängt', () => {
    expect(deuteSuche('Pfingsten im katholischen Religionsunterricht').faecher).toEqual(['katholisch']);
    const feste = deuteSuche('Arbeitsblatt über islamische Feste');
    expect(feste.faecher).toEqual([]);
    expect(feste.begriffe).toEqual(['islamische', 'Feste']);
  });
  it('lässt Stichwortsuchen Stichwortsuchen', () => {
    expect(deuteSuche('Martin Luther').istSatz).toBe(false);
    expect(deuteSuche('Ostern Kita').istSatz).toBe(false);
    expect(deuteSuche('Tod und Trauer').istSatz).toBe(false);
    expect(deuteSuche('').istSatz).toBe(false);
  });
  it('erkennt einen Satz auch ohne Filter, wenn Füllwörter wegfallen', () => {
    const d = deuteSuche('ich brauche etwas über Taufe');
    expect(d).toMatchObject({ istSatz: true, begriffe: ['Taufe'], erkannt: [] });
  });
});
