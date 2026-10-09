import { describe, expect, it } from 'vitest';
import { datumDeutsch, spracheName, zielName } from './anzeige.js';

describe('datumDeutsch', () => {
  it('schreibt ISO-Daten deutsch, so genau wie sie sind', () => {
    expect(datumDeutsch('2017-08-01')).toBe('01.08.2017');
    expect(datumDeutsch('2017-08-01T10:15:00Z')).toBe('01.08.2017');
    expect(datumDeutsch('2017-08')).toBe('08/2017');
    expect(datumDeutsch('2017')).toBe('2017');
  });
  it('lässt Unlesbares stehen, wie es ist', () => {
    expect(datumDeutsch('irgendwann')).toBe('irgendwann');
  });
});

describe('zielName', () => {
  it('nennt die Adresse ohne www und ohne Pfad', () => {
    expect(zielName('https://www.ekd.de/erntedank-10832.htm')).toBe('ekd.de');
    expect(zielName('https://material.rpi-virtuell.de/material/x/')).toBe('material.rpi-virtuell.de');
    expect(zielName('http://WWW.Example.org')).toBe('example.org');
  });
  it('ohne brauchbare Adresse: nichts', () => {
    expect(zielName('kaputt')).toBeNull();
    expect(zielName(null)).toBeNull();
  });
});

describe('spracheName', () => {
  it('nennt Sprachen beim deutschen Namen', () => {
    expect(spracheName('de')).toBe('Deutsch');
    expect(spracheName('en')).toBe('Englisch');
    expect(spracheName('de-DE')).toBe('Deutsch (Deutschland)');
    expect(spracheName('ar')).toBe('Arabisch');
  });
  it('lässt Unbekanntes stehen, wie es ist', () => {
    expect(spracheName('xx-kein')).toBe('xx-kein');
    expect(spracheName('')).toBe('');
  });
});
