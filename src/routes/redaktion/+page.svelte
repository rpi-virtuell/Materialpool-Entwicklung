<script>
  import Redaktion from '$lib/komponenten/Redaktion.svelte';
  /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
  let { data, form } = $props();
</script>

<svelte:head>
  <title>Hinweise — Materialpool Religion</title>
  <!-- Nicht in der Kopfzeile, keine Seite für Suchmaschinen (ADR-0011). -->
  <meta name="robots" content="noindex" />
</svelte:head>

<Redaktion offen={data.offen} ausgeblendet={data.ausgeblendet} toteLinks={data.toteLinks} zugang={data.zugang} kennwortNoetig={data.kennwortNoetig} fehler={form?.fehler ?? null} />
