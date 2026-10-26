import { describe, expect, it } from 'vitest';
import { ausgeblendet, BEGRUENDUNG_MAX, eingabePruefen, entscheiden, GRUENDE, imLetztenTag, standVon } from './meldung.js';

const TAG = 24 * 60 * 60 * 1000;
const jetzt = Date.parse('2026-10-26T12:00:00Z');

/**
 * @param {Partial<import('./meldung.js').Meldung>} [teil]
 * @returns {import('./meldung.js').Meldung}
 */
const meldung = (teil = {}) => ({
  id: 'a1b2c3d4',
  material: 'abcdef012345',
  titel: 'Erntedank',
  pfad: '/m/erntedank',
  grund: 'lizenz',
  begruendung: 'Die Lizenz ist CC BY-NC, nicht CC BY.',
  zeit: new Date(jetzt).toISOString(),
  status: 'offen',
  ...teil
});

describe('eingabePruefen', () => {
  it('nimmt Grund und Begründung, getrimmt', () => {
    expect(eingabePruefen({ grund: 'inhalt', begruendung: '  Abwertend gegenüber Muslimen.  ' })).toEqual({
      ok: true,
      werte: { grund: 'inhalt', begruendung: 'Abwertend gegenüber Muslimen.' }
    });
  });
  it('verlangt einen bekannten Grund', () => {
    const r = eingabePruefen({ grund: 'gefaellt-mir-nicht', begruendung: 'x' });
    expect(r.ok).toBe(false);
    expect(r.fehler).toMatch(/Grund/);
    expect(eingabePruefen({ grund: null, begruendung: 'x' }).ok).toBe(false);
  });
  it('verlangt eine Begründung von höchstens 1.000 Zeichen und gibt die Eingabe zurück', () => {
    const leer = eingabePruefen({ grund: 'lizenz', begruendung: '   ' });
    expect(leer).toMatchObject({ ok: false, werte: { grund: 'lizenz', begruendung: '' } });
    expect(leer.fehler).toMatch(/Begründung/);
    const lang = eingabePruefen({ grund: 'lizenz', begruendung: 'x'.repeat(BEGRUENDUNG_MAX + 1) });
    expect(lang.ok).toBe(false);
    expect(lang.fehler).toMatch(/1\.000/);
  });
  it('kennt die vier Gründe aus ADR-0011', () => {
    expect(GRUENDE.map((g) => g.label)).toEqual(['Lizenz falsch', 'Inhalt problematisch', 'Link oder Angaben falsch', 'Sonstiges']);
  });
});

describe('standVon', () => {
  it('ohne Meldung: keine', () => {
    expect(standVon([])).toMatchObject({ stand: 'keine', offen: 0 });
    expect(ausgeblendet(standVon([]))).toBe(false);
  });
  it('eine offene Meldung markiert nur', () => {
    const s = standVon([meldung()]);
    expect(s).toMatchObject({ stand: 'gemeldet', offen: 1, gruende: ['Lizenz falsch'] });
    expect(ausgeblendet(s)).toBe(false);
  });
  it('ab zwei offenen ist das Material vorläufig ausgeblendet; Gründe ohne Doppel, seit der ersten', () => {
    const erste = meldung({ zeit: new Date(jetzt - TAG).toISOString() });
    const s = standVon([erste, meldung({ id: 'b', grund: 'inhalt' }), meldung({ id: 'c' })]);
    expect(s).toMatchObject({ stand: 'vorlaeufig', offen: 3, gruende: ['Lizenz falsch', 'Inhalt problematisch'], seit: erste.zeit });
    expect(ausgeblendet(s)).toBe(true);
  });
  it('eine bestätigte Meldung blendet aus, auch neben offenen', () => {
    const s = standVon([meldung({ status: 'bestaetigt', entschieden: new Date(jetzt).toISOString() })]);
    expect(s).toMatchObject({ stand: 'bestaetigt', offen: 0, seit: new Date(jetzt).toISOString() });
    expect(ausgeblendet(s)).toBe(true);
  });
});

describe('entscheiden', () => {
  const andere = meldung({ id: 'x', material: '999999999999' });
  const alle = [meldung({ id: 'a' }), meldung({ id: 'b' }), andere];

  it('bestätigen: offene dieses Materials werden bestätigt, mit Zeitpunkt', () => {
    const neu = entscheiden(alle, 'abcdef012345', 'bestaetigen', jetzt);
    expect(neu.filter((m) => m.material === 'abcdef012345').map((m) => m.status)).toEqual(['bestaetigt', 'bestaetigt']);
    expect(neu[0].entschieden).toBe(new Date(jetzt).toISOString());
    expect(neu).toContainEqual(andere);
  });
  it('verwerfen: offene dieses Materials werden gelöscht, bestätigte bleiben', () => {
    const bestaetigt = meldung({ id: 'z', status: 'bestaetigt' });
    expect(entscheiden([...alle, bestaetigt], 'abcdef012345', 'verwerfen', jetzt)).toEqual([andere, bestaetigt]);
  });
  it('einblenden: alles zu diesem Material wird gelöscht', () => {
    const bestaetigt = meldung({ id: 'z', status: 'bestaetigt' });
    expect(entscheiden([...alle, bestaetigt], 'abcdef012345', 'einblenden', jetzt)).toEqual([andere]);
  });
  it('Unbekanntes ändert nichts', () => {
    expect(entscheiden(alle, 'abcdef012345', 'loeschen', jetzt)).toEqual(alle);
  });
});

describe('imLetztenTag', () => {
  it('zählt Meldungen der letzten 24 Stunden', () => {
    const alt = meldung({ zeit: new Date(jetzt - TAG - 1).toISOString() });
    expect(imLetztenTag([alt, meldung(), meldung({ id: 'b' })], jetzt)).toBe(2);
  });
});
