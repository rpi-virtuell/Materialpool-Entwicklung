<script module>
  /**
   * Icons als SVG-Sprite (ADR-0004): die Pfade kommen einmal je Seite über
   * `IconSprite.svelte` ins Dokument, jedes Icon ist danach nur ein
   * `<use>`. Quelle: @tabler/icons (MIT), Vite bündelt allein die
   * importierten Dateien.
   */
  import arrowRight from '@tabler/icons/outline/arrow-right.svg?raw';
  import books from '@tabler/icons/outline/books.svg?raw';
  import bulb from '@tabler/icons/outline/bulb.svg?raw';
  import file from '@tabler/icons/outline/file.svg?raw';
  import fileText from '@tabler/icons/outline/file-text.svg?raw';
  import headphones from '@tabler/icons/outline/headphones.svg?raw';
  import notebook from '@tabler/icons/outline/notebook.svg?raw';
  import pencil from '@tabler/icons/outline/pencil.svg?raw';
  import search from '@tabler/icons/outline/search.svg?raw';
  import video from '@tabler/icons/outline/video.svg?raw';
  import world from '@tabler/icons/outline/world.svg?raw';

  /** @type {Record<string, string>} */
  const ROH = {
    'arrow-right': arrowRight, books, bulb, file, 'file-text': fileText,
    headphones, notebook, pencil, search, video, world
  };

  /** Icons, die es gibt — für Sprite, Tests und Typprüfung. */
  export const ICON_NAMEN = Object.keys(ROH);

  /**
   * Inhalt eines Icons ohne das äußere `<svg>` — für `<symbol>` im Sprite.
   * @param {string} name
   */
  export function iconPfade(name) {
    return (ROH[name] ?? ROH.file).replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  }
</script>

<script>
  /** @type {{ name: string }} */
  let { name } = $props();
  const gueltig = $derived(ICON_NAMEN.includes(name) ? name : 'file');
</script>

<svg class="ti ti-{gueltig}" aria-hidden="true" focusable="false"><use href="#ti-{gueltig}" /></svg>

<style>
  .ti { width: 1em; height: 1em; display: inline-block; flex-shrink: 0; vertical-align: -0.15em; }
</style>
