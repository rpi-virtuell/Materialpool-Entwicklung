import { afterEach, describe, expect, it } from 'vitest';
import { ausgeblendet } from '../models/linkstatus.js';
import { linkAnfragen, linkpruefungHolen, linkpruefungZuruecksetzen, taktLaufen } from './linkpruefung.js';

const TAG = 24 * 60 * 60 * 1000;
const jetzt = Date.parse('2026-10-08T12:00:00Z');
const regeln = { intervallMs: 7 * TAG, nachpruefMs: TAG };

/**
 * Nachgebautes Netz: je URL und Methode ein Status, oder ein Fehler.
 * @param {Record<string, number|Partial<Record<'HEAD'|'GET', number>>|Error>} antworten
 * @param {string[]} [protokoll]
 */
function netz(antworten, protokoll = []) {
  return /** @type {typeof fetch} */ (async (url, init) => {
    const methode = /** @type {'HEAD'|'GET'} */ (init?.method ?? 'GET');
    protokoll.push(`${methode} ${url}`);
    const a = antworten[String(url)];
    if (a instanceof Error) throw a;
    const status = typeof a === 'number' ? a : a?.[methode] ?? 200;
    return new Response(null, { status });
  });
}

afterEach(() => linkpruefungZuruecksetzen());

describe('linkAnfragen', () => {
  it('fragt mit HEAD und bestätigt 404 mit GET', async () => {
    const protokoll = /** @type {string[]} */ ([]);
    expect(await linkAnfragen('https://weg.example/', netz({ 'https://weg.example/': 404 }, protokoll))).toBe(404);
    expect(protokoll).toEqual(['HEAD https://weg.example/', 'GET https://weg.example/']);
  });
  it('glaubt einem HEAD-404 nicht, wenn GET die Seite liefert', async () => {
    expect(await linkAnfragen('https://x.example/', netz({ 'https://x.example/': { HEAD: 404, GET: 200 } }))).toBe(200);
  });
  it('fragt mit GET nach, wenn der Server HEAD ablehnt', async () => {
    expect(await linkAnfragen('https://x.example/', netz({ 'https://x.example/': { HEAD: 405, GET: 200 } }))).toBe(200);
  });
  it('ohne Antwort: null', async () => {
    expect(await linkAnfragen('https://x.example/', netz({ 'https://x.example/': new Error('ENOTFOUND') }))).toBeNull();
  });
});

describe('taktLaufen', () => {
  it('prüft höchstens jeTakt fällige Links und blendet nach zwei 404 aus', async () => {
    const urls = ['https://a.example/', 'https://b.example/', 'https://c.example/'];
    const holen = netz({ 'https://a.example/': 404 });
    const erster = await taktLaufen({ urls, zustand: new Map(), jetzt, regeln, jeTakt: 2, holen });
    expect([...erster.keys()]).toEqual(['https://a.example/', 'https://b.example/']);
    expect(ausgeblendet(erster.get('https://a.example/'))).toBe(false);
    const zweiter = await taktLaufen({ urls, zustand: erster, jetzt: jetzt + TAG, regeln, jeTakt: 2, holen });
    expect(zweiter.has('https://c.example/')).toBe(true);
    expect(ausgeblendet(zweiter.get('https://a.example/'))).toBe(true);
    expect(zweiter.get('https://b.example/')?.bewertung).toBe('ok');
  });
  it('vergisst Links, die kein Material mehr hat, und überspringt Nicht-http', async () => {
    const alt = new Map([['https://alt.example/', { status: 404, bewertung: /** @type {const} */ ('weg'), wegInFolge: 2, geprueft: new Date(jetzt).toISOString() }]]);
    const neu = await taktLaufen({ urls: ['urn:x', 'https://neu.example/'], zustand: alt, jetzt, regeln, jeTakt: 5, holen: netz({}) });
    expect([...neu.keys()]).toEqual(['https://neu.example/']);
  });
});

describe('linkpruefungHolen', () => {
  it('ohne Lauf ist nichts ausgeblendet', () => {
    expect(linkpruefungHolen().weg('https://a.example/')).toBe(false);
  });
});
