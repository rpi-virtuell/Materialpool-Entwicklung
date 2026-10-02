<script>
  import Icon from './Icon.svelte';
  import Karte from './Karte.svelte';
  /**
   * Liste (/materialien): Suche, Facetten (Fach, Materialart,
   * Bildungsstufe, Schlagworte) als Link-Chips in einer Spalte links,
   * rechts Ergebnisleiste mit Treffern, aktiven Filtern als entfernbare
   * Pillen und Sortierung als Link-Gruppe, Karten. Alles GET-Links — ohne
   * JavaScript vollständig. Zustände: leerer Spiegel (Erklärung), keine
   * Treffer (aktive Filter), Treffer.
   *
   * Die Spalte ist Christinas Wahl vom 02.10.2026 aus drei Entwürfen:
   * Vorher brauchten die Facetten über den Karten bei 1280 × 800 rund
   * 390 px Höhe. Von den Schlagworten stehen die ersten sechs, der Rest
   * hinter „mehr …“. Chips ohne Treffer bleiben abgeblendet stehen —
   * ausgeblendet wirkte es, als kenne die Seite die Werte nicht. Unter
   * 900 px liegen die Facetten über den Karten hinter einem Knopf „Filter“.
   * @type {ReturnType<typeof import('$lib/routen/uebersicht.js').listeLaden>}
   */
  let { karten, treffer, seiten, zurueck, filter, pillen, facetten, sortierungen, suche, frage, profilHinweis, gesamt, leerstand } = $props();
  /** Schlagwort-Chips vor „mehr …“. */
  const SCHLAGWORTE_SICHTBAR = 6;
  /** Auf dem Handy liegen die Facetten hinter „Filter“; mit aktiven Filtern steht es offen. */
  const aktiveFacetten = $derived(filter.stufen.length + filter.typen.length + filter.faecher.length + filter.schlagworte.length);
  const trefferText = $derived(
    treffer === gesamt ? `${treffer} Treffer` : `${treffer} Treffer von ${gesamt}`
  );
  const filterText = $derived(pillen.map((p) => p.label).join(' und '));
  const gruppen = $derived([
    { name: 'Fach', werte: facetten.faecher },
    { name: 'Materialart', werte: facetten.typen },
    { name: 'Bildungsstufe', werte: facetten.stufen },
    { name: 'Schlagworte', werte: facetten.schlagworte }
  ]);
</script>

