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
  it('behält Zahlen als Themenwörter, außer eine Klassen- oder Altersregel braucht sie', () => {
    expect(deuteSuche('Psalm 23 für Kinder')).toMatchObject({ begriffe: ['Psalm', '23'], stufen: ['elem'], istSatz: true });
    expect(deuteSuche('Die 10 Gebote für Konfis')).toMatchObject({ begriffe: ['10', 'Gebote'], stufen: ['sek1'], istSatz: true });
    expect(deuteSuche('Arbeitsblatt Schöpfung Klasse 3').begriffe).toEqual(['Schöpfung']);
    expect(deuteSuche('etwas zu Weihnachten für 8 Jahre').begriffe).toEqual(['Weihnachten']);
  });
  it('zählt Zahlen nicht als Wörter eines Satzes', () => {
    expect(deuteSuche('Römer 8 Vers 28')).toMatchObject({ istSatz: false, begriffe: ['Römer', '8', 'Vers', '28'] });
    expect(deuteSuche('Lukas 2 1 20').istSatz).toBe(false);
  });
  it('deutet auch zerlegte Umlaute (NFD)', () => {
    const d = deuteSuche('Ein Video über Ostern für Kinder'.normalize('NFD'));
    expect(d).toMatchObject({ typen: ['video'], stufen: ['elem'], begriffe: ['Ostern'], istSatz: true });
  });
  it('erkennt einen Satz auch ohne Filter, wenn Füllwörter wegfallen', () => {
    const d = deuteSuche('ich brauche etwas über Taufe');
    expect(d).toMatchObject({ istSatz: true, begriffe: ['Taufe'], erkannt: [] });
  });
});
