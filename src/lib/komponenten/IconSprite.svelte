<script>
  import { ICON_NAMEN, iconPfade } from './Icon.svelte';
  /**
   * Einmal je Seite im Layout: ein `<symbol>` je Icon. Strich-Attribute
   * stehen hier, nicht an jedem `<use>`. Das Sprite ist unsichtbar; die
   * Referenzen aus `Icon.svelte` funktionieren trotzdem.
   */
</script>

<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  {#each ICON_NAMEN as name (name)}
    <symbol id="ti-{name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html iconPfade(name)}</symbol>
  {/each}
</svg>
