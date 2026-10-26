import { redirect } from '@sveltejs/kit';

/**
 * Die Liste der ausgeblendeten Materialien steht nur noch auf der
 * Redaktionsseite (Nachträge ADR-0010 und ADR-0011, 2026-10-26). Alte
 * Lesezeichen landen dort.
 * @type {import('./$types').RequestHandler}
 */
export function GET() {
  redirect(308, '/redaktion');
}
