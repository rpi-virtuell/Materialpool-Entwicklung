import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { materialAusEvent } from '../models/material.js';
import { standVon } from '../models/meldung.js';
import { leererInhalt } from '../services/spiegel.js';
import {
  faelleBilden, gemeldetLesen, gemeldetMerken, meldenBilden as bilden, meldenVerarbeiten, meldungsBrief,
  redaktionLaden, stempelAusstellen, stempelPruefen, zugangErlaubt, zugangsMarke
} from './meldungen.js';
import { merkSchluessel } from './merkliste.js';

const jetzt = Date.parse('2026-10-26T12:00:00Z');
const geheimnis = 'test-geheimnis';
const inhalt = { ...leererInhalt(), materialien: beispiele };
const [a, b] = beispiele.map(materialAusEvent);

/**
 * @param {Partial<import('../models/meldung.js').Meldung>} [teil]
 * @returns {import('../models/meldung.js').Meldung}
 */
const meldung = (teil = {}) => ({
  id: 'm1', material: merkSchluessel(a), titel: a.name, pfad: a.pfad, grund: 'lizenz', begruendung: 'Lizenz ist NC.',
  zeit: new Date(jetzt).toISOString(), status: 'offen', ...teil
});

describe('Stempel gegen Spam-Programme', () => {
  it('gilt ab drei Sekunden bis einen Tag', () => {
    const s = stempelAusstellen(geheimnis, jetzt);
    expect(stempelPruefen(s, geheimnis, jetzt + 1000)).toBe('zu-schnell');
    expect(stempelPruefen(s, geheimnis, jetzt + 3000)).toBe('ok');
    expect(stempelPruefen(s, geheimnis, jetzt + 25 * 60 * 60 * 1000)).toBe('abgelaufen');
  });
  it('erkennt gefälschte Stempel', () => {
    const [zeit] = stempelAusstellen(geheimnis, jetzt).split('.');
    expect(stempelPruefen(`${zeit}.falsch`, geheimnis, jetzt + 5000)).toBe('abgelaufen');
    expect(stempelPruefen(stempelAusstellen('anderes', jetzt), geheimnis, jetzt + 5000)).toBe('abgelaufen');
    expect(stempelPruefen(null, geheimnis, jetzt)).toBe('abgelaufen');
  });
});

describe('Cookie „gemeldet“', () => {
  it('liest nur gültige Schlüssel und merkt neue vorne', () => {
    expect(gemeldetLesen(undefined)).toEqual([]);
    expect(gemeldetLesen('kaputt')).toEqual([]);
    expect(gemeldetLesen(JSON.stringify(['abcdef012345', 'x', 3]))).toEqual(['abcdef012345']);
    expect(gemeldetMerken(['abcdef012345'], '999999999999')).toEqual(['999999999999', 'abcdef012345']);
    expect(gemeldetMerken(['abcdef012345'], 'abcdef012345')).toEqual(['abcdef012345']);
  });
});

describe('meldenVerarbeiten', () => {
  const gueltig = { grund: 'lizenz', begruendung: 'Lizenz ist NC.', falle: '', stempel: stempelAusstellen(geheimnis, jetzt - 10_000) };
  const basis = { material: a, schonGemeldet: false, heute: 0, jeTag: 30, geheimnis, jetzt, id: 'neu1' };

  it('legt eine gültige Meldung an — nur Material, Grund, Begründung, Zeit', () => {
    const r = meldenVerarbeiten({ ...basis, formular: gueltig });
    expect(r).toEqual({
      art: 'ablegen',
      meldung: { id: 'neu1', material: merkSchluessel(a), titel: a.name, pfad: a.pfad, grund: 'lizenz', begruendung: 'Lizenz ist NC.', zeit: new Date(jetzt).toISOString(), status: 'offen' }
    });
  });
  it('verwirft still: ausgefülltes Fangfeld, zu schnell, schon aus diesem Browser gemeldet', () => {
    expect(meldenVerarbeiten({ ...basis, formular: { ...gueltig, falle: 'http://spam.example' } }).art).toBe('still');
    expect(meldenVerarbeiten({ ...basis, formular: { ...gueltig, stempel: stempelAusstellen(geheimnis, jetzt) } }).art).toBe('still');
    expect(meldenVerarbeiten({ ...basis, schonGemeldet: true, formular: gueltig }).art).toBe('still');
  });
  it('bittet um erneutes Absenden, wenn das Formular zu alt ist', () => {
    const r = meldenVerarbeiten({ ...basis, formular: { ...gueltig, stempel: 'kaputt' } });
    expect(r).toMatchObject({ art: 'fehler', status: 400, werte: { grund: 'lizenz', begruendung: 'Lizenz ist NC.' } });
    expect(r.art === 'fehler' && r.fehler).toMatch(/noch einmal/);
  });
  it('meldet unvollständige Eingaben zurück', () => {
    const r = meldenVerarbeiten({ ...basis, formular: { ...gueltig, begruendung: '' } });
    expect(r).toMatchObject({ art: 'fehler', status: 400 });
  });
  it('hält die Tagesgrenze ein', () => {
    const r = meldenVerarbeiten({ ...basis, heute: 30, formular: gueltig });
    expect(r).toMatchObject({ art: 'fehler', status: 429 });
    expect(r.art === 'fehler' && r.fehler).toMatch(/morgen/);
  });
});

