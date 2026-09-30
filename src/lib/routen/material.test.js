import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { kennungAusD } from '../models/material.js';
import { leererInhalt } from '../services/spiegel.js';
import { eventFinden, materialLaden } from './material.js';

const inhalt = {
  ...leererInhalt(),
  materialien: beispiele,
  quellen: { [beispiele[0].id]: ['wss://eins/'] }
};

describe('materialLaden', () => {
  it('findet ein Material über die Kennung und nennt die Herkunft', () => {
    const treffer = materialLaden({ inhalt, d: 'https://material.rpi-virtuell.de/material/religionen-und-miteinander-leben-in-deutschland-jetzt-versteh-ich-das-arbeitsheft/' });
    expect(treffer?.material.name).toMatch(/Religionen und miteinander leben/);
    expect(treffer?.relays).toEqual(['wss://eins/']);
  });
  it('liefert null für unbekannte Kennungen', () => {
    expect(materialLaden({ inhalt, d: 'https://nix/' })).toBeNull();
    expect(eventFinden({ inhalt, d: '%E0%A4%A' })).toBeNull();
  });
  it('findet auch ein d mit %, weil SvelteKit die Kennung schon einmal dekodiert hat', () => {
    for (const d of ['https://example.org/a%20b', 'https://example.org/100%']) {
      const kopie = { ...beispiele[1], tags: beispiele[1].tags.map((t) => (t[0] === 'd' ? ['d', d] : t)) };
      const mitKopie = { ...inhalt, materialien: [kopie] };
      const param = decodeURIComponent(kennungAusD(d));
      expect(eventFinden({ inhalt: mitKopie, d: param })?.event).toBe(kopie);
    }
  });
  it('kennt ein Event ohne Herkunft (Stand aus der Datei) mit leerer Relay-Liste', () => {
    const treffer = eventFinden({ inhalt, d: 'https://material.rpi-virtuell.de/material/berufsorientierung/' });
    expect(treffer?.relays).toEqual([]);
  });
});
