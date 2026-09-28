/**
 * Komponenten werden mit svelte/server gerendert — dieselbe Darstellung,
 * die der Server ausliefert. Kein DOM-Nachbau.
 */
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import beispiele from './fixtures/amb-beispiele.json';
import Detail from '../src/lib/komponenten/Detail.svelte';
import Uebersicht from '../src/lib/komponenten/Uebersicht.svelte';
import { materialAusEvent } from '../src/lib/models/material.js';

const materialien = beispiele.map(materialAusEvent);

describe('Uebersicht', () => {
  it('zeigt jede Karte mit Titel, Link und Lizenzkürzel', () => {
    const { body } = render(Uebersicht, { props: { materialien, leerstand: null } });
    expect(body).toContain('Abraham — eine kindgerechte Erzählung');
    expect(body).toContain(`href="${materialien[0].pfad}"`);
    expect(body).toContain('CC BY-SA 4.0');
    expect(body).toContain('Primarstufe');
    expect(body).toContain('2 Einträge');
  });

  it('erklärt eine leere Liste statt sie stumm zu lassen', () => {
    const { body } = render(Uebersicht, { props: { materialien: [], leerstand: 'Kein Relay war erreichbar.' } });
    expect(body).toContain('Kein Relay war erreichbar.');
    expect(body).not.toContain('<article');
  });
});

describe('Detail', () => {
  it('nennt Ressource, Lizenz, Begriffe und die Entwickleransicht', () => {
    const { body } = render(Detail, { props: { material: materialien[0], relays: ['wss://eins/'] } });
    expect(body).toContain('https://material.rpi-virtuell.de/material/abraham-erzaehlung/');
    expect(body).toContain('rel="license"');
    expect(body).toContain('Religion');
    expect(body).toContain('wss://eins/');
    expect(body).toContain(`${materialien[0].pfad}/json`);
  });
});
