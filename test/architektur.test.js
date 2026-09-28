/**
 * Die Datenschicht kennt die Oberfläche nicht (Muster oer-community,
 * ADR-0014 dort): Nichts unter src/lib/{models,routen,services}/ importiert
 * eine Komponente oder eine Route. Und nur der Spiegel spricht mit dem
 * Relay-Modul.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const WURZEL = new URL('../src/lib', import.meta.url).pathname;

/** @param {string} verzeichnis @returns {string[]} */
function jsDateien(verzeichnis) {
  return readdirSync(verzeichnis).flatMap((name) => {
    const pfad = join(verzeichnis, name);
    if (statSync(pfad).isDirectory()) return jsDateien(pfad);
    return name.endsWith('.js') && !name.endsWith('.test.js') ? [pfad] : [];
  });
}

const datenschicht = ['models', 'routen', 'services'].flatMap((d) => jsDateien(join(WURZEL, d)));

describe('Architektur', () => {
  it('findet die Datenschicht', () => {
    expect(datenschicht.length).toBeGreaterThan(3);
  });

  it('Datenschicht importiert weder Komponenten noch Routen noch SvelteKit-Laufzeit', () => {
    for (const datei of datenschicht) {
      const quelle = readFileSync(datei, 'utf8');
      const importe = [...quelle.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
      for (const ziel of importe) {
        expect(ziel, `${relative(WURZEL, datei)} importiert ${ziel}`).not.toMatch(/komponenten|\.svelte$|\/routes\/|\$app\/|\$env\//);
      }
    }
  });

  it('nur services/spiegel.js importiert services/relay.js', () => {
    const verstoesse = datenschicht
      .filter((datei) => !datei.endsWith('services/spiegel.js') && !datei.endsWith('services/relay.js'))
      .filter((datei) => /from\s+'[^']*relay\.js'/.test(readFileSync(datei, 'utf8')))
      .map((datei) => relative(WURZEL, datei));
    expect(verstoesse).toEqual([]);
  });
});
