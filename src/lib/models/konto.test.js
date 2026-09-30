import { describe, expect, it } from 'vitest';
import { BEREICHE_MIT_FACH, fragtNachFach, LEERES_KONTO, profilFilter, profilOrt, vorname } from './konto.js';

/** @param {Partial<import('./konto.js').Konto>} teil */
const konto = (teil) => ({ ...LEERES_KONTO, angemeldet: true, name: 'Christina Kreutz', ...teil });

describe('profilFilter', () => {
  it('stellt nichts ein, solange niemand angemeldet ist', () => {
    expect(profilFilter(null)).toEqual({ stufen: [], faecher: [] });
    expect(profilFilter({ ...konto({ bereiche: ['kita'] }), angemeldet: false })).toEqual({ stufen: [], faecher: [] });
  });
  it('vereinigt die Stufen der Bereiche, in der Reihenfolge der Liste', () => {
    expect(profilFilter(konto({ bereiche: ['sek2', 'kita'] })).stufen).toEqual(['elem', 'sek2']);
    expect(profilFilter(konto({ bereiche: ['jugend'] })).stufen).toEqual(['sek1', 'sek2']);
  });
  it('grenzt mit Gemeinde gar nicht ein, auch neben anderen Bereichen', () => {
    expect(profilFilter(konto({ bereiche: ['kita', 'gemeinde'] })).stufen).toEqual([]);
  });
  it('nimmt das Fach nur mit einem Schulbereich; gespeichert bleibt es trotzdem', () => {
    expect(profilFilter(konto({ bereiche: ['sek1'], faecher: ['katholisch', 'evangelisch'] })).faecher).toEqual(['evangelisch', 'katholisch']);
    expect(profilFilter(konto({ bereiche: ['kita'], faecher: ['katholisch'] })).faecher).toEqual([]);
    expect(fragtNachFach(konto({ bereiche: ['konfi', 'berufsschule'] }))).toBe(true);
    expect(BEREICHE_MIT_FACH).toEqual(['grundschule', 'sek1', 'sek2', 'berufsschule']);
  });
});

describe('profilOrt und vorname', () => {
  it('nennt den Ort, fasst mehrere Schulstufen zur Schule zusammen', () => {
    expect(profilOrt(konto({ bereiche: ['konfi'] }))).toBe('mit Konfis');
    expect(profilOrt(konto({ bereiche: ['grundschule', 'kita'] }))).toBe('in der Grundschule und in der Kita');
    expect(profilOrt(konto({ bereiche: ['sek1', 'sek2', 'jugend', 'erwachsene'] }))).toBe('in der Schule, mit Jugendlichen und in der Erwachsenenbildung');
    expect(profilOrt(konto({ bereiche: [] }))).toBe('');
  });
  it('begrüßt mit dem ersten Vornamen', () => {
    expect(vorname(konto({ name: '  Christina   Kreutz ' }))).toBe('Christina');
  });
});
