import { afterEach, describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import faecher from '../../../test/fixtures/amb-faecher.json';
import { eventId, eventsPruefen, formGueltig, pruefungZuruecksetzen, signaturenGerechnet, signaturGueltig } from './pruefung.js';

// Echte, signierte Events; alles Gefälschte entsteht hier aus einer Kopie.
const echte = [...beispiele, ...faecher];
const [a, b] = beispiele;

afterEach(() => {
  pruefungZuruecksetzen();
});

describe('formGueltig (NIP-01)', () => {
  it('nimmt echte Events', () => {
    expect(echte.every(formGueltig)).toBe(true);
  });
  it('verwirft, was das Programm nicht lesen kann', () => {
    for (const kaputt of [
      { ...a, tags: null },
      { ...a, tags: [['d', 1]] },
      { ...a, tags: ['d'] },
      { ...a, created_at: String(a.created_at) },
      { ...a, created_at: 1.5 },
      { ...a, kind: '30142' },
      { ...a, id: a.id.toUpperCase() },
      { ...a, pubkey: a.pubkey.slice(1) },
      { ...a, sig: a.sig.slice(2) },
      { ...a, content: null },
      null,
      'EVENT'
    ]) expect(formGueltig(kaputt)).toBe(false);
  });
});

describe('signaturGueltig', () => {
  it('bestätigt id und Signatur echter Events', () => {
    for (const e of echte) {
      expect(eventId(e)).toBe(e.id);
      expect(signaturGueltig(e)).toBe(true);
    }
  });
  it('verwirft veränderten Inhalt, neu berechnete id ohne passende Signatur und fremde Signaturen', () => {
    const veraendert = { ...a, content: `${a.content} ` };
    expect(signaturGueltig(veraendert)).toBe(false);
    expect(signaturGueltig({ ...veraendert, id: eventId(veraendert) })).toBe(false);
    expect(signaturGueltig({ ...a, sig: b.sig })).toBe(false);
    const andererSchluessel = { ...a, pubkey: b.pubkey === a.pubkey ? faecher[0].pubkey : b.pubkey };
    expect(signaturGueltig({ ...andererSchluessel, id: eventId(andererSchluessel) })).toBe(false);
  });
  it('rechnet jedes Paar aus id und sig nur einmal, ein anderes sig zur selben id aber neu', () => {
    expect(signaturGueltig(a)).toBe(true);
    expect(signaturGueltig(a)).toBe(true);
    expect(signaturenGerechnet()).toBe(1);
    expect(signaturGueltig({ ...a, sig: b.sig })).toBe(false);
    expect(signaturGueltig({ ...a, sig: b.sig })).toBe(false);
    expect(signaturenGerechnet()).toBe(2);
  });
});

describe('eventsPruefen', () => {
  it('lässt nur echte Events durch, mit QUELLE_AUTOREN nur deren Schlüssel', async () => {
    const gefaelscht = { ...a, tags: [...a.tags, ['t', 'eingeschoben']] };
    const eingabe = [...echte, gefaelscht, { ...b, tags: null }, null];
    expect((await eventsPruefen(eingabe, [])).map((e) => e.id)).toEqual(echte.map((e) => e.id));
    const materialpool = await eventsPruefen(eingabe, [a.pubkey]);
    expect(materialpool.map((e) => e.id)).toEqual(beispiele.map((e) => e.id));
    expect(await eventsPruefen(echte, ['0'.repeat(64)])).toEqual([]);
  });
});
