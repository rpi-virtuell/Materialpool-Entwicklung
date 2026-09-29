# Plan: Startseite nach Prototyp (Spec 2026-09-29-startseite-design.md)

Reihenfolge so, dass jeder Schritt mit `pnpm test` grün endet.

1. **Modelle** (TDD): `models/typen.js` (Mappings, Icons), `models/farben.js`
   (Cover, Palette, mix, kontrastText, stufenPalette, ciFarbeLesen),
   `models/saison.js`; `material.js` um `typ`, `stufe`, `herkunft`,
   `mitwirkende`, URL-Fallbacks und `bild`-Prüfung erweitern. Fixtures um
   zwei Events ergänzen.
2. **Konfiguration und Spiegel**: `QUELLE_FAECHER` in `konfig.js`,
   `#about:id` in `filterBauen`; `.env.example` ergänzen.
3. **Routen-Logik**: `routen/startseite.js` (Themen, Stufen, Empfehlung,
   Status), `routen/uebersicht.js` (`filterAnwenden`, `listeLaden`).
4. **Architekturtest**: Hex-Regel; danach erst Komponenten.
5. **Stile**: `app.css` (Tokens, Aliase, Basis, Fokus, status-hint),
   `stile/schriften.css`; Pakete `@fontsource-variable/*`, `@tabler/icons`.
6. **Komponenten** mit `svelte/server`-Tests: `Icon`, `Kopfzeile`,
   `Fusszeile`, `startseite/*`, `Uebersicht`, `Karte`.
7. **Routen**: `/` → Startseite, `/materialien` → Liste, Layout mit
   CI-Farbe; `Detail` auf Tokens prüfen.
8. **Prüfen**: `pnpm check && pnpm test && pnpm build`; gebauten Server
   gegen Mock-Relay im Browser (Desktop, 960, 640, `?primaryColor`).
9. **Doku**: STATUS-Eintrag, CLAUDE.md (Gestaltung, Zuschnitt), README
   (Routen), `.env.example`.
