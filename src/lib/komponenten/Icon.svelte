<script module>
  /**
   * Inline-SVG statt Icon-Webfont (ADR-0004): nur die Icons, die das
   * Schaufenster braucht, als Rohtext aus @tabler/icons (MIT). Vite bündelt
   * allein die importierten Dateien.
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
  const ICONS = {
    'arrow-right': arrowRight, books, bulb, file, 'file-text': fileText,
    headphones, notebook, pencil, search, video, world
  };

  /** Icons, die es gibt — für Tests und Typprüfung. */
  export const ICON_NAMEN = Object.keys(ICONS);
</script>

<script>
  /** @type {{ name: string }} */
  let { name } = $props();
  const svg = $derived(ICONS[name] ?? ICONS.file);
</script>

<span class="ti ti-{name}" aria-hidden="true">{@html svg}</span>

<style>
  .ti { display: inline-flex; flex-shrink: 0; line-height: 1; vertical-align: -0.15em; }
  .ti :global(svg) { width: 1em; height: 1em; display: block; }
</style>
