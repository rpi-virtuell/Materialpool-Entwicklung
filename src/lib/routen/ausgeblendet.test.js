import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { fortschreiben } from '../models/linkstatus.js';
import { materialAusEvent } from '../models/material.js';
import { leererInhalt } from '../services/spiegel.js';
import { ausgeblendeteLaden } from './ausgeblendet.js';

const TAG = 24 * 60 * 60 * 1000;
const jetzt = Date.parse('2026-10-08T12:00:00Z');
const inhalt = { ...leererInhalt(), materialien: beispiele };
const [a, b, c] = beispiele.map(materialAusEvent);

/** Zweimal „weg“, das erste Mal am Tag `start`. @param {number} start */
const zweimalWeg = (start) => fortschreiben(fortschreiben(undefined, 'weg', 404, start), 'weg', 410, start + TAG);

describe('ausgeblendeteLaden (ADR-0010)', () => {
  it('listet nur ausgeblendete Materialien, zuletzt ausgeblendete zuerst, mit Link, Status und Datum', () => {
    const eintraege = new Map([
      [a.url, zweimalWeg(jetzt)],
      [b.url, zweimalWeg(jetzt + 3 * TAG)],
      [c.url, fortschreiben(undefined, 'weg', 404, jetzt)] // erst einmal weg: noch sichtbar
    ]);
    const daten = ausgeblendeteLaden({ inhalt, eintrag: (url) => (url ? eintraege.get(url) : undefined) });
    expect(daten.eintraege.map((e) => e.material.id)).toEqual([b.id, a.id]);
    expect(daten.eintraege[0]).toMatchObject({ url: b.url, status: 410, wegSeit: new Date(jetzt + 3 * TAG).toISOString() });
  });
  it('ohne Prüfung oder ohne Treffer: leer', () => {
    expect(ausgeblendeteLaden({ inhalt, eintrag: () => undefined }).eintraege).toEqual([]);
  });
});
