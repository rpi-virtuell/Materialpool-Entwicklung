<header>
  <div class="innen">
    <a class="wortmarke" href="/">Materialpool<span>-Entwicklung</span></a>
    <nav aria-label="Hauptnavigation">
      <a href="/">Materialien</a>
      <a href="https://git.rpi-virtuell.de/Comenius-Institut/Materialpool-Entwicklung" rel="external">Repository</a>
    </nav>
  </div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--fb-flaeche-2);
    border-bottom: 3px solid var(--fb-akzent);
  }
  .innen {
    max-width: var(--breite-raster);
    margin: 0 auto;
    padding: 0.75rem 24px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .wortmarke {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--fb-ueberschrift);
    text-decoration: none;
  }
  .wortmarke span { font-weight: 400; color: var(--fb-text-leise); }
  nav { display: flex; gap: 1rem; }
  nav a { text-decoration: none; }
  nav a:hover { text-decoration: underline; }
</style>
