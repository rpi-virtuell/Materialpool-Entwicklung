<script>
  /** @type {{ material: import('$lib/models/material.js').Material }} */
  let { material } = $props();
  const kurz = $derived(
    material.beschreibung.length > 220 ? `${material.beschreibung.slice(0, 217)}…` : material.beschreibung
  );
</script>

<article class="karte">
  {#if material.bild}
    <a class="bild" href={material.pfad} tabindex="-1" aria-hidden="true">
      <img src={material.bild} alt="" loading="lazy" />
    </a>
  {/if}
  <div class="text">
    {#if material.herausgeber.length > 0}
      <p class="label">{material.herausgeber.join(', ')}</p>
    {/if}
    <h2><a href={material.pfad}>{material.name}</a></h2>
    {#if kurz}<p class="anriss">{kurz}</p>{/if}
    <ul class="metazeile">
      {#if material.lizenzKuerzel}<li><span class="marker">{material.lizenzKuerzel}</span></li>{/if}
      {#each material.bildungsstufen as stufe (stufe.id)}<li><span class="marker">{stufe.label}</span></li>{/each}
    </ul>
  </div>
</article>

<style>
  .karte {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--fb-rahmen);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--fb-weiss);
    transition: transform var(--uebergang), border-color var(--uebergang);
  }
  .karte:hover { transform: translateY(-2px); border-color: var(--fb-primaer); }
  .bild { display: block; aspect-ratio: 16 / 10; background: var(--fb-flaeche); }
  .bild img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .text { padding: 1rem; }
  h2 a { text-decoration: none; color: var(--fb-ueberschrift); }
  h2 a:hover { text-decoration: underline; }
  .anriss { margin: 0.5rem 0 0; color: var(--fb-text); }
</style>
