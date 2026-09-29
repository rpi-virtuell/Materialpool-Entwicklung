# ADR-0001: Der Materialpool wird als Svelte-Schaufenster für AMB-Events nach dem Muster von oer-community neu begonnen

**Status:** angenommen (2026-09-28) · Nachtrag 2026-09-29: Die Suche über die konfigurierten Relays (NIP-50) ist mit ADR-0005 Teil des Vorhabens.
**Beteiligte:** Christina Kreutz, Jörg Lohrer (Besprechung 28.09.2026)

## Kontext

Der Materialpool läuft als WordPress (`material.rpi-virtuell.de`, Plugin
`rw-materialpool`, Theme `rw-materialpool-blocksy-theme` auf GitHub). Für die
Weiterentwicklung gab es kein gemeinsames Repositorium mit Auslieferung; das
hiesige Repo hielt nur Joachims Konzeptnotizen. Parallel ist mit
oer-community ein Muster entstanden, das Inhalte vollständig aus
Nostr-Events rendert und per Woodpecker auf einen Entwicklungsserver
ausliefert. Zur Wahl standen: (a) den WordPress-Code hierher holen und
deployen, (b) ein Konzeptrepo ohne Code, (c) ein Svelte-Schaufenster für
AMB-Events wie oer-community.

## Entscheidung

Wir beginnen den Materialpool als lesendes SvelteKit-Schaufenster für
AMB-Events (`kind:30142`) neu, übernehmen Aufbau, Regeln, Relay-Code und
Pipeline von oer-community und liefern jeden Push auf `main` auf
`material.rpi-virtuell.net` aus.

## Konsequenzen

- Leichter: Regeln und Werkzeuge sind erprobt; Muster wandern zwischen den
  beiden Projekten. Kein WordPress als Voraussetzung.
- Schwerer: Der Bestand des WordPress-Materialpools ist noch nicht als
  kind:30142 auf einem Relay — ohne Publisher zeigt das Schaufenster nichts
  (ADR-0003). Eingabe und Redaktion bleiben vorerst außerhalb.
- Falsch wäre die Entscheidung, wenn der Materialpool langfristig doch in
  WordPress weiterentwickelt werden soll; dann wird dieses Repo zum
  Schaufenster neben WordPress, und ADR-0001 bekommt einen Nachtrag.
