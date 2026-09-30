import { fail, redirect } from '@sveltejs/kit';
import {
  abmelden, anmelden, KONTO_COOKIE, KONTO_COOKIE_DAUER_S, kontoLesen, kontoSchreiben, kontoSeite, profilAusFormular
} from '$lib/routen/konto.js';

export const prerender = false;

/**
 * Prototypische Kontoebene (ADR-0006): Anmelden nur mit Namen, Profil im
 * Cookie dieses Browsers. Formulare per POST, danach zurück auf /konto
 * (Post/Redirect/Get) — ohne JavaScript vollständig.
 */

/** @param {import('@sveltejs/kit').Cookies} cookies @param {import('$lib/models/konto.js').Konto} konto */
function merken(cookies, konto) {
  cookies.set(KONTO_COOKIE, kontoSchreiben(konto), { path: '/', httpOnly: true, sameSite: 'lax', maxAge: KONTO_COOKIE_DAUER_S });
}

/** @type {import('./$types').PageServerLoad} */
export function load({ cookies, url }) {
  return { ...kontoSeite(kontoLesen(cookies.get(KONTO_COOKIE))), gespeichert: url.searchParams.has('gespeichert') };
}

/** @type {import('./$types').Actions} */
export const actions = {
  anmelden: async ({ request, cookies }) => {
    const formular = await request.formData();
    const konto = anmelden(formular.get('name'), kontoLesen(cookies.get(KONTO_COOKIE)));
    if (!konto) return fail(400, { fehler: 'Bitte gib deinen Namen ein.' });
    merken(cookies, konto);
    redirect(303, '/konto');
  },
  speichern: async ({ request, cookies }) => {
    const bisher = kontoLesen(cookies.get(KONTO_COOKIE));
    if (!bisher.angemeldet) redirect(303, '/konto');
    merken(cookies, profilAusFormular(await request.formData(), bisher));
    redirect(303, '/konto?gespeichert=1');
  },
  abmelden: async ({ cookies }) => {
    merken(cookies, abmelden(kontoLesen(cookies.get(KONTO_COOKIE))));
    redirect(303, '/konto');
  }
};
