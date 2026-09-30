import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import faecherBeispiele from '../../../test/fixtures/amb-faecher.json';
import { materialAusEvent } from '../models/material.js';
import { leererInhalt } from '../services/spiegel.js';
import {
  aktiveFilter, facettenBilden, filterAnwenden, filterLesen, grundmengeBilden, leererFilter, leerstandErklaeren,
  listeLaden, listenPfad, SEITENGROESSE_LISTE, seitenBilden, SORTIERUNGEN, sortieren
} from './uebersicht.js';

const relays = ['wss://amb-relay.edufeed.org/'];
const materialien = beispiele.map(materialAusEvent);
/** @param {Partial<import('./uebersicht.js').Filter>} teil */
const filter = (teil = {}) => ({ ...leererFilter(), ...teil });
const lesepause = 'Lesepause – Magazin für Religionslehrkräfte im Erzbistum Paderborn. Ausgabe 1 | Februar 2026';
const frieden = 'Modul für den Religionsunterricht: Kein Frieden ohne Frieden der Religionen';

describe('leerstandErklaeren — nie eine leere Liste ohne Erklärung', () => {
  it('schweigt, wenn Material da ist', () => {
    const inhalt = { ...leererInhalt(), materialien: beispiele };
    expect(leerstandErklaeren(inhalt, null, relays)).toBeNull();
  });
  it('nennt den Fehlschlag samt Relays', () => {
    const fehlschlag = { zeitpunkt: 'x', gefragteRelays: relays, grund: /** @type {const} */ ('kein-relay-erreichbar') };
    expect(leerstandErklaeren(leererInhalt(), fehlschlag, relays)).toMatch(/Kein Relay war erreichbar.*amb-relay/);
  });
  it('nennt einen abgebrochenen Lauf', () => {
    const fehlschlag = { zeitpunkt: 'x', gefragteRelays: relays, grund: /** @type {const} */ ('lauf-abgebrochen') };
    expect(leerstandErklaeren(leererInhalt(), fehlschlag, relays)).toMatch(/mit einem Fehler abgebrochen.*amb-relay/);
  });
  it('erklärt den fehlenden ersten Lauf', () => {
    expect(leerstandErklaeren(leererInhalt(), null, relays)).toMatch(/noch keinen Stand/);
  });
  it('erklärt eine belastbare leere Antwort mit Hinweis auf QUELLE_AUTOREN', () => {
    const inhalt = {
      ...leererInhalt(),
      stand: { zeitpunkt: 'x', dauerMs: 1, gefragteRelays: relays, nichtErreichbar: [], anzahl: { materialien: 0 } }
    };
    expect(leerstandErklaeren(inhalt, null, relays)).toMatch(/QUELLE_AUTOREN/);
  });
});

describe('listenPfad und filterLesen', () => {
  it('baut Pfade ohne leere Parameter, mehrfach je Facette, und liest sie zurück', () => {
    expect(listenPfad()).toBe('/materialien');
    expect(listenPfad({ q: 'Erntedank', stufen: ['elem'] })).toBe('/materialien?q=Erntedank&stufe=elem');
    const voll = filter({ q: 'x', stufen: ['elem', 'sek1'], typen: ['video'], faecher: ['katholisch'], schlagworte: ['kita'], sortierung: 'neu', seite: 3 });
    expect(listenPfad(voll)).toBe('/materialien?q=x&stufe=elem&stufe=sek1&typ=video&fach=katholisch&t=kita&sort=neu&seite=3');
    expect(filterLesen(new URLSearchParams(listenPfad(voll).slice(13)))).toEqual(voll);
  });
  it('lässt Standardsortierung und Seite 1 im Pfad weg und ignoriert Unbekanntes', () => {
    expect(listenPfad(filter({ sortierung: 'empfohlen', seite: 1 }))).toBe('/materialien');
    expect(filterLesen(new URLSearchParams('q=+Ostern+&stufe=weiterbildung&typ=nix&fach=orthodox&sort=nix&seite=0'))).toEqual(filter({ q: 'Ostern' }));
    expect(filterLesen(new URLSearchParams('seite=abc')).seite).toBe(1);
  });
});

