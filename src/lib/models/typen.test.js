import { describe, expect, it } from 'vitest';
import {
  LRT_ZU_TYP, STUFEN_LABEL, STUFEN_REIHENFOLGE, STUFEN_SICHTBAR, TYPEN, TYP_LABEL, TYP_REIHENFOLGE,
  stufeAusBegriffen, typAusBegriffen
} from './typen.js';

describe('Typen', () => {
  it('kennt acht Typen in fester Reihenfolge, jeder mit Icon', () => {
    expect(TYP_REIHENFOLGE).toEqual(['plan', 'ab', 'proj', 'uebung', 'video', 'audio', 'webseite', 'sonstiges']);
    for (const key of TYP_REIHENFOLGE) {
      expect(TYPEN[key].icon).toMatch(/^[a-z-]+$/);
      expect(TYP_LABEL[key]).toBeTruthy();
    }
  });

  it('bildet learningResourceType-Labels auf Typen ab, Unbekanntes auf sonstiges', () => {
    expect(LRT_ZU_TYP['Arbeitsblatt']).toBe('ab');
    expect(typAusBegriffen([{ id: 'https://w3id.org/kim/hcrt/lesson_plan', label: 'Unterrichtsplanung' }]))
      .toEqual({ key: 'plan', label: 'Unterrichtsplanung' });
    expect(typAusBegriffen([{ id: 'https://w3id.org/kim/hcrt/diagram', label: 'Diagramm' }]))
      .toEqual({ key: 'sonstiges', label: 'Diagramm' });
    expect(typAusBegriffen([])).toEqual({ key: 'sonstiges', label: 'Material' });
  });

  it('fällt beim Typ auf die HCRT-URI zurück, wenn das Label fehlt', () => {
    expect(typAusBegriffen([{ id: 'https://w3id.org/kim/hcrt/worksheet', label: 'worksheet' }]).key).toBe('ab');
    expect(typAusBegriffen([{ id: 'https://w3id.org/kim/hcrt/web_page', label: 'web_page' }]).key).toBe('webseite');
  });

  it('nimmt den ersten Begriff, der einen bekannten Typ ergibt', () => {
    const begriffe = [
      { id: 'https://w3id.org/kim/hcrt/diagram', label: 'Diagramm' },
      { id: 'https://w3id.org/kim/hcrt/video', label: 'Video' }
    ];
    expect(typAusBegriffen(begriffe)).toEqual({ key: 'video', label: 'Video' });
  });
});

describe('Stufen', () => {
  it('kennt fünf Stufen, vier davon sichtbar', () => {
    expect(STUFEN_REIHENFOLGE).toEqual(['elem', 'sek1', 'sek2', 'bbs', 'unbekannt']);
    expect(STUFEN_SICHTBAR).toEqual(['elem', 'sek1', 'sek2', 'bbs']);
    expect(STUFEN_LABEL.unbekannt).toBe('Stufe nicht angegeben');
  });

  it('bildet educationalLevel-Labels auf Stufen ab', () => {
    expect(stufeAusBegriffen([{ id: 'x', label: 'Primarbereich' }])).toEqual({ key: 'elem', label: 'Elementar- & Primarbereich' });
    expect(stufeAusBegriffen([{ id: 'x', label: 'Sekundarstufe I' }]).key).toBe('sek1');
    expect(stufeAusBegriffen([{ id: 'x', label: 'Postsekundarer nicht-tertiärer Bereich' }]).key).toBe('sek2');
    expect(stufeAusBegriffen([{ id: 'x', label: 'Berufsbildung' }]).key).toBe('bbs');
    expect(stufeAusBegriffen([{ id: 'x', label: 'Hochschule' }])).toEqual({ key: 'unbekannt', label: 'Stufe nicht angegeben' });
    expect(stufeAusBegriffen([])).toEqual({ key: 'unbekannt', label: 'Stufe nicht angegeben' });
  });

  it('fällt bei der Stufe auf die KIM-URI zurück', () => {
    expect(stufeAusBegriffen([{ id: 'https://w3id.org/kim/educationalLevel/level_0', label: 'level_0' }]).key).toBe('elem');
    expect(stufeAusBegriffen([{ id: 'https://w3id.org/kim/educationalLevel/level_2', label: 'level_2' }]).key).toBe('sek1');
    expect(stufeAusBegriffen([{ id: 'https://w3id.org/kim/educationalLevel/level_4', label: 'level_4' }]).key).toBe('sek2');
    expect(stufeAusBegriffen([{ id: 'https://w3id.org/kim/educationalLevel/level_A', label: 'level_A' }]).key).toBe('unbekannt');
  });
});
