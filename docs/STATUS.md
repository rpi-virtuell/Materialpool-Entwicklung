# STATUS — Logbuch

Neuester Eintrag oben. Jeder Eintrag beantwortet drei Fragen:
**Was ist passiert? Wo steht das Projekt? Was ist der nächste Schritt?**

Regeln stehen in `../CLAUDE.md`, Begründungen in `entscheidungen/`,
das Gesamtbild in `superpowers/specs/2026-09-28-materialpool-neustart-design.md`.

---

## 2026-10-08 (8) — Seite „Ausgeblendete Materialien“

**Passiert:** Christina: Ausblenden darf nicht still passieren, jemand
soll bei den Anbietern nachfragen können. Neue Seite `/ausgeblendet`
(`routen/ausgeblendet.js`, `komponenten/Ausgeblendet.svelte`): je
Material Titel (zur Detailseite), Anbieter, toter Link, Antwort, „nicht
erreichbar seit“ und „zuletzt geprüft“, zuletzt ausgeblendete zuerst;
leer mit Erklärung. Der Hinweis unter der Liste verlinkt mit „Welches?“
bzw. „Welche?“. Für alle erreichbar, nicht in der Kopfzeile, `noindex`.
Dafür merkt sich die Link-Prüfung `wegSeit` (erstes „weg“ der Folge,
„ok“ löscht es). Mail oder automatisches Issue wären die Alternativen
gewesen; beide bräuchten Zugang auf dem Server.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 278 Tests grün; im
Dev-Server mit einem künstlich eingetragenen toten Link geprüft (Seite,
Hinweis mit Link, `noindex`), Testeintrag danach gelöscht.

---

## 2026-10-08 (7) — Kein Download hinter „Material öffnen“

**Passiert:** Christina möchte nicht, dass „Material öffnen“ einen
Download startet. Die contentUrl hat jetzt nur Vorrang, wenn sie keine
Datei ist (Endung pdf, doc(x), ppt(x), xls(x), odt/odp/ods, rtf, zip,
mp3, mp4, m4a, wav, epub) — sonst gilt `d`, die Seite, die das Material
beschreibt. Ohne solche Seite (sodix: `d` ist keine Adresse) bleibt die
Datei der einzige Weg, wie bisher. Im lokalen Bestand: 6.231
Materialpool-Einträge führen direkt zur Webseite des Anbieters, 1.331
mit Datei bleiben auf der Katalogseite; Phaidra führt wieder auf die
eigene Seite statt aufs PDF bei blossom.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 273 Tests grün; im
Dev-Server auf den ersten drei Listenseiten (72 Materialien) 57 direkt
zur Webseite, 15 Katalogseite, keine Datei.

---

## 2026-10-08 (6) — Direkt zum Anbieter statt über den Katalog

**Passiert:** `material.url` nimmt zuerst `encoding:contentUrl`, dann
`d`, dann das erste http-`r` — bisher war es `d`, beim Materialpool die
Katalogseite bei `material.rpi-virtuell.de`, von der man noch einmal
weiterklicken musste. Wie ReliDesk (Commit `bf1a54c` dort, 2026-09-23).
Im lokalen Bestand: 7.701 von 7.702 Katalog-Einträgen haben eine
contentUrl, 167 davon zeigen wieder auf rpi-virtuell. Folgen: „Material
öffnen“ führt zum Anbieter, die Link-Prüfung (ADR-0010) prüft das Ziel,
die Herkunft ohne Namen nennt den Anbieter-Host. Kennung, Adresse der
Detailseite und Merk-Schlüssel hängen weiter an `d`.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 273 Tests grün; im
Dev-Server führen 23 von 24 Detailseiten der ersten Listenseite direkt
zum Anbieter.

---

## 2026-10-08 (5) — Link-Prüfung blendet tote Links aus (ADR-0010)

