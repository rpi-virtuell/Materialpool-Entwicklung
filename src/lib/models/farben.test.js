import { describe, expect, it } from 'vitest';
import {
  COVER, STUFEN_FARBE_DEFAULT, ciFarbeLesen, coverFarben, hash, kontrastText, mix, stufenPalette
} from './farben.js';

describe('mix', () => {
  it('mischt linear im RGB-Raum', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#1d5a8c', '#000000', 0.15)).toBe('#194d77');
  });
});

describe('kontrastText', () => {
  it('wählt Weiß nur bei Kontrast ≥ 4,5:1', () => {
    expect(kontrastText('#1d5a8c')).toBe('#fff');
    expect(kontrastText('#123f63')).toBe('#fff');
    expect(kontrastText('#7fb0d9')).toBe('#16181b');
    expect(kontrastText('#ffffff')).toBe('#16181b');
  });
});

describe('stufenPalette', () => {
  it('leitet vier Stufen aus der CI-Farbe ab, unbekannt bleibt grau', () => {
    const p = stufenPalette('#1d5a8c');
    expect(p.sek2).toBe('#1d5a8c');
    expect(p.elem).toBe(mix('#1d5a8c', '#ffffff', 0.55));
    expect(p.bbs).toBe(mix('#1d5a8c', '#000000', 0.3));
    expect(p.unbekannt).toBe(STUFEN_FARBE_DEFAULT.unbekannt);
  });
});

describe('coverFarben', () => {
  it('nimmt Ink vom Typ und eine von drei Tönungen, stabil je id', () => {
    const a = coverFarben({ id: 'amb:1', typ: { key: 'plan' } });
    expect(a.ink).toBe(COVER.plan.ink);
    expect(COVER.plan.tints).toContain(a.tint);
    expect(coverFarben({ id: 'amb:1', typ: { key: 'plan' } })).toEqual(a);
    expect(a.tint).toBe(COVER.plan.tints[hash('amb:1', 3)]);
  });
  it('fällt bei unbekanntem Typ auf sonstiges zurück', () => {
    expect(coverFarben({ id: 'x', typ: { key: /** @type {any} */ ('nix') } }).ink).toBe(COVER.sonstiges.ink);
  });
});

describe('hash (djb2)', () => {
  it('ist deterministisch und liegt im Modul', () => {
    expect(hash('abc', 3)).toBe(hash('abc', 3));
    for (const s of ['', 'a', 'Materialpool', 'amb:' + 'f'.repeat(64)]) {
      expect(hash(s, 7)).toBeGreaterThanOrEqual(0);
      expect(hash(s, 7)).toBeLessThan(7);
    }
  });
});

describe('ciFarbeLesen', () => {
  it('nimmt nur #RRGGBB und liefert Hauptfarbe, dunkle Variante und Palette', () => {
    const ci = ciFarbeLesen('#C1272D');
    expect(ci?.blue).toBe('#c1272d');
    expect(ci?.blueDark).toBe(mix('#c1272d', '#000000', 0.15));
    expect(ci?.palette.sek2).toBe('#c1272d');
  });
  it('ignoriert Unbrauchbares', () => {
    expect(ciFarbeLesen(null)).toBeNull();
    expect(ciFarbeLesen('')).toBeNull();
    expect(ciFarbeLesen('red')).toBeNull();
    expect(ciFarbeLesen('#fff')).toBeNull();
    expect(ciFarbeLesen('#12345g')).toBeNull();
  });
});
