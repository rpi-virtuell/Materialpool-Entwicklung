# ADR-0005: Die Suche fragt die konfigurierten Relays per NIP-50 und rendert die Treffer aus dem Spiegel-Modell

**Status:** angenommen (2026-09-29)
**Beteiligte:** Jörg Lohrer (Entscheidung), Claude (Vorschlag und Umsetzung)

## Kontext

Mit dem echten Bestand (7.701 Materialien, ADR-0003) reicht die Wortsuche
über den Spiegel nicht: Sie kennt kein Ranking, und `includes` über Titel
und Beschreibung trifft zu grob. Jörg wünschte eine Suche „über den
AMB-MCP“. Zur Wahl standen: (a) der AMB-MCP (`mcp.amb.edufeed.org`,
JSON-RPC mit Bearer-Token, bietet auch semantische Passagensuche),
(b) NIP-50 direkt am Relay über das vorhandene `relay.js` — dieselbe
Typesense-Suche, die auch hinter dem MCP liegt, ohne Token und ohne
weitere Abhängigkeit — oder (c) der Spiegel-Filter bleiben. ADR-0001 hatte
„Suche über Relays hinweg“ ausgeschlossen, weil damals kein Bestand da war.

## Entscheidung

Wir wählen (b): Bei Suchtext schickt der Server eine REQ mit `search` an
alle konfigurierten Relays, mit denselben Einschränkungen wie der Spiegel
(`authors`, `#about:id`), höchstens 250 Treffer, relevanzsortiert. Die
Treffer werden mit dem Spiegel-Modell gerendert; Facetten, Sortierung und
Seiten arbeiten auf der Treffermenge; „Empfohlen“ heißt dann „Relevanz“.
Antwortet kein Relay, springt die Wortsuche über den Spiegel ein — mit
Hinweis. Ergebnisse liegen `SPIEGEL_INTERVALL_S` im Speicher, weil
Facetten und Seiten dieselbe Suche wiederholen. `services/spiegel.js`
bleibt die einzige Datei, die mit dem Relay spricht.

Der MCP bleibt eine Option für später (Passagensuche, Fragen an den
Bestand); dafür braucht es eine eigene ADR und ein Token in `.env`.

## Konsequenzen

- Leichter: Relevanz-Ranking aus Typesense, gleiche Treffer wie im MCP,
  keine neue Abhängigkeit, kein Geheimnis im Betrieb.
- Schwerer: Eine Suche kostet 1–2,5 s am Relay (einmal je Suchtext und
  Intervall); ohne Relay nur Wortsuche. Die Startseite bleibt unabhängig
  vom Relay, die Liste mit Suchtext nicht.
- Woran wir merken, dass sie falsch war: Wenn Nutzer Fragen stellen statt
  Stichworte zu suchen, oder das Relay unter Suchlast leidet — dann
  Passagensuche über den MCP (neue ADR) oder ein eigener Index.
