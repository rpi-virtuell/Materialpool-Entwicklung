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
  it('lässt dem Dev-Server seine Skripte', () => {
    expect(antwortKoepfe({ entwicklung: true })).not.toHaveProperty('content-security-policy');
  });
});
