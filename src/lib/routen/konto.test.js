import { describe, expect, it } from 'vitest';
import { LEERES_KONTO } from '../models/konto.js';
import {
  abmelden, anmelden, kontoLesen, kontoSchreiben, kontoSeite, mitProfil, profilAusFormular, profilEinsetzen, profilHinweis
} from './konto.js';
import { filterLesen, leererFilter } from './uebersicht.js';

/** @param {Partial<import('../models/konto.js').Konto>} teil */
const konto = (teil) => ({ ...LEERES_KONTO, angemeldet: true, name: 'Christina', ...teil });
/** @param {[string, string][]} paare */
const formular = (paare) => {
  const f = new FormData();
  for (const [k, v] of paare) f.append(k, v);
  return f;
};

describe('Cookie', () => {
  it('liest zurück, was geschrieben wurde', () => {
    const k = konto({ bundesland: 'Hessen', bereiche: ['sek1', 'konfi'], faecher: ['katholisch'], fachAnderes: 'Ethik' });
    expect(kontoLesen(kontoSchreiben(k))).toEqual(k);
  });
  it('verwirft Unbekanntes und Kaputtes, statt zu raten', () => {
    expect(kontoLesen(undefined)).toEqual(LEERES_KONTO);
    expect(kontoLesen('{kaputt')).toEqual(LEERES_KONTO);
    expect(kontoLesen(JSON.stringify({ angemeldet: true, name: '' }))).toEqual(LEERES_KONTO);
    expect(kontoLesen(JSON.stringify({ angemeldet: 'ja', name: 'A' })).angemeldet).toBe(false);
    const roh = JSON.stringify({ angemeldet: true, name: 'A', bundesland: 'Atlantis', bereiche: ['sek1', 'mond'], faecher: ['orthodox', 'evangelisch'] });
    expect(kontoLesen(roh)).toEqual(konto({ name: 'A', bereiche: ['sek1'], faecher: ['evangelisch'] }));
  });
});

describe('anmelden und profilAusFormular', () => {
  it('meldet nur mit Namen an', () => {
    expect(anmelden('  Christina Kreutz ', LEERES_KONTO)).toEqual(konto({ name: 'Christina Kreutz' }));
    expect(anmelden('   ', LEERES_KONTO)).toBeNull();
  });
  it('kürzt Name und Freitext nach Zeichen, ohne ein Emoji zu zerbrechen', () => {
    const name = /** @type {import('../models/konto.js').Konto} */ (anmelden(`${'x'.repeat(59)}😀😀`, LEERES_KONTO)).name;
    expect(Array.from(name)).toHaveLength(60);
    expect(name.endsWith('😀')).toBe(true);
    expect(name).not.toMatch(/[\uD800-\uDBFF]$/);
    const profil = profilAusFormular(formular([['bereichAnderes', `${'y'.repeat(79)}🙂🙂`]]), konto({}));
    expect(Array.from(profil.bereichAnderes)).toHaveLength(80);
    expect(profil.bereichAnderes.endsWith('🙂')).toBe(true);
  });
  it('behält beim Abmelden das Profil, das mit der nächsten Anmeldung zurückkommt', () => {
    const k = konto({ bereiche: ['konfi'] });
    const ab = kontoLesen(kontoSchreiben(abmelden(k)));
    expect(ab).toEqual({ ...k, angemeldet: false });
    expect(anmelden('Christina', ab)).toEqual(k);
  });
  it('übernimmt das Profil aus dem Formular und behält den Namen', () => {
    const f = formular([['bundesland', 'Bayern'], ['bereich', 'grundschule'], ['bereich', 'kita'], ['fach', 'evangelisch'], ['bereichAnderes', ' Diakonie '], ['fachAnderes', '']]);
    expect(profilAusFormular(f, konto({ faecher: ['katholisch'] }))).toEqual(
      konto({ bundesland: 'Bayern', bereiche: ['grundschule', 'kita'], faecher: ['evangelisch'], bereichAnderes: 'Diakonie' })
    );
  });
  it('speichert Fächer auch ohne Schulbereich; sie gelten dann nur nicht', () => {
    const k = profilAusFormular(formular([['bereich', 'kita'], ['fach', 'katholisch']]), konto({}));
    expect(k.faecher).toEqual(['katholisch']);
    expect(kontoSeite(k).fragtNachFach).toBe(false);
  });
});

