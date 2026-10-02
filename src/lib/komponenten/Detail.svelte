<script>
  import Icon from './Icon.svelte';
  /**
   * Detailseite nach dem Prototyp Materialpool 2.0: eine Lesespalte, oben
   * dasselbe Cover wie auf der Karte, von der man kommt (Tinte, Tönung,
   * Typ-Marke, Titel darin), darunter Herkunft, Beschreibung, „Material
   * öffnen“ und „Merken“ (ADR-0008), dann die Angaben als benannte Liste.
   * Die Rohdaten bleiben in der Entwickleransicht.
   * @type {{
   *   material: import('$lib/models/material.js').Material,
   *   relays: string[],
   *   cover: { ink: string, tint: string },
   *   icon: string,
   *   zurueck?: string,
   *   merken?: { schluessel: string, gemerkt: boolean }|null
   * }}
   */
  let { material, relays, cover, icon, zurueck = '/materialien', merken = null } = $props();
  const begriffe = (/** @type {{ label: string }[]} */ liste) => liste.map((b) => b.label).join(', ');
</script>

<article class="detail" style="--cover-ink:{cover.ink};--cover-tint:{cover.tint}">
  <a class="zurueck" href={zurueck}><Icon name="arrow-left" /> Zurück</a>

  <!-- Ein Bild liegt hier wie auf der Karte nur als Textur dahinter,
       weichgezeichnet und von der Tönung überdeckt: Viele Vorschaubilder
       sind Titelfolien mit eigener Schlagzeile, die sonst mit dem Titel
       streiten würde. Fällt das Bild aus, bleibt die Tönung — ohne JS. -->
  <header class="detail-cover" class:hat-bild={material.bild}>
    {#if material.bild}<img class="detail-cover-bild" src={material.bild} alt="" />{/if}
    <span class="detail-cover-marke"><Icon name={icon} /></span>
    <div class="detail-cover-text">
      <p class="detail-art">{material.typ.label}</p>
      <h1>{material.name}</h1>
    </div>
  </header>

  <p class="detail-von">{material.herkunft}</p>
  <p class="detail-beschreibung">{material.beschreibung || 'Keine Beschreibung vorhanden.'}</p>

  <div class="detail-aktionen">
    {#if material.url}
      <a class="knopf-primaer" href={material.url} rel="external noopener"><Icon name="external-link" /> Material öffnen</a>
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
  </div>

  <!-- Benannte Zeilen statt gleich aussehender Pillen: jede Angabe sagt,
       was sie ist (Prototyp). -->
  <dl class="detail-angaben">
    <dt>Bildungsstufe</dt>
    <dd>{material.bildungsstufen.length > 0 ? begriffe(material.bildungsstufen) : 'nicht angegeben'}</dd>
    {#if material.faecher.length > 0}<dt>Fach</dt><dd>{begriffe(material.faecher)}</dd>{/if}
    {#if material.ressourcentypen.length > 0}<dt>Materialart</dt><dd>{begriffe(material.ressourcentypen)}</dd>{/if}
    {#if material.lizenz}<dt>Lizenz</dt><dd><a href={material.lizenz} rel="license">{material.lizenzKuerzel ?? material.lizenz}</a></dd>{/if}
    {#if material.datum}<dt>Datum</dt><dd>{material.datum}</dd>{/if}
    {#if material.sprachen.length > 0}<dt>Sprache</dt><dd>{material.sprachen.join(', ')}</dd>{/if}
    {#if material.schlagworte.length > 0}<dt>Schlagworte</dt><dd>{material.schlagworte.join(' · ')}</dd>{/if}
  </dl>

  <details class="entwickler">
    <summary>Entwickleransicht</summary>
    <p>Event <code>{material.id}</code> von <code>{material.pubkey}</code>, kind 30142, d = <code>{material.d}</code>.</p>
    {#if material.typen.length > 0}<p>AMB-Typ: {material.typen.join(', ')}</p>{/if}
    <p>Geliefert von: {relays.length > 0 ? relays.join(', ') : 'unbekannt (Stand aus der Datei)'}.</p>
    <p><a href={`${material.pfad}/json`}>Rohes Event als JSON</a></p>
  </details>
</article>

<style>
  /* Lesespalte, schmaler als das Listenraster: Bei voller Breite wird die
     Beschreibung zur Bleiwüste (Prototyp, detail.css). */
  .detail { max-width: 760px; margin: 0 auto; padding: var(--sp-6) var(--gutter) var(--sp-15); }
  .zurueck {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    padding: var(--sp-2) 0;
    margin-bottom: var(--sp-4);
    font-size: var(--fs-300);
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.12s ease;
  }
  .zurueck:hover { color: var(--text-dark); }

  /* Dieselbe Mechanik wie die Karte: die Tönung trägt die Fläche, der Titel
     steht in ihr, die Materialart sitzt als Marke in der Ecke. Kein festes
     Seitenverhältnis — 16:9 wären auf 760 px über 400 px Farbe. */
  .detail-cover {
    position: relative;
    display: flex;
    align-items: flex-end;
    min-height: 240px;
    padding: var(--sp-8);
    margin-bottom: var(--sp-5);
    border-radius: 6px;
    background: var(--cover-tint);
    overflow: hidden;
  }
  .detail-cover-bild {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.32;
    filter: blur(10px);
    transform: scale(1.12);
  }
  /* Die Tönung liegt über dem Bild, damit der Titel auf jedem Motiv lesbar
     bleibt. */
  .detail-cover.hat-bild::after { content: ''; position: absolute; inset: 0; background: var(--cover-tint); opacity: 0.68; }
  .detail-cover-marke { position: absolute; z-index: 1; top: var(--sp-5); right: var(--sp-5); font-size: 26px; color: var(--cover-ink); opacity: 0.75; }
  .detail-cover-text { position: relative; z-index: 1; }
  .detail-art { margin: 0 0 var(--sp-2); font-size: var(--fs-200); font-weight: 600; color: var(--cover-ink); }
  h1 {
    font-size: 34px;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--cover-ink);
    text-wrap: pretty;
    overflow-wrap: anywhere;
    -webkit-hyphens: auto;
    hyphens: auto;
  }
  .detail-von { margin: 0 0 var(--sp-6); font-size: var(--fs-300); color: var(--text-muted); }
  .detail-beschreibung { margin: 0 0 var(--sp-6); font-size: var(--fs-400); line-height: 1.7; white-space: pre-line; color: var(--text-body); }

  .detail-aktionen { display: flex; flex-wrap: wrap; gap: var(--sp-3); margin-bottom: var(--sp-8); }
  .merken { margin: 0; display: contents; }
  .knopf-primaer,
  .merken-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    border-radius: 5px;
    padding: var(--sp-3) var(--sp-5);
    font: inherit;
    font-size: var(--fs-300);
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  .knopf-primaer { background: var(--blue); border: 1px solid var(--blue); color: var(--weiss); }
  .knopf-primaer:hover { background: var(--blue-dark); border-color: var(--blue-dark); }
  /* Wie im Prototyp: weiß mit Rand, gemerkt blau gefüllt. */
  .merken-btn { background: var(--weiss); border: 1px solid var(--border); color: var(--text-dark); }
  .merken-btn:hover { border-color: var(--blue); }
  .merken-btn.ist-gemerkt { background: var(--blue); border-color: var(--blue); color: var(--weiss); }

  .detail-angaben {
    display: grid;
    grid-template-columns: 130px 1fr;
    gap: var(--sp-3) var(--sp-4);
    margin: 0;
    padding-top: var(--sp-5);
    border-top: 1px solid var(--border);
    font-size: var(--fs-300);
  }
  .detail-angaben dt { color: var(--text-muted); }
  .detail-angaben dd { margin: 0; color: var(--text-dark); overflow-wrap: anywhere; }
  .detail-angaben a { color: var(--blue); }

  .entwickler { margin-top: var(--sp-8); font-size: var(--fs-200); color: var(--text-muted); }
  .entwickler summary { cursor: pointer; }
  .entwickler code { word-break: break-all; }

  @media (max-width: 960px) {
    .detail { padding: var(--sp-5) var(--gutter) var(--sp-10); }
    .detail-cover { padding: var(--sp-6); }
  }
  @media (max-width: 640px) {
    .detail { padding: var(--sp-4) var(--sp-4) var(--sp-10); }
    .detail-cover { min-height: 180px; padding: var(--sp-5); }
    h1 { font-size: 26px; }
    /* Nebeneinander bleiben auf 320 px vom Knopf „Material öffnen“ drei
       Buchstaben übrig — untereinander, volle Breite. */
    .knopf-primaer,
    .merken-btn { flex: 1 1 100%; justify-content: center; }
    /* Eine 130-px-Spalte für die Bezeichnung frisst auf dem Handy die
       halbe Zeile. */
    .detail-angaben { grid-template-columns: 1fr; gap: 0; }
    .detail-angaben dd { margin-bottom: var(--sp-4); }
    .detail-angaben dd:last-child { margin-bottom: 0; }
  }
</style>
