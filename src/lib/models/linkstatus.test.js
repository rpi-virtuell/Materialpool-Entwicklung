import { describe, expect, it } from 'vitest';
import { ausgeblendet, bewerten, faellig, fortschreiben, pruefbar } from './linkstatus.js';

const TAG = 24 * 60 * 60 * 1000;
const jetzt = Date.parse('2026-10-08T12:00:00Z');
const regeln = { intervallMs: 7 * TAG, nachpruefMs: TAG };

describe('bewerten', () => {
  it('weg nur bei 404 und 410', () => {
    expect(bewerten(404)).toBe('weg');
    expect(bewerten(410)).toBe('weg');
  });
  it('erreichbar bei 2xx und 3xx', () => {
    for (const s of [200, 204, 301, 304]) expect(bewerten(s)).toBe('ok');
  });
  it('unklar bei allem anderen, auch ohne Antwort', () => {
    for (const s of [401, 403, 429, 500, 503, null]) expect(bewerten(s)).toBe('unklar');
  });
});

describe('fortschreiben und ausgeblendet', () => {
  it('blendet erst nach zwei „weg“ hintereinander aus', () => {
    const einmal = fortschreiben(undefined, 'weg', 404, jetzt);
    expect(einmal.wegInFolge).toBe(1);
    expect(ausgeblendet(einmal)).toBe(false);
    const zweimal = fortschreiben(einmal, 'weg', 404, jetzt + TAG);
    expect(ausgeblendet(zweimal)).toBe(true);
    expect(zweimal.status).toBe(404);
    expect(zweimal.geprueft).toBe(new Date(jetzt + TAG).toISOString());
  });
  it('„ok“ setzt zurück, „unklar“ lässt den Zähler stehen', () => {
    const weg = fortschreiben(fortschreiben(undefined, 'weg', 404, jetzt), 'weg', 410, jetzt);
    expect(ausgeblendet(fortschreiben(weg, 'unklar', 503, jetzt))).toBe(true);
    expect(ausgeblendet(fortschreiben(weg, 'ok', 200, jetzt))).toBe(false);
    expect(fortschreiben(undefined, 'unklar', null, jetzt).wegInFolge).toBe(0);
  });
  it('merkt sich, seit wann ein Link weg ist; „unklar“ behält, „ok“ löscht es', () => {
    const einmal = fortschreiben(undefined, 'weg', 404, jetzt);
    expect(einmal.wegSeit).toBe(new Date(jetzt).toISOString());
    const zweimal = fortschreiben(einmal, 'weg', 404, jetzt + TAG);
    expect(zweimal.wegSeit).toBe(new Date(jetzt).toISOString());
    expect(fortschreiben(zweimal, 'unklar', 503, jetzt + 2 * TAG).wegSeit).toBe(new Date(jetzt).toISOString());
    expect(fortschreiben(zweimal, 'ok', 200, jetzt + 2 * TAG).wegSeit).toBeNull();
    expect(fortschreiben(undefined, 'ok', 200, jetzt).wegSeit).toBeNull();
  });
  it('ohne Eintrag ist nichts ausgeblendet', () => {
    expect(ausgeblendet(undefined)).toBe(false);
  });
});

describe('faellig', () => {
  it('nie geprüft: sofort', () => {
    expect(faellig(undefined, jetzt, regeln)).toBe(true);
  });
  it('sonst nach dem Intervall, nach einem „weg“ schon nach einem Tag', () => {
    const ok = fortschreiben(undefined, 'ok', 200, jetzt);
    expect(faellig(ok, jetzt + 6 * TAG, regeln)).toBe(false);
    expect(faellig(ok, jetzt + 7 * TAG, regeln)).toBe(true);
    const weg = fortschreiben(undefined, 'weg', 404, jetzt);
    expect(faellig(weg, jetzt + TAG - 1, regeln)).toBe(false);
    expect(faellig(weg, jetzt + TAG, regeln)).toBe(true);
  });
});

describe('pruefbar', () => {
  it('nur http(s)-Adressen', () => {
    expect(pruefbar('https://example.org/a')).toBe(true);
    expect(pruefbar('http://example.org/a')).toBe(true);
    for (const u of ['urn:x', 'javascript:alert(1)', 'ftp://x/', '', null]) expect(pruefbar(u)).toBe(false);
  });
});
