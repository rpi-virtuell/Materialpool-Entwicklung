<script>
  /**
   * Redaktionsseite (/redaktion, ADR-0011): die eine Seite für alles
   * Ausgeblendete. Gemeldete Materialien mit allen Meldungen, je Material
   * „Bestätigen und ausblenden“ oder „Verwerfen“; darunter, was die
   * Redaktion ausgeblendet hat, mit „Wieder einblenden“; zuletzt die toten
   * Links der Link-Prüfung (ADR-0010, Nachtrag 2026-10-26), nur zum
   * Ansehen — sie kommen von selbst zurück. Jeder Knopf ist ein
   * POST-Formular. Mit REDAKTION_KENNWORT fragt die Seite zuerst danach,
   * ohne sagt sie, dass sie offen ist.
   * @type {{
   *   offen: import('$lib/routen/meldungen.js').Fall[],
   *   ausgeblendet: import('$lib/routen/meldungen.js').Fall[],
   *   toteLinks?: ReturnType<typeof import('$lib/routen/ausgeblendet.js').ausgeblendeteLaden>['eintraege'],
   *   zugang: boolean,
   *   kennwortNoetig: boolean,
   *   fehler?: string|null
   * }}
   */
  let { offen, ausgeblendet, toteLinks = [], zugang, kennwortNoetig, fehler = null } = $props();
  const datum = (/** @type {string} */ iso) => new Date(iso).toLocaleDateString('de-DE', { dateStyle: 'medium', timeZone: 'Europe/Berlin' });
  /** @param {import('$lib/models/meldung.js').Stand} s */
  const standText = (s) => (s.stand === 'vorlaeufig' ? `${s.offen} Hinweise · vorläufig ausgeblendet` : '1 Hinweis · am Material vermerkt, noch sichtbar');
</script>

