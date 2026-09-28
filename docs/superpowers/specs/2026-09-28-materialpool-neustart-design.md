# Materialpool-Entwicklung: Neustart als Svelte-Schaufenster für AMB-Events

**Datum:** 2026-09-28 · **Status:** umgesetzt als Gerüst, Deploy ausstehend
**Beteiligte:** Christina Kreutz, Jörg Lohrer

## Ziel

Das Repositorium `Comenius-Institut/Materialpool-Entwicklung` wird das
gemeinsame Entwicklungsrepo für den nächsten Materialpool. Jeder Push auf
`main` landet per Woodpecker auf `material.rpi-virtuell.net`. Vorlage in
Aufbau, Regeln und Pipeline ist `oer-community`.

## Was gebaut wurde

1. **Archiv** (ADR-0002): alle Altdateien unter
   `Archiv/2024-2025-Joachim-Vault/`, Tag `archiv-joachim-2025-01-31`.
2. **Svelte-Gerüst** (ADR-0001):
   - `src/lib/konfig.js` — Pflichtwerte, Abbruch beim Start.
   - `src/lib/services/relay.js` — aus oer-community übernommen.
   - `src/lib/services/spiegel.js` — Stand über alle Relays, Datei, Zeitgeber;
     ersetzbare Events je `(pubkey, d)`.
   - `src/lib/models/material.js` — AMB-Tags → Material, SKOS-Labels,
     Lizenzkürzel, Kennung aus `d`.
   - `src/lib/routen/` — Übersicht mit Leerstands-Erklärung, Detail.
   - Routen `/`, `/m/[kennung]`, `/m/[kennung]/json`; Komponenten Kopfzeile,
     Fußzeile (Spiegelstand), Übersicht, Karte, Detail.
3. **Betrieb**: `.woodpecker.yml`, `Dockerfile`, `docker-compose.yml`,
   `.env.example`, `docs/betrieb.md`.
4. **Tests** ohne Netz: Konfiguration, Modell, Spiegel, Routen,
   Architektur, Oberfläche (svelte/server).

## Was bewusst nicht gebaut wurde

Signaturprüfung, Themenfilter, Suche, Bildlizenz-Auflösung, Zweisprachigkeit,
Feed und Sitemap. Alles hat in oer-community ein Vorbild und folgt, sobald
echte Events da sind (ADR-0003) — nicht vorher, sonst prüfen wir gegen
erfundene Daten.

## Offene Punkte

Siehe `docs/STATUS.md` (Eintrag 2026-09-28) und ADR-0003.
