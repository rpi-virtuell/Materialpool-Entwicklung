# ADR-0002: Joachims Vault wird archiviert, nicht gelöscht; die Historie bleibt

**Status:** angenommen (2026-09-28)
**Beteiligte:** Jörg Lohrer, Christina Kreutz

## Kontext

Das Repositorium enthielt 27 Dateien aus Joachim Happels Obsidian-Vault
(08/2024 bis 01/2025) und zehn Issues von Corinna Ullmann zu Relaunch-Texten
für rpi-virtuell.de. Beides gehört nicht zum Svelte-Vorhaben, ist aber der
dokumentierte Ausgangspunkt (Status quo, Qualitätskriterien, Idee
dezentraler OER-Metadaten). Zur Wahl standen: Historie neu schreiben,
Dateien löschen, oder verschieben und taggen.

## Entscheidung

Wir verschieben alle bisherigen Dateien unverändert nach
`Archiv/2024-2025-Joachim-Vault/`, setzen den Tag
`archiv-joachim-2025-01-31` auf den letzten alten Stand und lassen Corinnas
Issues offen, gekennzeichnet mit dem Label „Relaunch rpi-virtuell.de (2025)“.

## Konsequenzen

- Leichter: Nichts geht verloren, Wikilinks und Bilder bleiben im Archiv
  auffindbar, die Git-Historie ist vollständig.
- Schwerer: Das Archiv taucht in Suchen mit auf; wer im Repo sucht, muss
  `Archiv/` ausblenden.
- Falsch wäre die Entscheidung, wenn das Archiv jemanden irreführt; dann
  bekommt es einen deutlicheren Hinweis, wird aber nicht gelöscht.
