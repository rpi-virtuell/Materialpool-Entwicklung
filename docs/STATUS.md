# STATUS — Logbuch

Neuester Eintrag oben. Jeder Eintrag beantwortet drei Fragen:
**Was ist passiert? Wo steht das Projekt? Was ist der nächste Schritt?**

Regeln stehen in `../CLAUDE.md`, Begründungen in `entscheidungen/`,
das Gesamtbild in `superpowers/specs/2026-09-28-materialpool-neustart-design.md`.

---

## 2026-09-30 — Nachzug aus dem Prototyp: Kacheln, Zielgruppen, Empfehlung

**Passiert:** Christina hat den React-Prototyp „Materialpool 2.0“ nach
dem Stand, der dieser Startseite zugrunde liegt, weiterentwickelt. Die
drei kleinen Änderungen daraus sind übertragen (Branch
`feat/prototyp-nachzug`), je ein Commit:

- **Kacheln nach Alter:** „Nach Alter einsteigen“ mit Kinder /
  Jugendliche / Junge Erwachsene / Erwachsene (`STUFEN_LABEL_ALTER` in
  `models/typen.js`). Zuordnung und Links unverändert; die Facette der
  Liste nennt weiter die Schulstufe.
- **Zielgruppen gemischt:** Schule und Schulgottesdienste, Konfi- und
  Jugendarbeit stehen nicht mehr nebeneinander, auch nicht über den
  Umlauf; ein Test hält das fest.
- **Empfehlungskarte:** Rücken, Hover-Rand und Label in `--blue` statt
  in der Cover-Tinte, die neben einem Foto als einzelne Fremdfarbe stand.
- **Architekturtest unter Windows:** `fileURLToPath` und Schrägstriche
  statt `.pathname`; unter Linux unverändert.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 133 Tests grün. Lokal
gegen `amb-relay.edufeed.org` im Browser geprüft (7.701 Materialien).
Aufgefallen: Die Dev-Seite `material.rpi-virtuell.net` zeigt 290
Materialien von `relay.edufeed.org` und `relay-rpi.edufeed.org` — die
`.env` auf dem Server weicht von `.env.example` ab.

**Nächster Schritt:** Review und Merge durch Jörg. Aus dem Prototyp
offen: die Suche in eigenen Worten (Sätze werden zu Filtern, passt
serverseitig) und die Kontoebene mit Profil — Letztere widerspricht
ADR-0001/0004 („keine Anmeldung“) und braucht zuerst eine ADR. Die
Facette „Fach“ aus dem Prototyp bringt beim jetzigen Bestand nichts
(alle 7.701 evangelisch).

---

## 2026-09-29 (3) — Echte Daten: Materialpool-Bestand vom Relay, kein Mock mehr

**Passiert:** Beim lokalen Prüfen fiel auf, dass `.env` seit dem 28.09. auf
das Mock-Relay zeigte und die Oberfläche handgeschriebene Beispieldaten
zeigte. Jörgs Vorgabe: **nur echte Daten, keine Beispieldaten.** Befund und
Umsetzung (Branch `feat/facetten`, zweiter Commit):

- **Bestand gefunden (ADR-0003, Nachtrag):** `amb-relay.edufeed.org` hält
  8.533 kind:30142, davon 7.701 vom Schlüssel `610df6d6…` mit
  `material.rpi-virtuell.de`-Adressen — der Materialpool, importiert am
  04.03.2026. 2.197 mit Bild, 959 mit Lizenz, alle Fach „Religionslehre
  (evangelische)“. `.env` und `.env.example` zeigen jetzt auf das Relay
  mit diesem Schlüssel als `QUELLE_AUTOREN`. Wer den Schlüssel verwahrt,
  ist zu bestätigen.
- **Spiegel blättert:** Das Relay liefert je Anfrage höchstens 250 Events;
  `seitenweise` in `services/spiegel.js` geht über `until`, bis alles da
  ist (31 Seiten, ~50 s beim ersten Lauf). `SPIEGEL_LIMIT` ist jetzt die
  Obergrenze je Relay (Standard 10.000), `SPIEGEL_STARTWARTEZEIT_S=60`.
  `daten/spiegel.json` hat 25 MB.
