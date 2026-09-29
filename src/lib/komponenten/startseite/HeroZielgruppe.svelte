<script module>
  /** Zielgruppen, die im H1 rotieren (Prototyp 5.3). */
  export const ZIELGRUPPEN = [
    'für die Schule', 'für die Kita', 'für die Gemeinde', 'für die Konfi-Arbeit',
    'für die Jugendarbeit', 'für die Erwachsenenbildung', 'für Schulgottesdienste'
  ];
  /** Sekunden je Wort. */
  export const TAKT_S = 3;
</script>

<script>
  /**
   * Rotation ohne JavaScript: eine CSS-Animation je Wort, versetzt um
   * i · TAKT_S. Der unsichtbare Platzhalter reserviert die Breite des
   * längsten Worts, damit nichts springt. Ohne Animation (reduced motion)
   * steht das erste Wort; nur dieses ist für Screenreader sichtbar.
   */
  const dauer = ZIELGRUPPEN.length * TAKT_S;
</script>

<span class="hero-zielgruppe" style="--takt:{TAKT_S}s;--dauer:{dauer}s">
  <span class="hero-zielgruppe-platzhalter" aria-hidden="true">
    {#each ZIELGRUPPEN as wort (wort)}<span>{wort}</span>{/each}
  </span>
  {#each ZIELGRUPPEN as wort, i (wort)}
    <span class="hero-zielgruppe-wort" class:is-aktiv={i === 0} style="--i:{i}" aria-hidden={i === 0 ? undefined : 'true'}>{wort}</span>
  {/each}
</span>

<style>
  .hero-zielgruppe {
    position: relative;
    display: inline-grid;
    vertical-align: top;
    max-width: 100%;
  }
  .hero-zielgruppe-platzhalter { display: grid; visibility: hidden; }
  .hero-zielgruppe-platzhalter > span { grid-area: 1 / 1; min-width: 0; }
  .hero-zielgruppe-wort {
    position: absolute;
    inset: 0;
    color: var(--weiss-78);
    opacity: 0;
    transform: translateY(0.18em);
    animation: zielgruppe var(--dauer) ease infinite;
    animation-delay: calc(var(--i) * var(--takt));
  }
  /* Bei 7 Wörtern à 3 s: 0,22 s warten, 0,28 s einblenden, bis 2,8 s
     stehen, 0,2 s ausblenden — wie die Transitions des Prototyps. */
  @keyframes zielgruppe {
    0%, 1.05% { opacity: 0; transform: translateY(0.18em); }
    2.38%, 13.33% { opacity: 1; transform: none; }
    14.29%, 100% { opacity: 0; transform: translateY(0.18em); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-zielgruppe-wort { animation: none; transform: none; }
    .hero-zielgruppe-wort.is-aktiv { opacity: 1; }
  }
</style>
