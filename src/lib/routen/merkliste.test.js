import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { materialAusEvent } from '../models/material.js';
import { leererInhalt } from '../services/spiegel.js';
import {
  MERKLISTE_MAX, merklisteLaden, merklisteLesen, merklisteSchreiben, merkSchluessel, umschalten, zurueckPfad
} from './merkliste.js';

const inhalt = { ...leererInhalt(), materialien: beispiele };
const [arbeitsheft, berufsorientierung, erntedank] = beispiele.map(materialAusEvent);

describe('merkSchluessel', () => {
  it('ist kurz, stabil und hängt an der Adresse (d), nicht an der Event-id', () => {
    const k = merkSchluessel(erntedank);
    expect(k).toMatch(/^[0-9a-f]{12}$/);
    const neueFassung = { ...erntedank, id: 'neue-version' };
    expect(merkSchluessel(neueFassung)).toBe(k);
    expect(merkSchluessel(arbeitsheft)).not.toBe(k);
  });
});

describe('Cookie und Umschalten', () => {
  it('liest zurück, was geschrieben wurde, und verwirft Unbrauchbares', () => {
    expect(merklisteLesen(merklisteSchreiben(['aaaaaaaaaaaa', 'bbbbbbbbbbbb']))).toEqual(['aaaaaaaaaaaa', 'bbbbbbbbbbbb']);
    expect(merklisteLesen(undefined)).toEqual([]);
    expect(merklisteLesen('{kaputt')).toEqual([]);
    expect(merklisteLesen(JSON.stringify(['aaaaaaaaaaaa', '<script>', 'aaaaaaaaaaaa', 7]))).toEqual(['aaaaaaaaaaaa']);
  });
  it('merkt vorne, entfernt beim zweiten Mal, und hält die Liste klein genug fürs Cookie', () => {
    expect(umschalten(['aaaaaaaaaaaa'], 'bbbbbbbbbbbb')).toEqual(['bbbbbbbbbbbb', 'aaaaaaaaaaaa']);
    expect(umschalten(['bbbbbbbbbbbb', 'aaaaaaaaaaaa'], 'bbbbbbbbbbbb')).toEqual(['aaaaaaaaaaaa']);
    expect(umschalten(['aaaaaaaaaaaa'], 'kein-schluessel')).toEqual(['aaaaaaaaaaaa']);
    const voll = Array.from({ length: MERKLISTE_MAX }, (_, i) => i.toString(16).padStart(12, '0'));
    expect(umschalten(voll, 'ffffffffffff')).toHaveLength(MERKLISTE_MAX);
    expect(merklisteSchreiben(voll).length).toBeLessThan(3500);
  });
  it('führt nur auf eigene Seiten zurück', () => {
    expect(zurueckPfad('/materialien?stufe=elem#k-aaaaaaaaaaaa')).toBe('/materialien?stufe=elem#k-aaaaaaaaaaaa');
    expect(zurueckPfad('//boese.example/')).toBe('/merkliste');
    expect(zurueckPfad('https://boese.example/')).toBe('/merkliste');
    expect(zurueckPfad(null)).toBe('/merkliste');
  });
});

describe('merklisteLaden', () => {
  it('zeigt Gemerktes in der Reihenfolge des Merkens und zählt, was nicht mehr im Bestand ist', () => {
    const keys = [merkSchluessel(erntedank), 'aaaaaaaaaaaa', merkSchluessel(berufsorientierung)];
    const m = merklisteLaden({ inhalt, keys });
    expect(m.karten.map((k) => k.material.name)).toEqual(['EKD: Erntedankfest', 'Berufsorientierung']);
    expect(m.karten[0]).toMatchObject({ gemerkt: true, merkSchluessel: keys[0], icon: 'notebook' });
    expect(m.fehlend).toBe(1);
  });
  it('ist leer ohne Gemerktes', () => {
    expect(merklisteLaden({ inhalt, keys: [] })).toEqual({ karten: [], fehlend: 0 });
  });
});
