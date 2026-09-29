<script>
  import Icon from '../Icon.svelte';
  /** @type {{ empfehlung: import('$lib/routen/startseite.js').Empfehlung }} */
  let { empfehlung } = $props();
</script>

<a class="empfehlung-card" href={empfehlung.pfad} style="--cover-ink:{empfehlung.cover.ink};--cover-tint:{empfehlung.cover.tint}">
  <span class="empfehlung-card-cover">
    <Icon name={empfehlung.icon} />
    {#if empfehlung.bild}
      <img src={empfehlung.bild} alt="" fetchpriority="high" />
    {/if}
  </span>
  <span class="empfehlung-card-body">
    <span class="empfehlung-card-label">Aktuelle Empfehlung</span>
    <span class="empfehlung-card-title">{empfehlung.name}</span>
    {#if empfehlung.beschreibung}<span class="empfehlung-card-desc">{empfehlung.beschreibung}</span>{/if}
    <span class="empfehlung-card-cta">Material ansehen <Icon name="arrow-right" /></span>
  </span>
</a>

<style>
  .empfehlung-card {
    display: flex;
    align-items: stretch;
    width: 100%;
    min-height: 210px;
    background: var(--weiss);
    border: 1px solid var(--border);
    border-left: 6px solid var(--cover-ink);
    border-radius: 8px;
    overflow: hidden;
    text-align: left;
    text-decoration: none;
    transition: border-color 0.15s ease;
  }
  .empfehlung-card:hover { border-color: var(--cover-ink); }
  .empfehlung-card-cover {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 300px;
    flex-shrink: 0;
    background: var(--cover-tint);
    overflow: hidden;
  }
  /* Bild über dem Icon: fällt das Bild aus (alt=""), bleibt das Icon — ohne JavaScript. */
  .empfehlung-card-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .empfehlung-card-cover :global(.ti) { font-size: 48px; color: var(--cover-ink); opacity: 0.75; }
  .empfehlung-card-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--sp-2);
    min-width: 0;
    max-width: 62ch;
    padding: var(--sp-6) var(--sp-8);
  }
  .empfehlung-card-label { font-size: var(--fs-200); font-weight: 600; color: var(--cover-ink); }
  .empfehlung-card-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.015em;
    color: var(--text-dark);
  }
  .empfehlung-card-desc {
    font-size: var(--fs-300);
    line-height: 1.5;
    color: var(--text-body);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .empfehlung-card-cta {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    margin-top: var(--sp-1);
    font-size: var(--fs-300);
    font-weight: 600;
    color: var(--blue);
  }
  .empfehlung-card:hover .empfehlung-card-cta { text-decoration: underline; }
  @media (max-width: 640px) {
    .empfehlung-card { flex-direction: column; }
    .empfehlung-card-cover { width: 100%; height: 170px; }
    .empfehlung-card-body { padding: var(--sp-5); }
  }
</style>