**Passiert:** Neuer Hintergrundlauf neben dem Spiegel
(`services/linkpruefung.js`, Regeln in `models/linkstatus.js`): je Takt
(`LINKPRUEFUNG_TAKT_S`, 60) bis zu `LINKPRUEFUNG_JE_TAKT` (20) fällige
Links, `HEAD`, bei 404/405/410/501 `GET` hinterher. Nur 404/410 sind
„weg“; nach zwei „weg“ hintereinander fehlt das Material in Liste, Suche
und Startseite, die Liste nennt die Zahl, die Detailseite bleibt mit
Hinweis und ohne „Material öffnen“. 403, 429, 5xx, keine Antwort:
unklar, ändert nichts. Stand in `daten/linkpruefung.json`
(`.gitignore`), abschaltbar mit `LINKPRUEFUNG=aus`.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 273 Tests grün, `pnpm
build` läuft. Im Dev-Server gegen 8.381 Materialien: ein künstlich als
zweimal „weg“ eingetragener Link fehlt in Liste und Suche, Hinweise
stehen; der erste echte Takt prüfte 20 Links (13 × 200, 7 × 403 bei
`download.sodix.de/s3/…` — unklar, bleiben sichtbar).

**Nächster Schritt:** Nach einigen Tagen live ansehen, was ausgeblendet
ist (`daten/linkpruefung.json` auf dem Server), und ob ein Server
Prüfprogrammen fälschlich 404 sagt.

---

## 2026-10-08 (4) — Klartext statt Kürzel bei Materialart und Bildungsstufe

**Passiert:** Live zeigten 173 von 290 Detailseiten Kürzel wie „text“,
„video“ oder „level_A“: Die Events bringen nur die `:id` eines Begriffs,
kein `:prefLabel`, und `begriffe()` fiel auf den letzten Pfadteil
zurück. `models/begriffsnamen.js` trägt jetzt die deutschen Namen aus
zwei KIM-Vokabularen vollständig (hcrt 26, educationalLevel 12, Stand
2026-10-08); ein mitgeliefertes Label hat weiter Vorrang. Ohne Namen
bleiben, was in keinem Vokabular steht: `educationalLevel/adult_education`
und `w3id.org/reliedu/…` (je ein Material), dazu die
Hochschulfächersystematik (`n02`, `n08`, ein Material).

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 252 Tests grün; im
Dev-Server alle 24 Detailseiten der ersten Listenseite ohne Kürzel.

**Nächster Schritt:** Aufgefallen: `hochschulfaechersystematik/n02` ist
„Evangelische Theologie, -Religionslehre“ — solche Materialien zählt die
Fach-Facette nicht als evangelisch, sie liest nur die Schulfächer.

---

## 2026-10-08 (3) — Entscheidungen 0006–0009 angenommen, Menüpunkt „Mein Profil“

**Passiert:** Angenommen:
Kontoebene (0006), drei Relays mit allen Religionsfächern (0007),
Merkliste (0008), Signaturprüfung (0009); Nachträge in 0001 und 0004.
Jörgs offene Frage zu 0006 ist entschieden: Die Kopfzeile sagt
abgemeldet „Mein Profil“ statt „Anmelden“, `/konto` heißt „Dein Profil“,
der Knopf „Profil anlegen“ — „Anmelden“ versprach ein Konto, das es
nicht gibt.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 252 Tests grün.

Danach auch ADR-0004 angenommen: Das Schaufenster heißt „Materialpool
Religion“.

**Nächster Schritt:** `.env` des Servers nach ADR-0007 — Issue #15 (Jörg
oder Ludger). Offen
bleibt ADR-0003 (wem der Materialpool-Schlüssel gehört und wie neue
Einträge aufs Relay kommen) — Frage an Jörg, edufeed oder die Redaktion.

---

## 2026-10-08 (2) — `QUELLE_FAECHER` erreicht den Container

**Passiert:** Der offene Befund aus 2026-09-30 (3): `docker-compose.yml`
reichte `QUELLE_FAECHER` nicht durch. Eine Zeile ergänzt; ein Test in
`test/betrieb.test.js` prüft jetzt jede Einstellung, die `konfig.js`
liest, gegen `docker-compose.yml`.

**Wo steht das Projekt:** Live seit heute Detailseite und Review-Befunde
(siehe unten). Der Server zeigt 290 Materialien von relay.edufeed.org und
relay-rpi.edufeed.org — seine `.env` folgt noch nicht ADR-0007.

