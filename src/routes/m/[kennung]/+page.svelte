<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  import { kuerzen } from '$lib/models/text.js';
  /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
  let { data, form } = $props();
  // Nach einer abgelehnten Meldung (ADR-0011): Formular offen, mit Eingabe und Fehler.
  const melden = $derived(
    data.melden?.formular && form?.melden
      ? { ...data.melden, formular: { ...data.melden.formular, ...form.melden, offen: true } }
      : data.melden
  );
</script>

<svelte:head>
  <title>{data.material.name} — Materialpool Religion</title>
  {#if data.material.beschreibung}<meta name="description" content={kuerzen(data.material.beschreibung, 200)} />{/if}
</svelte:head>

<main class="detail-page">
  <Detail material={data.material} relays={data.relays} cover={data.cover} icon={data.icon} zurueck={data.zurueck} merken={data.merken} linkWeg={data.linkWeg} {melden} />
</main>

<style>
  .detail-page { background: var(--weiss); }
</style>
