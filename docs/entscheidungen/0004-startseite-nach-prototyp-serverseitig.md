# ADR-0004: Die Startseite übernimmt Gestaltung und Aufbau des Materialpool-2.0-Prototyps, bleibt aber serverseitig gerendert aus dem Spiegel

**Status:** offen (umgesetzt am 2026-09-29 unter Vorbehalt der Besprechung)
**Beteiligte:** Jörg Lohrer; zu bestätigen mit Christina Kreutz

## Kontext

Für „Materialpool 2.0“ liegt ein React/Vite-Prototyp mit Startseite,
Liste, Detail, Merkliste und CI-Theming vor, dokumentiert als Svelte-
Bauanleitung samt `startseite.css`. Er ist ein reiner Client: Relays per
WebSocket im Browser, Zustand in Stores. Dieses Repo rendert serverseitig
aus dem Spiegel und schließt Suche über Relays, Anmeldung und Eingabe aus
(ADR-0001). Zur Wahl standen: (a) den Prototyp 1:1 als Client-App
nachbauen und die Regeln aufgeben, (b) nur die Optik übernehmen, (c)
Aufbau, Texte, Klassen und CSS übernehmen und jede Client-Mechanik durch
ihr serverseitiges Gegenstück ersetzen.

## Entscheidung

Wir wählen (c): Die Startseite, Kopf- und Fußzeile folgen dem Prototyp in
DOM-Reihenfolge, Klassennamen, Texten, Mappings und CSS. Alles, was im
Prototyp Client-Zustand ist, wird serverseitig aus dem Spiegel berechnet
oder entfällt:

- Suche ist ein GET-Formular auf `/materialien?q=…` und filtert den
  Spiegel; es gibt keine NIP-50-Suche und keine Relay-Abfrage je Anfrage.
- Die Merkliste und die Navigation „Gemerkt“ entfallen (nur Lesen).
- Die Empfehlung ist je Tag deterministisch, die Zielgruppen-Rotation
  reine CSS-Animation, die CI-Farbe ein serverseitig gelesener
  Query-Parameter.
- Statushinweis und Fußzeile nennen den Spiegel, nicht „live“.
- Der Fach-Filter (`#about:id`) ist Konfiguration (`QUELLE_FAECHER`),
  kein Code.
- Die Design-Tokens des Prototyps (`--blue`, `--fs-*`, `--sp-*` …) lösen
  die FOERBICO-Token als Grundlage ab; `--fb-*` bleiben als Aliase, bis
  Liste und Detail umgestellt sind. Tokennamen bleiben, wie das CSS sie
  liefert (englisch) — sie gehören zum übernommenen Stylesheet.
- Hex-Werte sind erlaubt in `src/app.css`, `src/lib/stile/*.css` und
  `src/lib/models/farben.js` (Farbdaten für Inline-Variablen); nirgends
  sonst. Der Architekturtest prüft das.

Zur Entscheidung fehlt: Bestätigung, dass „Materialpool Religion“ der
Name des Schaufensters ist, und ob `QUELLE_FAECHER` auf Religion
(`s1024`, `s1026`) stehen soll, solange ADR-0003 offen ist.

## Konsequenzen

- Leichter: Die Seite ist ohne JavaScript vollständig, cachebar und
  schnell (kein Icon-Font, nur drei Schriftdateien, Startseiten-CSS nur
  auf der Startseite). Der Prototyp bleibt als Gestaltungsvorlage
  wiedererkennbar; spätere Ergänzungen (Facetten, Sortierung) haben mit
  `filterAnwenden` und `startseiteLaden` reine Funktionen als Ansatzpunkt.
- Schwerer: Wer den Prototyp weiterentwickelt, muss Client-Mechanik hier
  neu denken. Suchtreffer sind auf den Spiegel beschränkt
  (`SPIEGEL_LIMIT`).
- Falsch wäre die Entscheidung, wenn das Team Merkliste oder Live-Suche
  im Browser will; dann braucht es eine ADR zur Client-Schicht, und
  ADR-0001 bekommt einen Nachtrag.