describe('meldenBilden (Detailseite)', () => {
  const stempel = stempelAusstellen(geheimnis, jetzt);
  /** Eingeschaltet gibt es immer etwas. @param {Parameters<typeof bilden>[0]} eingabe */
  const meldenBilden = (eingabe) => {
    const m = bilden(eingabe);
    if (!m) throw new Error('Meldefunktion unerwartet aus');
    return m;
  };
  it('ohne Meldung: kein Hinweis, Formular zu, Aktion auf dieser Adresse', () => {
    const m = meldenBilden({ material: a, stand: standVon([]), gemeldetHier: false, an: true, stempel });
    expect(m.hinweis).toBeNull();
    expect(m.ausgeblendet).toBe(false);
    expect(m.formular).toMatchObject({ aktion: `${a.pfad}?/melden`, stempel, offen: false, fehler: null, werte: { grund: '', begruendung: '' } });
    expect(m.formular?.gruende).toHaveLength(4);
  });
  it('mit ?von= hängt die Aktion an, statt die Adresse zu verlieren', () => {
    const m = meldenBilden({ material: { ...a, pfad: '/m/x?von=abc' }, stand: standVon([]), gemeldetHier: false, an: true, stempel });
    expect(m.formular?.aktion).toBe('/m/x?von=abc&/melden');
  });
  it('nach einem Fehler: offen, mit Eingabe und Fehler', () => {
    const m = meldenBilden({ material: a, stand: standVon([]), gemeldetHier: false, an: true, stempel, ruecklauf: { fehler: 'F', werte: { grund: 'inhalt', begruendung: 'B' } } });
    expect(m.formular).toMatchObject({ offen: true, fehler: 'F', werte: { grund: 'inhalt', begruendung: 'B' } });
  });
  it('Hinweise je Stand; bestätigt oder schon gemeldet: kein Formular', () => {
    expect(meldenBilden({ material: a, stand: standVon([meldung()]), gemeldetHier: false, an: true, stempel }).hinweis).toMatch(/liegt ein Hinweis vor/);
    const vorlaeufig = meldenBilden({ material: a, stand: standVon([meldung(), meldung({ id: 'm2' })]), gemeldetHier: false, an: true, stempel });
    expect(vorlaeufig.hinweis).toMatch(/ausgeblendet, bis die Redaktion/);
    expect(vorlaeufig.ausgeblendet).toBe(true);
    const bestaetigt = meldenBilden({ material: a, stand: standVon([meldung({ status: 'bestaetigt' })]), gemeldetHier: false, an: true, stempel });
    expect(bestaetigt.hinweis).toBe('Die Redaktion hat dieses Material ausgeblendet. Grund: Lizenz falsch.');
    expect(bestaetigt.formular).toBeNull();
    const hier = meldenBilden({ material: a, stand: standVon([meldung()]), gemeldetHier: true, an: true, stempel });
    expect(hier.formular).toBeNull();
    expect(hier.gemeldetHier).toBe(true);
  });
  it('abgeschaltet: nichts', () => {
    expect(bilden({ material: a, stand: standVon([meldung(), meldung({ id: 'm2' })]), gemeldetHier: false, an: false, stempel })).toBeNull();
  });
});

describe('meldungsBrief', () => {
  it('nennt Material, Grund, Begründung, Stand und beide Links', () => {
    const { betreff, text } = meldungsBrief({ meldung: meldung(), stand: standVon([meldung(), meldung({ id: 'm2' })]), origin: 'https://material.example' });
    expect(betreff).toBe(`Hinweis zu „${a.name}“: Lizenz falsch`);
    expect(text).toContain('Lizenz ist NC.');
    expect(text).toContain('vorläufig ausgeblendet');
    expect(text).toContain(`https://material.example${a.pfad}`);
    expect(text).toContain('https://material.example/redaktion');
  });
});

describe('faelleBilden und redaktionLaden', () => {
  it('gruppiert je Material, ausgeblendete zuerst, mit Material aus dem Spiegel', () => {
    const vonB = meldung({ id: 'b1', material: merkSchluessel(b), titel: b.name, pfad: b.pfad });
    const faelle = faelleBilden(inhalt, [meldung(), vonB, meldung({ id: 'm2', grund: 'inhalt' })]);
    expect(faelle.map((f) => f.schluessel)).toEqual([merkSchluessel(a), merkSchluessel(b)]);
    expect(faelle[0]).toMatchObject({ titel: a.name, pfad: a.pfad, herkunft: a.herkunft, stand: { stand: 'vorlaeufig', offen: 2 } });
    expect(faelle[0].meldungen.map((m) => m.grund)).toEqual(['Lizenz falsch', 'Inhalt problematisch']);
  });
  it('fehlt das Material im Spiegel, bleibt der gespeicherte Titel', () => {
    const [f] = faelleBilden(inhalt, [meldung({ material: '000000000000', titel: 'Verschwunden' })]);
    expect(f).toMatchObject({ titel: 'Verschwunden', herkunft: null });
  });
  it('trennt offene von bestätigten', () => {
    const daten = redaktionLaden({ inhalt, meldungen: [meldung({ status: 'bestaetigt' }), meldung({ id: 'b1', material: merkSchluessel(b) })] });
    expect(daten.offen.map((f) => f.schluessel)).toEqual([merkSchluessel(b)]);
    expect(daten.ausgeblendet.map((f) => f.schluessel)).toEqual([merkSchluessel(a)]);
  });
});

describe('Zugang zur Redaktionsseite', () => {
  it('ohne Kennwort offen, sonst nur mit passender Marke', () => {
    expect(zugangErlaubt('', undefined)).toBe(true);
    expect(zugangErlaubt('geheim', undefined)).toBe(false);
    expect(zugangErlaubt('geheim', 'falsch')).toBe(false);
    expect(zugangErlaubt('geheim', zugangsMarke('geheim'))).toBe(true);
    expect(zugangsMarke('geheim')).not.toContain('geheim');
  });
});
