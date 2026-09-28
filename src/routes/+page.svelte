<script>
  import Uebersicht from '$lib/komponenten/Uebersicht.svelte';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<svelte:head>
  <title>Materialpool-Entwicklung</title>
  <meta name="description" content="Schaufenster für Materialien als AMB-Events auf Nostr — Entwicklungsstand des rpi-virtuell-Materialpools." />
</svelte:head>

<Uebersicht materialien={data.materialien} leerstand={data.leerstand} />
