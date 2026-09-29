# Startseite nach dem Materialpool-2.0-Prototyp — serverseitig gerendert

**Datum:** 2026-09-29 · **Status:** in Umsetzung (Branch `feat/startseite`)
**Beteiligte:** Jörg Lohrer · Vorlage: `materialpool-startseite-svelte-spec.md`
und `startseite.css` (React/Vite-Prototyp „Materialpool 2.0“, Comenius-Institut)

## Ziel

Die Startseite des Schaufensters übernimmt Aufbau, Texte, Klassennamen und
CSS des Prototyps: blauer Kopf mit rotierender Zielgruppe, Suchfeld,
„Beliebte Themen“, vier Stufen-Kacheln, „Aktuelle Empfehlung“,
„Alle Materialien durchstöbern“; dazu Header und Footer des Prototyps auf
allen Seiten. Die bisherige Kartenübersicht wird zur Liste unter
`/materialien`, auf der Suche, Themen-Chips und Stufen-Kacheln landen.

## Was vom Prototyp bewusst anders ist (ADR-0004)

Der Prototyp ist ein reiner Client (WebSocket im Browser, Stores, Screens
per Store-Routing). Dieses Repo rendert serverseitig aus dem Spiegel
(CLAUDE.md, ADR-0001). Daraus folgt:

| Prototyp | Hier |
|---|---|
| `nostr-tools` im Browser, Status `loading/live/fallback` | Spiegel; Status aus Spiegelstand und letztem Fehlschlag |
| Screens per Store, `button` für Navigation | Routen `/`, `/materialien`, `/m/<kennung>`; Navigation sind `<a href>` |
| Suche: Client-Filter + NIP-50 `liveSuche` | GET-Formular → `/materialien?q=…`, Filter über den Spiegel (kein Relay-Zugriff pro Anfrage, keine NIP-50-Suche) |
| Merkliste in `localStorage`, Nav „Gemerkt“ | entfällt (nur Lesen; nichts andeuten, was es nicht gibt) |
| Empfehlung per `Math.random`, im Client stabil | deterministisch je Tag (Hash aus Datum), damit jede Anfrage dieselbe zeigt und die Seite cachebar bleibt |
| Rotation der Zielgruppe per `setInterval` | reine CSS-Animation (Keyframes, 7 × 3 s); ohne JavaScript und bei `prefers-reduced-motion` steht das erste Wort |
| Tabler-Webfont (`.ti.ti-*`) | Inline-SVG aus `@tabler/icons` (nur die elf benötigten Icons, `?raw` importiert) — kein 100-kB-Font für elf Zeichen |
| `@fontsource/inter`, `@fontsource/space-grotesk` (statische Schnitte) | `@fontsource-variable/*`, eigene `@font-face` nur für `latin` und `latin-ext` (drei woff2, ~160 kB gesamt, `font-display: swap`) |
| CI-Farbe per `document.documentElement.style` | `?primaryColor=%23RRGGBB` wird serverseitig gelesen und als `<style>` im `<head>` ausgegeben; Stufen-Palette wird auf dem Server abgeleitet |
| Statushinweis „nicht erreichbar – ein Reload hilft meist“ | die vorhandene Leerstands-Erklärung (`leerstandErklaeren`), die Relays und nächsten Schritt nennt |
| Footer „Materialdaten live vom AMB-Relay“ | Footer nennt den Spiegelstand und dessen Alter bei Fehlschlag (CLAUDE.md) |
| Fach-Filter `#about:id` fest im Code | optional `QUELLE_FAECHER` in `.env` (komma-getrennte URIs); leer = kein Fachfilter |

Alles Übrige — DOM-Reihenfolge, Klassennamen, Texte, Mappings, Saison-
Keywords, Cover-Farben, Kontrastrechnung, Breakpoints — wird übernommen.

## Architektur

```
src/lib/models/
  material.js    + typ {key,label}, stufe {key,label}, herkunft, mitwirkende, url-Fallbacks, bild nur http(s)
  typen.js       TYPEN (Icon), LRT_ZU_TYP, LEVEL_ZU_STUFE (Label + KIM-URI), STUFEN_*
  farben.js      COVER, STUFEN_FARBE_DEFAULT, mix, kontrastText, stufenPalette, coverFarben, ciFarbeLesen
                 — einzige JS-Datei mit Hex-Werten (Farbdaten für Inline-Variablen)
  saison.js      SAISON, saisonKeywords(datum), passtZurSaison(wort, keywords)
src/lib/routen/
  startseite.js  startseiteLaden({inhalt, fehlschlag, relays, heute}) → { themen, stufen, empfehlung, status }
  uebersicht.js  listeLaden({…, q, stufe}) → { materialien, filter, treffer, leerstand }, filterAnwenden (rein)
src/lib/komponenten/
  Icon.svelte                 Inline-SVG, name → @tabler/icons
  Kopfzeile.svelte            header.site-header (Logo → /, Nav „Stöbern“ → /materialien)
  Fusszeile.svelte            footer.site-footer (Spiegelstand · Credit)
  startseite/Startseite.svelte, HeroZielgruppe.svelte, ThemenRow.svelte,
             StufenKacheln.svelte, EmpfehlungCard.svelte
  Uebersicht.svelte, Karte.svelte  (Liste; Ergebnisleiste, Filter-Pillen, Karten mit Cover-Farben)
src/routes/
  +layout.server.js  Spiegelstand + CI-Farbe aus ?primaryColor
  +page.server.js    Startseite
  materialien/+page.server.js, +page.svelte
src/app.css          Tokens des Prototyps (`--blue` …) + FOERBICO-Aliase (`--fb-*` → neue Tokens), Basis, Fokus, .status-hint
src/lib/stile/schriften.css   @font-face Inter Variable, Space Grotesk Variable
```

