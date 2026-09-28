<script>
  import { page } from '$app/state';
</script>

<h1>{page.status}</h1>
<p class="hinweis">{page.error?.message ?? 'Unbekannter Fehler.'}</p>
<p><a href="/">Zur Übersicht</a></p>
