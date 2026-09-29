# Materialpool-Entwicklung

Entwicklungsrepositorium für den nächsten rpi-virtuell-Materialpool: ein
**lesendes Schaufenster, das Materialien aus AMB-Events (kind:30142) auf
Nostr rendert** — nach dem Muster von
[oer-community](https://git.rpi-virtuell.de/Comenius-Institut/oer-community).
Jeder Push auf `main` soll per Woodpecker auf dem Entwicklungsserver
`material.rpi-virtuell.net` landen, damit das Team gemeinsam am Stand
arbeiten und ihn ansehen kann.

**Neustart am 28.09.2026** (Besprechung Christina Kreutz und Jörg Lohrer).
Der bisherige Inhalt — Joachims Obsidian-Vault mit Konzeptnotizen 2024/25 —
liegt unverändert in [`Archiv/2024-2025-Joachim-Vault/`](Archiv/2024-2025-Joachim-Vault/README.md)
und unter dem Tag `archiv-joachim-2025-01-31`.

## Wo das Projekt steht

`docs/STATUS.md` ist das Logbuch (neuester Eintrag oben). Die Regeln stehen
in `CLAUDE.md`, die Begründungen in `docs/entscheidungen/` (ADR), der
Betrieb in `docs/betrieb.md`.

## Lokal starten

Voraussetzung: Node ≥ 22.13 (`.nvmrc`: 24), pnpm über corepack.

```
cp .env.example .env      # Relays eintragen, QUELLE_AUTOREN vorerst leer
pnpm install
pnpm dev                  # http://localhost:5173
```

Prüfen vor jedem Merge:

```
pnpm check && pnpm test
```

Den gebauten Server ohne Netz ansehen (Mock-Relay mit den Fixtures):

```
node test/mock-relay.mjs 3790
RELAYS=ws://127.0.0.1:3790/ pnpm build && RELAYS=ws://127.0.0.1:3790/ pnpm start
```

## Wie es zusammenhängt

```
Relays (amb-relay.edufeed.org)
      │  kind:30142 (AMB-Metadaten, ein Event je Ressource)
      ▼
Spiegel  src/lib/services/spiegel.js   ← einziger Nutzer von relay.js
      │  Stand im Speicher + daten/spiegel.json, alle SPIEGEL_INTERVALL_S neu
      ▼
Modell   src/lib/models/material.js     AMB-Tags → Material
      ▼
Routen   /            Startseite (Suche, Themen, Stufen, Empfehlung)
         /materialien Liste; ?q=<Text>&stufe=<elem|sek1|sek2|bbs>
         /m/<kennung> Detail; /m/<kennung>/json rohes Event
```

Serverseitig gerendert, ohne JavaScript lesbar, keine Relay-Verbindung im
Browser. Gestaltung nach dem Materialpool-2.0-Prototyp (ADR-0004);
CI-Farbe zum Ausprobieren per `?primaryColor=%23C1272D`. Adressen und Schlüssel kommen aus `.env`, nie aus dem Code.

## Ausliefern

`.woodpecker.yml`: installieren, prüfen, testen, bauen, per SSH
`deploy-app.sh` auf dem Entwicklungsserver. Was dafür noch fehlt (Woodpecker-
Aktivierung, Deploy-Nutzer, vHost und Zertifikat für
material.rpi-virtuell.net), steht in den Issues und in `docs/betrieb.md`.

## Mitwirken

Issues und Pull Requests hier im Repository. Konzeptfragen werden als ADR
festgehalten (`docs/entscheidungen/TEMPLATE.md`), auch mit Status „offen“.
Oberfläche, Code, Bezeichner und Commits auf Deutsch; Nostr-Bezeichner
(`kind`, `tags`, `d`, `t`) bleiben englisch.

## Lizenz

Code: MIT, sofern nicht anders vermerkt. Inhalte der Materialien gehören
ihren Urhebern und tragen ihre eigene Lizenz im Event (`license:id`).
