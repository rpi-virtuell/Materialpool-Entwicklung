/**
 * Komponenten werden mit svelte/server gerendert — dieselbe Darstellung,
 * die der Server ausliefert. Kein DOM-Nachbau.
 */
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import beispiele from './fixtures/amb-beispiele.json';
import Detail from '../src/lib/komponenten/Detail.svelte';
import Farbschalter from '../src/lib/komponenten/Farbschalter.svelte';
import Fusszeile from '../src/lib/komponenten/Fusszeile.svelte';
import Icon, { ICON_NAMEN } from '../src/lib/komponenten/Icon.svelte';
import IconSprite from '../src/lib/komponenten/IconSprite.svelte';
import Karte from '../src/lib/komponenten/Karte.svelte';
import Konto from '../src/lib/komponenten/Konto.svelte';
import Merkliste from '../src/lib/komponenten/Merkliste.svelte';
import { karteMitMerken, merkSchluessel } from '../src/lib/routen/merkliste.js';
import Kopfzeile from '../src/lib/komponenten/Kopfzeile.svelte';
import { LEERES_KONTO } from '../src/lib/models/konto.js';
import { kontoSeite } from '../src/lib/routen/konto.js';
import Startseite from '../src/lib/komponenten/startseite/Startseite.svelte';
import { ZIELGRUPPEN } from '../src/lib/komponenten/startseite/HeroZielgruppe.svelte';
import Uebersicht from '../src/lib/komponenten/Uebersicht.svelte';
import { materialAusEvent } from '../src/lib/models/material.js';
import { TYPEN } from '../src/lib/models/typen.js';
import { farbschalterBilden } from '../src/lib/routen/farbschalter.js';
import { frageHinweis, frageUmleitung } from '../src/lib/routen/frage.js';
import { startseiteLaden } from '../src/lib/routen/startseite.js';
import { filterLesen, leererFilter, listeLaden } from '../src/lib/routen/uebersicht.js';
import { leererInhalt } from '../src/lib/services/spiegel.js';

const relays = ['wss://amb-relay.edufeed.org/'];
const materialien = beispiele.map(materialAusEvent);
const inhalt = { ...leererInhalt(), materialien: beispiele };
const september = new Date(2026, 8, 29);

describe('Farbschalter', () => {
  it('ist ein GET-Formular auf die aktuelle Seite mit Hex- und Farbfeld, ohne JavaScript', () => {
    const url = new URL('http://x/materialien?stufe=elem&primaryColor=%23c1272d');
    const { body } = render(Farbschalter, { props: { schalter: farbschalterBilden(url, '#c1272d') } });
    expect(body).toMatch(/<form[^>]*class="farbschalter[^>]*action="\/materialien"[^>]*method="get"/);
    expect(body).toMatch(/type="hidden" name="stufe" value="elem"/);
    expect(body).toMatch(/type="text" name="primaryColor" value="#c1272d"/);
    expect(body).toMatch(/type="color" name="primaryColor" value="#c1272d"/);
    expect(body).toContain('Übernehmen');
    expect(body).toContain('href="/materialien?stufe=elem&amp;primaryColor="');
    expect(body).not.toContain('<script');
  });
  it('bietet „Zurücksetzen“ nur an, wenn eine Farbe gesetzt ist', () => {
    const { body } = render(Farbschalter, { props: { schalter: farbschalterBilden(new URL('http://x/'), null) } });
    expect(body).toContain('value="#1d5a8c"');
    expect(body).not.toContain('Zurücksetzen');
  });
});

describe('Icon', () => {
  it('verweist je Icon auf ein Symbol im Sprite und fällt auf „file“ zurück', () => {
    for (const typ of Object.values(TYPEN)) expect(ICON_NAMEN).toContain(typ.icon);
    expect(render(Icon, { props: { name: 'search' } }).body).toContain('<use href="#ti-search"');
    expect(render(Icon, { props: { name: 'gibtesnicht' } }).body).toContain('<use href="#ti-file"');
  });

  it('das Sprite hält je Icon ein Symbol mit Pfaden, ohne verschachteltes <svg>', () => {
    const { body } = render(IconSprite);
    for (const name of ICON_NAMEN) expect(body).toContain(`<symbol id="ti-${name}"`);
    expect(body).toContain('<path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"');
    expect((body.match(/<svg/g) ?? []).length).toBe(1);
  });
});

describe('Kopfzeile', () => {
  const abgemeldet = { angemeldet: false, vorname: '', stoebernPfad: '/materialien' };
  it('verlinkt Start, Liste und Merkliste (ADR-0008)', () => {
    const { body } = render(Kopfzeile, { props: { aktiv: 'liste', kopf: abgemeldet } });
    expect(body).toContain('class="logo');
    expect(body).toContain('href="/"');
    expect(body).toMatch(/href="\/materialien"[^>]*class="[^"]*active/);
    expect(body).toContain('Stöbern');
    expect(body).toMatch(/href="\/merkliste"[^>]*aria-label="Gemerkt"/);
  });
  it('bietet „Anmelden“ an und zeigt angemeldet den Vornamen (ADR-0006)', () => {
    expect(render(Kopfzeile, { props: { aktiv: null, kopf: abgemeldet } }).body).toMatch(/href="\/konto"[^>]*aria-label="Anmelden"/);
    const { body } = render(Kopfzeile, { props: { aktiv: 'konto', kopf: { angemeldet: true, vorname: 'Christina', stoebernPfad: '/materialien?profil=1' } } });
    expect(body).toMatch(/href="\/konto"[^>]*aria-label="Profil von Christina"/);
    expect(body).toMatch(/<span[^>]*>Christina<\/span>/);
    expect(body).toContain('href="/materialien?profil=1"');
  });
});