Die Datenschicht (`models/`, `routen/`, `services/`) bleibt frei von
Oberfläche und `$app`/`$env`; `test/architektur.test.js` prüft zusätzlich:
**kein Hex in `.svelte`-Dateien und in keiner `.js` außer `models/farben.js`**.

CSS-Verteilung: Die Regeln aus `startseite.css` wandern unverändert in die
`<style>`-Blöcke der Komponenten, die die jeweiligen Elemente rendern
(Svelte scoped). Selektoren auf Kind-Komponenten und `:focus-visible`
werden mit `:global()` gekennzeichnet. Tokens und Basisregeln liegen in
`app.css`. So lädt die Detailseite kein Startseiten-CSS.

## Datenfluss der Startseite

1. `+page.server.js` liest Spiegel (`inhalt`, `fehlschlag`), Relays und
   das heutige Datum, ruft `startseiteLaden`.
2. `startseiteLaden` bildet Materialien, zählt Schlagworte (Fallback
   `about:prefLabel:de`, max. 4 je Material), sortiert saisonal zuerst,
   nimmt 6 Themen; baut 4 Stufen (`elem, sek1, sek2, bbs`) mit Link
   `/materialien?stufe=<key>`; wählt die Empfehlung (Kandidaten A: saisonal
   und Bild, B: Bild, C: alle; Element per djb2-Hash des Datums); setzt
   `status = { text, warnung }` aus `leerstandErklaeren`, wenn keine
   Materialien da sind.
3. `Startseite.svelte` rendert die Sektionen; ohne Materialien steht statt
   der Empfehlung `p.status-hint` (mit `status-warn` bei Fehlschlag oder
   belastbar leerem Stand).

## Liste `/materialien`

`q` (Text, includes über Titel, Beschreibung, Herkunft, Schlagworte,
kleingeschrieben) und `stufe` (Key) als Query-Parameter. Ergebnisleiste
„N Treffer“, aktive Filter als Pillen mit Link zum Entfernen, Karten in
Spiegelreihenfolge. Keine Treffer → „Dazu passt gerade nichts“ mit den
aktiven Filtern und Link „Filter aufheben“. Spiegel leer → Leerstands-
Erklärung wie bisher. Facetten, Sortierung, Merkliste: nicht Teil dieser
Spec; `filterAnwenden` ist so geschnitten, dass sie sich ergänzen lassen.

## Fehlerfälle

- Kein Spiegelstand, kein Fehlschlag → Startseite mit Kopf, Suche,
  Kacheln und Hinweis „Materialien werden geladen …“.
- Fehlschlag oder belastbar leer → Hinweis mit `status-warn` und der
  Erklärung aus `leerstandErklaeren`.
- Ungültiges `?primaryColor` → ignoriert, Standardfarben.
- Bild der Empfehlung fehlt (`bild === null`) → Typ-Icon auf Tint. Ein
  Ladefehler des Bildes wird ohne JavaScript nicht abgefangen; das Bild
  bekommt `alt=""`, das Icon steht nicht dahinter.

## Tests (ohne Netz, gegen Fixtures)

- `typen.test.js`, `farben.test.js`, `saison.test.js`, `material.test.js`
  (neue Felder), `konfig.test.js` (`QUELLE_FAECHER`), `spiegel.test.js`
  (`#about:id` im Filter), `startseite.test.js`, `uebersicht.test.js`
  (Filter), `test/oberflaeche.test.js` (Startseite, Kopf-/Fußzeile, Liste
  mit `svelte/server`), `test/architektur.test.js` (Hex-Regel).
- Fixtures um zwei Events erweitert: eins mit `t`-losen Schlagworten aus
  `about`, saisonalem Schlagwort und Bild; eins mit `contributor:name`,
  `encoding:contentUrl` und Berufsbildung.

## Abnahme

Entspricht Abschnitt 11 der Vorlage, mit den Abweichungen oben: (1) Seite
rendert ohne Daten; (2) mit Daten Themen-Chips und Empfehlung; (3) Relays
unerreichbar → Hinweis, Kacheln und Suche benutzbar; (4) Suche, Chip,
Kachel, Durchstöbern landen auf `/materialien` mit Query bzw. Stufe;
(5) Empfehlung stabil innerhalb eines Tages; (6) `?primaryColor=%23C1272D`
färbt Kopf, Suche, Kacheln konsistent; (7) Breakpoints 960/640 px ohne
horizontales Scrollen. Geprüft gegen das Mock-Relay im Browser.
