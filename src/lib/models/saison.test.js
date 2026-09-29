import { describe, expect, it } from 'vitest';
import { passtZurSaison, saisonKeywords } from './saison.js';

describe('saisonKeywords', () => {
  it('kennt das Kirchenjahr je Monat', () => {
    expect(saisonKeywords(new Date(2026, 0, 6))).toEqual(['epiphanias', 'sternsinger', 'weihnacht']);
    expect(saisonKeywords(new Date(2026, 2, 15))).toEqual([
      'passion', 'fasten', 'buß', 'ostern', 'auferstehung', 'karfreitag', 'palmsonntag', 'gründonnerstag'
    ]);
    expect(saisonKeywords(new Date(2026, 8, 29))).toEqual(['erntedank', 'schöpfung']);
    expect(saisonKeywords(new Date(2026, 10, 20))).toEqual([
      'reformation', 'luther', 'allerheilig', 'ewigkeitssonntag', 'totensonntag', 'volkstrauertag', 'advent'
    ]);
  });
  it('hat Monate ohne Saison', () => {
    expect(saisonKeywords(new Date(2026, 6, 1))).toEqual([]);
  });
});

describe('passtZurSaison', () => {
  it('vergleicht kleingeschrieben per includes', () => {
    const k = saisonKeywords(new Date(2026, 8, 1));
    expect(passtZurSaison('Erntedank', k)).toBe(true);
    expect(passtZurSaison('Schöpfungsgeschichte', k)).toBe(true);
    expect(passtZurSaison('Ostern', k)).toBe(false);
    expect(passtZurSaison('x', [])).toBe(false);
  });
});
