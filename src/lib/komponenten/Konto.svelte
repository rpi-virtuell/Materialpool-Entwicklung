<script>
  import Icon from './Icon.svelte';
  /**
   * Anmelden und Profil auf einer Seite (Prototyp Materialpool 2.0,
   * ADR-0006). Abgemeldet nur das Namensfeld, angemeldet das Profil. Ohne
   * JavaScript: Formulare per POST, darum „Speichern“ statt sofortiger
   * Übernahme. Der Fach-Abschnitt erscheint nur mit einem Schulbereich —
   * per CSS (:has), die Felder bleiben im Formular.
   * @type {{ seite: ReturnType<typeof import('$lib/routen/konto.js').kontoSeite>, gespeichert: boolean, fehler: string|null }}
   */
  let { seite, gespeichert, fehler } = $props();
  const konto = $derived(seite.konto);
</script>

<main class="konto-page">
  <div class="konto-inner">
    {#if !konto.angemeldet}
      <h1>Anmelden</h1>
      <p class="konto-lead">
        Mit einem Konto sagst du einmal, wo du arbeitest, und der Materialpool zeigt dir danach gleich das Passende.
      </p>
      <form class="konto-anmelden" method="post" action="?/anmelden">
        <label class="konto-feld">
          <span>Dein Name</span>
          <input type="text" name="name" value={konto.name} required maxlength="60" autocomplete="given-name" />
        </label>
        <button class="konto-knopf" type="submit">Anmelden</button>
      </form>
      {#if fehler}<p class="konto-fehler" role="alert">{fehler}</p>{/if}
      <p class="konto-hinweis">
        Prototyp: Es gibt noch keine echten Konten und kein Passwort. Deine Angaben bleiben nur in diesem Browser.
      </p>
    {:else}
      <h1>Dein Profil</h1>
      <form class="konto-lead" method="post" action="?/abmelden">
        Angemeldet als <strong>{konto.name}</strong> · <button class="konto-link" type="submit">Abmelden</button>
      </form>

      <form class="profil-form" method="post" action="?/speichern">
        <section class="konto-abschnitt">
          <h2><label for="konto-bundesland">In welchem Bundesland arbeitest du?</label></h2>
          <select id="konto-bundesland" class="konto-auswahl" name="bundesland">
            <option value="">Bitte wählen</option>
            {#each seite.bundeslaender as land (land)}
              <option value={land} selected={konto.bundesland === land}>{land}</option>
            {/each}
          </select>
        </section>

        <section class="konto-abschnitt">
          <h2>In welchem Bereich arbeitest du?</h2>
          <p class="konto-abschnitt-sub">Mehrere möglich.</p>
          {#each seite.gruppen as gruppe (gruppe.key)}
            <fieldset class="konto-gruppe">
              <legend class="konto-gruppe-label">{gruppe.label}</legend>
              <div class="konto-bereiche">
                {#each gruppe.bereiche as b (b.key)}
                  <label class="konto-bereich">
                    <input type="checkbox" name="bereich" value={b.key} checked={b.gewaehlt} class:mit-fach={gruppe.mitFach} />
                    {b.label}
                  </label>
                {/each}
              </div>
            </fieldset>
          {/each}
          <!-- Eigene Zeile statt in „Kirche und Gemeinde“: Diakonie,
               Hochschule oder Referendariat gehören zu keiner der beiden. -->
          <div class="konto-gruppe">
            <label class="konto-gruppe-label" for="konto-bereich-anderes">Weiteres: Anderes …</label>
            <input id="konto-bereich-anderes" class="konto-anderes" type="text" name="bereichAnderes" value={konto.bereichAnderes} maxlength="80" placeholder="Wo arbeitest du? z.B. Schulseelsorge, Diakonie" />
          </div>
        </section>

        <section class="konto-abschnitt fach-abschnitt">
          <h2>Welches Fach unterrichtest du?</h2>
          <!-- Dieselben Werte und Namen wie der Fach-Filter beim Stöbern.
               Überkonfessionell kommt nicht heimlich dazu — wer es will,
               wählt es hier sichtbar mit. -->
          <p class="konto-abschnitt-sub">Mehrere möglich. Überkonfessionelle Materialien passen oft zu allen Fächern.</p>
          <div class="konto-bereiche">
            {#each seite.faecher as f (f.key)}
              <label class="konto-bereich">
                <input type="checkbox" name="fach" value={f.key} checked={f.gewaehlt} />
                {f.label}
              </label>
            {/each}
          </div>
          <label class="konto-gruppe-label konto-anderes-label" for="konto-fach-anderes">Anderes …</label>
          <input id="konto-fach-anderes" class="konto-anderes" type="text" name="fachAnderes" value={konto.fachAnderes} maxlength="80" placeholder="Welches Fach? z.B. Ethik, Philosophie" />
        </section>

        <div class="konto-speichern">
          <button class="konto-knopf" type="submit">Speichern</button>
          {#if gespeichert}<span class="konto-gespeichert" role="status">Gespeichert.</span>{/if}
        </div>
      </form>

      <section class="konto-folge">
        <p>{seite.folge}</p>
        <a class="konto-knopf" href={seite.stoebernPfad}>Passende Materialien ansehen <Icon name="arrow-right" /></a>
      </section>
    {/if}
  </div>
</main>

<style>
  /* Dieselbe Sprache wie die Liste: weiße Fläche, Kanten statt Schatten,
     Blau nur für Auswahl und Knöpfe. Eine schmale Spalte, weil hier nur
     Formularfelder stehen (Prototyp, konto.css). */
  .konto-page { background: var(--weiss); }
  .konto-inner { max-width: 640px; margin: 0 auto; padding: var(--sp-10) var(--gutter) var(--sp-15); }
  h1 { font-size: 40px; letter-spacing: -0.02em; color: var(--text-dark); margin-bottom: var(--sp-3); }
  .konto-lead { font-size: var(--fs-400); line-height: 1.5; color: var(--text-body); margin-bottom: var(--sp-8); }
  .konto-anmelden { display: flex; align-items: flex-end; gap: var(--sp-3); flex-wrap: wrap; margin-bottom: var(--sp-6); }
  .konto-feld {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    flex: 1;
    min-width: 220px;
    font-size: var(--fs-200);
    font-weight: 600;
    color: var(--text-dark);
  }
  .konto-feld input,
  .konto-auswahl,
  .konto-anderes {
    font: inherit;
    font-size: var(--fs-400);
    font-weight: 400;
    color: var(--text-dark);
    background: var(--weiss);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: var(--sp-3) var(--sp-4);
    outline: none;
    transition: border-color 0.15s ease;
  }
  .konto-feld input:focus,
  .konto-auswahl:focus,
  .konto-anderes:focus { border-color: var(--blue); }
  .konto-auswahl { width: 100%; max-width: 320px; cursor: pointer; }
  .konto-anderes { width: 100%; font-size: var(--fs-300); padding: var(--sp-2) var(--sp-3); }
  .konto-knopf {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    background: var(--blue);
    color: var(--weiss);
    border: 1px solid var(--blue);
    border-radius: 5px;
    padding: var(--sp-3) var(--sp-5);
    font: inherit;
    font-size: var(--fs-300);
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .konto-knopf:hover { background: var(--blue-dark); border-color: var(--blue-dark); }
  .konto-hinweis { font-size: var(--fs-200); line-height: 1.5; color: var(--text-muted); }
  .konto-fehler { color: var(--fb-fehler); font-size: var(--fs-300); margin-bottom: var(--sp-4); }
  .konto-link { background: none; border: none; padding: 0; font: inherit; color: var(--blue); text-decoration: underline; cursor: pointer; }
  .konto-abschnitt { padding: var(--sp-6) 0; border-top: 1px solid var(--border); }
  .konto-abschnitt h2 { font-size: var(--fs-500); color: var(--text-dark); margin-bottom: var(--sp-4); }
  .konto-abschnitt-sub { font-size: var(--fs-300); color: var(--text-muted); margin: calc(-1 * var(--sp-3)) 0 var(--sp-4); }
  .konto-gruppe { display: flex; flex-direction: column; gap: var(--sp-2); margin: 0 0 var(--sp-4); padding: 0; border: none; }
  .konto-gruppe-label { font-size: var(--fs-200); font-weight: 600; color: var(--text-muted); padding: 0; margin-bottom: var(--sp-2); }
  .konto-anderes-label { display: block; margin-top: var(--sp-4); }
  .konto-bereiche { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  /* Rahmen wie die entfernbaren Filter der Liste; gewählt wird der Rahmen
     blau und doppelt so kräftig, statt sich zu füllen. Die innere Kante
     kommt als box-shadow, der keinen Platz braucht — die Reihe springt
     beim Anklicken nicht um. Das Kästchen bleibt sichtbar, damit die Wahl
     auch ohne :has erkennbar ist. */
  .konto-bereich {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    background: var(--weiss);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: var(--sp-2) var(--sp-3);
    font-size: var(--fs-300);
    color: var(--text-dark);
    cursor: pointer;
    transition: border-color 0.12s ease, color 0.12s ease;
  }
  .konto-bereich:hover { border-color: var(--blue); }
  .konto-bereich input { accent-color: var(--blue); margin: 0; }
  .konto-bereich:has(input:checked) { border-color: var(--blue); box-shadow: inset 0 0 0 1px var(--blue); color: var(--blue); }
  .konto-bereich:has(input:focus-visible) { outline: 2px solid var(--blue); outline-offset: 2px; }
  /* Nach dem Fach wird nur mit einem Schulbereich gefragt. Ohne :has
     bleibt der Abschnitt einfach sichtbar. */
  .profil-form:not(:has(.mit-fach:checked)) .fach-abschnitt { display: none; }
  .konto-speichern { display: flex; align-items: center; gap: var(--sp-4); padding: var(--sp-2) 0 var(--sp-6); }
  .konto-gespeichert { font-size: var(--fs-300); color: var(--text-muted); }
  .konto-folge {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-4);
    padding-top: var(--sp-6);
    border-top: 1px solid var(--border);
    font-size: var(--fs-300);
    line-height: 1.5;
    color: var(--text-body);
  }
  @media (max-width: 640px) {
    .konto-inner { padding: var(--sp-6) var(--sp-4) var(--sp-10); }
    h1 { font-size: var(--fs-700); }
  }
</style>
