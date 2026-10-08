import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { begriffe, herkunftBilden, kennungAusD, letzterPfadteil, lizenzKuerzel, materialAusEvent } from './material.js';

// Echte Events vom Materialpool-Schlüssel (test/fixtures/README.md).
const [arbeitsheft, berufsorientierung, erntedank, geist, jenseits, fluechtlinge, jericho] = beispiele;

describe('materialAusEvent', () => {
  it('liest die flachen AMB-Felder', () => {
    const m = materialAusEvent(arbeitsheft);
    expect(m.name).toBe('Religionen und miteinander leben in Deutschland - jetzt versteh ich das! (Arbeitsheft)');
    expect(m.beschreibung).toMatch(/abrahamitischen Religionen/);
    expect(m.url).toBe('https://material.rpi-virtuell.de/material/religionen-und-miteinander-leben-in-deutschland-jetzt-versteh-ich-das-arbeitsheft/');
    expect(m.bild).toMatch(/^https:\/\/www\.bpb\.de\//);
    expect(m.schlagworte).toHaveLength(7);
    expect(m.schlagworte.slice(0, 2)).toEqual(['Abrahamitische Religionen', 'Christentum']);
    expect(m.sprachen).toEqual(['de']);
    expect(m.datum).toBe('2021-01-01');
    expect(m.typen).toEqual(['LearningResource']);
  });

  it('liest Personen und Organisationen über die Doppelpunkt-Pfade', () => {
    expect(materialAusEvent(arbeitsheft).herausgeber).toEqual(['HanisauLand', 'bpb']);
    expect(materialAusEvent(jericho).urheber).toEqual(['Horst Heller']);
    expect(materialAusEvent(erntedank).mitwirkende).toEqual([]);
  });

  it('bildet SKOS-Begriffe mit deutschem Label', () => {
    const m = materialAusEvent(arbeitsheft);
    expect(m.bildungsstufen).toEqual([
      { id: 'https://w3id.org/kim/educationalLevel/level_1', label: 'Primarbereich' },
      { id: 'https://w3id.org/kim/educationalLevel/level_2', label: 'Sekundarbereich I' }
    ]);
    expect(m.faecher.map((f) => f.label)).toEqual(['Religionslehre (evangelische)', 'Religion']);
    expect(m.ressourcentypen.map((r) => r.label)).toEqual(['Lernkontrolle', 'Unterrichtsplanung', 'Textdokument', 'Arbeitsmaterial']);
  });

  it('fällt ohne prefLabel auf den letzten Pfadteil zurück', () => {
    const ohneLabel = { ...jenseits, tags: [['d', 'urn:x'], ['educationalLevel:id', 'https://w3id.org/kim/educationalLevel/level_B']] };
    expect(materialAusEvent(ohneLabel).bildungsstufen).toEqual([
      { id: 'https://w3id.org/kim/educationalLevel/level_B', label: 'level_B' }
    ]);
    expect(materialAusEvent(ohneLabel).beschreibung).toBe('');
    expect(materialAusEvent(ohneLabel).bild).toBeNull();
  });

  it('kürzt Creative-Commons-Lizenzen; ohne Lizenz null', () => {
    expect(materialAusEvent(jericho).lizenz).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
    expect(materialAusEvent(jericho).lizenzKuerzel).toBe('CC BY-SA 4.0');
    expect(materialAusEvent(jericho).lizenzUrl).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
    expect(materialAusEvent(arbeitsheft).lizenzKuerzel).toBeNull();
    expect(lizenzKuerzel('https://creativecommons.org/publicdomain/zero/1.0/')).toBe('CC0');
    expect(lizenzKuerzel('https://example.org/eigene-lizenz')).toBeNull();
    expect(lizenzKuerzel(null)).toBeNull();
  });

  it('verlinkt eine Lizenz nur mit http(s)-Adresse, zeigt sie aber immer', () => {
    const tags = jericho.tags.map((t) => (t[0] === 'license:id' ? ['license:id', 'javascript:alert(1)'] : t));
    const m = materialAusEvent({ ...jericho, tags });
    expect(m.lizenz).toBe('javascript:alert(1)');
    expect(m.lizenzUrl).toBeNull();
    expect(materialAusEvent(arbeitsheft).lizenzUrl).toBeNull();
  });

  it('leitet Typ und Stufe aus den SKOS-Begriffen ab — erster bekannter zur Anzeige, alle für Filter', () => {
    const a = materialAusEvent(arbeitsheft);
    expect(a.typ).toEqual({ key: 'plan', label: 'Unterrichtsplanung' });
    expect(a.typKeys).toEqual(['plan', 'ab']);
    expect(a.stufe).toEqual({ key: 'elem', label: 'Elementar- & Primarbereich' });
    expect(a.stufenKeys).toEqual(['elem', 'sek1']);
    expect(materialAusEvent(geist).typ).toEqual({ key: 'video', label: 'Video' });
    expect(materialAusEvent(fluechtlinge).typ).toEqual({ key: 'audio', label: 'Audio' });
    expect(materialAusEvent(fluechtlinge).typKeys).toEqual(['plan', 'ab', 'audio', 'webseite']);
    expect(materialAusEvent(erntedank).stufenKeys).toEqual(['elem', 'sek1', 'sek2', 'bbs', 'fortbildung']);
    expect(materialAusEvent(fluechtlinge).stufenKeys).toEqual(['sek1', 'sek2', 'bbs']);
    expect(materialAusEvent(jericho).stufenKeys).toEqual(['elem', 'hochschule']);
    expect(materialAusEvent(berufsorientierung).stufe.key).toBe('unbekannt');
    expect(materialAusEvent(berufsorientierung).stufenKeys).toEqual(['unbekannt']);
  });

  it('nennt die Herkunft: Urheber, Herausgeber, Mitwirkende — sonst Hostname — sonst Hinweis', () => {
    expect(materialAusEvent(arbeitsheft).herkunft).toBe('HanisauLand · bpb');
    expect(materialAusEvent(berufsorientierung).herkunft).toBe('Matthias Gronover');
    expect(materialAusEvent({ ...jenseits, tags: [['d', 'https://www.example.org/x']] }).herkunft).toBe('example.org');
    expect(materialAusEvent({ ...jenseits, tags: [['d', 'urn:x']] }).herkunft).toBe('Herkunft nicht angegeben');
    expect(herkunftBilden({ urheber: ['A'], herausgeber: ['A', 'B'], mitwirkende: ['B'], url: null })).toBe('A · B');
  });

  it('findet die URL: d, sonst encoding:contentUrl, sonst erstes http-r', () => {
    expect(materialAusEvent(erntedank).url).toBe('https://material.rpi-virtuell.de/material/ekd-erntedankfest/');
    const ohneHttpD = { ...erntedank, tags: erntedank.tags.map((t) => (t[0] === 'd' ? ['d', 'urn:test'] : t)) };
    expect(materialAusEvent(ohneHttpD).url).toBe('https://www.ekd.de/erntedank-10832.htm');
    const nurR = { ...jenseits, tags: [['d', 'urn:y'], ['r', 'mailto:x'], ['r', 'https://r.example/']] };
    expect(materialAusEvent(nurR).url).toBe('https://r.example/');
    expect(materialAusEvent({ ...jenseits, tags: [['d', 'urn:z']] }).url).toBeNull();
  });

  it('nimmt ein Bild nur mit http(s)-Adresse', () => {
    expect(materialAusEvent(geist).bild).toMatch(/^http:\/\/cf\.katholisch\.de\//);
    expect(materialAusEvent(berufsorientierung).bild).toBeNull();
    expect(materialAusEvent({ ...geist, tags: [['d', 'urn:a'], ['image', 'ftp://kein-bild/x.jpg']] }).bild).toBeNull();
  });

  it('liefert Themen: t-Tags, sonst about-Labels, höchstens vier', () => {
    expect(materialAusEvent(erntedank).themen).toEqual(['Erntedank', 'Früchte', 'Lebensmittel', 'Nutztier']);
    expect(materialAusEvent(jenseits).themen).toEqual(['Religionslehre (evangelische)', 'Religion']);
    expect(materialAusEvent({ ...jenseits, tags: [['d', 'urn:x']] }).themen).toEqual([]);
  });

  it('macht aus d eine URL-sichere Kennung und zurück', () => {
    const m = materialAusEvent(arbeitsheft);
    expect(m.pfad).toBe(`/m/${m.kennung}`);
    expect(m.kennung).not.toContain('/');
    // So dekodiert SvelteKit params.kennung — einmal.
    expect(decodeURIComponent(m.kennung)).toBe(m.d);
    expect(kennungAusD('a b')).toBe('a%20b');
  });

  it('nimmt d als Titel, wenn name fehlt', () => {
    const m = materialAusEvent({ ...jenseits, tags: [['d', 'https://x.example/']] });
    expect(m.name).toBe('https://x.example/');
  });

  it('nimmt datePublished vor dateCreated', () => {
    expect(materialAusEvent(jericho).datum).toBe('2024-12-08');
    expect(materialAusEvent(erntedank).datum).toBe('2020-07-21');
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
