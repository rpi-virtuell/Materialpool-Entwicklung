<script>
  import { datumDeutsch, spracheName, zielName } from '$lib/models/anzeige.js';
  import Icon from './Icon.svelte';
  /**
   * Detailseite nach dem Prototyp Materialpool 2.0: eine Lesespalte, oben
   * dasselbe Cover wie auf der Karte, von der man kommt (Tinte, Tönung,
   * Typ-Marke, Titel darin), darunter Herkunft, Beschreibung, „Material
   * öffnen“ und „Merken“ (ADR-0008), dann die Angaben als benannte Liste.
   * Keine Entwickleransicht mehr (Christina, 26.10.2026): Sie stammte aus
   * dem ersten Gerüst und war nie für Lehrkräfte gedacht.
   * @type {{
   *   material: import('$lib/models/material.js').Material,
   *   cover: { ink: string, tint: string },
   *   icon: string,
   *   zurueck?: string,
   *   merken?: { schluessel: string, gemerkt: boolean }|null,
   *   linkWeg?: boolean,
   *   melden?: ReturnType<typeof import('$lib/routen/meldungen.js').meldenBilden>
   * }}
   * `linkWeg`: Die Link-Prüfung hat den Link zweimal nicht gefunden
   * (ADR-0010) — Hinweis statt „Material öffnen“.
   * `melden`: Meldefunktion (ADR-0011) — Hinweis, ob gemeldet, und das
   * Formular; ausgeblendet ebenfalls ohne „Material öffnen“.
   */
  let { material, cover, icon, zurueck = '/materialien', merken = null, linkWeg = false, melden = null } = $props();
  const oeffnenZeigen = $derived(material.url && !linkWeg && !melden?.ausgeblendet);
  const begriffe = (/** @type {{ label: string }[]} */ liste) => liste.map((b) => b.label).join(', ');
  // Das Ziel nur nennen, wenn es nicht schon dasteht — sonst liest man
  // dieselbe Adresse dreimal (Herkunft, Beschreibung, Knopf).
  const ziel = $derived.by(() => {
    const name = zielName(material.url);
    if (!name) return null;
    const schonDa = `${material.herkunft} ${material.beschreibung}`.toLowerCase();
    return schonDa.includes(name) ? null : name;
  });
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

  {#if linkWeg}
    <p class="detail-linkweg" role="note">Der Link zu diesem Material war zuletzt nicht erreichbar.</p>
  {/if}
  {#if melden?.hinweis}
    <p class="detail-linkweg" role="note">{melden.hinweis}</p>
  {/if}

  <div class="detail-aktionen">
    {#if oeffnenZeigen}
      <!-- Wohin es geht, steht klein darunter: Man verlässt den Materialpool
           (Christina, 09.10.2026). Derselbe Tab, kein target. -->
      <div class="oeffnen">
        <a class="knopf-primaer" href={material.url} rel="external noopener" aria-describedby={ziel ? 'oeffnen-ziel' : undefined}><Icon name="external-link" /> Material öffnen</a>
        {#if ziel}<span class="oeffnen-ziel" id="oeffnen-ziel">auf {ziel}</span>{/if}
      </div>
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
    {#if material.lizenzUrl}<dt>Lizenz</dt><dd><a href={material.lizenzUrl} rel="license">{material.lizenzKuerzel ?? material.lizenzUrl}</a></dd>
    {:else if material.lizenz}<dt>Lizenz</dt><dd>{material.lizenzKuerzel ?? material.lizenz}</dd>{/if}
    {#if material.datum}<dt>Datum</dt><dd>{datumDeutsch(material.datum)}</dd>{/if}
    {#if material.sprachen.length > 0}<dt>Sprache</dt><dd>{material.sprachen.map(spracheName).join(', ')}</dd>{/if}
    {#if material.schlagworte.length > 0}<dt>Schlagworte</dt><dd>{material.schlagworte.join(' · ')}</dd>{/if}
  </dl>

  {#if melden?.gemeldetHier}
    <p class="melden-dank" id="melden">Danke für deine Meldung! Die Redaktion sieht sie sich an.</p>
  {:else if melden?.formular}
    {@const f = melden.formular}
    <!-- Aufklappen ohne JavaScript; nach einem Fehler steht es offen. Das
         Fangfeld sehen Menschen nicht, Spam-Programme füllen es aus. -->
    <details class="melden" id="melden" open={f.offen}>
      <summary class="melden-auf">Stimmt etwas nicht? Melden</summary>
      <form method="post" action={f.aktion}>
        {#if f.fehler}<p class="melden-fehler" role="alert">{f.fehler}</p>{/if}
        <fieldset>
          <legend>Was stimmt nicht?</legend>
          {#each f.gruende as g (g.key)}
            <label class="melden-grund"><input type="radio" name="grund" value={g.key} checked={f.werte.grund === g.key} required /> {g.label}</label>
          {/each}
        </fieldset>
        <label class="melden-feld" for="melden-begruendung">Kurze Begründung</label>
        <p class="melden-klein" id="melden-hilfe">Bitte keine Namen, E-Mail-Adressen oder Telefonnummern.</p>
        <textarea id="melden-begruendung" name="begruendung" rows="4" maxlength="1000" required aria-describedby="melden-hilfe">{f.werte.begruendung}</textarea>
        <div class="melden-falle" aria-hidden="true">
          <label>Webseite (bitte leer lassen) <input type="text" name="webseite" autocomplete="off" tabindex="-1" /></label>
        </div>
        <input type="hidden" name="stempel" value={f.stempel} />
        <button class="melden-btn" type="submit">Meldung abschicken</button>
        <p class="melden-klein">
          Die Meldung geht an die Redaktion des Materialpools. Gespeichert werden Grund, Begründung und Zeitpunkt –
          nicht, wer meldet. Ab zwei Meldungen wird das Material ausgeblendet, bis die Redaktion es geprüft hat.
        </p>
      </form>
    </details>
  {/if}

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

  .detail-linkweg { margin: 0 0 var(--sp-6); padding-left: var(--sp-3); border-left: 3px solid var(--blue); color: var(--text-body); }
  .detail-aktionen { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--sp-3); margin-bottom: var(--sp-8); }
  .oeffnen { display: flex; flex-direction: column; align-items: flex-start; gap: var(--sp-1); }
  .oeffnen-ziel { font-size: var(--fs-200); color: var(--text-muted); overflow-wrap: anywhere; }
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

  /* Melden (ADR-0011): zurückhaltend unter den Angaben, kein Knopf neben
     „Material öffnen“ — es ist die Ausnahme, nicht der Weg. */
  .melden { margin-top: var(--sp-8); padding-top: var(--sp-5); border-top: 1px solid var(--border); font-size: var(--fs-300); }
  .melden-auf { cursor: pointer; color: var(--text-muted); }
  .melden-auf:hover { color: var(--text-dark); }
  .melden form { display: flex; flex-direction: column; align-items: flex-start; gap: var(--sp-3); margin-top: var(--sp-4); }
  .melden fieldset { margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: var(--sp-2); }
  .melden legend { margin-bottom: var(--sp-2); font-weight: 600; color: var(--text-dark); }
  .melden-grund { display: flex; align-items: center; gap: var(--sp-2); color: var(--text-body); }
  .melden-feld { font-weight: 600; color: var(--text-dark); }
  .melden textarea {
    width: 100%;
    padding: var(--sp-3);
    border: 1px solid var(--border);
    border-radius: 5px;
    font: inherit;
    color: var(--text-dark);
    background: var(--weiss);
  }
  .melden textarea:focus { border-color: var(--blue); outline: 2px solid var(--blue); outline-offset: 1px; }
  .melden-klein { margin: 0; font-size: var(--fs-200); color: var(--text-muted); }
  .melden-fehler { margin: 0; padding-left: var(--sp-3); border-left: 3px solid var(--blue); font-weight: 600; color: var(--text-dark); }
  .melden-falle { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
  .melden-btn {
    min-height: 44px;
    padding: var(--sp-3) var(--sp-5);
    border: 1px solid var(--border);
    border-radius: 5px;
    background: var(--weiss);
    font: inherit;
    font-weight: 600;
    color: var(--text-dark);
    cursor: pointer;
  }
  .melden-btn:hover { border-color: var(--blue); }
  .melden-dank { margin-top: var(--sp-8); padding-top: var(--sp-5); border-top: 1px solid var(--border); font-size: var(--fs-300); color: var(--text-body); }

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
    .oeffnen,
    .knopf-primaer,
    .merken-btn { flex: 1 1 100%; justify-content: center; }
    .oeffnen { align-items: stretch; }
    /* Eine 130-px-Spalte für die Bezeichnung frisst auf dem Handy die
       halbe Zeile. */
    .detail-angaben { grid-template-columns: 1fr; gap: 0; }
    .detail-angaben dd { margin-bottom: var(--sp-4); }
    .detail-angaben dd:last-child { margin-bottom: 0; }
  }
</style>