describe('Merkliste (ADR-0008)', () => {
  const erntedank = materialAusEvent(beispiele[2]);
  it('Karte: Lesezeichen als POST-Formular, das an die Karte zurückführt', () => {
    const karte = karteMitMerken(erntedank, []);
    const { body } = render(Karte, { props: { karte, zurueck: '/materialien?stufe=elem' } });
    expect(body).toContain(`id="k-${karte.merkSchluessel}"`);
    expect(body).toMatch(/<form[^>]*class="merken[^>]*method="post"[^>]*action="\/merkliste\?\/umschalten"/);
    expect(body).toContain(`name="zurueck" value="/materialien?stufe=elem#k-${karte.merkSchluessel}"`);
    expect(body).toContain('aria-label="„EKD: Erntedankfest“ merken"');
    expect(body).toContain('aria-pressed="false"');
  });
  it('Karte: gemerkt gefüllt; ohne zurueck kein Lesezeichen', () => {
    const karte = karteMitMerken(erntedank, [merkSchluessel(erntedank)]);
    const gemerkt = render(Karte, { props: { karte, zurueck: '/' } }).body;
    expect(gemerkt).toContain('#ti-bookmark-gefuellt');
    expect(gemerkt).toContain('aus der Merkliste entfernen');
    expect(render(Karte, { props: { karte } }).body).not.toContain('class="merken');
  });
  it('Seite: leer mit Erklärung, sonst die Karten und was fehlt', () => {
    expect(render(Merkliste, { props: { karten: [], fehlend: 0 } }).body).toContain('Noch nichts gemerkt');
    const { body } = render(Merkliste, { props: { karten: [karteMitMerken(erntedank, [])], fehlend: 2 } });
    expect(body).toContain('1 Material');
    expect(body).toContain('2 sind nicht mehr im Bestand');
    expect(body).toContain('name="zurueck" value="/merkliste#k-');
  });
  it('Detailseite: „Merken“ bzw. „Gemerkt“', () => {
    const merken = { schluessel: merkSchluessel(erntedank), gemerkt: true };
    const { body } = render(Detail, { props: { material: erntedank, relays, merken } });
    expect(body).toMatch(/action="\/merkliste\?\/umschalten"/);
    expect(body).toContain(`name="zurueck" value="${erntedank.pfad}"`);
    expect(body).toMatch(/aria-pressed="true"[^>]*>.*Gemerkt/s);
  });
});

describe('Konto', () => {
  it('abgemeldet: nur das Namensfeld, als POST-Formular', () => {
    const { body } = render(Konto, { props: { seite: kontoSeite(LEERES_KONTO), gespeichert: false, fehler: null } });
    expect(body).toContain('<h1 class="svelte-');
    expect(body).toContain('Anmelden</h1>');
    expect(body).toMatch(/<form[^>]*method="post"[^>]*action="\?\/anmelden"/);
    expect(body).toMatch(/name="name"[^>]*required/);
    expect(body).toContain('Deine Angaben bleiben nur in diesem Browser.');
  });
  it('angemeldet: Profil mit Bereichen und Fach, Speichern und Abmelden', () => {
    /** @type {import('../src/lib/models/konto.js').Konto} */
    const k = { ...LEERES_KONTO, angemeldet: true, name: 'Christina', bereiche: ['sek1'], faecher: ['katholisch'] };
    const { body } = render(Konto, { props: { seite: kontoSeite(k), gespeichert: true, fehler: null } });
    expect(body).toContain('Angemeldet als <strong>Christina</strong>');
    expect(body).toMatch(/action="\?\/abmelden"/);
    expect(body).toMatch(/<form[^>]*class="profil-form[^>]*method="post"[^>]*action="\?\/speichern"/);
    expect(body).toMatch(/name="bereich" value="sek1"[^>]*checked/);
    expect(body).toMatch(/name="fach" value="katholisch"[^>]*checked/);
    expect(body).toContain('Welches Fach unterrichtest du?');
    expect(body).toContain('Gespeichert.');
    expect(body).toContain('Beim Stöbern stellen wir dir vorab ein: Sekundarstufe I, Katholische Religionslehre.');
    expect(body).toContain('href="/materialien?profil=1"');
  });
});

describe('Fusszeile', () => {
  it('nennt den Spiegelstand und das Alter bei Fehlschlag', () => {
    const stand = { zeitpunkt: '2026-09-29T06:00:00Z', anzahl: 4, veraltet: true, relays };
    const { body } = render(Fusszeile, { props: { spiegelstand: stand } });
    expect(body).toContain('4 Materialien');
    expect(body).toContain('gescheitert');
    expect(body).toContain('Comenius-Instituts');
    expect(body).not.toContain('live');
  });
});

describe('Startseite', () => {
  it('mischt die Zielgruppen: Verwandtes steht auch über den Umlauf nie nebeneinander', () => {
    const verwandt = [['für die Schule', 'für Schulgottesdienste'], ['für die Konfi-Arbeit', 'für die Jugendarbeit']];
    const n = ZIELGRUPPEN.length;
    for (const [a, b] of verwandt) {
      const abstand = Math.abs(ZIELGRUPPEN.indexOf(a) - ZIELGRUPPEN.indexOf(b));
      expect(Math.min(abstand, n - abstand), `${a} / ${b}`).toBeGreaterThan(1);
    }
  });

  it('rendert ohne Daten sofort: Kopf, Suche, Kacheln, Hinweis „wird geladen“', () => {
    const daten = startseiteLaden({ inhalt: leererInhalt(), fehlschlag: null, relays, heute: september });
    const { body } = render(Startseite, { props: daten });
    expect(body).toContain('Materialpool Religion');
    for (const z of ZIELGRUPPEN) expect(body).toContain(z);
    expect(body).toMatch(/<form[^>]*class="hero-search[^>]*action="\/materialien"[^>]*method="get"/);
    expect(body).toContain('Nach Alter einsteigen');
    expect(body).toContain('Junge Erwachsene');
    expect((body.match(/class="stufe-kachel /g) ?? []).length).toBe(4);
    expect(body).toContain('href="/materialien?stufe=bbs"');
    expect(body).toContain('Materialien werden geladen …');
    expect(body).not.toContain('status-warn');
    expect(body).not.toContain('themen-row');
    expect(body).toContain('Alle Materialien durchstöbern');
  });

  it('zeigt mit Daten Themen-Chips (saisonale zuerst) und die Empfehlung, keinen Hinweis', () => {
    const daten = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september });
    const { body } = render(Startseite, { props: daten });
    expect(body).toContain('Beliebte Themen');
    expect(body.indexOf('>Erntedank<')).toBeLessThan(body.indexOf('>Abrahamitische Religionen<'));
    expect(body).toContain('href="/materialien?q=Erntedank"');
    expect(body).toContain('Aktuelle Empfehlung');
    expect(body).toContain('EKD: Erntedankfest');
    expect(body).toMatch(/<img src="https:\/\/www\.ekd\.de\/[^"]+" alt=""/);
    expect(body).toMatch(/--cover-ink:#[0-9a-f]{6};--cover-tint:#[0-9A-F]{6}/);
    expect(body).not.toContain('status-hint');
  });

  it('warnt bei Fehlschlag, Kacheln und Suche bleiben', () => {
    const fehlschlag = { zeitpunkt: 'x', gefragteRelays: relays, grund: /** @type {const} */ ('kein-relay-erreichbar') };
    const daten = startseiteLaden({ inhalt: leererInhalt(), fehlschlag, relays, heute: september });
    const { body } = render(Startseite, { props: daten });
    expect(body).toMatch(/class="status-hint[^"]*status-warn/);
    expect(body).toContain('Kein Relay war erreichbar');
    expect((body.match(/class="stufe-kachel /g) ?? []).length).toBe(4);
    expect(body).toContain('hero-search');
  });

  it('setzt Kachelfarben als Inline-Variablen mit Kontrasttext', () => {
    const daten = startseiteLaden({ inhalt, fehlschlag: null, relays, heute: september });
    const { body } = render(Startseite, { props: daten });
    expect(body).toContain('--kachel-color:#7FB0D9;--kachel-text:#16181b');
    expect(body).toContain('--kachel-color:#1D5A8C;--kachel-text:#fff');
  });
});

describe('Uebersicht (Liste)', () => {
  it('zeigt jede Karte mit Titel, Link, Art und Herkunft', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toContain('Zwischen Jericho und Jerusalem');
    expect(body).toContain(`href="${materialien[0].pfad}"`);
    expect(body).toContain('7 Treffer');
    expect(body).toContain('Unterrichtsplanung');
    expect(body).toContain('EKD · Elementar- &amp; Primarbereich');
    expect(body).toContain('class="material-grid');
    expect((body.match(/class="material-card/g) ?? []).length).toBe(7);
    expect(body).toContain('loading="lazy"');
    expect(body).not.toContain('aria-label="Seiten"');
  });

  it('blättert mit Zurück/Weiter, wenn es mehr als eine Seite gibt', () => {
    const viele = Array.from({ length: 30 }, (_, i) => ({
      ...beispiele[0], id: String(i).padStart(64, 'a'), tags: beispiele[0].tags.map((t) => (t[0] === 'd' ? ['d', `https://x.example/${i}`] : t))
    }));
    const daten = listeLaden({ inhalt: { ...leererInhalt(), materialien: viele }, fehlschlag: null, relays });
    const { body } = render(Uebersicht, { props: daten });
    expect((body.match(/class="material-card/g) ?? []).length).toBe(24);
    expect(body).toContain('Seite 1 von 2 · Treffer 1–24');
    expect(body).toMatch(/href="\/materialien\?seite=2" rel="next"/);
  });

  it('zeigt aktive Filter als entfernbare Pillen und hält Facetten und Sortierung im Formular', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: { ...leererFilter(), q: 'jericho', stufen: ['elem'], sortierung: 'titel' } });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toContain('1 Treffer von 7');
    expect(body).toContain('href="/materialien?stufe=elem&amp;sort=titel"');
    expect(body).toContain('href="/materialien?q=jericho&amp;sort=titel"');
    expect(body).toMatch(/name="stufe"[^>]*value="elem"/);
    expect(body).toMatch(/name="sort"[^>]*value="titel"/);
    expect(body).toMatch(/name="q"[^>]*value="jericho"/);
  });

  it('zeigt bei einer Frage in eigenen Worten, wie sie verstanden wurde, mit Rückgängig', () => {
    const ziel = /** @type {string} */ (frageUmleitung(new URLSearchParams('q=Erntedank+f%C3%BCr+Kinder+in+der+Kita+bitte')));
    const params = new URL(`http://x${ziel}`).searchParams;
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: filterLesen(params), frage: frageHinweis(params) });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toContain('„Erntedank für Kinder in der Kita bitte“ haben wir so verstanden:');
    expect(body).toContain('„Kinder“ <span aria-label="wird zu">→</span> Elementar- &amp; Primarbereich');
    expect(body).toContain('Thema: <strong>Erntedank</strong>');
    expect(body).toMatch(/class="frage-zurueck[^"]*" href="\/materialien\?q=Erntedank\+f%C3%BCr\+Kinder[^"]*wortlaut=/);
    expect(body).toMatch(/name="q"[^>]*value="Erntedank"/);
  });

  it('hält den Wortlaut nach „Rückgängig“ im Formular, damit er nicht wieder gedeutet wird', () => {
    const satz = 'Erntedank für Kinder in der Kita bitte';
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: { ...leererFilter(), q: satz, wortlaut: satz } });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toMatch(/type="hidden" name="wortlaut" value="Erntedank für Kinder in der Kita bitte"/);
    expect(body).not.toContain('haben wir so verstanden');
  });

  it('stellt die Facetten als Spalte vor die Treffer und kürzt Schlagworte auf sechs plus „mehr …“', () => {
    const { body } = render(Uebersicht, { props: listeLaden({ inhalt, fehlschlag: null, relays }) });
    expect(body).toMatch(/<aside class="liste-filter[^"]*" aria-label="Filter">/);
    expect(body.indexOf('class="liste-filter')).toBeLessThan(body.indexOf('class="liste-ergebnis'));
    const schlagworte = body.slice(body.indexOf('>Schlagworte</legend>'));
    const vorMehr = schlagworte.slice(0, schlagworte.indexOf('<details class="facette-mehr'));
    expect((vorMehr.match(/class="chip[ "]/g) ?? []).length).toBe(6);
    expect(schlagworte).toContain('<summary class="svelte-');
    expect(schlagworte).toContain('mehr …</summary>');
  });

  it('rendert Facetten als Link-Chips mit Zählern, aktive gedrückt, leere ohne Link', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: { ...leererFilter(), stufen: ['elem'] } });
    const { body } = render(Uebersicht, { props: daten });
    for (const name of ['Fach', 'Materialart', 'Bildungsstufe', 'Schlagworte']) expect(body).toMatch(new RegExp(`<legend[^>]*>${name}</legend>`));
    expect(body.indexOf('>Fach</legend>')).toBeLessThan(body.indexOf('>Materialart</legend>'));
    expect(body).toMatch(/class="chip[^"]*is-aktiv[^"]*" href="\/materialien" aria-current="true"/);
    expect(body).toMatch(/class="chip is-leer[^"]*" aria-disabled="true">Video/);
    expect(body).toContain('href="/materialien?stufe=elem&amp;typ=plan"');
    expect(body).toContain('href="/materialien?stufe=elem&amp;t=Erntedank"');
    expect(body).toContain('>Fortbildung <span');
  });

  it('rendert die Sortierung als Link-Gruppe mit aktivem Eintrag', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: { ...leererFilter(), sortierung: 'neu' } });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toMatch(/aria-label="Sortierung"/);
    expect(body).toMatch(/href="\/materialien\?sort=neu" aria-current="true" class="[^"]*is-aktiv[^"]*"/);
    expect(body).toContain('href="/materialien?sort=titel"');
    expect(body).toContain('href="/materialien"');
  });

  it('erklärt „keine Treffer“ mit den aktiven Filtern', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: { ...leererFilter(), q: 'gibtesnicht', stufen: ['hochschule'] } });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toContain('Dazu passt gerade nichts');
    expect(body).toContain('„gibtesnicht“ und Hochschule');
    expect(body).toContain('Filter aufheben');
  });

  it('sagt, wenn die Relay-Suche nicht lief und der Spiegel einspringt', () => {
    const suche = { events: [], gefragteRelays: relays, grund: /** @type {const} */ ('kein-relay-erreichbar') };
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: { ...leererFilter(), q: 'erntedank' }, suche });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toMatch(/class="status-hint status-warn suche-hinweis[^"]*">Kein Relay war erreichbar/);
    expect(body).toContain('EKD: Erntedankfest');
  });

  it('nennt die Standardsortierung bei Relay-Treffern „Relevanz“', () => {
    const suche = { events: [beispiele[3], beispiele[2]], gefragteRelays: relays, grund: null };
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: { ...leererFilter(), q: 'geist' }, suche });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toContain('>Relevanz</a>');
    expect(body).not.toContain('suche-hinweis');
  });

  it('erklärt eine leere Liste statt sie stumm zu lassen', () => {
    const daten = listeLaden({ inhalt: leererInhalt(), fehlschlag: null, relays });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toContain('noch keinen Stand');
    expect(body).not.toContain('<article');
  });
});

describe('Detail', () => {
  it('nennt Ressource, Lizenz, Begriffe, Herkunft und die Entwickleransicht', () => {
    const jericho = materialien[6];
    const { body } = render(Detail, { props: { material: jericho, relays: ['wss://eins/'] } });
    expect(body).toContain('https://material.rpi-virtuell.de/material/zwischen-jericho-und-jerusalem/');
    expect(body).toContain('rel="license"');
    expect(body).toContain('CC BY-SA 4.0');
    expect(body).toContain('Religionslehre (evangelische)');
    expect(body).toContain('Horst Heller');
    expect(body).toContain('wss://eins/');
    expect(body).toContain(`${jericho.pfad}/json`);
  });
});
