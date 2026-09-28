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
    const kennung = kennungAusD('https://material.rpi-virtuell.de/material/abraham-erzaehlung/');
    const treffer = materialLaden({ inhalt, kennung });
    expect(treffer?.material.name).toMatch(/Abraham/);
    expect(treffer?.relays).toEqual(['wss://eins/']);
  });
  it('liefert null für unbekannte und für kaputte Kennungen', () => {
    expect(materialLaden({ inhalt, kennung: kennungAusD('https://nix/') })).toBeNull();
    expect(eventFinden({ inhalt, kennung: '%E0%A4%A' })).toBeNull();
  });
  it('kennt ein Event ohne Herkunft (Stand aus der Datei) mit leerer Relay-Liste', () => {
    const treffer = eventFinden({ inhalt, kennung: kennungAusD('https://example.org/ohne-labels') });
    expect(treffer?.relays).toEqual([]);
  });
});
