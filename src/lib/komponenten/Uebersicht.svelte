<script>
  import Karte from './Karte.svelte';
  /** @type {{ materialien: import('$lib/models/material.js').Material[], leerstand: string|null }} */
  let { materialien, leerstand } = $props();
</script>

<h1>Materialien</h1>
<p class="label">{materialien.length} Einträge aus dem Spiegel</p>

{#if leerstand}
  <p class="hinweis">{leerstand}</p>
{:else}
  <div class="raster">
    {#each materialien as material (material.id)}
      <Karte {material} />
    {/each}
  </div>
{/if}

<style>
  .raster {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
    margin-top: 1.5rem;
  }
</style>