- **Fixtures sind echt:** `test/fixtures/amb-beispiele.json` enthält
  sieben signierte Events vom Relay, unverändert (README dort). Alle Tests
  laufen dagegen. Keine erfundenen Materialien mehr, auch nicht in Tests.
- **Modell mehrwertig:** Echte Materialien tragen bis zu sieben
  Bildungsstufen und Ressourcentypen. `stufenKeys` und `typKeys` halten
  alle, `stufe`/`typ` den ersten zur Anzeige; Filter und Facetten zählen
  über alle. Neue Stufen `fortbildung` (KIM level_C, 1.179 Materialien)
  und `hochschule` (level_A, 639) in der Facette, nicht als Kachel.
  Ein Label „Berufsbildung“ gibt es im Bestand nicht; siehe Entscheidung
  unten.
- **Seitenumbruch:** 24 Karten je Seite (`seite=`), Zurück/Weiter,
  Facetten- und Sortierlinks springen auf Seite 1. Sortierung „neu“ geht
  nach `datePublished`/`dateCreated`, weil `created_at` die Importzeit ist.
- **Leistung:** Materialien werden je Spiegelstand einmal aufbereitet
  (`routen/bestand.js`, WeakMap). `csr = false` im Layout: kein
  JavaScript-Bündel, keine Hydrationsdaten — die Liste schrumpfte von 137
  auf 67 kB (Dev-Modus, mit eingebetteten Styles). Icons als SVG-Sprite
  (`IconSprite.svelte`), je Icon nur ein `<use>`. Antwortzeiten bei 7.701
  Materialien: Startseite 8 ms, Liste 20–40 ms.
- **Suche per NIP-50 am Relay (ADR-0005, Jörgs Entscheidung):** Bei
  Suchtext fragt der Server die Relays mit `search` (Typesense-Ranking,
  1–2,5 s, höchstens 250 Treffer, je Suchtext 10 min im Speicher).
  Facetten, Sortierung und Seiten arbeiten auf den Treffern; „Empfohlen“
  heißt dann „Relevanz“. Ohne erreichbares Relay springt die Wortsuche
  im Spiegel ein, mit Hinweis. Der AMB-MCP bleibt Option für später.
- **Berufsbildung (Jörgs Entscheidung):** „Postsekundarer nicht-tertiärer
  Bereich“ (KIM level_4, 1.321 Materialien) zählt zu Berufsbildung, nicht
  zu Sekundarstufe II — die Kachel führt jetzt zu Treffern.

**Wo steht das Projekt:** 129 Tests grün, `svelte-check` 0 Fehler. Dev-
Server läuft lokal gegen das echte Relay mit 7.701 Materialien; Bilder
laden von den Quellseiten (ekd.de, bpb.de, ytimg …); Suche geprüft.

**Nächster Schritt:** `feat/facetten` mergen und pushen. Danach:
Deploy-Voraussetzungen (28.09.), Detailseite auf Prototyp-Tokens, Frage
an edufeed/Steffen, wer den Schlüssel `610df6d6…` verwahrt (ADR-0003).

---

## 2026-09-29 (2) — Liste: Facetten und Sortierung

**Passiert:** `/materialien` hat jetzt die Facetten und Sortierungen aus
Abschnitt 7 der Prototyp-Vorlage (Branch `feat/facetten`):

- **Facetten** Materialart (`typ`), Bildungsstufe (`stufe`), Schlagworte
  (`t`) als GET-Link-Chips: ODER innerhalb einer Facette, UND dazwischen;
  Zähler je Facette ohne die eigene Facette; Chips mit 0 ohne Link
  (`is-leer`). Schlagworte höchstens 12, aktive zuerst. Parameter dürfen
  sich wiederholen (`?stufe=elem&stufe=sek1`); die Kacheln der Startseite
  bleiben gültig.
- **Sortierung** `sort=empfohlen|neu|titel|anbieter` als Link-Gruppe in
  der Ergebnisleiste (kein `<select>`, weil das ohne JavaScript einen
  Knopf bräuchte). `empfohlen` = 2·Bild + 1·Lizenz, dann jüngste zuerst;
  die im Prototyp hart kodierte Ausnahme für einen Titel ist nicht
  übernommen.
