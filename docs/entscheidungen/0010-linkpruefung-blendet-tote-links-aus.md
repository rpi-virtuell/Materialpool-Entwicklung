# ADR-0010: Eine Link-Prüfung im Server blendet Materialien aus, deren Link zweimal hintereinander „gibt es nicht“ meldet

**Status:** angenommen (2026-10-08) · Nachtrag 2026-10-08: Geprüft wird jetzt das Ziel, nicht die Zwischenseite (siehe unten)
**Beteiligte:** Christina Kreutz, Claude (Umsetzung)

## Kontext

Materialien verlinken auf fremde Seiten, und die verschwinden. Ein
Konzept vom 21.09.2026 (Team-Doc „404-Erkennung im Materialpool“) sah
eine Prüfung im Server vor, sobald es einen gibt; dieses Repo hat einen.
Zur Wahl standen beim Umfang: (a) nur eindeutige Fälle (404, 410), (b)
auch weiche Fehler (Seite da, Inhalt ausgetauscht, per Fingerabdruck) —
und beim Umgang: Hinweis am Material, Ausblenden, oder nur eine Liste
für die Redaktion.

## Entscheidung

Wir prüfen nur eindeutige Fälle und blenden aus:

- Ein Hintergrundlauf im Server (`services/linkpruefung.js`, neben dem
  Spiegel) fragt je Takt einige Links an: `HEAD`, bei 404/410 zur
  Sicherheit noch einmal `GET` (manche Server beantworten `HEAD` falsch).
  Jeder Link kommt etwa einmal je `LINKPRUEFUNG_INTERVALL_S` dran.
- **Weg** ist ein Link nur bei 404 oder 410. Alles andere — 403, 429,
  5xx, Zeitüberschreitung, DNS-Fehler — ist **unklar** und zählt weder
  für noch gegen den Link: Viele Server sperren Prüfprogramme aus oder
  sind kurz nicht da.
- Ausgeblendet wird erst nach **zwei** „weg“ hintereinander; ein „weg“
  holt die nächste Prüfung auf einen Tag vor. Eine Antwort 2xx/3xx setzt
  den Zähler zurück, das Material erscheint wieder.
- Ausgeblendet heißt: nicht in Liste, Suche und Startseite. Die Liste
  sagt, wie viele das betrifft (nie still), und verlinkt auf
  `/ausgeblendet`: Titel, Anbieter, toter Link, Antwort, seit wann und
  zuletzt geprüft — damit jemand bei den Anbietern nachfragen kann
  (Nachtrag 2026-10-08). Die Seite ist für alle erreichbar, aber nicht in
  der Kopfzeile und `noindex`. Die Detailseite bleibt
  erreichbar (Lesezeichen, Merkliste) und sagt, dass der Link zuletzt
  nicht erreichbar war, ohne „Material öffnen“.
- Der Stand liegt in `LINKPRUEFUNG_PFAD` (Standard
  `daten/linkpruefung.json`) und überlebt Neustarts.

## Konsequenzen

- Leichter: Tote Links verschwinden ohne Redaktionsarbeit, und sie
  kommen von selbst zurück, wenn die Seite wieder da ist.
- Schwerer: Rund 97 % der Materialpool-Links führen über die
  Zwischenseite `material.rpi-virtuell.de`. Geprüft wird die
  Zwischenseite, nicht das Ziel dahinter — ein totes Ziel hinter einer
  lebenden Zwischenseite bleibt unentdeckt (bewusst, siehe Konzept:
  die Zwischenschicht soll wegfallen).
- **Nachtrag 2026-10-08:** `material.url` nimmt jetzt zuerst
  `encoding:contentUrl`, die Adresse beim Anbieter (wie ReliDesk seit
  2026-09-23). Im Bestand vom 08.10. hatten 7.701 von 7.702
  Materialpool-Einträgen eine; bei 167 zeigt auch sie auf
  rpi-virtuell. „Material öffnen“ und die Link-Prüfung gehen damit am
  Katalog vorbei, der Punkt oben gilt nur noch für diese Reste — und
  für die 1.331, deren contentUrl eine Datei ist: Dort bleibt es bei
  der Katalogseite, damit „Material öffnen“ keinen Download startet.
- Falsch wäre die Entscheidung, wenn Materialien zu Unrecht
  verschwinden (ein Server antwortet Prüfprogrammen mit 404). Dann: die
  Liste der ausgeblendeten Links ansehen und solche Server ausnehmen,
  oder auf „Hinweis statt Ausblenden“ umstellen.
