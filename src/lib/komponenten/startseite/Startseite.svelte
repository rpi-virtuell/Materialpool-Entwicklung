<script>
  import Icon from '../Icon.svelte';
  import EmpfehlungCard from './EmpfehlungCard.svelte';
  import HeroZielgruppe from './HeroZielgruppe.svelte';
  import StufenKacheln from './StufenKacheln.svelte';
  import ThemenRow from './ThemenRow.svelte';

  /**
   * Startseite nach dem Prototyp (Abschnitt 5), gerendert aus dem Spiegel
   * (ADR-0004). Suche ist ein GET-Formular auf /materialien.
   * @type {ReturnType<typeof import('$lib/routen/startseite.js').startseiteLaden>}
   */
  let { themen, stufen, empfehlung, status } = $props();
</script>

<main class="home-page">
  <section class="home-kopf">
    <div class="home-inner">
      <h1>Materialpool Religion <HeroZielgruppe /></h1>
      <p class="hero-sub">Finde passende und aktuelle Materialien für deine Arbeit.</p>
      <form class="hero-search" action="/materialien" method="get" role="search">
        <Icon name="search" />
        <input type="search" name="q" placeholder="z.B. Schöpfung, Reformation, Pfingsten …" aria-label="Materialien durchsuchen" />
        <button type="submit">Suchen</button>
      </form>
      <ThemenRow {themen} />
    </div>
  </section>

  <section class="stufen-section">
    <div class="home-inner">
      <h2>Nach Alter einsteigen</h2>
      <StufenKacheln {stufen} />
    </div>
  </section>

  <section class="empfehlung-section">
    <div class="home-inner">
      {#if empfehlung}
        <EmpfehlungCard {empfehlung} />
      {:else if status}
        <p class="status-hint" class:status-warn={status.warnung}>{status.text}</p>
      {/if}
      <a class="hero-browse" href="/materialien"><Icon name="books" /> Alle Materialien durchstöbern</a>
    </div>
  </section>
</main>

<style>
  .home-page { background: var(--weiss); }
  .home-inner {
    position: relative;
    z-index: 1;
    max-width: var(--content-max);
    margin: 0 auto;
    padding: 0 var(--gutter);
  }
  .home-kopf {
    background: var(--blue);
    color: var(--weiss);
    padding: var(--sp-10) 0 var(--sp-15);
  }
  .home-kopf h1 {
    font-size: clamp(26px, 5.5vw, 52px);
    -webkit-hyphens: auto;
    hyphens: auto;
    line-height: 1.08;
    letter-spacing: -0.025em;
    color: var(--weiss);
    margin-bottom: var(--sp-4);
  }
  .hero-sub { color: var(--weiss-88); font-size: var(--fs-500); margin-bottom: var(--sp-8); }
  .hero-search {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    max-width: 680px;
    margin: 0 0 var(--sp-5);
    background: var(--weiss);
    border-radius: 6px;
    padding: var(--sp-2) var(--sp-2) var(--sp-2) var(--sp-4);
  }
  .hero-search :global(.ti) { color: var(--text-muted); font-size: 20px; }
  .hero-search input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    font-size: var(--fs-400);
    color: var(--text-body);
    padding: var(--sp-3) 0;
    background: none;
  }
  .hero-search button {
    background: var(--blue-dark);
    color: var(--weiss);
    border: none;
    border-radius: 4px;
    padding: var(--sp-3) var(--sp-6);
    font-weight: 600;
    font-size: var(--fs-300);
    min-height: 44px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .hero-search button:hover { background: var(--blue-darker); }
  .stufen-section { padding: var(--sp-10) 0 0; }
  .stufen-section h2 {
    font-size: 22px;
    letter-spacing: -0.015em;
    color: var(--text-dark);
    margin-bottom: var(--sp-5);
  }
  .empfehlung-section { padding: var(--sp-10) 0 var(--sp-15); }
  .empfehlung-section .home-inner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-6);
  }
  .empfehlung-section .status-hint { width: 100%; }
  .hero-browse {
    border-bottom: 1.5px solid var(--unterstrich);
    color: var(--text-dark);
    font-weight: 600;
    font-size: var(--fs-400);
    padding: var(--sp-2) 0;
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    text-decoration: none;
    transition: border-color 0.15s ease;
  }
  .hero-browse:hover { border-bottom-color: var(--text-dark); }
  .home-kopf :global(:focus-visible),
  .hero-search:focus-within { outline: 2px solid var(--weiss); outline-offset: 2px; }
  .hero-search button:focus-visible { outline: 2px solid var(--blue-dark); outline-offset: 2px; }
  @media (max-width: 960px) {
    .home-kopf { padding: var(--sp-10) 0 var(--sp-10); }
  }
  @media (max-width: 640px) {
    .home-inner { padding: 0 var(--sp-4); }
    .home-kopf { padding: var(--sp-8) 0 var(--sp-8); }
    .hero-sub { font-size: var(--fs-400); margin-bottom: var(--sp-5); }
    .empfehlung-section { padding-bottom: var(--sp-10); }
  }
</style>
