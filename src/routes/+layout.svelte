<script>
  import '../app.css';
  import { page } from '$app/state';
  import Kopfzeile from '$lib/komponenten/Kopfzeile.svelte';
  import Fusszeile from '$lib/komponenten/Fusszeile.svelte';

  /** @type {{ children: import('svelte').Snippet, data: import('./$types').LayoutData }} */
  let { children, data } = $props();
</script>

<Kopfzeile />
<main class:breit={page.data.breit === true}>
  {@render children()}
</main>
<Fusszeile spiegelstand={data.spiegelstand} />

<style>
  main {
    max-width: var(--breite-schmal);
    margin: 0 auto;
    padding: 32px 24px 48px;
  }
  main.breit {
    max-width: var(--breite-raster);
  }
</style>
