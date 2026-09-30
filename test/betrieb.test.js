/**
 * Was der Betrieb braucht und im Code nicht auffällt (docs/betrieb.md):
 * Der Container läuft nicht als root, und der gebaute Server kennt seine
 * öffentliche Adresse.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** @param {string} datei */
const lesen = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), 'utf8');

describe('Betrieb', () => {
  it('Dockerfile: der Server läuft als node, daten/ gehört ihm', () => {
    const laufzeit = lesen('Dockerfile').split(/^FROM /m).at(-1) ?? '';
    expect(laufzeit).toMatch(/chown node:node daten/);
    expect(laufzeit).toMatch(/^USER node$/m);
    expect(laufzeit.indexOf('USER node')).toBeLessThan(laufzeit.indexOf('CMD'));
  });
  it('ORIGIN steht in .env.example, docker-compose.yml und docs/betrieb.md', () => {
    expect(lesen('.env.example')).toMatch(/^# ORIGIN=https:\/\//m);
    expect(lesen('docker-compose.yml')).toMatch(/ORIGIN: \$\{ORIGIN:-http:\/\/localhost:8080\}/);
    expect(lesen('docs/betrieb.md')).toContain('ORIGIN=https://material.rpi-virtuell.net');
  });
});
