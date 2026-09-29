<script>
  /**
   * Fußzeile des Prototyps — links statt „live vom Relay“ der Stand des
   * Spiegels: Scheitert der letzte Lauf, ist das Alter des angezeigten
   * Stands eine Nachricht (CLAUDE.md), sonst nur eine Angabe.
   * @type {{ spiegelstand: { zeitpunkt: string|null, anzahl: number, veraltet: boolean, relays: string[] } }}
   */
  let { spiegelstand } = $props();
  const zeit = $derived(
    spiegelstand.zeitpunkt
      ? new Date(spiegelstand.zeitpunkt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
      : null
  );
</script>

<footer class="site-footer">
  <span class="stand" class:veraltet={spiegelstand.veraltet}>
    {#if zeit}
      Materialdaten aus dem Spiegel vom {zeit} ({spiegelstand.anzahl} Materialien, {spiegelstand.relays.join(', ')}){#if spiegelstand.veraltet} — der letzte Lauf ist gescheitert, gezeigt wird der ältere Stand{/if}
    {:else}
      Noch kein Spiegelstand. Relays: {spiegelstand.relays.join(', ')}
    {/if}
  </span>
  <span class="footer-credit">Materialpool 2.0 · ein Prototyp des Comenius-Instituts</span>
</footer>

<style>
  .site-footer {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-4);
    padding: var(--sp-5) var(--sp-6);
    margin-top: var(--sp-10);
    font-size: var(--fs-200);
    color: var(--text-muted);
    border-top: 1px solid var(--border);
  }
  .footer-credit { flex-shrink: 0; }
  .stand.veraltet { color: var(--fb-fehler); }
  @media (max-width: 640px) {
    .site-footer { flex-direction: column; gap: var(--sp-2); padding: var(--sp-5) var(--sp-4); }
  }
</style>