describe('filterAnwenden', () => {
  it('sucht kleingeschrieben in Titel, Beschreibung, Herkunft und Schlagworten', () => {
    expect(filterAnwenden(materialien, filter({ q: 'ERNTEDANK' })).map((m) => m.name)).toEqual(['EKD: Erntedankfest']);
    expect(filterAnwenden(materialien, filter({ q: 'horst heller' })).map((m) => m.name)).toEqual(['Zwischen Jericho und Jerusalem']);
    expect(filterAnwenden(materialien, filter({ q: 'Grundschule' }))).toHaveLength(1);
    expect(filterAnwenden(materialien, filter({ q: 'gibtesnicht' }))).toEqual([]);
  });
  it('ODER innerhalb einer Facette, UND dazwischen — über alle Stufen und Typen eines Materials', () => {
    expect(filterAnwenden(materialien, filter({ stufen: ['elem'] }))).toHaveLength(3);
    expect(filterAnwenden(materialien, filter({ stufen: ['elem', 'hochschule'] }))).toHaveLength(3);
    expect(filterAnwenden(materialien, filter({ stufen: ['fortbildung'] })).map((m) => m.name)).toEqual(['EKD: Erntedankfest']);
    expect(filterAnwenden(materialien, filter({ stufen: ['unbekannt'] }))).toHaveLength(2);
    expect(filterAnwenden(materialien, filter({ stufen: ['bbs'] })).map((m) => m.name)).toEqual(['EKD: Erntedankfest', 'Flüchtlinge schützen']);
    expect(filterAnwenden(materialien, filter({ typen: ['plan'] }))).toHaveLength(6);
    expect(filterAnwenden(materialien, filter({ typen: ['ab'] }))).toHaveLength(2);
    expect(filterAnwenden(materialien, filter({ typen: ['video', 'audio'] }))).toHaveLength(2);
    expect(filterAnwenden(materialien, filter({ stufen: ['elem'], typen: ['ab'] }))).toHaveLength(1);
    expect(filterAnwenden(materialien, filter({ stufen: ['elem'], typen: ['video'] }))).toHaveLength(0);
    expect(filterAnwenden(materialien, filter({ schlagworte: ['Pfingsten'] })).map((m) => m.name)).toEqual(['Ein frischer Geist weht']);
    expect(filterAnwenden(materialien, filter({ q: 'jericho', stufen: ['bbs'] }))).toEqual([]);
  });
  it('lässt ohne Filter alles durch', () => {
    expect(filterAnwenden(materialien, filter())).toHaveLength(materialien.length);
  });
  it('filtert nach Fach, ein Material mit zwei Konfessionen zählt in beiden', () => {
    const mitFaechern = [...materialien, ...faecherBeispiele.map(materialAusEvent)];
    expect(filterAnwenden(mitFaechern, filter({ faecher: ['katholisch'] })).map((m) => m.name)).toEqual([lesepause]);
    expect(filterAnwenden(mitFaechern, filter({ faecher: ['evangelisch'] }))).toHaveLength(8);
    expect(filterAnwenden(mitFaechern, filter({ faecher: ['allgemein'] })).map((m) => m.name)).toEqual([frieden]);
    expect(filterAnwenden(mitFaechern, filter({ faecher: ['katholisch', 'allgemein'] }))).toHaveLength(2);
  });
});

