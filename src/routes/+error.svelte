<script>
  import { page } from '$app/state';
</script>

<main class="inhalt-schmal">
  <h1>{page.status}</h1>
  <p class="hinweis">{page.error?.message ?? 'Unbekannter Fehler.'}</p>
  <p><a href="/">Zur Startseite</a> · <a href="/materialien">Alle Materialien</a></p>
</main>