- Das Suchformular hält aktive Facetten und Sortierung als versteckte
  Felder. Aktive Werte erscheinen als entfernbare Pillen.
- Logik rein in `routen/uebersicht.js` (`filterLesen`, `listenPfad`,
  `filterAnwenden`, `facettenBilden`, `sortieren`); `TYP_LABEL` in
  `models/typen.js`.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 108 Tests grün. Im
Browser gegen das Mock-Relay geprüft (Desktop und 600 px): Kombinationen
aus Facetten, Sortierung, „keine Treffer“ mit aktiven Filtern.

**Nächster Schritt:** `feat/facetten` mergen. Danach Detailseite auf die
Tokens des Prototyps umstellen und die `--fb-*`-Aliase entfernen; Deploy-
Voraussetzungen wie am 28.09.

---

## 2026-09-29 — Startseite nach dem Materialpool-2.0-Prototyp, serverseitig

**Passiert:** Jörg hat die Svelte-Bauanleitung und `startseite.css` des
React-Prototyps „Materialpool 2.0“ eingebracht. Umgesetzt auf
`feat/startseite` (Spec `superpowers/specs/2026-09-29-startseite-design.md`,
ADR-0004 mit Status „offen“):

- **Startseite `/`** nach Prototyp: blauer Kopf mit rotierender Zielgruppe
  (reine CSS-Animation), Suchformular (GET → `/materialien?q=`), bis zu
  sechs Themen-Chips (saisonale zuerst), vier Stufen-Kacheln mit
  Kontrastrechnung, „Aktuelle Empfehlung“ (deterministisch je Tag),
  „Alle Materialien durchstöbern“. Ohne Daten: Statushinweis aus
  `leerstandErklaeren`.
- **Liste `/materialien`** (bisher `/`): Filter `q` und `stufe` über den
  Spiegel, Ergebnisleiste „N Treffer“, entfernbare Filter-Pillen, Karten
  mit Cover-Farben (Ink/Tint je Typ) und Typ-Icon. Facetten und Sortierung
  aus Abschnitt 7 der Vorlage sind noch nicht gebaut; `filterAnwenden`
  ist der Ansatzpunkt.
- **Kopf- und Fußzeile** des Prototyps auf allen Seiten; Nav nur
  „Stöbern“ (keine Merkliste, ADR-0004). Fußzeile nennt den Spiegelstand.
- **Modell**: `typ`, `stufe` (Label- und KIM-URI-Mapping), `herkunft`,
  `mitwirkende`, `themen`, URL-Fallbacks (`encoding:contentUrl`, `r`),
  `bild` nur mit http(s). Neue Module `models/typen.js`, `farben.js`,
  `saison.js`; `routen/startseite.js`.
- **Konfiguration**: `QUELLE_FAECHER` (URIs für `#about:id`), leer =
  kein Fachfilter.
- **Gestaltung**: Tokens des Prototyps in `app.css`, `--fb-*` als Aliase.
  Schriften Inter und Space Grotesk selbst gehostet (variabel, nur latin
  und latin-ext, 155 kB). Icons als Inline-SVG aus `@tabler/icons` statt
  Webfont. DaisyUI-Import entfernt (ungenutzt, 20 kB CSS); das Paket
  bleibt, eine Zeile in `app.css` schaltet es wieder ein. CSS je Route
  getrennt: Layout 12 kB, Startseite 7 kB, Liste 3,5 kB (unkomprimiert).
- **CI-Farbe** per `?primaryColor=%23RRGGBB`, serverseitig als
  Inline-Variablen auf dem Rahmen; Stufen-Palette abgeleitet.
- **Prüfungen**: 99 Tests (vorher 48), Architekturtest prüft zusätzlich:
  kein Hex außerhalb `app.css`, `lib/stile/*.css`, `models/farben.js`.
  Fixtures auf vier Events erweitert (`test/fixtures/README.md`).

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 99 Tests grün, Build
läuft. Gebauter Server gegen das Mock-Relay im Browser geprüft: Startseite
(Desktop, 600 px, `?primaryColor`), Liste mit Filter, Detail. Live-Daten
weiterhin ungeprüft (ADR-0003).

