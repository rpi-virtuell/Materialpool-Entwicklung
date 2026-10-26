import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { meldungAblegen, meldungEntscheiden, meldungenHolen, meldungenStarten, meldungenZuruecksetzen } from './meldungen.js';

const jetzt = Date.parse('2026-10-26T12:00:00Z');

/**
 * @param {string} id @param {string} [material]
 * @returns {import('../models/meldung.js').Meldung}
 */
const meldung = (id, material = 'abcdef012345') => ({
  id, material, titel: 'Erntedank', pfad: '/m/erntedank', grund: 'lizenz', begruendung: 'CC BY-NC', zeit: new Date(jetzt).toISOString(), status: 'offen'
});

/** @type {string} */
let ordner;
beforeEach(async () => {
  ordner = await mkdtemp(join(tmpdir(), 'meldungen-'));
});
afterEach(async () => {
  meldungenZuruecksetzen();
  await rm(ordner, { recursive: true, force: true });
});

describe('Meldungen (ADR-0011)', () => {
  it('ohne Start ist nichts gemeldet und nichts verborgen', () => {
    expect(meldungenHolen().an).toBe(false);
    expect(meldungenHolen().stand('abcdef012345').stand).toBe('keine');
    expect(meldungenHolen().verborgen('abcdef012345')).toBe(false);
  });

  it('legt ab, zählt je Material und blendet ab der zweiten offenen aus', async () => {
    const pfad = join(ordner, 'meldungen.json');
    await meldungenStarten({ an: true, pfad });
    expect((await meldungAblegen(meldung('a'))).stand).toBe('gemeldet');
    expect(meldungenHolen().verborgen('abcdef012345')).toBe(false);
    expect((await meldungAblegen(meldung('b'))).stand).toBe('vorlaeufig');
    expect(meldungenHolen().verborgen('abcdef012345')).toBe(true);
    expect(meldungenHolen().verborgen('999999999999')).toBe(false);
    expect(meldungenHolen().vonMaterial('abcdef012345').map((m) => m.id)).toEqual(['a', 'b']);
    expect(JSON.parse(await readFile(pfad, 'utf8')).meldungen).toHaveLength(2);
  });

  it('überlebt einen Neustart', async () => {
    const pfad = join(ordner, 'meldungen.json');
    await meldungenStarten({ an: true, pfad });
    await meldungAblegen(meldung('a'));
    meldungenZuruecksetzen();
    await meldungenStarten({ an: true, pfad });
    expect(meldungenHolen().alle().map((m) => m.id)).toEqual(['a']);
  });

  it('Entscheidungen wirken und landen in der Datei', async () => {
    const pfad = join(ordner, 'meldungen.json');
    await meldungenStarten({ an: true, pfad });
    await meldungAblegen(meldung('a'));
    await meldungAblegen(meldung('b', '999999999999'));
    await meldungEntscheiden('abcdef012345', 'bestaetigen', jetzt);
    expect(meldungenHolen().stand('abcdef012345').stand).toBe('bestaetigt');
    expect(meldungenHolen().verborgen('abcdef012345')).toBe(true);
    await meldungEntscheiden('999999999999', 'verwerfen', jetzt);
    expect(meldungenHolen().stand('999999999999').stand).toBe('keine');
    const datei = JSON.parse(await readFile(pfad, 'utf8'));
    expect(datei.meldungen.map((/** @type {{ id: string }} */ m) => m.id)).toEqual(['a']);
  });

  it('kaputte Datei: beginnt leer', async () => {
    const pfad = join(ordner, 'gibt-es-nicht', 'meldungen.json');
    await meldungenStarten({ an: true, pfad });
    expect(meldungenHolen().alle()).toEqual([]);
  });

  it('abgeschaltet: blendet nichts aus', async () => {
    await meldungenStarten({ an: false, pfad: join(ordner, 'meldungen.json') });
    expect(meldungenHolen().an).toBe(false);
    expect(meldungenHolen().verborgen('abcdef012345')).toBe(false);
  });
});
