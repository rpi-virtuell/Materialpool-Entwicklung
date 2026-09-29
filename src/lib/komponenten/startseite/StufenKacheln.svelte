<script>
  import Icon from '../Icon.svelte';
  /** @type {{ stufen: import('$lib/routen/startseite.js').Stufe[] }} */
  let { stufen } = $props();
</script>

<div class="stufen-kacheln">
  {#each stufen as stufe (stufe.key)}
    <a class="stufe-kachel" href={stufe.pfad} style="--kachel-color:{stufe.farbe};--kachel-text:{stufe.text}">
      <span class="stufe-kachel-name">{stufe.label}</span>
      <Icon name="arrow-right" />
    </a>
  {/each}
</div>

<style>
  .stufen-kacheln {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--sp-3);
  }
  .stufe-kachel {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--sp-3);
    min-height: 132px;
    background: var(--kachel-color);
    color: var(--kachel-text);
    border-radius: 8px;
    padding: var(--sp-5);
    text-align: left;
    text-decoration: none;
    transition: filter 0.15s ease;
  }
  .stufe-kachel:hover { filter: brightness(0.92); }
  .stufe-kachel-name {
    min-width: 0;
    overflow-wrap: break-word;
    -webkit-hyphens: auto;
    hyphens: auto;
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.015em;
  }
  .stufe-kachel :global(.ti) { font-size: 20px; opacity: 0.8; }
  @media (max-width: 960px) {
    .stufen-kacheln { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .stufen-kacheln { grid-template-columns: 1fr; gap: var(--sp-2); }
    .stufe-kachel { min-height: 84px; align-items: center; }
  }
</style>
