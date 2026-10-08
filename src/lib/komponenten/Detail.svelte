<script>
  import Icon from './Icon.svelte';
  /**
   * `merken` (ADR-0008): Lesezeichen als POST-Formular, zurück auf diese Seite.
   * @type {{ material: import('$lib/models/material.js').Material, relays: string[], merken?: { schluessel: string, gemerkt: boolean }|null }}
   */
  let { material, relays, merken = null } = $props();
</script>

<article>
  <p class="label">{material.typ.label} · {material.stufe.label}</p>
  <h1>{material.name}</h1>
  {#if material.url}
    <p><a href={material.url} rel="external noopener">{material.url}</a></p>
  {/if}
  {#if merken}
    <form class="merken" method="post" action="/merkliste?/umschalten">
      <input type="hidden" name="m" value={merken.schluessel} />
      <input type="hidden" name="zurueck" value={material.pfad} />
      <button class="merken-btn" class:ist-gemerkt={merken.gemerkt} type="submit" aria-pressed={merken.gemerkt}>
        <Icon name={merken.gemerkt ? 'bookmark-gefuellt' : 'bookmark'} /> {merken.gemerkt ? 'Gemerkt' : 'Merken'}
      </button>
    </form>
  {/if}
  {#if material.bild}
    <img class="bild" src={material.bild} alt="" />
  {/if}
  {#if material.beschreibung}
    <p class="beschreibung">{material.beschreibung}</p>
  {/if}

  <dl>
    <dt>Herkunft</dt><dd>{material.herkunft}</dd>
    {#if material.lizenz}<dt>Lizenz</dt><dd><a href={material.lizenz} rel="license">{material.lizenzKuerzel ?? material.lizenz}</a></dd>{/if}
    {#if material.datum}<dt>Datum</dt><dd>{material.datum}</dd>{/if}
    {#if material.sprachen.length > 0}<dt>Sprache</dt><dd>{material.sprachen.join(', ')}</dd>{/if}
    {#if material.bildungsstufen.length > 0}<dt>Bildungsstufe</dt><dd>{material.bildungsstufen.map((b) => b.label).join(', ')}</dd>{/if}
    {#if material.faecher.length > 0}<dt>Fach / Thema</dt><dd>{material.faecher.map((b) => b.label).join(', ')}</dd>{/if}
    {#if material.ressourcentypen.length > 0}<dt>Materialart</dt><dd>{material.ressourcentypen.map((b) => b.label).join(', ')}</dd>{/if}
    {#if material.typen.length > 0}<dt>AMB-Typ</dt><dd>{material.typen.join(', ')}</dd>{/if}
  </dl>

  {#if material.schlagworte.length > 0}
    <ul class="metazeile">
      {#each material.schlagworte as wort (wort)}<li><span class="marker">{wort}</span></li>{/each}
    </ul>
  {/if}

  <details class="entwickler">
    <summary>Entwickleransicht</summary>
    <p>Event <code>{material.id}</code> von <code>{material.pubkey}</code>, kind 30142, d = <code>{material.d}</code>.</p>
    <p>Geliefert von: {relays.length > 0 ? relays.join(', ') : 'unbekannt (Stand aus der Datei)'}.</p>
    <p><a href={`${material.pfad}/json`}>Rohes Event als JSON</a></p>
  </details>
</article>

<style>
  h1 { font-size: var(--fs-700); margin-bottom: var(--sp-3); }
  .merken { margin: var(--sp-3) 0; }
  /* Wie im Prototyp: weiß mit Rand, gemerkt blau gefüllt. */
  .merken-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    background: var(--weiss);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: var(--sp-3) var(--sp-5);
    font: inherit;
    font-size: var(--fs-300);
    font-weight: 600;
    color: var(--text-dark);
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
  }
  .merken-btn:hover { border-color: var(--blue); }
  .merken-btn.ist-gemerkt { background: var(--blue); border-color: var(--blue); color: var(--weiss); }
  .bild { max-width: 100%; border-radius: var(--radius); border: 1px solid var(--fb-rahmen); margin: 1rem 0; }
  .beschreibung { font-size: 1.05rem; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.35rem 1.25rem; margin: 1.5rem 0; }
  dt { color: var(--fb-text-leise); }
  dd { margin: 0; }
  .entwickler { margin-top: 2rem; font-size: 0.9rem; color: var(--fb-text-leise); }
  .entwickler code { word-break: break-all; }
</style>
