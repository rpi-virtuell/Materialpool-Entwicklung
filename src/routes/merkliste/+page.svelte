<script>
  import Merkliste from '$lib/komponenten/Merkliste.svelte';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<svelte:head>
  <title>Gemerkt — Materialpool Religion</title>
</svelte:head>

<Merkliste karten={data.karten} fehlend={data.fehlend} />
