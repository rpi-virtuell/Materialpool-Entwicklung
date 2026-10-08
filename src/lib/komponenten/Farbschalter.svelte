<script>
  /**
   * Farbschalter des Prototyps (Materialpool 2.0): CI-Farbe ausprobieren.
   * Ohne JavaScript ein GET-Formular auf die aktuelle Seite; Hex-Feld und
   * Farbfeld schicken beide `primaryColor`, der Server nimmt das geänderte
   * (routen/farbschalter.js) und merkt es sich im Cookie.
   * @type {{ schalter: ReturnType<typeof import('$lib/routen/farbschalter.js').farbschalterBilden> }}
   */
  let { schalter } = $props();
</script>

<form class="farbschalter" action={schalter.aktion} method="get" aria-label="CI-Farbe ausprobieren">
  {#each schalter.felder as [name, wert], i (i)}<input type="hidden" {name} value={wert} />{/each}
  <input class="farbschalter-hex" type="text" name="primaryColor" value={schalter.farbe} maxlength="7" pattern="#[0-9a-fA-F]{'{6}'}" aria-label="Hex-Farbwert" />
  <label class="farbschalter-label">
    CI-Farbe
    <input class="farbschalter-feld" type="color" name="primaryColor" value={schalter.farbe} />
  </label>
  <button class="farbschalter-knopf" type="submit">Übernehmen</button>
  {#if schalter.gesetzt}<a class="farbschalter-knopf" href={schalter.zuruecksetzenPfad}>Zurücksetzen</a>{/if}
</form>

<style>
  .farbschalter {
    position: fixed;
    right: var(--sp-4);
    bottom: var(--sp-4);
    z-index: 50;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    max-width: calc(100vw - 2 * var(--sp-4));
    background: var(--weiss);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: var(--sp-2) var(--sp-3);
    box-shadow: var(--schatten-schwebend);
    font-size: var(--fs-200);
    color: var(--text-dark);
  }
  .farbschalter-label { display: flex; align-items: center; gap: var(--sp-2); }
  .farbschalter-hex {
    width: 5.5em;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--sp-1) var(--sp-2);
    font-family: ui-monospace, monospace;
    font-size: var(--fs-100);
    color: var(--text-dark);
  }
  .farbschalter-feld {
    width: 32px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
  }
  .farbschalter-knopf {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--fb-flaeche);
    padding: var(--sp-1) var(--sp-2);
    font: inherit;
    font-size: var(--fs-100);
    color: var(--text-dark);
    text-decoration: none;
    cursor: pointer;
  }
  .farbschalter-knopf:hover { border-color: var(--text-muted); }
  .farbschalter :focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
</style>
