<script>
  /** @type {{ themen: import('$lib/routen/startseite.js').Thema[] }} */
  let { themen } = $props();
</script>

{#if themen.length > 0}
  <div class="themen-row">
    <span class="themen-row-label">Beliebte Themen</span>
    <div class="themen-row-chips">
      {#each themen as thema (thema.wort)}
        <a class="theme-link" href={thema.pfad}>{thema.wort}</a>
      {/each}
    </div>
  </div>
{/if}

<style>
  .themen-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
  }
  .themen-row-label { font-size: var(--fs-200); color: var(--weiss-75); flex-shrink: 0; }
  .themen-row-chips { display: flex; flex-wrap: wrap; gap: var(--sp-2) var(--sp-3); }
  .theme-link {
    display: inline-block;
    background: var(--weiss-12);
    border: 1px solid var(--weiss-35);
    border-radius: 999px;
    padding: var(--sp-2) var(--sp-4);
    font-size: var(--fs-200);
    font-weight: 500;
    color: var(--weiss);
    text-decoration: none;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }
  .theme-link:hover { background: var(--weiss-22); border-color: var(--weiss); }
</style>