**Nächster Schritt:** Jörg übernimmt `RELAYS` und `QUELLE_FAECHER` aus
`.env.example` in die `.env` des Servers — erst jetzt, sonst hätte der
Spiegel von drei Relays alle Fächer geholt.

---

## 2026-10-08 — Review-Befunde nachgezogen (Branch `fix/review-befunde-nachziehen`)

**Passiert:** `fix/review-befunde` (Eintrag 2026-09-30 (3)) zweigte von
`feat/prototyp-nachzug` ab, bevor Merkliste, Facettenspalte und
Detailseite dazukamen, und war nie in `main`. Jetzt zusammengeführt.
Konflikte in Detailseite, `routen/material.js`, `routen/uebersicht.js`
und `m/[kennung]/+page.server.js`: Die Detailseite behält Cover,
„Zurück“ und „Merken“ und nimmt die Adresse (pubkey, d) mit `?von=`
sowie die Lizenz nur mit http(s)-Link. Zwei Entscheidungen hießen 0008;
die Merkliste war schon in `main`, darum ist die Signaturprüfung jetzt
**ADR-0009** (Datei umbenannt, Verweise nachgezogen). Dazu zwei
Anpassungen, je mit Test: Der Merk-Schlüssel ist SHA-256 über
(pubkey, d) statt nur `d` — sonst teilten sich zwei Schlüssel mit
gleichem `d` ein Lesezeichen; Lesezeichen von vor dieser Änderung
finden ihr Material nicht mehr und zählen in `/merkliste` als „nicht
mehr im Spiegel“. Und der Merklisten-Cookie macht eine Seite ebenso
persönlich wie Konto und Farbe (`private, no-store`).

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 251 Tests grün, `pnpm
build` läuft. Im Dev-Server geprüft: Startseite, Liste und zwölf
Detailseiten 200 mit Cover und „Merken“; Merken → „Gemerkt“ →
`/merkliste` zeigt das Material, die Antwort trägt `private, no-store`;
Entmerken.

**Nächster Schritt:** Nach Christinas Freigabe in `main` mergen; dann
`QUELLE_VORRANG` und `ORIGIN` in die `.env` des Servers (siehe
2026-09-30 (3)).

---

## 2026-10-02 (2) — Detailseite nach dem Prototyp (Branch `feat/detailseite`)

**Passiert:** Die Detailseite folgt jetzt dem Prototyp Materialpool 2.0
und den Tokens aus `app.css` statt der FOERBICO-Aliase (nächster Schritt
aus dem Logbuch vom 29.09.). Eine Lesespalte von 760 px; oben dasselbe
Cover wie auf der Karte (Tinte, Tönung, Typ-Marke, Titel darin; ein Bild
nur weichgezeichnet als Textur unter der Tönung), darunter Herkunft,
Beschreibung, „Material öffnen“ und „Merken“, dann die Angaben als
benannte Zeilen (Bildungsstufe, Fach, Materialart, Lizenz, Datum,
Sprache, Schlagworte). AMB-Typ steht nur noch in der Entwickleransicht.
„Zurück“ ohne JavaScript über den Referer (`zurueckZiel` in
`routen/material.js`): auf Liste, Merkliste oder Startseite, von der man
kam, samt Filtern — sonst zur Liste, auch nach dem Merken. Die Bausteine
`.label`, `.marker`, `.metazeile` in `app.css` sind entfernt, sie
dienten nur der alten Detailseite.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 203 Tests grün. Im
Browser geprüft: Liste → Detail → Zurück mit Filter, Direktaufruf,
Handybreite (Knöpfe untereinander, Angaben einspaltig).

**Nächster Schritt:** Eigener Pull Request nach #14 (der Branch zweigt
von `feat/prototyp-nachzug` ab und zeigt nach dessen Merge nur sich).

---

## 2026-10-02 — Merkliste „Gemerkt“ (ADR-0008, offen)

