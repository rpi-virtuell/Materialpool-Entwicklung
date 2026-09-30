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
import Kopfzeile from '../src/lib/komponenten/Kopfzeile.svelte';
import Startseite from '../src/lib/komponenten/startseite/Startseite.svelte';
import { ZIELGRUPPEN } from '../src/lib/komponenten/startseite/HeroZielgruppe.svelte';
import Uebersicht from '../src/lib/komponenten/Uebersicht.svelte';
import { materialAusEvent } from '../src/lib/models/material.js';
import { TYPEN } from '../src/lib/models/typen.js';
import { farbschalterBilden } from '../src/lib/routen/farbschalter.js';
import { startseiteLaden } from '../src/lib/routen/startseite.js';
import { leererFilter, listeLaden } from '../src/lib/routen/uebersicht.js';
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
  it('verlinkt Start und Liste, ohne Merkliste', () => {
    const { body } = render(Kopfzeile, { props: { aktiv: 'liste' } });
    expect(body).toContain('class="logo');
    expect(body).toContain('href="/"');
    expect(body).toMatch(/href="\/materialien"[^>]*class="[^"]*active/);
    expect(body).toContain('Stöbern');
    expect(body).not.toContain('Gemerkt');
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
