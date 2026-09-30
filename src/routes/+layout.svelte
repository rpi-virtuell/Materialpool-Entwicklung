<script>
  import '../app.css';
  import { page } from '$app/state';
  import IconSprite from '$lib/komponenten/IconSprite.svelte';
  import Kopfzeile from '$lib/komponenten/Kopfzeile.svelte';
  import Farbschalter from '$lib/komponenten/Farbschalter.svelte';
  import Fusszeile from '$lib/komponenten/Fusszeile.svelte';

  /** @type {{ children: import('svelte').Snippet, data: import('./$types').LayoutData }} */
  let { children, data } = $props();

  const aktiv = $derived(
    page.url.pathname === '/'
      ? 'start'
      : page.url.pathname.startsWith('/materialien')
        ? 'liste'
        : page.url.pathname.startsWith('/konto')
          ? 'konto'
          : null
  );
  // CI-Farbe (Prototyp 9) als Inline-Variablen auf dem Rahmen: erbt in
  // Kopf, Seite und Fuß und liegt vor den Tokens aus app.css. Werte sind
  // in ciFarbeLesen auf #RRGGBB geprüft.
  const ciStil = $derived(data.ci ? `--blue:${data.ci.blue};--blue-dark:${data.ci.blueDark}` : undefined);
</script>

<div class="rahmen" style={ciStil}>
  <IconSprite />
  <Kopfzeile {aktiv} kopf={data.kopf} />
  {@render children()}
  <Fusszeile spiegelstand={data.spiegelstand} />
  <Farbschalter schalter={data.farbschalter} />
</div>

<style>
  .rahmen { display: contents; }
</style>
