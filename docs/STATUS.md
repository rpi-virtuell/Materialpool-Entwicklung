# STATUS — Logbuch

Neuester Eintrag oben. Jeder Eintrag beantwortet drei Fragen:
**Was ist passiert? Wo steht das Projekt? Was ist der nächste Schritt?**

Regeln stehen in `../CLAUDE.md`, Begründungen in `entscheidungen/`,
das Gesamtbild in `superpowers/specs/2026-09-28-materialpool-neustart-design.md`.

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