<main class="liste-page">
  <div class="liste-inner">
    <h1>Materialien</h1>
    <form class="liste-suche" action="/materialien" method="get" role="search">
      <Icon name="search" />
      <input type="search" name="q" value={filter.q} placeholder="Stichwort oder in eigenen Worten …" aria-label="Materialien durchsuchen" />
      {#if filter.wortlaut && filter.wortlaut === filter.q}<input type="hidden" name="wortlaut" value={filter.wortlaut} />{/if}
      {#each filter.stufen as s (s)}<input type="hidden" name="stufe" value={s} />{/each}
      {#each filter.typen as t (t)}<input type="hidden" name="typ" value={t} />{/each}
      {#each filter.faecher as f (f)}<input type="hidden" name="fach" value={f} />{/each}
      {#each filter.schlagworte as w (w)}<input type="hidden" name="t" value={w} />{/each}
      {#if filter.sortierung !== 'empfohlen'}<input type="hidden" name="sort" value={filter.sortierung} />{/if}
      <button type="submit">Suchen</button>
    </form>

    {#if leerstand}
      <p class="status-hint status-warn">{leerstand}</p>
    {:else}
      {#if frage}
        <p class="frage-hinweis">
          <span class="frage-kopf"><Icon name="sparkles" /> „{frage.text}“ haben wir so verstanden:</span>
          {#each frage.teile as teil (teil.label)}
            <span class="deutung-teil">„{teil.woerter}“ <span aria-label="wird zu">→</span> {teil.label}</span>
          {/each}
          {#if frage.themen.length > 0}
            <span class="deutung-teil">{frage.themen.length === 1 ? 'Thema' : 'Themen'}: <strong>{frage.themen.join(', ')}</strong></span>
          {/if}
          <a class="frage-zurueck" href={frage.rueckgaengigPfad}>Rückgängig</a>
        </p>
      {/if}
      {#if suche.hinweis}<p class="status-hint status-warn suche-hinweis">{suche.hinweis}</p>{/if}
      {#snippet chip(/** @type {import('$lib/routen/uebersicht.js').Facettenwert} */ wert)}
        {#if wert.pfad}
          <a class="chip" class:is-aktiv={wert.aktiv} href={wert.pfad} aria-current={wert.aktiv ? 'true' : undefined}>
            {wert.label} <span class="chip-zahl">{wert.anzahl}</span>
          </a>
        {:else}
          <span class="chip is-leer" aria-disabled="true">{wert.label} <span class="chip-zahl">0</span></span>
        {/if}
      {/snippet}

      <div class="liste-koerper">
      <aside class="liste-filter" aria-label="Filter">
        <!-- Nur unter 900 px sichtbar: Das Kästchen schaltet die Facetten per
             CSS auf und zu, ohne JavaScript. Am Desktop ist beides
             ausgeblendet, die Spalte steht immer. -->
        <input class="filter-schalter" type="checkbox" id="filter-schalter" checked={aktiveFacetten > 0} />
        <label class="filter-knopf" for="filter-schalter">Filter{aktiveFacetten > 0 ? ` (${aktiveFacetten})` : ''}</label>
        <div class="facetten">
          {#each gruppen as gruppe (gruppe.name)}
            <!-- Leere Chips bleiben abgeblendet stehen: Man soll sehen, dass
                 es die Werte gibt, auch wenn gerade nichts dazu passt. -->
            {@const werte = gruppe.werte}
            {@const viele = gruppe.name === 'Schlagworte' && werte.length > SCHLAGWORTE_SICHTBAR}
            {#if werte.length > 0}
              <fieldset class="facette">
                <legend>{gruppe.name}</legend>
                <div class="facette-chips">
                  {#each viele ? werte.slice(0, SCHLAGWORTE_SICHTBAR) : werte as wert (wert.key)}{@render chip(wert)}{/each}
                  {#if viele}
                    <details class="facette-mehr">
                      <summary>mehr …</summary>
                      <div class="facette-chips">{#each werte.slice(SCHLAGWORTE_SICHTBAR) as wert (wert.key)}{@render chip(wert)}{/each}</div>
                    </details>
                  {/if}
                </div>
              </fieldset>
            {/if}
          {/each}
        </div>
      </aside>
      <div class="liste-ergebnis">

      {#if profilHinweis}
        <p class="profil-hinweis"><Icon name="user-check" /> {profilHinweis} <a href="/konto">Profil ändern</a></p>
      {/if}

      {#if karten.length === 0}
        <div class="keine-treffer">
          <h2>Dazu passt gerade nichts</h2>
          <p>Von {gesamt} Materialien passt keines zu {filterText}.</p>
          <a class="filter-aufheben" href="/materialien">Filter aufheben</a>
        </div>
      {:else}
        <div class="ergebnisleiste">
          <span class="treffer">{trefferText}</span>
          {#each pillen as pille (pille.art + pille.label)}
            <a class="filter-pille" href={pille.entfernenPfad} aria-label="Filter {pille.label} entfernen">{pille.label} <span aria-hidden="true">×</span></a>
          {/each}
          <nav class="sortierung" aria-label="Sortierung">
            <span class="sortierung-label">Sortieren:</span>
            {#each sortierungen as s (s.key)}
              <a href={s.pfad} class:is-aktiv={s.aktiv} aria-current={s.aktiv ? 'true' : undefined}>{s.label}</a>
            {/each}
          </nav>
        </div>
        <div class="material-grid">
          {#each karten as karte (karte.material.id)}
            <Karte {karte} {zurueck} />
          {/each}
        </div>
        {#if seiten.anzahl > 1}
          <nav class="seiten" aria-label="Seiten">
            {#if seiten.vorPfad}<a href={seiten.vorPfad} rel="prev">← Zurück</a>{:else}<span class="seiten-aus">← Zurück</span>{/if}
            <span class="seiten-stand">Seite {seiten.aktuell} von {seiten.anzahl} · Treffer {seiten.von}–{seiten.bis}</span>
            {#if seiten.weiterPfad}<a href={seiten.weiterPfad} rel="next">Weiter →</a>{:else}<span class="seiten-aus">Weiter →</span>{/if}
          </nav>
        {/if}
      {/if}
      </div>
      </div>
    {/if}
  </div>
</main>

<style>
  .liste-inner {
    max-width: var(--content-max);
    margin: 0 auto;
    padding: var(--sp-8) var(--gutter) var(--sp-15);
  }
  h1 { font-size: var(--fs-700); margin-bottom: var(--sp-5); }
  .liste-suche {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    max-width: 680px;
    margin: 0 0 var(--sp-6);
    background: var(--weiss);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: var(--sp-1) var(--sp-1) var(--sp-1) var(--sp-4);
  }
  .liste-suche:focus-within { border-color: var(--blue); }
  .liste-suche :global(.ti) { color: var(--text-muted); font-size: 20px; }
  .liste-suche input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    font-size: var(--fs-400);
    color: var(--text-body);
    padding: var(--sp-2) 0;
    background: none;
  }
  .liste-suche button {
    background: var(--blue-dark);
    color: var(--weiss);
    border: none;
    border-radius: 4px;
    padding: var(--sp-2) var(--sp-5);
    font-weight: 600;
    font-size: var(--fs-300);
    min-height: 40px;
    cursor: pointer;
  }
  .liste-suche button:hover { background: var(--blue-darker); }

  .suche-hinweis { margin-bottom: var(--sp-4); }
  .frage-hinweis {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-1) var(--sp-3);
    margin: 0 0 var(--sp-5);
    padding: var(--sp-3) var(--sp-4);
    border-left: 3px solid var(--blue);
    background: var(--fb-flaeche);
    border-radius: 0 var(--radius) var(--radius) 0;
    font-size: var(--fs-300);
    color: var(--text-body);
  }
  .frage-kopf { display: inline-flex; align-items: center; gap: var(--sp-1); font-weight: 600; color: var(--text-dark); }
  .frage-kopf :global(.ti) { width: 16px; height: 16px; color: var(--blue); }
  .frage-zurueck { margin-left: auto; color: var(--blue); font-weight: 600; }
  /* Solange die Voreinstellung aus dem Profil unverändert gilt (ADR-0006). */
  .profil-hinweis { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-2); font-size: var(--fs-200); color: var(--text-muted); margin: calc(-1 * var(--sp-3)) 0 var(--sp-4); }
  .profil-hinweis :global(.ti) { width: 15px; height: 15px; color: var(--blue); }
  .profil-hinweis a { color: var(--blue); }
  /* Facetten als Spalte links, die beim Scrollen mitläuft; rechts die
     Treffer mit drei Karten je Reihe. Unter 900 px stehen die Facetten
     wieder über den Karten, je Facette eine Zeile. */
  .liste-koerper {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: var(--sp-8);
    align-items: start;
  }
  .liste-filter {
    position: sticky;
    top: calc(64px + var(--sp-4));
    max-height: calc(100vh - 64px - 2 * var(--sp-4));
    overflow-y: auto;
  }
  .facetten { display: flex; flex-direction: column; gap: var(--sp-5); }
  .facette { border: none; margin: 0; padding: 0; }
  .facette legend { display: block; font-size: var(--fs-200); font-weight: 600; color: var(--text-muted); padding: 0; margin-bottom: var(--sp-2); }
  .facette-chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .facette-mehr { display: inline-flex; }
  .facette-mehr[open] { flex-basis: 100%; flex-direction: column; }
  .facette-mehr summary {
    list-style: none;
    cursor: pointer;
    padding: var(--sp-1) var(--sp-2);
    font-size: var(--fs-200);
    font-weight: 600;
    color: var(--blue);
  }
  .facette-mehr summary::-webkit-details-marker { display: none; }
  .facette-mehr[open] summary { display: none; }
  .liste-ergebnis .profil-hinweis { margin-top: 0; }
  /* Handy: Knopf „Filter“; das Kästchen bleibt für Tastatur und
     Screenreader erreichbar, ist aber unsichtbar. */
  .filter-schalter {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    opacity: 0;
  }
  .filter-knopf { display: none; }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    padding: var(--sp-1) var(--sp-3);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: var(--fs-200);
    font-weight: 500;
    color: var(--text-dark);
    text-decoration: none;
    background: var(--weiss);
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }
  .chip:hover { border-color: var(--text-dark); }
  .chip.is-aktiv { background: var(--blue); border-color: var(--blue); color: var(--weiss); }
  .chip.is-leer { color: var(--text-muted); border-style: dashed; cursor: default; }
  .chip-zahl { font-weight: 400; opacity: 0.75; }

  .ergebnisleiste {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    margin-bottom: var(--sp-5);
    font-size: var(--fs-300);
    color: var(--text-muted);
  }
  .treffer { font-weight: 600; color: var(--text-dark); }
  .filter-pille {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    padding: var(--sp-1) var(--sp-3);
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text-dark);
    text-decoration: none;
    background: var(--fb-flaeche);
  }
  .filter-pille:hover { border-color: var(--text-dark); }
  .sortierung { margin-left: auto; display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-1) var(--sp-3); }
  .sortierung a { color: var(--text-muted); text-decoration: none; padding: 2px 0; border-bottom: 2px solid transparent; }
  .sortierung a:hover { color: var(--text-dark); }
  .sortierung a.is-aktiv { color: var(--text-dark); font-weight: 600; border-bottom-color: var(--blue); }
  .material-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--sp-4);
  }
  .seiten {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--sp-3);
    margin-top: var(--sp-8);
    font-size: var(--fs-300);
    color: var(--text-muted);
  }
  .seiten a { color: var(--text-dark); font-weight: 600; text-decoration: none; border-bottom: 1.5px solid var(--unterstrich); }
  .seiten a:hover { border-bottom-color: var(--text-dark); }
  .seiten-aus { opacity: 0.4; }
  .keine-treffer h2 { font-size: 22px; margin-bottom: var(--sp-2); }
  .filter-aufheben { color: var(--blue); font-weight: 600; }
  @media (max-width: 900px) {
    .liste-koerper { display: block; }
    .liste-filter { position: static; max-height: none; overflow: visible; margin-bottom: var(--sp-6); }
    .facetten { gap: var(--sp-3); display: none; margin-top: var(--sp-4); }
    .filter-schalter:checked ~ .facetten { display: flex; }
    .filter-knopf {
      display: inline-flex;
      align-items: center;
      gap: var(--sp-2);
      cursor: pointer;
      padding: var(--sp-2) var(--sp-4);
      min-height: 44px;
      border: 1px solid var(--border);
      border-radius: 5px;
      font-size: var(--fs-300);
      font-weight: 600;
      color: var(--text-dark);
      background: var(--weiss);
    }
    .filter-knopf::after { content: '▾'; font-size: 0.8em; color: var(--text-muted); }
    .filter-schalter:checked + .filter-knopf { border-color: var(--blue); color: var(--blue); }
    .filter-schalter:checked + .filter-knopf::after { content: '▴'; }
    .filter-schalter:focus-visible + .filter-knopf { outline: 2px solid var(--blue); outline-offset: 2px; }
    .facette { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--sp-2) var(--sp-3); }
    .facette legend { float: left; min-width: 7.5em; margin-bottom: 0; }
  }
  @media (max-width: 640px) {
    .liste-inner { padding: var(--sp-6) var(--sp-4) var(--sp-10); }
    .facette legend { float: none; min-width: 0; width: 100%; margin-bottom: var(--sp-1); }
    .sortierung { margin-left: 0; width: 100%; }
  }
</style>