**Passiert:** Christina wollte vor dem Pull Request auch die Merkliste
des Prototyps. Umgesetzt ohne Client-Schicht: Lesezeichen oben rechts
auf jeder Karte und „Merken“/„Gemerkt“ auf der Detailseite, je ein
POST-Formular auf `/merkliste?/umschalten`, zurück per Anker an dieselbe
Karte (`scroll-margin-top` unter der festen Kopfzeile). Die Liste liegt
als Cookie `merkliste` im Browser — je Material 12 Hex-Zeichen SHA-256
über `d`, höchstens 200. `/merkliste` zeigt alles Gemerkte, neueste
Merkung zuerst, und nennt, was nicht mehr im Spiegel steht. „Gemerkt“
in der Kopfzeile.

Danach: **Facetten als Spalte links.** Bei 1280 × 800 brauchten die
Facetten über den Karten 390 px, die erste Karte begann bei 700 px. Aus
drei Entwürfen (Aufklappen, Kompakt, Spalte) hat Christina die Spalte
gewählt: mitlaufend, rechts drei Karten je Reihe (Mindestbreite 220 px),
erste Karte bei 285 px. Schlagworte zeigen sechs plus „mehr …“
(`<details>`). Leere Chips bleiben abgeblendet stehen — ausgeblendet
wirkte es, als kenne die Seite die Werte nicht. Unter 900 px stehen die
Facetten über den Karten hinter einem Knopf „Filter“ (Kästchen + CSS,
ohne JavaScript), mit aktiven Filtern offen und gezählt — am Handy
beginnt die erste Karte damit bei 375 statt 1.055 px.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 197 Tests grün, `pnpm
build` läuft. Im Browser geprüft: Merken auf Seite 2 der Liste und
Rücksprung an die Karte, Merkliste, Entfernen auf der Detailseite,
leerer Zustand. Der Branch liegt seit dem 01.10. auf dem Server; der
Pull Request steht noch aus.

**Nächster Schritt:** Branch erneut hochladen, Pull Request an Jörg mit
ADR-0006, -0007 und -0008 zur Bestätigung.

---

## 2026-09-30 (3) — Review-Befunde behoben: Signaturen, Adressen, Suche, Farbschalter, Betrieb

**Passiert:** Ein Review von `feat/prototyp-nachzug` fand Sicherheits-
und Robustheitslücken. Behoben auf `fix/review-befunde`, je Befund ein
Commit mit Test:

- **Sicherheit:** Lizenz nur mit http(s) als Link (`javascript:` in
  `license:id` war ein Skript in der Seite); Content-Security-Policy
  ohne Skripte (`routen/koepfe.js`). Jedes Event wird vor Spiegel und
  Suchtreffern geprüft — Form, id, Schnorr-Signatur, mit QUELLE_AUTOREN
  auch lokal der Schlüssel (`services/pruefung.js`, `@noble/curves`,
  ADR-0009, offen). Materialien sind über (pubkey, d) adressiert:
  `?von=` bei mehrdeutigem `d`, sonst `QUELLE_VORRANG`, sonst das
  früheste Event — nie mehr das jüngste.
- **Robustheit:** Ein abgebrochener Lauf ist ein Fehlschlag mit Grund
  statt stillem Stillstand; ein `d` mit `%` findet sein Material (nur
  noch einmal dekodiert); der Spiegel blättert über Sekunden mit mehr
  als 250 Events; Suchtext höchstens 200 Zeichen, keine Umleitung über
  4.000 Zeichen (431), gleiche Suchen teilen eine Anfrage; `CLOSED`
  mit Grund zählt als nicht erreicht (`relay.js`); „überkonfessionell“
  nur mit s1055; Treffer der drei Relays nach Rang verzahnt.
- **Satzsuche, Konto, Farbschalter:** Zahlen bleiben Themenwörter
  („Psalm 23“), NFD wird gelesen, Erwachsene/Senioren sind Fortbildung
  (auch Kachel und Profilbereich); `frage` reist über Seiten und
  Facetten mit, „Rückgängig“ bringt ersetzte Facetten zurück (`vorher`),
  der Hinweis erscheint nur, wenn die Deutung die Suche ergibt; der
  Farbwähler gilt auch ohne Cookie, `//evil.example` wird keine fremde
  `action`; leeres „Neu für deine Arbeit“ ersetzt die Kacheln nicht
  mehr; persönliche Seiten `cache-control: private, no-store`; Name
  und Freitext nach Zeichen gekürzt.
