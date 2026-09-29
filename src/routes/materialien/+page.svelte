<script>
  import Uebersicht from '$lib/komponenten/Uebersicht.svelte';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
  const titel = $derived(data.filter.q ? `„${data.filter.q}“ — Materialpool Religion` : 'Alle Materialien — Materialpool Religion');
</script>

<svelte:head>
  <title>{titel}</title>
  <meta name="description" content="Alle Materialien des Materialpools Religion zum Durchstöbern, nach Bildungsstufe und Stichwort." />
</svelte:head>

<Uebersicht karten={data.karten} treffer={data.treffer} seiten={data.seiten} filter={data.filter} pillen={data.pillen} facetten={data.facetten} sortierungen={data.sortierungen} suche={data.suche} gesamt={data.gesamt} leerstand={data.leerstand} />
