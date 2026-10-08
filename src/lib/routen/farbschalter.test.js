import { describe, expect, it } from 'vitest';
import { STANDARD_CI } from '../models/farben.js';
import { farbschalterBilden, farbwahlLesen } from './farbschalter.js';

/** @param {string} query */
const p = (query) => new URLSearchParams(query);

describe('farbwahlLesen', () => {
  it('nimmt ohne Parameter die Farbe aus dem Cookie, ändert ihn aber nicht', () => {
    expect(farbwahlLesen(p(''), '#c1272d')).toEqual({ farbe: '#c1272d', cookie: null });
    expect(farbwahlLesen(p(''), undefined)).toEqual({ farbe: null, cookie: null });
    expect(farbwahlLesen(p(''), 'rot')).toEqual({ farbe: null, cookie: null });
  });
  it('merkt sich eine Farbe aus der Adresse, wie bisher ?primaryColor=%23RRGGBB', () => {
    expect(farbwahlLesen(p('primaryColor=%23C1272D'), undefined)).toEqual({ farbe: '#c1272d', cookie: 'setzen' });
  });
  it('nimmt aus Farbfeld und Hex-Feld den Wert, der sich geändert hat', () => {
    // Farbfeld unverändert, Hex-Feld neu
    expect(farbwahlLesen(p('primaryColor=%23336699&primaryColor=%23c1272d'), '#336699').farbe).toBe('#c1272d');
    // Farbfeld neu, Hex-Feld unverändert
    expect(farbwahlLesen(p('primaryColor=%232c6b4d&primaryColor=%23336699'), '#336699').farbe).toBe('#2c6b4d');
    // ungültiger Hex-Wert zählt nicht
    expect(farbwahlLesen(p('primaryColor=%232c6b4d&primaryColor=%23zz'), '#336699').farbe).toBe('#2c6b4d');
  });
  it('setzt mit leerem oder unbrauchbarem Wert zurück und löscht den Cookie', () => {
    expect(farbwahlLesen(p('primaryColor='), '#c1272d')).toEqual({ farbe: null, cookie: 'loeschen' });
    expect(farbwahlLesen(p('primaryColor=rot'), '#c1272d')).toEqual({ farbe: null, cookie: 'loeschen' });
  });
});

describe('farbschalterBilden', () => {
  it('behält die übrigen Parameter der Seite als versteckte Felder, ohne Farbe und Seite', () => {
    const url = new URL('http://x/materialien?q=Ostern&stufe=elem&stufe=sek1&seite=3&primaryColor=%23c1272d');
    expect(farbschalterBilden(url, '#c1272d')).toEqual({
      aktion: '/materialien',
      farbe: '#c1272d',
      felder: [['q', 'Ostern'], ['stufe', 'elem'], ['stufe', 'sek1']],
      zuruecksetzenPfad: '/materialien?q=Ostern&stufe=elem&stufe=sek1&primaryColor=',
      gesetzt: true
    });
  });
  it('zeigt ohne gesetzte Farbe das Standardblau', () => {
    const schalter = farbschalterBilden(new URL('http://x/'), null);
    expect(schalter).toMatchObject({ aktion: '/', farbe: STANDARD_CI, felder: [], gesetzt: false });
    expect(schalter.zuruecksetzenPfad).toBe('/?primaryColor=');
  });
});