**Zu klären (ADR-0004, offen):** Name „Materialpool Religion“ bestätigen;
ob `QUELLE_FAECHER` auf Religion (`s1024`, `s1026`) gesetzt wird; ob
Merkliste oder Live-Suche im Browser gewünscht sind (dann Client-Schicht
als eigene ADR).

**Nächster Schritt:** Branch mergen, Deploy-Voraussetzungen wie am
28.09. Danach Liste um Facetten (Typ, Stufe, Schlagwort) und Sortierung
aus Abschnitt 7 der Vorlage ergänzen, Detailseite auf die Tokens des
Prototyps umstellen und die `--fb-*`-Aliase entfernen.

---

## 2026-09-28 — Neustart: Archiv, Svelte-Gerüst, Pipeline-Skelett

**Passiert:** Christina Kreutz und Jörg Lohrer haben beschlossen, dieses
Repositorium für die Materialpool-Entwicklung neu zu nutzen und Joachims
Notizen darin zu archivieren. Umgesetzt:

- Joachims Obsidian-Vault (32 Sicherungen, 08/2024 bis 01/2025) liegt unter
  `Archiv/2024-2025-Joachim-Vault/`, der alte Stand als Tag
  `archiv-joachim-2025-01-31` (ADR-0002).
- Svelte-Gerüst nach dem Muster von oer-community (ADR-0001): Konfiguration,
  Relay-Abfrage (übernommen), Spiegel für `kind:30142`, Modell für AMB-Tags,
  Übersicht `/`, Detail `/m/<kennung>` mit Entwickleransicht `/json`.
- `.woodpecker.yml`, `Dockerfile`, `docker-compose.yml`, `.env.example`
  nach oer-community; Deploy-Schritt zeigt auf `material.rpi-virtuell.net`.
- Corinnas Issues #1–#10 (Relaunch-Texte für rpi-virtuell.de, Januar 2025)
  bleiben offen und tragen jetzt das Label „Relaunch rpi-virtuell.de (2025)“.

**Wo steht das Projekt:** `svelte-check` 0 Fehler, 48 Tests grün,
`vite build` läuft. Der gebaute Server wurde gegen das Mock-Relay
(`test/mock-relay.mjs`, liefert die Fixtures) geprüft: Übersicht mit zwei
Karten, Detailseite, `/json`, 404 mit Erklärung, Spiegeldatei geschrieben.
Live gegen `amb-relay.edufeed.org` konnte am 28.09. nicht geprüft werden:
`nak req -k 30142` blieb von Jörgs Rechner aus ohne Antwort (kein EOSE);
ob das Relay überhaupt kind:30142 von einem Materialpool-Publisher hält,
ist offen (ADR-0003). Die Fixtures sind handgeschrieben nach der
Tagstruktur von `amb-nostr-converter`. Für das Mock-Relay erlaubt
`konfigLesen` `ws://` ausschließlich auf 127.0.0.1/localhost.

**Was noch fehlt, bevor der Deploy läuft** (Issues):
1. Woodpecker für dieses Repository aktivieren, Secrets `deploy_ssh_user`
   und `deploy_ssh_key` hinterlegen, Name für `deploy-app.sh` festlegen
   (Ludger).
2. `material.rpi-virtuell.net`: DNS zeigt auf den rpi-virtuell.de-Server
   (88.99.213.122), HTTP liefert eine leere Apache-Seite, HTTPS ein fremdes
   Zertifikat (`rpivirt02.intranda.com`). Es braucht vHost, Zertifikat und
   den Reverse-Proxy auf den Container — oder die Adresse zieht auf den
   Server um, auf dem oer-community läuft.
3. Datenquelle klären: Wer publiziert Materialpool-Einträge als
   `kind:30142`, mit welchem Schlüssel, auf welches Relay? (ADR-0003)

**Nächster Schritt:** Nach der Woodpecker-Aktivierung den ersten Lauf
beobachten; parallel mit Steffen (edufeed) klären, ob `amb-relay` für
kind:30142 offen ist und wie ein Testbestand hineinkommt. Dann echte Events
als Fixtures (mit Signatur) und die Signaturprüfung nachziehen.
