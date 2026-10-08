import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { STUFEN_FARBE_DEFAULT } from '../models/farben.js';
import { LEERES_KONTO } from '../models/konto.js';
import { materialAusEvent } from '../models/material.js';
import { leererInhalt } from '../services/spiegel.js';
import { empfehlungWaehlen, startseiteLaden, themenZaehlen } from './startseite.js';

const relays = ['wss://amb-relay.edufeed.org/'];
const inhalt = { ...leererInhalt(), materialien: beispiele, stand: { zeitpunkt: 'x', dauerMs: 1, gefragteRelays: relays, nichtErreichbar: [], anzahl: { materialien: 7 } } };
const september = new Date(2026, 8, 29);
const juli = new Date(2026, 6, 1);

describe('themenZaehlen', () => {
  it('zählt Themen über alle Materialien, saisonale zuerst, dann nach Häufigkeit, höchstens sechs', () => {
    const { themen } = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september });
    expect(themen[0]).toMatchObject({ wort: 'Erntedank', saisonal: true, pfad: '/materialien?q=Erntedank' });
    expect(themen).toHaveLength(6);
    expect(themen.slice(1).every((t) => !t.saisonal)).toBe(true);
  });
  it('sortiert ohne Saison nur nach Häufigkeit, dann alphabetisch', () => {
    const zaehlung = themenZaehlen(
      [{ themen: ['a', 'b'] }, { themen: ['b'] }, { themen: ['b', 'c'] }],
      []
    );
    expect(zaehlung.map((t) => t.wort)).toEqual(['b', 'a', 'c']);
  });
});

describe('startseiteLaden', () => {
  it('liefert vier Stufen-Kacheln in fester Reihenfolge mit Farben und Link', () => {
    const { stufen } = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september });
    expect(stufen.map((s) => s.key)).toEqual(['elem', 'sek1', 'sek2', 'fortbildung']);
    expect(stufen[3]).toMatchObject({ label: 'Erwachsene', pfad: '/materialien?stufe=fortbildung' });
    expect(stufen[0]).toEqual({
      key: 'elem', label: 'Kinder', pfad: '/materialien?stufe=elem',
      farbe: STUFEN_FARBE_DEFAULT.elem, text: '#16181b'
    });
    expect(stufen[2].text).toBe('#fff');
  });

  it('nimmt die Palette der CI-Farbe, wenn eine gesetzt ist', () => {
    const palette = { ...STUFEN_FARBE_DEFAULT, sek2: '#c1272d' };
    const { stufen } = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september, palette });
    expect(stufen[2].farbe).toBe('#c1272d');
  });

  it('wählt die Empfehlung: saisonal mit Bild vor Bild vor allem, stabil je Tag', () => {
    const a = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september });
    expect(a.empfehlung?.name).toBe('EKD: Erntedankfest');
    expect(a.empfehlung?.cover.ink).toMatch(/^#/);
    expect(a.empfehlung?.icon).toBe('notebook');
    const b = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september });
    expect(b.empfehlung?.id).toBe(a.empfehlung?.id);
    expect(a.status).toBeNull();
  });

  it('ohne Saisontreffer: irgendein Material mit Bild', () => {
    const { empfehlung } = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: juli });
    expect(empfehlung?.bild).toMatch(/^https?:/);
  });

  it('ohne Bilder: irgendein Material', () => {
    const ohneBild = beispiele.map((e) => ({ ...e, tags: e.tags.filter((t) => t[0] !== 'image') }));
    const m = empfehlungWaehlen(ohneBild.map(materialAusEvent), juli);
    expect(m).not.toBeNull();
  });

  it('ohne Materialien: keine Empfehlung, Statushinweis statt dessen', () => {
    const leer = startseiteLaden({ inhalt: leererInhalt(), fehlschlag: null, relays, heute: september });
    expect(leer.empfehlung).toBeNull();
    expect(leer.themen).toEqual([]);
    expect(leer.status).toEqual({ text: 'Materialien werden geladen …', warnung: false });
    expect(leer.stufen).toHaveLength(4);
  });

  it('nennt bei Fehlschlag die Erklärung mit Warnung', () => {
    const fehlschlag = { zeitpunkt: 'x', gefragteRelays: relays, grund: /** @type {const} */ ('kein-relay-erreichbar') };
    const s = startseiteLaden({ inhalt: leererInhalt(), fehlschlag, relays, heute: september });
    expect(s.status?.warnung).toBe(true);
    expect(s.status?.text).toMatch(/Kein Relay war erreichbar/);
  });

  it('warnt auch bei belastbar leerem Stand', () => {
    const leerMitStand = { ...leererInhalt(), stand: inhalt.stand };
    const s = startseiteLaden({ inhalt: leerMitStand, fehlschlag: null, relays, heute: september });
    expect(s.status?.warnung).toBe(true);
    expect(s.status?.text).toMatch(/QUELLE_AUTOREN/);
  });
});

describe('startseiteLaden mit Konto (ADR-0006)', () => {
  /** @param {Partial<import('../models/konto.js').Konto>} teil */
  const konto = (teil) => ({ ...LEERES_KONTO, angemeldet: true, name: 'Christina Kreutz', ...teil });

  it('ohne Anmeldung: keine Begrüßung, Kacheln, Links ohne Profil', () => {
    const s = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september });
    expect(s.begruessung).toBeNull();
    expect(s.fuerDich).toBeNull();
    expect(s.browsePfad).toBe('/materialien');
    expect(s.stufen[0].pfad).toBe('/materialien?stufe=elem');
    expect(s.sucheMitProfil).toBe(false);
  });

  it('begrüßt mit Vorname und Ort, Einstiege tragen das Profil', () => {
    const s = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september, konto: konto({ bereiche: ['konfi'] }) });
    expect(s.begruessung).toEqual({ vorname: 'Christina', ort: 'mit Konfis', profilText: 'Profil ändern' });
    expect(s.browsePfad).toBe('/materialien?profil=1');
    expect(s.themen[0].pfad).toBe('/materialien?q=Erntedank&profil=1');
    expect(s.sucheMitProfil).toBe(true);
    expect(startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september, konto: konto({}) }).begruessung?.profilText).toBe('Profil ausfüllen');
  });

  it('zeigt mit Stufen im Profil das Neueste für die eigene Arbeit statt der Alterskacheln', () => {
    const s = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september, konto: konto({ bereiche: ['grundschule'], faecher: ['evangelisch'] }) });
    expect(s.fuerDich).toMatchObject({
      ort: 'in der Grundschule',
      profil: ['Elementar- & Primarbereich', 'Evangelische Religionslehre'],
      anzahl: 3,
      allePfad: '/materialien?stufe=elem&fach=evangelisch&sort=neu'
    });
    // neueste zuerst, nach datePublished/dateCreated
    expect(s.fuerDich?.karten.map((k) => k.material.datum)).toEqual(['2024-12-08', '2021-01-01', '2020-07-21']);
  });

  it('behält die Kacheln, wenn im eigenen Bereich nichts liegt', () => {
    // Keines der Fixture-Materialien ist katholisch und für die Grundschule.
    const s = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september, konto: konto({ bereiche: ['grundschule'], faecher: ['katholisch'] }) });
    expect(s.fuerDich).toBeNull();
    expect(s.stufen).toHaveLength(4);
  });

  it('behält die Kacheln, wenn das Profil keine Stufen kennt (Gemeinde)', () => {
    const s = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september, konto: konto({ bereiche: ['gemeinde'] }) });
    expect(s.fuerDich).toBeNull();
    expect(s.stufen[0].pfad).toBe('/materialien?stufe=elem&profil=1');
  });
});
