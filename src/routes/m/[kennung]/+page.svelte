<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.material.name} — Materialpool Religion</title>
  {#if data.material.beschreibung}<meta name="description" content={data.material.beschreibung.slice(0, 200)} />{/if}
</svelte:head>

<main class="detail-page">
  <Detail material={data.material} relays={data.relays} cover={data.cover} icon={data.icon} zurueck={data.zurueck} merken={data.merken} />
</main>

<style>
  .detail-page { background: var(--weiss); }
</style>
