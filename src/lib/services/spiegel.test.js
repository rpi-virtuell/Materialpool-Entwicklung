import { afterEach, describe, expect, it, vi } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { ersetzbareZusammenfassen, filterBauen, KIND_AMB, SEITENGROESSE, seitenweise, standAufbauen } from './spiegel.js';

/** @returns {import('../konfig.js').Konfig} */
function konfig(teil = {}) {
  return {
    relays: ['wss://eins/', 'wss://zwei/'],
    autoren: [],
    faecher: [],
    spiegelPfad: 'daten/test.json',
    spiegelIntervallS: 600,
    spiegelStartwartezeitS: 1,
    spiegelLimit: 10000,
    ...teil
  };
}

afterEach(() => vi.restoreAllMocks());

describe('filterBauen', () => {
  it('fragt kind 30142 mit Limit, ohne Autoren-Einschränkung', () => {
    expect(filterBauen(konfig())).toEqual({ kinds: [KIND_AMB], limit: 10000 });
  });
  it('schränkt auf QUELLE_AUTOREN ein, sobald gesetzt', () => {
    const f = filterBauen(konfig({ autoren: ['a'.repeat(64)] }));
    expect(f.authors).toEqual(['a'.repeat(64)]);
  });
  it('filtert auf QUELLE_FAECHER über #about:id, sobald gesetzt', () => {
    const f = filterBauen(konfig({ faecher: ['http://w3id.org/kim/schulfaecher/s1024'] }));
    expect(f['#about:id']).toEqual(['http://w3id.org/kim/schulfaecher/s1024']);
    expect(filterBauen(konfig())).not.toHaveProperty('#about:id');
  });
});

describe('seitenweise — das Relay liefert je REQ höchstens 250 Events', () => {
  /** @param {number} n @param {number} start */
  const events = (n, start) =>
    Array.from({ length: n }, (_, i) => ({ ...beispiele[0], id: String(start - i).padStart(64, '0'), created_at: start - i }));

  it('blättert mit until, bis eine Seite kleiner als die Seitengröße ist, und dedupliziert', async () => {
    const holen = vi.fn(async (_url, filter) => {
      const bis = /** @type {number} */ (filter.until ?? 1000);
      // until ist einschließlich: die erste Zeile jeder Folgeseite wiederholt sich
      return { erreicht: true, events: events(Math.min(SEITENGROESSE, bis - 400 + 1), bis) };
    });
    const ergebnis = await seitenweise(holen, 10000)('wss://eins/', { kinds: [KIND_AMB] }, {});
    expect(ergebnis.erreicht).toBe(true);
    expect(ergebnis.events).toHaveLength(601);
    expect(holen).toHaveBeenCalledTimes(3);
    expect(holen.mock.calls[0][1]).toMatchObject({ limit: SEITENGROESSE });
    expect(holen.mock.calls[0][1]).not.toHaveProperty('until');
    expect(holen.mock.calls[1][1]).toMatchObject({ until: 751 });
  });

  it('hört beim Limit auf und fragt nur den Rest an', async () => {
    // Folgeseiten beginnen hier unterhalb von until, damit sich nichts wiederholt.
    const holen = vi.fn(async (_url, filter) => ({
      erreicht: true,
      events: events(/** @type {number} */ (filter.limit), filter.until === undefined ? 100000 : /** @type {number} */ (filter.until) - 1)
    }));
    const ergebnis = await seitenweise(holen, 300)('wss://eins/', {}, {});
    expect(ergebnis.events).toHaveLength(300);
    expect(holen.mock.calls[1][1]).toMatchObject({ limit: 50 });
  });

  it('gilt als nicht erreicht, wenn schon die erste Seite ausfällt — mit Teilstand, wenn eine spätere ausfällt', async () => {
    const nie = vi.fn(async () => ({ erreicht: false, events: [] }));
    expect((await seitenweise(nie, 1000)('wss://eins/', {}, {})).erreicht).toBe(false);
    let aufruf = 0;
    const spaeter = vi.fn(async () => (aufruf++ === 0 ? { erreicht: true, events: events(SEITENGROESSE, 1000) } : { erreicht: false, events: [] }));
    const teil = await seitenweise(spaeter, 1000)('wss://eins/', {}, {});
    expect(teil.erreicht).toBe(true);
    expect(teil.events).toHaveLength(SEITENGROESSE);
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
    const [juenger, aelter] = a.created_at > b.created_at ? [a, b] : [b, a];
    expect(ersetzbareZusammenfassen([aelter, juenger]).map((e) => e.id)).toEqual([juenger.id, aelter.id]);
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
    expect(ergebnis.inhalt?.materialien).toHaveLength(beispiele.length);
    expect(ergebnis.inhalt?.quellen[beispiele[0].id]).toEqual(['wss://eins/', 'wss://zwei/']);
    expect(ergebnis.inhalt?.stand?.anzahl.materialien).toBe(beispiele.length);
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
