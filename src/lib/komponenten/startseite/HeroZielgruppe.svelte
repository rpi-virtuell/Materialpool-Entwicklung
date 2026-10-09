<script module>
  /**
   * Zielgruppen, die im H1 rotieren (Prototyp 5.3). Reihenfolge absichtlich
   * gemischt: Verwandtes (Schule/Schulgottesdienste, Konfi-/Jugendarbeit)
   * steht auch über den Umlauf hinweg nie nebeneinander (Prototyp, 28.09.2026).
   */
  export const ZIELGRUPPEN = [
    'für die Schule', 'für die Gemeinde', 'für die Kita', 'für die Konfi-Arbeit',
    'für Schulgottesdienste', 'für die Erwachsenenbildung', 'für die Jugendarbeit'
  ];
  /**
   * Alle Bereiche in einer Zeile, für „wenig Bewegung“ und fürs Vorlesen:
   * Schulgottesdienste stecken in „Schule“, Konfi- und Jugendarbeit in
   * „Gemeinde“, Erwachsenenbildung in „Bildungsarbeit“ (Christina, 09.10.2026).
   */
  export const ZIELGRUPPEN_ZUSAMMEN = 'für Schule, Kita, Gemeinde und Bildungsarbeit';
  /** Sekunden je Wort. */
  export const TAKT_S = 3;
</script>

<script>
  /**
   * Rotation ohne JavaScript: eine CSS-Animation je Wort, versetzt um
   * i · TAKT_S, nur Überblenden. Der unsichtbare Platzhalter reserviert die Breite des
   * längsten Worts, damit nichts springt. Bei „wenig Bewegung“ (reduced
   * motion; oft von der IT gesetzt) wechselt nichts — dann steht
   * ZIELGRUPPEN_ZUSAMMEN da, sonst bliebe allein „für die Schule“ und die
   * Breite des Materialpools ginge verloren. Vorgelesen wird immer die
   * ganze Zeile, nie die wechselnden Wörter.
   */
  const dauer = ZIELGRUPPEN.length * TAKT_S;
</script>

<span class="hero-zielgruppe" style="--takt:{TAKT_S}s;--dauer:{dauer}s">
  <span class="hero-zielgruppe-alle">{ZIELGRUPPEN_ZUSAMMEN}</span>
  <span class="hero-zielgruppe-platzhalter" aria-hidden="true">
    {#each ZIELGRUPPEN as wort (wort)}<span>{wort}</span>{/each}
  </span>
  {#each ZIELGRUPPEN as wort, i (wort)}
    <span class="hero-zielgruppe-wort" style="--i:{i}" aria-hidden="true">{wort}</span>
  {/each}
</span>

<style>
  .hero-zielgruppe {
    position: relative;
    display: inline-grid;
    vertical-align: top;
    max-width: 100%;
  }
  /* Mit Bewegung nur für Vorleseprogramme da, unsichtbar und ohne Platz. */
  .hero-zielgruppe-alle {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .hero-zielgruppe-platzhalter { display: grid; visibility: hidden; }
  .hero-zielgruppe-platzhalter > span { grid-area: 1 / 1; min-width: 0; }
  .hero-zielgruppe-wort {
    position: absolute;
    inset: 0;
    color: var(--weiss-78);
    opacity: 0;
    animation: zielgruppe var(--dauer) ease-in-out infinite;
    animation-delay: calc(var(--i) * var(--takt));
  }
  /* Nur Überblenden, kein Hochrutschen. Bei 7 Wörtern à 3 s: Das neue Wort
     blendet in 0,45 s ein, während das alte in 0,45 s ausblendet — die
     sanfte erste Fassung des Prototyps (16.09.2026), nie eine leere Stelle
     (Christina, 09.10.2026). */
  @keyframes zielgruppe {
    0% { opacity: 0; }
    2.14%, 14.29% { opacity: 1; }
    16.43%, 100% { opacity: 0; }
  }
  /* Sehr schmal brauchen kurze Wörter eine Zeile, lange zwei (gemessen
     09.10.2026: gemischt bei 320 und 360 px, ab 390 px alles einzeilig);
     gleichzeitig übereinander gäbe Buchstabensalat. Dort erst raus, dann
     rein: 0,2 s aus, 0,22 s Pause, 0,28 s ein (Prototyp, zweite Fassung). */
  @keyframes zielgruppe-nacheinander {
    0%, 1.05% { opacity: 0; }
    2.38%, 13.33% { opacity: 1; }
    14.29%, 100% { opacity: 0; }
  }
  @media (max-width: 400px) {
    .hero-zielgruppe-wort { animation-name: zielgruppe-nacheinander; animation-timing-function: ease; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-zielgruppe-platzhalter,
    .hero-zielgruppe-wort { display: none; }
    .hero-zielgruppe-alle {
      position: static;
      width: auto;
      height: auto;
      overflow: visible;
      clip-path: none;
      white-space: normal;
      text-wrap: balance;
      color: var(--weiss-78);
    }
  }
</style>
