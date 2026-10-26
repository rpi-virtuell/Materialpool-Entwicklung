<script>
  /**
   * Redaktionsseite (/redaktion, ADR-0011): gemeldete Materialien mit allen
   * Meldungen, je Material „Bestätigen und ausblenden“ oder „Verwerfen“;
   * darunter, was die Redaktion ausgeblendet hat, mit „Wieder einblenden“.
   * Jeder Knopf ist ein POST-Formular. Mit REDAKTION_KENNWORT fragt die
   * Seite zuerst danach, ohne sagt sie, dass sie offen ist.
   * @type {{
   *   offen: import('$lib/routen/meldungen.js').Fall[],
   *   ausgeblendet: import('$lib/routen/meldungen.js').Fall[],
   *   zugang: boolean,
   *   kennwortNoetig: boolean,
   *   fehler?: string|null
   * }}
   */
  let { offen, ausgeblendet, zugang, kennwortNoetig, fehler = null } = $props();
  const datum = (/** @type {string} */ iso) => new Date(iso).toLocaleDateString('de-DE', { dateStyle: 'medium', timeZone: 'Europe/Berlin' });
  /** @param {import('$lib/models/meldung.js').Stand} s */
  const standText = (s) => (s.stand === 'vorlaeufig' ? `${s.offen} Meldungen · vorläufig ausgeblendet` : '1 Meldung · Hinweis am Material, noch sichtbar');
</script>

<main class="redaktion-page">
  <div class="redaktion-inner">
    <h1>Meldungen</h1>

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
        Eine Meldung setzt einen Hinweis aufs Material; ab zwei ist es vorläufig ausgeblendet. Bestätigen blendet es
        aus, bis jemand es wieder einblendet. Verwerfen löscht die Meldungen, das Material ist wieder normal sichtbar.
      </p>

      <h2>Offen</h2>
      {#if offen.length === 0}
        <p class="redaktion-leer">Zurzeit liegen keine offenen Meldungen vor.</p>
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
