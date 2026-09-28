# STATUS — Logbuch

Neuester Eintrag oben. Jeder Eintrag beantwortet drei Fragen:
**Was ist passiert? Wo steht das Projekt? Was ist der nächste Schritt?**

Regeln stehen in `../CLAUDE.md`, Begründungen in `entscheidungen/`,
das Gesamtbild in `superpowers/specs/2026-09-28-materialpool-neustart-design.md`.

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