describe('facettenBilden', () => {
  it('zählt je Facette ohne die eigene Facette, in fester Reihenfolge, Materialien mit mehreren Werten in jedem', () => {
    const f = facettenBilden(materialien, filter({ stufen: ['elem'] }));
    expect(f.typen.map((o) => o.key)).toEqual(['plan', 'ab', 'proj', 'uebung', 'video', 'audio', 'webseite', 'sonstiges']);
    // Stufe elem aktiv: Typen werden innerhalb elem gezählt …
    expect(f.typen.find((o) => o.key === 'plan')?.anzahl).toBe(3);
    expect(f.typen.find((o) => o.key === 'ab')?.anzahl).toBe(1);
    expect(f.typen.find((o) => o.key === 'video')?.anzahl).toBe(0);
    // … die Stufen-Facette selbst aber ohne den Stufenfilter.
    expect(f.stufen.map((o) => [o.key, o.anzahl])).toEqual([
      ['elem', 3], ['sek1', 4], ['sek2', 3], ['bbs', 2], ['fortbildung', 1], ['hochschule', 1], ['unbekannt', 2]
    ]);
    expect(f.stufen[0].aktiv).toBe(true);
  });
  it('markiert leere Chips, baut Umschalt-Pfade und springt dabei auf Seite 1', () => {
    const f = facettenBilden(materialien, filter({ stufen: ['elem'], seite: 3 }));
    const video = f.typen.find((o) => o.key === 'video');
    expect(video?.leer).toBe(true);
    expect(video?.pfad).toBeNull();
    expect(f.stufen.find((o) => o.key === 'bbs')?.pfad).toBe('/materialien?stufe=elem&stufe=bbs');
    expect(f.typen.find((o) => o.key === 'plan')?.pfad).toBe('/materialien?stufe=elem&typ=plan');
    expect(f.stufen[0].pfad).toBe('/materialien');
    expect(f.stufen[4].pfad).toBe('/materialien?stufe=elem&stufe=fortbildung');
  });
  it('zählt die Fach-Facette in fester Reihenfolge', () => {
    const mitFaechern = [...materialien, ...faecherBeispiele.map(materialAusEvent)];
    const f = facettenBilden(mitFaechern, filter({ faecher: ['katholisch'] }));
    expect(f.faecher.map((o) => [o.key, o.anzahl])).toEqual([
      ['evangelisch', 8], ['katholisch', 1], ['islamisch', 0], ['juedisch', 0], ['alevitisch', 0], ['allgemein', 1]
    ]);
    expect(f.faecher[1]).toMatchObject({ aktiv: true, pfad: '/materialien' });
    expect(f.faecher[5].pfad).toBe('/materialien?fach=katholisch&fach=allgemein');
  });
  it('zeigt höchstens zwölf Schlagworte, aktive zuerst, dann nach Häufigkeit', () => {
    const viele = Array.from({ length: 20 }, (_, i) => ({ ...materialien[0], id: `m${i}`, themen: [`w${i}`, 'gemeinsam'] }));
    const f = facettenBilden(viele, filter({ schlagworte: ['w19'] }));
    expect(f.schlagworte).toHaveLength(12);
    expect(f.schlagworte[0]).toMatchObject({ key: 'w19', aktiv: true, anzahl: 1 });
    // ohne die eigene Facette gezählt: „gemeinsam“ steht in allen 20
    expect(f.schlagworte[1]).toMatchObject({ key: 'gemeinsam', anzahl: 20, aktiv: false });
  });
});

describe('sortieren', () => {
  it('empfohlen: Bild zählt doppelt, Lizenz einfach, dann neueste zuerst', () => {
    const namen = sortieren(materialien, 'empfohlen').map((m) => m.name);
    expect(namen[0]).toBe('Zwischen Jericho und Jerusalem'); // Bild und Lizenz
    // Punktgleichstand (nur Bild): nach Datum, neueste zuerst
    expect(namen.slice(1, 5)).toEqual([
      'Religionen und miteinander leben in Deutschland - jetzt versteh ich das! (Arbeitsheft)',
      'EKD: Erntedankfest', 'Ein frischer Geist weht', 'Flüchtlinge schützen'
    ]);
    expect(namen.slice(5)).toEqual(['Jenseits des Wissens', 'Berufsorientierung']);
  });
  it('neu sortiert nach datePublished/dateCreated, nicht nach der Importzeit des Events', () => {
    expect(sortieren(materialien, 'neu').map((m) => m.datum)).toEqual(
      ['2024-12-08', '2021-01-01', '2020-07-21', '2017-08-13', '2017-05-15', '2017-05-11', '2017-01-01']
    );
  });
  it('titel und anbieter nach deutscher Sortierung', () => {
    const titel = sortieren(materialien, 'titel').map((m) => m.name);
    expect(titel[0]).toBe('Berufsorientierung');
    expect(titel[6]).toBe('Zwischen Jericho und Jerusalem');
    expect(sortieren(materialien, 'anbieter').map((m) => m.herkunft).slice(0, 2)).toEqual(['EKD', 'Evangelisch-Lutherische Kirche in Bayern']);
    expect(SORTIERUNGEN.map((s) => s.key)).toEqual(['empfohlen', 'neu', 'titel', 'anbieter']);
  });
  it('verändert die Eingabe nicht', () => {
    const kopie = [...materialien];
    sortieren(materialien, 'titel');
    expect(materialien).toEqual(kopie);
  });
});

