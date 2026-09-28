import { afterEach, describe, expect, it, vi } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { ersetzbareZusammenfassen, filterBauen, KIND_AMB, standAufbauen } from './spiegel.js';

/** @returns {import('../konfig.js').Konfig} */
function konfig(teil = {}) {
  return {
    relays: ['wss://eins/', 'wss://zwei/'],
    autoren: [],
    spiegelPfad: 'daten/test.json',
    spiegelIntervallS: 600,
    spiegelStartwartezeitS: 1,
    spiegelLimit: 500,
    ...teil
  };
}

afterEach(() => vi.restoreAllMocks());

describe('filterBauen', () => {
  it('fragt kind 30142 mit Limit, ohne Autoren-Einschränkung', () => {
    expect(filterBauen(konfig())).toEqual({ kinds: [KIND_AMB], limit: 500 });
  });
  it('schränkt auf QUELLE_AUTOREN ein, sobald gesetzt', () => {
    const f = filterBauen(konfig({ autoren: ['a'.repeat(64)] }));
    expect(f.authors).toEqual(['a'.repeat(64)]);
  });
});

describe('ersetzbareZusammenfassen', () => {
  const [alt] = beispiele;
  const neu = { ...alt, id: '9'.repeat(64), created_at: alt.created_at + 10 };

  it('behält je (pubkey, d) nur das jüngste Event', () => {
    const ergebnis = ersetzbareZusammenfassen([alt, neu]);
    expect(ergebnis).toHaveLength(1);
    expect(ergebnis[0].id).toBe(neu.id);
  });

  it('entscheidet Gleichstand über die kleinere id', () => {
    const gleich = { ...alt, id: '0'.repeat(64) };
    expect(ersetzbareZusammenfassen([alt, gleich])[0].id).toBe(gleich.id);
  });

  it('sortiert jüngstes zuerst', () => {
    const [a, b] = beispiele;
    expect(ersetzbareZusammenfassen([b, a]).map((e) => e.id)).toEqual([a.id, b.id]);
  });
});

describe('standAufbauen', () => {
  it('führt Antworten mehrerer Relays zusammen und merkt sich die Herkunft', async () => {
    const holen = vi.fn(async (url) => ({
      erreicht: true,
      events: url === 'wss://eins/' ? [beispiele[0]] : beispiele
    }));
    const ergebnis = await standAufbauen(konfig(), { holen });
    expect(ergebnis.ok).toBe(true);
    expect(ergebnis.inhalt?.materialien).toHaveLength(2);
    expect(ergebnis.inhalt?.quellen[beispiele[0].id]).toEqual(['wss://eins/', 'wss://zwei/']);
    expect(ergebnis.inhalt?.stand?.anzahl.materialien).toBe(2);
    expect(ergebnis.inhalt?.stand?.nichtErreichbar).toEqual([]);
  });

  it('ist gültig, wenn ein Relay antwortet und das andere nicht', async () => {
    const holen = vi.fn(async (url) =>
      url === 'wss://eins/' ? { erreicht: true, events: [] } : { erreicht: false, events: [] }
    );
    const ergebnis = await standAufbauen(konfig(), { holen });
    expect(ergebnis.ok).toBe(true);
    expect(ergebnis.inhalt?.stand?.nichtErreichbar).toEqual(['wss://zwei/']);
    expect(ergebnis.inhalt?.materialien).toEqual([]);
  });

  it('ist ungültig, wenn kein Relay erreichbar war, und nennt den Grund', async () => {
    const holen = vi.fn(async () => ({ erreicht: false, events: [] }));
    const ergebnis = await standAufbauen(konfig(), { holen });
    expect(ergebnis.ok).toBe(false);
    expect(ergebnis.inhalt).toBeNull();
    expect(ergebnis.grund).toBe('kein-relay-erreichbar');
    expect(ergebnis.gefragteRelays).toEqual(['wss://eins/', 'wss://zwei/']);
  });

  it('lässt fremde Kinds nicht in den Stand', async () => {
    const holen = vi.fn(async () => ({ erreicht: true, events: [{ ...beispiele[0], kind: 30023 }] }));
    const ergebnis = await standAufbauen(konfig(), { holen });
    expect(ergebnis.inhalt?.materialien).toEqual([]);
  });
});
