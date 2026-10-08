import { describe, expect, it } from 'vitest';
import { kuerzen, SUCHTEXT_MAX } from './text.js';

describe('kuerzen', () => {
  it('lässt Kurzes, wie es ist', () => {
    expect(kuerzen('Ostern', SUCHTEXT_MAX)).toBe('Ostern');
  });
  it('zählt Codepoints und zerbricht kein Surrogatpaar', () => {
    expect(kuerzen('ab😀cd', 3)).toBe('ab😀');
    expect(kuerzen('😀😀😀', 2)).toBe('😀😀');
    expect(kuerzen('x'.repeat(1000), SUCHTEXT_MAX)).toHaveLength(SUCHTEXT_MAX);
  });
});