describe('aktiveFilter', () => {
  it('liefert je aktivem Wert eine Pille mit Entfernen-Pfad', () => {
    expect(aktiveFilter(filter({ q: 'Ostern', stufen: ['sek1'], typen: ['video'], schlagworte: ['kita'], seite: 2 }))).toEqual([
      { art: 'q', label: '„Ostern“', entfernenPfad: '/materialien?stufe=sek1&typ=video&t=kita' },
      { art: 'typ', label: 'Video', entfernenPfad: '/materialien?q=Ostern&stufe=sek1&t=kita' },
      { art: 'stufe', label: 'Sekundarstufe I', entfernenPfad: '/materialien?q=Ostern&typ=video&t=kita' },
      { art: 't', label: 'kita', entfernenPfad: '/materialien?q=Ostern&stufe=sek1&typ=video' }
    ]);
    expect(aktiveFilter(filter({ faecher: ['katholisch'] }))).toEqual([
      { art: 'fach', label: 'Katholische Religionslehre', entfernenPfad: '/materialien' }
    ]);
    expect(aktiveFilter(filter())).toEqual([]);
  });
});

describe('seitenBilden', () => {
  it('teilt Treffer in Seiten und zieht die Seite auf den gültigen Bereich', () => {
    expect(seitenBilden(7, filter())).toEqual({ aktuell: 1, anzahl: 1, von: 1, bis: 7, vorPfad: null, weiterPfad: null });
    const s = seitenBilden(50, filter({ q: 'x', seite: 2 }));
    expect(s).toMatchObject({ aktuell: 2, anzahl: 3, von: 25, bis: 48, vorPfad: '/materialien?q=x', weiterPfad: '/materialien?q=x&seite=3' });
    expect(seitenBilden(50, filter({ seite: 99 })).aktuell).toBe(3);
    expect(seitenBilden(0, filter())).toMatchObject({ aktuell: 1, anzahl: 1, von: 0, bis: 0 });
  });
});

describe('listeLaden', () => {
  const inhalt = { ...leererInhalt(), materialien: beispiele };
  it('liefert Karten sortiert mit Icon, Cover-Farben, Facetten, Sortierungen und Seiten', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays });
    expect(daten.karten).toHaveLength(7);
    expect(daten.treffer).toBe(7);
    expect(daten.gesamt).toBe(7);
    expect(daten.karten[0].material.name).toBe('Zwischen Jericho und Jerusalem');
    expect(daten.karten[0].icon).toBe('notebook');
    expect(daten.karten[0].cover.ink).toMatch(/^#/);
    expect(daten.leerstand).toBeNull();
    expect(daten.pillen).toEqual([]);
    expect(daten.facetten.typen).toHaveLength(8);
    expect(daten.seiten.anzahl).toBe(1);
    expect(daten.sortierungen.find((s) => s.aktiv)?.key).toBe('empfohlen');
    expect(daten.sortierungen.find((s) => s.key === 'titel')?.pfad).toBe('/materialien?sort=titel');
  });
  it('wendet Filter und Sortierung an und behält gesamt', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: filter({ q: 'pfingsten', sortierung: 'titel' }) });
    expect(daten.karten).toHaveLength(1);
    expect(daten.treffer).toBe(1);
    expect(daten.gesamt).toBe(7);
    expect(daten.pillen[0].label).toBe('„pfingsten“');
    expect(daten.sortierungen.find((s) => s.aktiv)?.key).toBe('titel');
  });
  it('blättert: Seite 2 zeigt den Rest, Sortier- und Facettenlinks springen auf Seite 1', () => {
    const viele = Array.from({ length: SEITENGROESSE_LISTE + 6 }, (_, i) => ({
      ...beispiele[0], id: String(i).padStart(64, 'a'), tags: beispiele[0].tags.map((t) => (t[0] === 'd' ? ['d', `https://x.example/${i}`] : t))
    }));
    const daten = listeLaden({ inhalt: { ...leererInhalt(), materialien: viele }, fehlschlag: null, relays, filter: filter({ seite: 2 }) });
    expect(daten.treffer).toBe(30);
    expect(daten.karten).toHaveLength(6);
    expect(daten.seiten).toMatchObject({ aktuell: 2, anzahl: 2, von: 25, bis: 30, vorPfad: '/materialien', weiterPfad: null });
    expect(daten.sortierungen.find((s) => s.key === 'neu')?.pfad).toBe('/materialien?sort=neu');
    expect(daten.facetten.typen.find((o) => o.key === 'plan')?.pfad).toBe('/materialien?typ=plan');
  });
  it('bereitet die Materialien je Spiegelstand nur einmal auf', () => {
    const a = listeLaden({ inhalt, fehlschlag: null, relays });
    const b = listeLaden({ inhalt, fehlschlag: null, relays, filter: filter({ sortierung: 'titel' }) });
    expect(a.karten[0].material).toBe(b.karten.find((k) => k.material.id === a.karten[0].material.id)?.material);
  });

});

