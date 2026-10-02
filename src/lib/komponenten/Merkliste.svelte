<script>
  import Icon from './Icon.svelte';
  import Karte from './Karte.svelte';
  /**
   * „Gemerkt“ (Prototyp Materialpool 2.0, ADR-0008): alles, was man sich
   * gemerkt hat, ungefiltert — dort will man alles wiederfinden. Neueste
   * Merkung zuerst. Nie leer ohne Erklärung.
   * @type {ReturnType<typeof import('$lib/routen/merkliste.js').merklisteLaden>}
   */
  let { karten, fehlend } = $props();
</script>

<main class="merkliste-page">
  <div class="merkliste-inner">
    <h1>Gemerkt</h1>
    {#if karten.length === 0 && fehlend === 0}
      <div class="merkliste-leer">
        <h2>Noch nichts gemerkt</h2>
        <p>Klicke bei einem Material auf das Lesezeichen <Icon name="bookmark" /> oder auf „Merken“ – dann sammelt sich hier, was du wiederfinden willst.</p>
        <a class="merkliste-stoebern" href="/materialien">Materialien durchstöbern <Icon name="arrow-right" /></a>
      </div>
    {:else}
      <p class="merkliste-zahl">
        {karten.length === 1 ? '1 Material' : `${karten.length} Materialien`}
        {#if fehlend > 0}
          · {fehlend === 1 ? 'eines ist' : `${fehlend} sind`} nicht mehr im Bestand
        {/if}
      </p>
      <p class="merkliste-hinweis">Deine Merkliste bleibt nur in diesem Browser.</p>
      <div class="merkliste-grid">
        {#each karten as karte (karte.material.id)}
          <Karte {karte} zurueck="/merkliste" />
        {/each}
      </div>
    {/if}
  </div>
</main>

<style>
  .merkliste-inner { max-width: var(--content-max); margin: 0 auto; padding: var(--sp-8) var(--gutter) var(--sp-15); }
  h1 { font-size: var(--fs-700); margin-bottom: var(--sp-3); }
  .merkliste-zahl { font-size: var(--fs-300); font-weight: 600; color: var(--text-dark); margin-bottom: var(--sp-1); }
  .merkliste-hinweis { font-size: var(--fs-200); color: var(--text-muted); margin-bottom: var(--sp-5); }
  .merkliste-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--sp-4); }
  .merkliste-leer h2 { font-size: 22px; margin-bottom: var(--sp-2); }
  .merkliste-leer p { color: var(--text-body); max-width: 60ch; margin-bottom: var(--sp-4); }
  .merkliste-stoebern { display: inline-flex; align-items: center; gap: var(--sp-1); color: var(--blue); font-weight: 600; }
  @media (max-width: 640px) {
    .merkliste-inner { padding: var(--sp-6) var(--sp-4) var(--sp-10); }
  }
</style>