<main class="redaktion-page">
  <div class="redaktion-inner">
    <h1>Hinweise</h1>

    {#if !zugang}
      <form class="redaktion-anmelden" method="post" action="?/anmelden">
        <label for="redaktion-kennwort">Kennwort der Redaktion</label>
        {#if fehler}<p class="redaktion-fehler" role="alert">{fehler}</p>{/if}
        <input id="redaktion-kennwort" type="password" name="kennwort" autocomplete="current-password" required />
        <button class="redaktion-btn" type="submit">Weiter</button>
      </form>
    {:else}
      {#if !kennwortNoetig}
        <p class="redaktion-offen" role="note">
          Diese Seite ist noch nicht durch ein Kennwort geschützt: Wer die Adresse kennt, kann hier entscheiden.
        </p>
      {/if}
      <p class="redaktion-lead">
        Ein Hinweis wird am Material vermerkt; ab zwei ist es vorläufig ausgeblendet. Bestätigen blendet es
        aus, bis jemand es wieder einblendet. Verwerfen löscht die Hinweise, das Material ist wieder normal sichtbar.
      </p>

      <h2>Offen</h2>
      {#if offen.length === 0}
        <p class="redaktion-leer">Zurzeit liegen keine offenen Hinweise vor.</p>
      {:else}
        <ul class="redaktion-liste">
          {#each offen as f (f.schluessel)}
            <li>
              <a class="redaktion-titel" href={f.pfad}>{f.titel}</a>
              {#if f.herkunft}<p class="redaktion-von">{f.herkunft}</p>{:else}<p class="redaktion-von">nicht mehr im Bestand</p>{/if}
              <p class="redaktion-stand" class:ist-weg={f.stand.stand === 'vorlaeufig'}>{standText(f.stand)}</p>
              <ul class="redaktion-meldungen">
                {#each f.meldungen as m (m.id)}
                  <li>
                    <p class="redaktion-grund">{m.grund} <span>· {datum(m.zeit)}</span></p>
                    <p class="redaktion-text">{m.begruendung}</p>
                  </li>
                {/each}
              </ul>
              <form class="redaktion-entscheiden" method="post" action="?/entscheiden">
                <input type="hidden" name="material" value={f.schluessel} />
                <button class="redaktion-btn ist-primaer" type="submit" name="entscheidung" value="bestaetigen">Bestätigen und ausblenden</button>
                <button class="redaktion-btn" type="submit" name="entscheidung" value="verwerfen">Verwerfen</button>
              </form>
            </li>
          {/each}
        </ul>
      {/if}

      {#if ausgeblendet.length > 0}
        <h2>Von der Redaktion ausgeblendet</h2>
        <ul class="redaktion-liste">
          {#each ausgeblendet as f (f.schluessel)}
            <li>
              <a class="redaktion-titel" href={f.pfad}>{f.titel}</a>
              <p class="redaktion-stand">{f.stand.gruende.join(', ')}{f.stand.seit ? ` · seit ${datum(f.stand.seit)}` : ''}</p>
              <form class="redaktion-entscheiden" method="post" action="?/entscheiden">
                <input type="hidden" name="material" value={f.schluessel} />
                <button class="redaktion-btn" type="submit" name="entscheidung" value="einblenden">Wieder einblenden</button>
              </form>
            </li>
          {/each}
        </ul>
      {/if}

      <h2>Tote Links</h2>
      <p class="redaktion-lead">
        Der Materialpool prüft regelmäßig, ob die Links zu den Materialien noch funktionieren. Meldet eine Seite
        zweimal hintereinander, dass es sie nicht mehr gibt, wird das Material aus Liste, Suche und Startseite
        genommen. Funktioniert der Link wieder, erscheint es von selbst wieder.
      </p>
      {#if toteLinks.length === 0}
        <p class="redaktion-leer">Zurzeit ist kein Material wegen eines toten Links ausgeblendet.</p>
      {:else}
        <ul class="redaktion-liste">
          {#each toteLinks as e (e.material.id)}
            <li>
              <a class="redaktion-titel" href={e.material.pfad}>{e.material.name}</a>
              <p class="redaktion-von">{e.material.herkunft}</p>
              <p class="redaktion-link"><a href={e.url} rel="external noopener nofollow">{e.url}</a></p>
              <p class="redaktion-stand">
                Antwort {e.status ?? '–'} · nicht erreichbar seit {datum(e.wegSeit)} · zuletzt geprüft {datum(e.geprueft)}
              </p>
            </li>
          {/each}
        </ul>
      {/if}

      {#if kennwortNoetig}
        <form class="redaktion-abmelden" method="post" action="?/abmelden">
          <button class="redaktion-link" type="submit">Abmelden</button>
        </form>
      {/if}
    {/if}
  </div>
</main>

<style>
  .redaktion-inner { max-width: 760px; margin: 0 auto; padding: var(--sp-8) var(--gutter) var(--sp-15); }
  h1 { font-size: var(--fs-700); margin-bottom: var(--sp-3); }
  h2 { font-size: var(--fs-500); margin: var(--sp-8) 0 var(--sp-3); }
  .redaktion-lead { color: var(--text-body); line-height: 1.6; margin-bottom: var(--sp-4); }
  .redaktion-offen,
  .redaktion-fehler { margin: 0 0 var(--sp-4); padding-left: var(--sp-3); border-left: 3px solid var(--blue); color: var(--text-dark); }
  .redaktion-leer { font-weight: 600; color: var(--text-dark); }
  .redaktion-liste { list-style: none; padding: 0; margin: 0; }
  .redaktion-liste > li { padding: var(--sp-5) 0; border-top: 1px solid var(--border); }
  .redaktion-titel { font-weight: 600; color: var(--text-dark); }
  .redaktion-von { font-size: var(--fs-200); color: var(--text-body); margin: var(--sp-1) 0; }
  .redaktion-stand { font-size: var(--fs-200); color: var(--text-muted); margin: var(--sp-1) 0 0; }
  .redaktion-link { font-size: var(--fs-200); overflow-wrap: anywhere; margin: 0; }
  .redaktion-link a { color: var(--blue); }
  .redaktion-stand.ist-weg { font-weight: 600; color: var(--text-dark); }
  .redaktion-meldungen { list-style: none; padding: 0; margin: var(--sp-3) 0; display: flex; flex-direction: column; gap: var(--sp-3); }
  .redaktion-meldungen li { padding-left: var(--sp-3); border-left: 2px solid var(--border); }
  .redaktion-grund { margin: 0; font-size: var(--fs-300); font-weight: 600; color: var(--text-dark); }
  .redaktion-grund span { font-weight: 400; color: var(--text-muted); }
  .redaktion-text { margin: var(--sp-1) 0 0; font-size: var(--fs-300); white-space: pre-line; overflow-wrap: anywhere; color: var(--text-body); }
  .redaktion-entscheiden,
  .redaktion-anmelden { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-3); margin-top: var(--sp-3); }
  .redaktion-anmelden { flex-direction: column; align-items: flex-start; }
  .redaktion-anmelden input { min-height: 44px; padding: var(--sp-2) var(--sp-3); border: 1px solid var(--border); border-radius: 5px; font: inherit; }
  .redaktion-btn {
    min-height: 44px;
    padding: var(--sp-3) var(--sp-5);
    border: 1px solid var(--border);
    border-radius: 5px;
    background: var(--weiss);
    font: inherit;
    font-size: var(--fs-300);
    font-weight: 600;
    color: var(--text-dark);
    cursor: pointer;
  }
  .redaktion-btn:hover { border-color: var(--blue); }
  .redaktion-btn.ist-primaer { background: var(--blue); border-color: var(--blue); color: var(--weiss); }
  .redaktion-btn.ist-primaer:hover { background: var(--blue-dark); border-color: var(--blue-dark); }
  .redaktion-abmelden { margin-top: var(--sp-10); }
  .redaktion-link { padding: 0; border: 0; background: none; font: inherit; font-size: var(--fs-200); color: var(--text-muted); text-decoration: underline; cursor: pointer; }
  @media (max-width: 640px) {
    .redaktion-inner { padding: var(--sp-6) var(--sp-4) var(--sp-10); }
    .redaktion-btn { flex: 1 1 100%; }
  }
</style>
