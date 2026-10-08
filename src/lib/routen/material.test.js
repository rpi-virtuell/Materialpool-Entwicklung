import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import { kennungAusD } from '../models/material.js';
import { leererInhalt } from '../services/spiegel.js';
import { eventFinden, materialLaden, zurueckZiel } from './material.js';

const inhalt = {
  ...leererInhalt(),
  materialien: beispiele,
  quellen: { [beispiele[0].id]: ['wss://eins/'] }
};

describe('materialLaden', () => {
  it('findet ein Material über die Kennung und nennt die Herkunft', () => {
    const kennung = kennungAusD('https://material.rpi-virtuell.de/material/religionen-und-miteinander-leben-in-deutschland-jetzt-versteh-ich-das-arbeitsheft/');
    const treffer = materialLaden({ inhalt, kennung });
    expect(treffer?.material.name).toMatch(/Religionen und miteinander leben/);
    expect(treffer?.relays).toEqual(['wss://eins/']);
  });
  it('liefert null für unbekannte und für kaputte Kennungen', () => {
    expect(materialLaden({ inhalt, kennung: kennungAusD('https://nix/') })).toBeNull();
    expect(eventFinden({ inhalt, kennung: '%E0%A4%A' })).toBeNull();
  });
  it('bringt Cover-Farben und Typ-Icon mit, wie die Karte, von der man kommt', () => {
    const treffer = materialLaden({ inhalt, kennung: kennungAusD('https://material.rpi-virtuell.de/material/ekd-erntedankfest/') });
    expect(treffer?.icon).toBe('notebook');
    expect(treffer?.cover.ink).toMatch(/^#/);
    expect(treffer?.cover.tint).toMatch(/^#/);
  });
  it('kennt ein Event ohne Herkunft (Stand aus der Datei) mit leerer Relay-Liste', () => {
    const treffer = eventFinden({ inhalt, kennung: kennungAusD('https://material.rpi-virtuell.de/material/berufsorientierung/') });
    expect(treffer?.relays).toEqual([]);
  });
});

describe('zurueckZiel', () => {
  const origin = 'https://material.rpi-virtuell.net';
  const hier = '/m/https%3A%2F%2Fx%2F';
  it('führt zurück auf Liste, Merkliste oder Startseite, von der man kam — mit allen Filtern', () => {
    expect(zurueckZiel(`${origin}/materialien?stufe=elem&seite=2`, origin, hier)).toBe('/materialien?stufe=elem&seite=2');
    expect(zurueckZiel(`${origin}/merkliste`, origin, hier)).toBe('/merkliste');
    expect(zurueckZiel(`${origin}/`, origin, hier)).toBe('/');
  });
  it('sonst zur Liste: ohne Herkunft, von fremden Seiten, von sich selbst (nach dem Merken)', () => {
    expect(zurueckZiel(null, origin, hier)).toBe('/materialien');
    expect(zurueckZiel('https://boese.example/materialien', origin, hier)).toBe('/materialien');
    expect(zurueckZiel(`${origin}${hier}`, origin, hier)).toBe('/materialien');
    expect(zurueckZiel(`${origin}/konto`, origin, hier)).toBe('/materialien');
    expect(zurueckZiel('kaputt', origin, hier)).toBe('/materialien');
  });
});
