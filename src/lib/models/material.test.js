import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { begriffe, dAusKennung, kennungAusD, letzterPfadteil, lizenzKuerzel, materialAusEvent } from './material.js';

const [abraham, ohneLabels] = beispiele;

describe('materialAusEvent', () => {
  it('liest die flachen AMB-Felder', () => {
    const m = materialAusEvent(abraham);
    expect(m.name).toBe('Abraham — eine kindgerechte Erzählung');
    expect(m.beschreibung).toMatch(/Grundschule/);
    expect(m.url).toBe('https://material.rpi-virtuell.de/material/abraham-erzaehlung/');
    expect(m.bild).toBe('https://blossom.edufeed.org/abcdef.jpg');
    expect(m.schlagworte).toEqual(['abraham', 'erzählung']);
    expect(m.sprachen).toEqual(['de']);
    expect(m.datum).toBe('2025-03-01');
    expect(m.typen).toEqual(['LearningResource']);
  });

  it('liest Personen und Organisationen über die Doppelpunkt-Pfade', () => {
    const m = materialAusEvent(abraham);
    expect(m.urheber).toEqual(['Beispielautorin']);
    expect(m.herausgeber).toEqual(['rpi-virtuell']);
  });

  it('bildet SKOS-Begriffe mit deutschem Label', () => {
    const m = materialAusEvent(abraham);
    expect(m.bildungsstufen).toEqual([
      { id: 'https://w3id.org/kim/educationalLevel/level_A', label: 'Primarstufe' }
    ]);
    expect(m.faecher[0].label).toBe('Religion');
    expect(m.ressourcentypen[0].label).toBe('Text');
  });

  it('fällt ohne prefLabel auf den letzten Pfadteil zurück', () => {
    const m = materialAusEvent(ohneLabels);
    expect(m.bildungsstufen).toEqual([
      { id: 'https://w3id.org/kim/educationalLevel/level_B', label: 'level_B' }
    ]);
    expect(m.beschreibung).toBe('');
    expect(m.bild).toBeNull();
  });

  it('kürzt Creative-Commons-Lizenzen', () => {
    expect(materialAusEvent(abraham).lizenzKuerzel).toBe('CC BY-SA 4.0');
    expect(materialAusEvent(ohneLabels).lizenzKuerzel).toBe('CC0');
    expect(lizenzKuerzel('https://example.org/eigene-lizenz')).toBeNull();
    expect(lizenzKuerzel(null)).toBeNull();
  });

  it('macht aus d eine URL-sichere Kennung und zurück', () => {
    const m = materialAusEvent(abraham);
    expect(m.pfad).toBe(`/m/${m.kennung}`);
    expect(m.kennung).not.toContain('/');
    expect(dAusKennung(m.kennung)).toBe(m.d);
    expect(dAusKennung('%E0%A4%A')).toBeNull();
    expect(kennungAusD('a b')).toBe('a%20b');
  });

  it('nimmt d als Titel, wenn name fehlt', () => {
    const m = materialAusEvent({ ...ohneLabels, tags: [['d', 'https://x.example/']] });
    expect(m.name).toBe('https://x.example/');
  });
});

describe('Hilfsfunktionen', () => {
  it('letzterPfadteil', () => {
    expect(letzterPfadteil('https://w3id.org/kim/hcrt/text')).toBe('text');
    expect(letzterPfadteil('https://w3id.org/kim/hcrt/text/')).toBe('text');
    expect(letzterPfadteil('https://example.org/voc#slide')).toBe('slide');
  });

  it('begriffe ordnet Labels nach Reihenfolge zu', () => {
    const tags = [
      ['about:id', 'https://v/a'], ['about:prefLabel:de', 'A'],
      ['about:id', 'https://v/b'], ['about:prefLabel:de', 'B']
    ];
    expect(begriffe(tags, 'about').map((b) => b.label)).toEqual(['A', 'B']);
  });
});