describe('listeLaden mit Relay-Suche (ADR-0005)', () => {
  const inhalt = { ...leererInhalt(), materialien: beispiele };
  const [arbeitsheft, , erntedank, geist] = beispiele;
  /** @param {import('../services/spiegel.js').Event[]} events */
  const suche = (events, grund = /** @type {import('../services/relay.js').Abfragegrund} */ (null)) => ({ events, gefragteRelays: relays, grund });

  it('nimmt bei Suchtext die Relay-Treffer in Relevanz-Reihenfolge als Grundmenge', () => {
    const g = grundmengeBilden(inhalt, filter({ q: 'geist' }), suche([geist, erntedank]));
    expect(g.quelle).toBe('relay');
    expect(g.textGefiltert).toBe(true);
    expect(g.materialien.map((m) => m.name)).toEqual(['Ein frischer Geist weht', 'EKD: Erntedankfest']);
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: filter({ q: 'geist' }), suche: suche([geist, erntedank]) });
    expect(daten.karten.map((k) => k.material.name)).toEqual(['Ein frischer Geist weht', 'EKD: Erntedankfest']);
    expect(daten.treffer).toBe(2);
    expect(daten.gesamt).toBe(7);
    expect(daten.suche).toEqual({ quelle: 'relay', hinweis: null });
    expect(daten.sortierungen[0]).toMatchObject({ key: 'empfohlen', label: 'Relevanz', aktiv: true });
  });

  it('Facetten und andere Sortierungen greifen auf die Relay-Treffer', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: filter({ q: 'x', typen: ['video'] }), suche: suche([erntedank, geist, arbeitsheft]) });
    expect(daten.karten.map((k) => k.material.name)).toEqual(['Ein frischer Geist weht']);
    expect(daten.facetten.typen.find((o) => o.key === 'plan')?.anzahl).toBe(2);
    expect(daten.facetten.stufen.find((o) => o.key === 'unbekannt')?.anzahl).toBe(0);
    const titel = listeLaden({ inhalt, fehlschlag: null, relays, filter: filter({ q: 'x', sortierung: 'titel' }), suche: suche([erntedank, geist, arbeitsheft]) });
    expect(titel.karten.map((k) => k.material.name)[0]).toBe('Ein frischer Geist weht');
  });

  it('Facetten-Links behalten den Suchtext, auch wenn die Treffer vom Relay kommen', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: filter({ q: 'geist' }), suche: suche([geist, erntedank]) });
    expect(daten.facetten.typen.find((o) => o.key === 'video')?.pfad).toBe('/materialien?q=geist&typ=video');
    expect(daten.facetten.faecher.find((o) => o.key === 'evangelisch')?.pfad).toBe('/materialien?q=geist&fach=evangelisch');
  });

  it('fällt ohne erreichbares Relay auf die Wortsuche im Spiegel zurück und sagt das', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: filter({ q: 'erntedank' }), suche: suche([], 'kein-relay-erreichbar') });
    expect(daten.karten.map((k) => k.material.name)).toEqual(['EKD: Erntedankfest']);
    expect(daten.suche.quelle).toBe('spiegel');
    expect(daten.suche.hinweis).toMatch(/Kein Relay war erreichbar.*Spiegel/);
    expect(daten.sortierungen[0].label).toBe('Empfohlen');
  });

  it('ohne Suchtext bleibt alles im Spiegel, auch wenn ein Suchergebnis mitkommt', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: filter(), suche: suche([geist]) });
    expect(daten.treffer).toBe(7);
    expect(daten.suche).toEqual({ quelle: 'spiegel', hinweis: null });
  });
});
