<script>
  import Icon from './Icon.svelte';
  import Karte from './Karte.svelte';
  /**
   * Liste (/materialien): Suche, Ergebnisleiste mit Treffern und aktiven
   * Filtern als entfernbare Pillen, Karten. Zustände: leerer Spiegel
   * (Erklärung), keine Treffer (aktive Filter), Treffer.
   * @type {ReturnType<typeof import('$lib/routen/uebersicht.js').listeLaden>}
   */
  let { karten, filter, pillen, gesamt, leerstand } = $props();
  const trefferText = $derived(
    karten.length === gesamt ? `${karten.length} Treffer` : `${karten.length} Treffer von ${gesamt}`
  );
  const filterText = $derived(pillen.map((p) => p.label).join(' und '));
</script>

<main class="liste-page">
  <div class="liste-inner">
    <h1>Materialien</h1>
    <form class="liste-suche" action="/materialien" method="get" role="search">
      <Icon name="search" />
      <input type="search" name="q" value={filter.q} placeholder="Suchen in Titel, Beschreibung, Herkunft und Schlagworten" aria-label="Materialien durchsuchen" />
      {#if filter.stufe}<input type="hidden" name="stufe" value={filter.stufe} />{/if}
      <button type="submit">Suchen</button>
    </form>

    {#if leerstand}
      <p class="status-hint status-warn">{leerstand}</p>
    {:else if karten.length === 0}
      <div class="keine-treffer">
        <h2>Dazu passt gerade nichts</h2>
        <p>Von {gesamt} Materialien passt keines zu {filterText}.</p>
        <a class="filter-aufheben" href="/materialien">Filter aufheben</a>
      </div>
    {:else}
      <div class="ergebnisleiste">
        <span class="treffer">{trefferText}</span>
        {#each pillen as pille (pille.art)}
          <a class="filter-pille" href={pille.entfernenPfad} aria-label="Filter {pille.label} entfernen">{pille.label} <span aria-hidden="true">×</span></a>
        {/each}
      </div>
      <div class="material-grid">
        {#each karten as karte (karte.material.id)}
          <Karte {karte} />
        {/each}
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
  .material-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--sp-4);
  }
  .keine-treffer h2 { font-size: 22px; margin-bottom: var(--sp-2); }
  .filter-aufheben { color: var(--blue); font-weight: 600; }
  @media (max-width: 640px) {
    .liste-inner { padding: var(--sp-6) var(--sp-4) var(--sp-10); }
  }
</style>
