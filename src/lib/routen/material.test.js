import { describe, expect, it } from 'vitest';
import beispiele from '../../../test/fixtures/amb-beispiele.json';
import faecher from '../../../test/fixtures/amb-faecher.json';
import { kennungAusD } from '../models/material.js';
import { leererInhalt } from '../services/spiegel.js';
import { materialienVon, materialImBestand } from './bestand.js';
import { eventFinden, materialLaden, vorzugWaehlen } from './material.js';

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

describe('Adresse (pubkey, d) — ADR-0008', () => {
  const echt = beispiele[1];
  const d = 'https://material.rpi-virtuell.de/material/berufsorientierung/';
  const fremderSchluessel = faecher[0].pubkey;
  /** Ein anderer Schlüssel publiziert dasselbe d — als veränderte Kopie eines echten Events. @param {number} verschiebung */
  const fremd = (verschiebung) => ({ ...echt, pubkey: fremderSchluessel, id: 'f'.repeat(64), created_at: echt.created_at + verschiebung });
  /** @param {import('../services/relay.js').Event[]} weitere */
  const mit = (...weitere) => ({ ...leererInhalt(), materialien: [...beispiele, ...weitere] });

  it('lässt ohne von das früheste Event gelten, nie das jüngste', () => {
    expect(eventFinden({ inhalt: mit(fremd(+100)), d })?.event).toBe(echt);
    expect(eventFinden({ inhalt: mit(fremd(-100)), d })?.event.pubkey).toBe(fremderSchluessel);
  });
  it('gibt QUELLE_VORRANG den Vorzug vor dem frühesten', () => {
    expect(eventFinden({ inhalt: mit(fremd(-100)), d, vorrang: [echt.pubkey] })?.event).toBe(echt);
    expect(vorzugWaehlen([echt, fremd(+1)], ['0'.repeat(64), fremderSchluessel]).pubkey).toBe(fremderSchluessel);
  });
  it('findet mit von genau diesen Schlüssel, sonst nichts', () => {
    const inhalt = mit(fremd(+100));
    expect(eventFinden({ inhalt, d, von: fremderSchluessel })?.event.pubkey).toBe(fremderSchluessel);
    expect(eventFinden({ inhalt, d, von: fremderSchluessel.toUpperCase() })?.event.pubkey).toBe(fremderSchluessel);
    expect(eventFinden({ inhalt, d, von: echt.pubkey })?.event).toBe(echt);
    expect(eventFinden({ inhalt, d, von: '0'.repeat(64) })).toBeNull();
    expect(eventFinden({ inhalt, d, von: 'kaputt' })).toBeNull();
  });
  it('nennt von im Pfad nur, wenn d mehrdeutig ist — die übrigen Adressen bleiben', () => {
    const inhalt = mit(fremd(+100));
    const pfade = materialienVon(inhalt).map((m) => m.pfad);
    const kennung = kennungAusD(d);
    expect(pfade).toContain(`/m/${kennung}?von=${echt.pubkey}`);
    expect(pfade).toContain(`/m/${kennung}?von=${fremderSchluessel}`);
    expect(pfade).toContain(`/m/${kennungAusD(beispiele[0].tags.find((t) => t[0] === 'd')?.[1] ?? '')}`);
    expect(pfade.filter((p) => p.includes('?von='))).toHaveLength(2);
    expect(materialLaden({ inhalt, d, von: fremderSchluessel })?.material.jsonPfad).toBe(`/m/${kennung}/json?von=${fremderSchluessel}`);
    expect(materialienVon({ ...leererInhalt(), materialien: beispiele }).every((m) => !m.pfad.includes('?'))).toBe(true);
  });
  it('nennt von auch bei einem Suchtreffer, dessen d im Bestand ein anderer Schlüssel hält', () => {
    expect(materialImBestand({ ...leererInhalt(), materialien: beispiele }, fremd(+1)).pfad).toBe(`/m/${kennungAusD(d)}?von=${fremderSchluessel}`);
    expect(materialImBestand({ ...leererInhalt(), materialien: beispiele }, echt).pfad).toBe(`/m/${kennungAusD(d)}`);
  });
});
