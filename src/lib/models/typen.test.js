import { describe, expect, it } from 'vitest';
import {
  FACH_LABEL, FACH_REIHENFOLGE, faecherAusBegriffen, LRT_ZU_TYP, STUFEN_LABEL, STUFEN_LABEL_ALTER, STUFEN_REIHENFOLGE, STUFEN_SICHTBAR, TYPEN, TYP_LABEL, TYP_REIHENFOLGE,
  stufeAusBegriffen, stufenAusBegriffen, typAusBegriffen, typenAusBegriffen
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

describe('Fächer', () => {
  /** @param {...string} ids */
  const f = (...ids) => faecherAusBegriffen(ids.map((id) => ({ id: `http://w3id.org/kim/schulfaecher/${id}`, label: id })));
  it('erkennt Konfessionen an der KIM-URI, alle passenden in fester Reihenfolge', () => {
    expect(f('s1024', 's1055')).toEqual(['evangelisch']);
    expect(f('s1026', 's1024')).toEqual(['evangelisch', 'katholisch']);
    expect(f('s1025')).toEqual(['islamisch']);
    expect(f('s1057', 's1056')).toEqual(['juedisch', 'alevitisch']);
  });
  it('ist überkonfessionell nur mit s1055 und ohne Konfession', () => {
    expect(f('s1055')).toEqual(['allgemein']);
    expect(f('s1008', 's1055')).toEqual(['allgemein']);
  });
  it('nennt kein Fach, wenn keine Religions-Kennung dasteht', () => {
    expect(f('s1008', 's1021')).toEqual([]);
    expect(faecherAusBegriffen([])).toEqual([]);
  });
  it('heißt „Fach“, nicht „Konfession“, mit den Namen des Prototyps', () => {
    expect(FACH_REIHENFOLGE.map((k) => FACH_LABEL[k])).toEqual([
      'Evangelische Religionslehre', 'Katholische Religionslehre', 'Islamische Religionslehre',
      'Jüdische Religionslehre', 'Alevitische Religionslehre', 'Religionslehre (überkonfessionell)'
    ]);
  });
});

describe('Stufen', () => {
  it('kennt sieben Stufen, vier davon als Kachel sichtbar', () => {
    expect(STUFEN_REIHENFOLGE).toEqual(['elem', 'sek1', 'sek2', 'bbs', 'fortbildung', 'hochschule', 'unbekannt']);
    expect(STUFEN_SICHTBAR).toEqual(['elem', 'sek1', 'sek2', 'fortbildung']);
    expect(STUFEN_LABEL.unbekannt).toBe('Stufe nicht angegeben');
  });

  it('benennt die Kacheln nach Alter, die Facette bleibt bei der Schulstufe', () => {
    expect(STUFEN_SICHTBAR.map((key) => STUFEN_LABEL_ALTER[key]))
      .toEqual(['Kinder', 'Jugendliche', 'Junge Erwachsene', 'Erwachsene']);
    expect(STUFEN_LABEL.sek1).toBe('Sekundarstufe I');
  });

  it('bildet educationalLevel-Labels auf Stufen ab', () => {
    expect(stufeAusBegriffen([{ id: 'x', label: 'Primarbereich' }])).toEqual({ key: 'elem', label: 'Elementar- & Primarbereich' });
    expect(stufeAusBegriffen([{ id: 'x', label: 'Sekundarstufe I' }]).key).toBe('sek1');
    expect(stufeAusBegriffen([{ id: 'x', label: 'Postsekundarer nicht-tertiärer Bereich' }]).key).toBe('bbs');
    expect(stufeAusBegriffen([{ id: 'x', label: 'Berufsbildung' }]).key).toBe('bbs');
    expect(stufeAusBegriffen([{ id: 'x', label: 'Hochschule' }])).toEqual({ key: 'hochschule', label: 'Hochschule' });
    expect(stufeAusBegriffen([{ id: 'x', label: 'Fortbildung' }]).key).toBe('fortbildung');
    expect(stufeAusBegriffen([{ id: 'x', label: 'Weiterbildung' }])).toEqual({ key: 'unbekannt', label: 'Stufe nicht angegeben' });
    expect(stufeAusBegriffen([])).toEqual({ key: 'unbekannt', label: 'Stufe nicht angegeben' });
  });

  it('fällt bei der Stufe auf die KIM-URI zurück', () => {
    expect(stufeAusBegriffen([{ id: 'https://w3id.org/kim/educationalLevel/level_0', label: 'level_0' }]).key).toBe('elem');
    expect(stufeAusBegriffen([{ id: 'https://w3id.org/kim/educationalLevel/level_2', label: 'level_2' }]).key).toBe('sek1');
    expect(stufeAusBegriffen([{ id: 'https://w3id.org/kim/educationalLevel/level_4', label: 'level_4' }]).key).toBe('bbs');
    expect(stufeAusBegriffen([{ id: 'https://w3id.org/kim/educationalLevel/level_A', label: 'level_A' }]).key).toBe('hochschule');
    expect(stufeAusBegriffen([{ id: 'https://w3id.org/kim/educationalLevel/level_C', label: 'level_C' }]).key).toBe('fortbildung');
  });

  it('liefert alle Stufen eines Materials dedupliziert in fester Reihenfolge', () => {
    const begriffe = ['Fortbildung', 'Sekundarbereich II', 'Primarbereich', 'Elementarbereich', 'Postsekundarer nicht-tertiärer Bereich']
      .map((label) => ({ id: 'x', label }));
    expect(stufenAusBegriffen(begriffe)).toEqual(['elem', 'sek2', 'bbs', 'fortbildung']);
    expect(stufenAusBegriffen([])).toEqual(['unbekannt']);
    expect(stufeAusBegriffen(begriffe)).toEqual({ key: 'elem', label: 'Elementar- & Primarbereich' });
  });

  it('liefert alle Typen eines Materials dedupliziert in fester Reihenfolge', () => {
    const begriffe = ['Lernkontrolle', 'Audio', 'Unterrichtsplanung', 'Textdokument', 'Webseite', 'Arbeitsmaterial']
      .map((label) => ({ id: 'x', label }));
    expect(typenAusBegriffen(begriffe)).toEqual(['plan', 'ab', 'audio', 'webseite']);
    expect(typenAusBegriffen([{ id: 'x', label: 'Lernkontrolle' }])).toEqual(['sonstiges']);
    expect(typAusBegriffen(begriffe)).toEqual({ key: 'audio', label: 'Audio' });
  });
});