describe('Liste mit Profil', () => {
  const k = konto({ bereiche: ['sek1'], faecher: ['katholisch'] });
  it('setzt beim Einstieg Stufe und Fach aus dem Profil, was die Adresse nicht schon nennt', () => {
    expect(profilEinsetzen(new URLSearchParams('profil=1'), k)?.toString()).toBe('stufe=sek1&fach=katholisch');
    // Eine Kachel ist eine ausdrückliche Wahl und schlägt die Stufe aus dem Profil.
    expect(profilEinsetzen(new URLSearchParams('stufe=elem&profil=1'), k)?.toString()).toBe('stufe=elem&fach=katholisch');
    expect(profilEinsetzen(new URLSearchParams('q=Ostern&profil=1'), LEERES_KONTO)?.toString()).toBe('q=Ostern');
    expect(profilEinsetzen(new URLSearchParams('stufe=elem'), k)).toBeNull();
  });
  it('nennt, was noch genau so aus dem Profil steht', () => {
    expect(profilHinweis({ ...leererFilter(), stufen: ['sek1'], faecher: ['katholisch'] }, k)).toBe('Stufe und Fach sind aus deinem Profil voreingestellt.');
    expect(profilHinweis({ ...leererFilter(), stufen: ['elem'], faecher: ['katholisch'] }, k)).toBe('Fach ist aus deinem Profil voreingestellt.');
    expect(profilHinweis(filterLesen(new URLSearchParams('stufe=sek1')), k)).toBe('Stufe ist aus deinem Profil voreingestellt.');
    expect(profilHinweis(leererFilter(), k)).toBeNull();
    expect(profilHinweis({ ...leererFilter(), stufen: ['sek1'] }, LEERES_KONTO)).toBeNull();
  });
  it('hängt profil=1 nur an, wenn jemand angemeldet ist', () => {
    expect(mitProfil('/materialien', k)).toBe('/materialien?profil=1');
    expect(mitProfil('/materialien?stufe=elem', k)).toBe('/materialien?stufe=elem&profil=1');
    expect(mitProfil('/materialien', LEERES_KONTO)).toBe('/materialien');
  });
});

describe('kontoSeite', () => {
  it('sagt, was beim Stöbern voreingestellt wird', () => {
    expect(kontoSeite(konto({ bereiche: ['sek1'], faecher: ['katholisch'] })).folge)
      .toBe('Beim Stöbern stellen wir dir vorab ein: Sekundarstufe I, Katholische Religionslehre. Du kannst das dort jederzeit wegklicken.');
    expect(kontoSeite(konto({ bereiche: ['gemeinde'] })).folge).toMatch(/Gemeindearbeit reicht über alle Altersgruppen/);
    expect(kontoSeite(konto({ bereichAnderes: 'Diakonie' })).folge).toMatch(/eigene Angabe/);
    expect(kontoSeite(konto({})).folge).toMatch(/Sobald du einen Bereich wählst/);
  });
  it('markiert gewählte Bereiche und Fächer', () => {
    const s = kontoSeite(konto({ bereiche: ['kita'], faecher: ['juedisch'] }));
    expect(s.gruppen[1].bereiche.find((b) => b.key === 'kita')?.gewaehlt).toBe(true);
    expect(s.faecher.find((f) => f.key === 'juedisch')).toEqual({ key: 'juedisch', label: 'Jüdische Religionslehre', gewaehlt: true });
    expect(s.fragtNachFach).toBe(false);
  });
});
