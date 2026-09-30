import { describe, expect, it } from 'vitest';
import { antwortKoepfe, SICHERHEITSRICHTLINIE } from './koepfe.js';

describe('antwortKoepfe', () => {
  it('verbietet jedes Skript und fremde Einbettung, erlaubt Inline-Styles und Bilder der Materialien', () => {
    const csp = antwortKoepfe()['content-security-policy'];
    expect(csp).toBe(SICHERHEITSRICHTLINIE);
    expect(csp).toContain("script-src 'none'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain('img-src \'self\' https: http: data:');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
  });
  it('verbietet gemeinsamen Caches persönliche Seiten (Konto, Farbe)', () => {
    /** @param {Record<string, string>} cookies */
    const mit = (cookies) => antwortKoepfe({ cookie: (name) => cookies[name] });
    expect(mit({ konto: '{"name":"Christina"}' })['cache-control']).toBe('private, no-store');
    expect(mit({ primaryColor: '#c1272d' })['cache-control']).toBe('private, no-store');
    expect(mit({})).not.toHaveProperty('cache-control');
    expect(antwortKoepfe().vary).toBe('Cookie');
  });
  it('lässt dem Dev-Server seine Skripte', () => {
    expect(antwortKoepfe({ entwicklung: true })).not.toHaveProperty('content-security-policy');
  });
});
