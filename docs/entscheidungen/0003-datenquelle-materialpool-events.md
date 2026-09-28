# ADR-0003: Welcher Schlüssel publiziert Materialpool-Einträge als kind:30142 auf welches Relay

**Status:** offen
**Beteiligte:** Jörg Lohrer, Christina Kreutz, Steffen (edufeed), Redaktion Materialpool

## Kontext

Das Schaufenster zeigt nur, was als `kind:30142` auf den konfigurierten
Relays liegt. Am 28.09.2026 ist unklar, ob `amb-relay.edufeed.org` solche
Events von einem Materialpool-Publisher hält; eine Abfrage von außen blieb
ohne Antwort. Kandidaten für den Weg dorthin: Export aus WordPress über die
vorhandene REST-API (`mymaterial/v1`, `materialpool/v1`) und
`amb-nostr-converter`; der n8n-Workflow `scrape2materialpool`; der
FOERBICO-Redaktionsschlüssel oder ein eigener Materialpool-Schlüssel.

## Entscheidung

Offen. Favorisiert: ein eigener, dokumentierter Materialpool-Schlüssel
(Signatur per Bunker, kein Klartext-Key), der einen ersten Testbestand von
20 bis 50 Einträgen aus dem WordPress-Materialpool über
`amb-nostr-converter` auf `amb-relay.edufeed.org` publiziert. Bis dahin
bleibt `QUELLE_AUTOREN` leer und der Spiegel zeigt alles, was das Relay bis
`SPIEGEL_LIMIT` liefert.

Zur Entscheidung fehlen: Bestätigung von edufeed, dass `amb-relay` schreibend
offen ist; Festlegung des Schlüssels und seiner Verwahrung; Lizenzprüfung des
Testbestands.

## Konsequenzen

- Mit Schlüssel: Filter `authors` schließt fremde Events aus; ohne: das
  Schaufenster zeigt, was immer auf dem Relay liegt — für Dev in Ordnung,
  für eine Adresse mit Publikum nicht.
- Woran wir merken, dass es falsch war: Wenn der Bestand doch aus WordPress
  gerendert werden muss, weil kein Publisher entsteht — dann wird ADR-0001
  nachgetragen.
