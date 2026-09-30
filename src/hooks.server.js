/**
 * Startet den Spiegel mit dem Prozess. `init` läuft einmal vor der ersten
 * Anfrage; `spiegelStarten` wartet höchstens SPIEGEL_STARTWARTEZEIT_S auf
 * den ersten Lauf und geht dann ans Netz — mit der Datei, oder leer mit
 * Meldung. Fehlt ein Pflichtwert, bricht `konfigLesen` hier ab — beim
 * Start, nicht später mit leeren Seiten.
 */
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { antwortKoepfe } from '$lib/routen/koepfe.js';
import { spiegelBereit, spiegelStarten } from '$lib/services/spiegel.js';

/** @type {import('@sveltejs/kit').ServerInit} */
export async function init() {
  spiegelStarten(konfigLesen(env));
  await spiegelBereit();
}

/** Sicherheitsrichtlinie und Cache-Regeln auf jeder Antwort (routen/koepfe.js). @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const antwort = await resolve(event);
  const koepfe = antwortKoepfe({ entwicklung: dev, cookie: (name) => event.cookies.get(name) });
  for (const [name, wert] of Object.entries(koepfe)) {
    if (name === 'vary') antwort.headers.append(name, wert);
    else antwort.headers.set(name, wert);
  }
  return antwort;
}
