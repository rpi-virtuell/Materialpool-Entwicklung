<script>
  import Icon from './Icon.svelte';
  /**
   * Listenkarte des Prototyps (Abschnitt 7): Cover mit Tint/Ink,
   * Icon-Marke, Titel mit Größenklasse, Fuß mit Art und Meta. Mit
   * `zurueck` ein Lesezeichen (ADR-0008): ein POST-Formular, das nach dem
   * Merken auf dieselbe Seite und an diese Karte zurückführt.
   * @type {{ karte: import('$lib/routen/uebersicht.js').Karte, zurueck?: string|null }}
   */
  let { karte, zurueck = null } = $props();
  const m = $derived(karte.material);
  const groesse = $derived(m.name.length <= 25 ? 'ist-gross' : m.name.length <= 45 ? 'ist-mittel' : 'ist-klein');
</script>

<article class="material-card" id="k-{karte.merkSchluessel}" style="--cover-ink:{karte.cover.ink};--cover-tint:{karte.cover.tint}">
  <a class="karten-cover" href={m.pfad} tabindex="-1" aria-hidden="true">
    <Icon name={karte.icon} />
    {#if m.bild}<img src={m.bild} alt="" loading="lazy" />{/if}
    <span class="karten-marke"><Icon name={karte.icon} /></span>
  </a>
  {#if zurueck}
    <form class="merken" method="post" action="/merkliste?/umschalten">
      <input type="hidden" name="m" value={karte.merkSchluessel} />
      <input type="hidden" name="zurueck" value="{zurueck}#k-{karte.merkSchluessel}" />
      <button
        class="merken-icon"
        class:ist-gemerkt={karte.gemerkt}
        type="submit"
        aria-pressed={karte.gemerkt}
        aria-label={karte.gemerkt ? `„${m.name}“ aus der Merkliste entfernen` : `„${m.name}“ merken`}
      ><Icon name={karte.gemerkt ? 'bookmark-gefuellt' : 'bookmark'} /></button>
    </form>
  {/if}
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
    position: relative;
    /* Nach dem Merken springt die Seite per Anker an die Karte; die feste
       Kopfzeile (64px) soll sie dabei nicht verdecken. */
    scroll-margin-top: calc(64px + var(--sp-4));
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
  /* Lesezeichen wie im Prototyp: zurückhaltend, bis man darauf zeigt;
     gemerkt voll deckend und gefüllt. */
  .merken { position: absolute; z-index: 2; top: var(--sp-2); right: var(--sp-2); margin: 0; }
  .merken-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 6px;
    background: var(--weiss);
    color: var(--cover-ink);
    font-size: 17px;
    opacity: 0.7;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .merken-icon:hover,
  .merken-icon.ist-gemerkt { opacity: 1; }
  .merken-icon:focus-visible { outline: 2px solid var(--cover-ink); outline-offset: 2px; opacity: 1; }
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
