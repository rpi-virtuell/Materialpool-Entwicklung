# Entscheidungen (ADR)

Eine Entscheidung, eine Datei, mit Status (Vorlage: `TEMPLATE.md`).
Angenommene ADRs werden nicht umgeschrieben; überholt eine spätere ADR eine
frühere, bekommt die frühere einen Nachtrag in der Statuszeile. Diese Tabelle
ist der Einstieg — die Statuszeile in der Datei ist maßgeblich.

**Was heute gilt, in einem Satz je Thema:** Svelte-Schaufenster für
AMB-Events nach dem Muster von oer-community (0001), Joachims Notizen
archiviert statt gelöscht (0002), Datenquelle noch offen — Bestand aber
gefunden (0003), Startseite nach dem Materialpool-2.0-Prototyp, serverseitig
aus dem Spiegel (0004), Suche per NIP-50 am Relay (0005), prototypische
Kontoebene ohne echte Konten, im Menü „Mein Profil“ (0006), alle
Religionsfächer von drei Relays (0007), Merkliste im Cookie (0008), nur
geprüfte Events im Spiegel (0009), Materialien mit totem Link
ausgeblendet (0010).

| Nr. | Titel | Status |
|---|---|---|
| [0001](0001-svelte-schaufenster-nach-oer-community-muster.md) | Der Materialpool wird als Svelte-Schaufenster für AMB-Events nach dem Muster von oer-community neu begonnen | angenommen (2026-09-28), Nachträge 2026-09-29, 2026-10-08 |
| [0002](0002-archiv-statt-loeschung.md) | Joachims Vault wird archiviert, nicht gelöscht; die Historie bleibt | angenommen (2026-09-28) |
| [0003](0003-datenquelle-materialpool-events.md) | Welcher Schlüssel publiziert Materialpool-Einträge als kind:30142 auf welches Relay | offen |
| [0004](0004-startseite-nach-prototyp-serverseitig.md) | Die Startseite übernimmt Gestaltung und Aufbau des Materialpool-2.0-Prototyps, bleibt aber serverseitig gerendert aus dem Spiegel | angenommen (2026-10-08), Nachträge 2026-09-29, 2026-10-08 |
| [0005](0005-suche-per-nip-50-am-relay.md) | Die Suche fragt die konfigurierten Relays per NIP-50 und rendert die Treffer aus dem Spiegel-Modell | angenommen (2026-09-29) |
| [0006](0006-prototypische-kontoebene-ohne-echte-konten.md) | Eine prototypische Kontoebene stellt das Stöbern nach Bereich und Fach vor — ohne echte Konten, das Profil liegt im Cookie des Browsers | angenommen (2026-10-08), Nachtrag 2026-10-08 |
| [0007](0007-alle-religionsfaecher-von-drei-relays.md) | Der Spiegel liest alle Religionsfächer von amb-relay, sodix und oersi — nicht nur den Materialpool-Schlüssel | angenommen (2026-10-08) |
| [0008](0008-merkliste-im-cookie-ohne-javascript.md) | Eine Merkliste „Gemerkt“ sammelt Materialien per Lesezeichen — als Cookie des Browsers, ohne JavaScript | angenommen (2026-10-08) |
| [0009](0009-vertrauen-signatur-autoren-adressen.md) | Der Spiegel nimmt nur Events mit gültiger id und Signatur, filtert Autoren selbst und adressiert Materialien über (pubkey, d) | angenommen (2026-10-08) |
| [0010](0010-linkpruefung-blendet-tote-links-aus.md) | Eine Link-Prüfung im Server blendet Materialien aus, deren Link zweimal hintereinander „gibt es nicht“ meldet | angenommen (2026-10-08) |
