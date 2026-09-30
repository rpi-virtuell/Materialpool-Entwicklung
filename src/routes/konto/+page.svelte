<script>
  import Konto from '$lib/komponenten/Konto.svelte';
  /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
  let { data, form } = $props();
</script>

<svelte:head>
  <title>{data.konto.angemeldet ? 'Dein Profil' : 'Anmelden'} — Materialpool Religion</title>
</svelte:head>

<Konto seite={data} gespeichert={data.gespeichert} fehler={form?.fehler ?? null} />
