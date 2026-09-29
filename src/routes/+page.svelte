<script>
  import Startseite from '$lib/komponenten/startseite/Startseite.svelte';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<svelte:head>
  <title>Materialpool Religion</title>
  <meta name="description" content="Materialien für Religionsunterricht, Kita, Gemeinde und Konfi-Arbeit — Schaufenster für AMB-Events (kind:30142) auf Nostr." />
</svelte:head>

<Startseite themen={data.themen} stufen={data.stufen} empfehlung={data.empfehlung} status={data.status} />
