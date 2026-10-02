import { redirect } from '@sveltejs/kit';
import {
  MERKLISTE_COOKIE, merklisteLaden, merklisteLesen, merklisteSchreiben, umschalten, zurueckPfad
} from '$lib/routen/merkliste.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** Ein Jahr, wie Farbe und Konto. */
const MERKLISTE_DAUER_S = 60 * 60 * 24 * 365;

/** @type {import('./$types').PageServerLoad} */
export function load({ cookies }) {
  return merklisteLaden({ inhalt: spiegelHolen().lesen(), keys: merklisteLesen(cookies.get(MERKLISTE_COOKIE)) });
}

/**
 * Das Lesezeichen auf Karten und Detailseite schickt hierher (ADR-0008);
 * danach geht es zurück, wo es gedrückt wurde (Post/Redirect/Get).
 * @type {import('./$types').Actions}
 */
export const actions = {
  umschalten: async ({ request, cookies }) => {
    const formular = await request.formData();
    const keys = umschalten(merklisteLesen(cookies.get(MERKLISTE_COOKIE)), formular.get('m'));
    cookies.set(MERKLISTE_COOKIE, merklisteSchreiben(keys), { path: '/', httpOnly: true, sameSite: 'lax', maxAge: MERKLISTE_DAUER_S });
    redirect(303, zurueckPfad(formular.get('zurueck')));
  }
};