- **Betrieb:** `ORIGIN` in `.env.example`, `docs/betrieb.md` und
  `docker-compose.yml` (sonst 403 auf `/konto` hinter Apache); der
  Container läuft als `node`.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 232 Tests grün,
`pnpm build` läuft. Gebauter Server gegen das Mock-Relay geprüft:
Startseite, Liste, Detail und `/json` 200, CSP auf jeder Seite, keine
fremden Ressourcen außer Materialbildern, „Psalm 23 für Kinder“ →
`q=Psalm 23` mit Stufe, `//evil.example` rendert `action="/evil.example"`.

**Nächster Schritt:** Offen bleiben — die Frage, ob „Anmelden“ als
Menüpunkt bleibt (ADR-0006, Entscheidung Jörg); ADR-0009 bestätigen und
danach `QUELLE_VORRANG` (Materialpool-Schlüssel) und `ORIGIN` in die
`.env` des Servers; `./daten` auf dem Server für uid 1000 beschreibbar
machen; die `relay.js`-Änderung (CLOSED mit Grund) in oer-community
nachziehen. `docker-compose.yml` reicht `QUELLE_FAECHER` nicht durch —
eigener Befund, nicht behoben.

---

## 2026-09-30 (2) — Nachzug aus dem Prototyp: Fächer, Farbschalter, Suche in eigenen Worten, Kontoebene

**Passiert:** Christina wollte alle ihre Weiterentwicklungen im Prototyp
hier haben. Übertragen auf `feat/prototyp-nachzug`, je ein Commit:

- **Fach-Facette und drei Relays (ADR-0007, offen):** Facette „Fach“
  vorne in der Liste (evangelisch … überkonfessionell, `fach=`), erkannt
  an `about:id`. `.env.example` fragt wie der Prototyp amb-relay, sodix
  und oersi nach allen sechs Religions-Kennungen, ohne Autorenfilter:
  8.382 Materialien, davon ~7.710 evangelisch, ~670 überkonfessionell,
  4 katholisch. Zwei echte Events als Fixtures (`amb-faecher.json`).
- **Farbschalter:** unten rechts Hex-Feld, Farbwähler, Übernehmen,
  Zurücksetzen — ein GET-Formular; die Farbe bleibt per Cookie beim
  Weiterklicken (bisher galt `?primaryColor` nur für eine Seite).
- **Suche in eigenen Worten:** `models/deutung.js` zerlegt einen Satz
  nach den Regeln des Prototyps; `routen/frage.js` leitet auf die
  gedeutete Suche um, zeigt „… haben wir so verstanden“ und
  „Rückgängig“ zum Wortlaut. Ohne JavaScript kein Zwischenschritt „So
  suchen“ in der Liste.
- **Behebung aus dem Bestand:** Bei der Relay-Suche verloren die
  Facetten-Links den Suchtext (Zählung ohne `q` war richtig, die Links
  nicht). Eigener Commit mit Test.
- **Prototypische Kontoebene (ADR-0006, offen):** `/konto` mit Anmelden
  nur per Name, Profil im Cookie, Begrüßung und „Neu für deine Arbeit …“
  auf der Startseite, Voreinstellung der Liste per `profil=1` mit
  Hinweis. `CLAUDE.md` und `README.md` nachgezogen.

**Wo steht das Projekt:** `pnpm check` 0 Fehler, 185 Tests grün, `pnpm
build` läuft. Im Browser gegen die drei Relays geprüft: Facette, Farbe
über Seitenwechsel und Zurücksetzen, Satz → Filter → Rückgängig,
Anmelden → Profil → Startseite → Liste → Abmelden, Handybreite.

**Nächster Schritt:** Review durch Jörg, vor allem ADR-0006 (Anmeldung
war ausgeschlossen) und ADR-0007 (Quelle breiter als der Materialpool).
Die `.env` auf dem Entwicklungsserver muss danach angepasst werden. Aus
dem Prototyp nicht übertragen: die Merkliste (ADR-0004 schließt sie aus).

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
