<script>
  /**
   * Nennt den Stand des Spiegels. Scheiterte der letzte Lauf, ist das Alter
   * des angezeigten Stands eine Nachricht — sonst nur eine Angabe.
   * @type {{ spiegelstand: { zeitpunkt: string|null, anzahl: number, veraltet: boolean, relays: string[] } }}
   */
  let { spiegelstand } = $props();
  const zeit = $derived(
    spiegelstand.zeitpunkt
      ? new Date(spiegelstand.zeitpunkt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
      : null
  );
</script>

<footer>
  <div class="innen">
    <p>
      Entwicklungsstand des rpi-virtuell-Materialpools als Schaufenster für AMB-Events (kind:30142) auf Nostr.
      Ein Vorhaben des Comenius-Instituts im Projekt FOERBICO.
    </p>
    <p class="stand" class:veraltet={spiegelstand.veraltet}>
      {#if zeit}
        Spiegel vom {zeit}, {spiegelstand.anzahl} Materialien
        {#if spiegelstand.veraltet} — der letzte Lauf gegen {spiegelstand.relays.join(', ')} ist gescheitert, gezeigt wird der ältere Stand.{/if}
      {:else}
        Noch kein Spiegelstand. Relays: {spiegelstand.relays.join(', ')}
      {/if}
    </p>
  </div>
</footer>

<style>
  footer {
    background: var(--fb-flaeche);
    border-top: 1px solid var(--fb-rahmen);
    margin-top: 3rem;
    font-size: 0.9rem;
    color: var(--fb-text-leise);
  }
  .innen { max-width: var(--breite-raster); margin: 0 auto; padding: 1.5rem 24px; }
  .stand.veraltet { color: var(--fb-fehler); }
</style>
