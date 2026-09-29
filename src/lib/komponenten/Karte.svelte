<script>
  import Icon from './Icon.svelte';
  /**
   * Listenkarte des Prototyps (Abschnitt 7): Cover mit Tint/Ink,
   * Icon-Marke, Titel mit Größenklasse, Fuß mit Art und Meta.
   * @type {{ karte: import('$lib/routen/uebersicht.js').Karte }}
   */
  let { karte } = $props();
  const m = $derived(karte.material);
  const groesse = $derived(m.name.length <= 25 ? 'ist-gross' : m.name.length <= 45 ? 'ist-mittel' : 'ist-klein');
</script>

<article class="material-card" style="--cover-ink:{karte.cover.ink};--cover-tint:{karte.cover.tint}">
  <a class="karten-cover" href={m.pfad} tabindex="-1" aria-hidden="true">
    <Icon name={karte.icon} />
    {#if m.bild}<img src={m.bild} alt="" loading="lazy" />{/if}
    <span class="karten-marke"><Icon name={karte.icon} /></span>
  </a>
  <div class="karten-body">
    <h2 class="karten-titel {groesse}"><a href={m.pfad}>{m.name}</a></h2>
    <p class="karten-fuss">
      <span class="karten-art">{m.typ.label}</span>
      <span class="karten-meta">{m.herkunft} · {m.stufe.label}</span>
    </p>
  </div>
</article>

<style>
  .material-card {
    display: flex;
    flex-direction: column;
    background: var(--weiss);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.15s ease;
  }
  .material-card:hover { border-color: var(--cover-ink); }
  .karten-cover {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 9;
    background: var(--cover-tint);
    color: var(--cover-ink);
    overflow: hidden;
  }
  /* Bild über dem Icon: fällt das Bild aus (alt=""), bleibt das Icon — ohne JavaScript. */
  .karten-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .karten-cover > :global(.ti) { font-size: 40px; opacity: 0.75; }
  .karten-marke {
    position: absolute;
    z-index: 1;
    top: var(--sp-3);
    left: var(--sp-3);
    display: inline-flex;
    padding: var(--sp-1);
    border-radius: 6px;
    background: var(--weiss);
    color: var(--cover-ink);
    font-size: 16px;
  }
  .karten-body { display: flex; flex-direction: column; gap: var(--sp-2); padding: var(--sp-4); }
  .karten-titel { line-height: 1.2; letter-spacing: -0.015em; }
  .karten-titel a { text-decoration: none; color: var(--text-dark); }
  .karten-titel a:hover { text-decoration: underline; }
  .ist-gross { font-size: 22px; }
  .ist-mittel { font-size: 18px; }
  .ist-klein { font-size: 16px; }
  .karten-fuss { display: flex; flex-direction: column; gap: 2px; margin: 0; font-size: var(--fs-200); }
  .karten-art { font-weight: 600; color: var(--cover-ink); }
  .karten-meta { color: var(--text-muted); }
</style>
