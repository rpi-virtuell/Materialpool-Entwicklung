<script>
  import Ausgeblendet from '$lib/komponenten/Ausgeblendet.svelte';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<svelte:head>
  <title>Ausgeblendete Materialien — Materialpool Religion</title>
  <!-- Erreichbar für alle, aber keine Seite für Suchmaschinen (ADR-0010). -->
  <meta name="robots" content="noindex" />
</svelte:head>

<Ausgeblendet eintraege={data.eintraege} />
