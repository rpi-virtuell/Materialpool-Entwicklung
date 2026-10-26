<script>
  /**
   * „Ausgeblendete Materialien“ (ADR-0010): was die Link-Prüfung aus Liste,
   * Suche und Startseite genommen hat — mit totem Link, Antwort des Servers
   * und Datum, damit jemand bei den Anbietern nachfragen kann. Darunter,
   * was nach Meldungen fehlt (ADR-0011), mit Grund, aber ohne den Text der
   * Meldung. Erreichbar über den Hinweis unter der Liste, nicht über die
   * Kopfzeile.
   * @type {{
   *   eintraege: ReturnType<typeof import('$lib/routen/ausgeblendet.js').ausgeblendeteLaden>['eintraege'],
   *   gemeldet?: import('$lib/routen/meldungen.js').Fall[]
   * }}
   */
  let { eintraege, gemeldet = [] } = $props();
  const datum = (/** @type {string} */ iso) => new Date(iso).toLocaleDateString('de-DE', { dateStyle: 'medium', timeZone: 'Europe/Berlin' });
</script>

<main class="ausgeblendet-page">
  <div class="ausgeblendet-inner">
    <h1>Ausgeblendete Materialien</h1>
    <p class="ausgeblendet-lead">
      Der Materialpool prüft regelmäßig, ob die Links zu den Materialien noch funktionieren. Meldet eine Seite
      zweimal hintereinander, dass es sie nicht mehr gibt, wird das Material aus Liste, Suche und Startseite
      genommen. Funktioniert der Link wieder, erscheint es von selbst wieder.
    </p>

    {#if eintraege.length === 0 && gemeldet.length === 0}
      <p class="ausgeblendet-leer">Zurzeit ist kein Material ausgeblendet.</p>
    {/if}
    {#if eintraege.length > 0}
      <p class="ausgeblendet-zahl">{eintraege.length === 1 ? '1 Material' : `${eintraege.length} Materialien, zuletzt ausgeblendete zuerst`}</p>
      <ul class="ausgeblendet-liste">
        {#each eintraege as e (e.material.id)}
          <li>
            <a class="ausgeblendet-titel" href={e.material.pfad}>{e.material.name}</a>
            <p class="ausgeblendet-von">{e.material.herkunft}</p>
            <p class="ausgeblendet-link">
              <a href={e.url} rel="external noopener nofollow">{e.url}</a>
            </p>
            <p class="ausgeblendet-stand">
              Antwort {e.status ?? '–'} · nicht erreichbar seit {datum(e.wegSeit)} · zuletzt geprüft {datum(e.geprueft)}
            </p>
          </li>
        {/each}
      </ul>
    {/if}

    {#if gemeldet.length > 0}
      <h2>Nach Meldungen ausgeblendet</h2>
      <p class="ausgeblendet-lead">
        Bei jedem Material kann man melden, dass etwas nicht stimmt. Ab zwei Meldungen ist es ausgeblendet, bis die
        Redaktion entschieden hat; bestätigt sie die Meldung, bleibt es ausgeblendet.
      </p>
      <ul class="ausgeblendet-liste">
        {#each gemeldet as f (f.schluessel)}
          <li>
            <a class="ausgeblendet-titel" href={f.pfad}>{f.titel}</a>
            {#if f.herkunft}<p class="ausgeblendet-von">{f.herkunft}</p>{/if}
            <p class="ausgeblendet-stand">
              {f.stand.gruende.join(', ')} ·
              {f.stand.stand === 'bestaetigt' ? 'von der Redaktion ausgeblendet' : 'vorläufig, die Redaktion prüft'}
              {#if f.stand.seit}· seit {datum(f.stand.seit)}{/if}
            </p>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>

<style>
  .ausgeblendet-inner { max-width: 760px; margin: 0 auto; padding: var(--sp-8) var(--gutter) var(--sp-15); }
  h1 { font-size: var(--fs-700); margin-bottom: var(--sp-3); }
  h2 { font-size: var(--fs-500); margin: var(--sp-10) 0 var(--sp-3); }
  .ausgeblendet-lead { color: var(--text-body); line-height: 1.6; margin-bottom: var(--sp-6); }
  .ausgeblendet-leer { font-weight: 600; color: var(--text-dark); }
  .ausgeblendet-zahl { font-size: var(--fs-200); color: var(--text-muted); margin-bottom: var(--sp-3); }
  .ausgeblendet-liste { list-style: none; padding: 0; margin: 0; }
  .ausgeblendet-liste li { padding: var(--sp-4) 0; border-top: 1px solid var(--border); }
  .ausgeblendet-titel { font-weight: 600; color: var(--text-dark); }
  .ausgeblendet-von { font-size: var(--fs-200); color: var(--text-body); margin: var(--sp-1) 0; }
  .ausgeblendet-link { font-size: var(--fs-200); overflow-wrap: anywhere; margin: 0; }
  .ausgeblendet-link a { color: var(--blue); }
  .ausgeblendet-stand { font-size: var(--fs-200); color: var(--text-muted); margin: var(--sp-1) 0 0; }
  @media (max-width: 640px) {
    .ausgeblendet-inner { padding: var(--sp-6) var(--sp-4) var(--sp-10); }
  }
</style>
