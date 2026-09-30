/**
 * Die Datenschicht kennt die Oberfläche nicht (Muster oer-community,
 * ADR-0014 dort): Nichts unter src/lib/{models,routen,services}/ importiert
 * eine Komponente oder eine Route. Und nur der Spiegel spricht mit dem
 * Relay-Modul.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// fileURLToPath statt .pathname und Schrägstriche statt Backslashes, damit
// der Test auch unter Windows die Dateien findet und die Pfadmuster greifen.
/** @param {string} pfad */
const vorwaerts = (pfad) => pfad.replaceAll('\\', '/');
const WURZEL = vorwaerts(fileURLToPath(new URL('../src/lib', import.meta.url)));
const SRC = vorwaerts(fileURLToPath(new URL('../src', import.meta.url)));

/** @param {string} verzeichnis @param {(name: string) => boolean} passt @returns {string[]} */
function dateien(verzeichnis, passt) {
  return readdirSync(verzeichnis).flatMap((name) => {
    const pfad = vorwaerts(join(verzeichnis, name));
    if (statSync(pfad).isDirectory()) return dateien(pfad, passt);
    return passt(name) ? [pfad] : [];
  });
}

/** @param {string} verzeichnis */
function jsDateien(verzeichnis) {
  return dateien(verzeichnis, (name) => name.endsWith('.js') && !name.endsWith('.test.js'));
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

  it('Hex-Farben stehen nur in app.css, stile/*.css und models/farben.js (ADR-0004)', () => {
    const erlaubt = /(^|\/)(app\.css|stile\/[^/]+\.css|models\/farben\.js)$/;
    const kandidaten = dateien(SRC, (name) => /\.(svelte|js|css)$/.test(name) && !name.endsWith('.test.js'));
    const verstoesse = kandidaten
      .filter((datei) => !erlaubt.test(datei))
      .filter((datei) => /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(datei, 'utf8').replace(/https?:\/\/\S+/g, '')))
      .map((datei) => relative(SRC, datei));
    expect(verstoesse).toEqual([]);
  });
});
