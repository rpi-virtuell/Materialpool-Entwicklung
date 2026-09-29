/**
 * Komponenten werden mit svelte/server gerendert — dieselbe Darstellung,
 * die der Server ausliefert. Kein DOM-Nachbau.
 */
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import beispiele from './fixtures/amb-beispiele.json';
import Detail from '../src/lib/komponenten/Detail.svelte';
import Fusszeile from '../src/lib/komponenten/Fusszeile.svelte';
import Icon, { ICON_NAMEN } from '../src/lib/komponenten/Icon.svelte';
import Kopfzeile from '../src/lib/komponenten/Kopfzeile.svelte';
import Startseite from '../src/lib/komponenten/startseite/Startseite.svelte';
import { ZIELGRUPPEN } from '../src/lib/komponenten/startseite/HeroZielgruppe.svelte';
import Uebersicht from '../src/lib/komponenten/Uebersicht.svelte';
import { materialAusEvent } from '../src/lib/models/material.js';
import { TYPEN } from '../src/lib/models/typen.js';
import { startseiteLaden } from '../src/lib/routen/startseite.js';
import { listeLaden } from '../src/lib/routen/uebersicht.js';
import { leererInhalt } from '../src/lib/services/spiegel.js';

const relays = ['wss://amb-relay.edufeed.org/'];
const materialien = beispiele.map(materialAusEvent);
const inhalt = { ...leererInhalt(), materialien: beispiele };
const september = new Date(2026, 8, 29);

describe('Icon', () => {
  it('rendert Inline-SVG für jedes Typ-Icon und fällt auf „file“ zurück', () => {
    for (const typ of Object.values(TYPEN)) expect(ICON_NAMEN).toContain(typ.icon);
    expect(render(Icon, { props: { name: 'search' } }).body).toMatch(/<svg[^>]*>/);
    expect(render(Icon, { props: { name: 'gibtesnicht' } }).body).toContain('icon-tabler-file"');
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
  it('rendert ohne Daten sofort: Kopf, Suche, Kacheln, Hinweis „wird geladen“', () => {
    const daten = startseiteLaden({ inhalt: leererInhalt(), fehlschlag: null, relays, heute: september });
    const { body } = render(Startseite, { props: daten });
    expect(body).toContain('Materialpool Religion');
    for (const z of ZIELGRUPPEN) expect(body).toContain(z);
    expect(body).toMatch(/<form[^>]*class="hero-search[^>]*action="\/materialien"[^>]*method="get"/);
    expect(body).toContain('Nach Bildungsstufe einsteigen');
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
    expect(body.indexOf('>Erntedank<')).toBeLessThan(body.indexOf('>abraham<'));
    expect(body).toContain('href="/materialien?q=Erntedank"');
    expect(body).toContain('Aktuelle Empfehlung');
    expect(body).toContain('Erntedank feiern in der Kita');
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
    expect(body).toContain('Abraham — eine kindgerechte Erzählung');
    expect(body).toContain(`href="${materialien[0].pfad}"`);
    expect(body).toContain('4 Treffer');
    expect(body).toContain('Unterrichtsplanung');
    expect(body).toContain('bbs-beispiel.de · Berufsbildung');
    expect(body).toContain('class="material-grid');
    expect((body.match(/class="material-card/g) ?? []).length).toBe(4);
    expect(body).toContain('loading="lazy"');
  });

  it('zeigt aktive Filter als entfernbare Pillen und hält die Stufe im Formular', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: { q: 'abraham', stufe: 'elem' } });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toContain('1 Treffer von 4');
    expect(body).toContain('href="/materialien?stufe=elem"');
    expect(body).toContain('href="/materialien?q=abraham"');
    expect(body).toMatch(/name="stufe"[^>]*value="elem"/);
    expect(body).toMatch(/name="q"[^>]*value="abraham"/);
  });

  it('erklärt „keine Treffer“ mit den aktiven Filtern', () => {
    const daten = listeLaden({ inhalt, fehlschlag: null, relays, filter: { q: 'gibtesnicht', stufe: 'bbs' } });
    const { body } = render(Uebersicht, { props: daten });
    expect(body).toContain('Dazu passt gerade nichts');
    expect(body).toContain('„gibtesnicht“ und Berufsbildung');
    expect(body).toContain('Filter aufheben');
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
    const { body } = render(Detail, { props: { material: materialien[0], relays: ['wss://eins/'] } });
    expect(body).toContain('https://material.rpi-virtuell.de/material/abraham-erzaehlung/');
    expect(body).toContain('rel="license"');
    expect(body).toContain('Religion');
    expect(body).toContain('Beispielautorin · rpi-virtuell');
    expect(body).toContain('wss://eins/');
    expect(body).toContain(`${materialien[0].pfad}/json`);
  });
});
