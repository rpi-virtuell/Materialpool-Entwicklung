<script>
  import Icon from './Icon.svelte';
  /**
   * Rahmen des Prototyps (Abschnitt 6): Logo → Start, „Stöbern“ → Liste.
   * Keine Merkliste, kein „Gemerkt“ (ADR-0004). Navigation sind Links.
   * @type {{ aktiv: 'start'|'liste'|null }}
   */
  let { aktiv } = $props();
</script>

<header class="site-header">
  <a class="logo" href="/"><Icon name="books" /> Materialpool Religion</a>
  <nav class="site-nav" aria-label="Hauptnavigation">
    <a href="/materialien" class:active={aktiv === 'liste'} aria-label="Stöbern" aria-current={aktiv === 'liste' ? 'page' : undefined}>
      <Icon name="search" /><span>Stöbern</span>
    </a>
  </nav>
</header>

<style>
  .site-header {
    display: flex;
    align-items: center;
    gap: var(--sp-6);
    padding: 0 var(--sp-6);
    height: 64px;
    background: var(--blue);
    color: var(--weiss);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    white-space: nowrap;
    color: var(--weiss);
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.01em;
    text-decoration: none;
  }
  .site-nav {
    display: flex;
    gap: var(--sp-6);
    margin-left: auto;
  }
  .site-nav a {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
    border-bottom: 2px solid transparent;
    color: var(--weiss-70);
    font-size: var(--fs-300);
    font-weight: 500;
    padding: 9px 4px;
    text-decoration: none;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .site-nav a:hover { color: var(--weiss); }
  .site-nav a.active {
    color: var(--weiss);
    font-weight: 600;
    border-bottom-color: var(--weiss);
  }
  .site-header :global(:focus-visible) { outline-color: var(--weiss); }
  @media (max-width: 640px) {
    .site-header { padding: 0 var(--sp-4); gap: var(--sp-3); }
    .logo { font-size: 17px; }
    .site-nav { gap: var(--sp-4); }
    .site-nav a span { display: none; }
  }
</style>
