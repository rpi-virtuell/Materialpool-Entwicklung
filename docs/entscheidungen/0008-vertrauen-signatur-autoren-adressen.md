# ADR-0008: Der Spiegel nimmt nur Events mit gültiger id und Signatur, filtert Autoren selbst und adressiert Materialien über (pubkey, d)

**Status:** offen (umgesetzt am 2026-09-30, Branch `fix/review-befunde`)
**Beteiligte:** Claude (Review-Befund und Umsetzung); zu bestätigen mit Jörg Lohrer

## Kontext

Der Spiegel übernahm jedes Event, das ein Relay schickte: ohne Prüfung
von `id` und `sig`, und der Autorenfilter stand nur im REQ — ein Relay,
das ihn nicht beachtet, hätte fremde Schlüssel in den Bestand gebracht.
Seit ADR-0007 fragt `.env.example` drei Relays ohne Autorenfilter. Ein
Relay ist kein Zeuge dafür, wer etwas geschrieben hat; das ist allein die
Signatur.

## Entscheidung

Wir prüfen jedes Event, bevor es in den Spiegel oder in Suchtreffer
kommt (`services/pruefung.js`, benutzt nur von `services/spiegel.js`):

- **Form** nach NIP-01 (`id`/`pubkey` 64 Hex, `sig` 128 Hex,
  `created_at` und `kind` ganzzahlig, `tags` Listen von Zeichenketten,
  `content` Zeichenkette). Was durchfällt, fällt weg.
- **id** = SHA-256 der Serialisierung `[0, pubkey, created_at, kind,
  tags, content]` (`node:crypto`), **Signatur** nach BIP-340 mit
  `@noble/curves` (secp256k1 Schnorr). Das ist keine
  Relay-Kommunikation; die bleibt eigener Code ohne `nostr-tools`.
- **Autorenfilter lokal:** Ist `QUELLE_AUTOREN` gesetzt, fällt jedes
  Event eines anderen Schlüssels weg — auch wenn das Relay es trotz
  `authors` schickt, und beim Laden des gesicherten Stands.

Eine Signaturprüfung kostet rund 1,5 ms, bei 8.400 Events also etwa
13 s Rechenzeit. Das Ergebnis je (id, sig) merkt sich der Prozess
(höchstens 50.000), ein Lauf alle zehn Minuten prüft so nur Neues; die
Prüfung gibt zwischendurch die Ereignisschleife frei. Der gesicherte
Stand (`SPIEGEL_PFAD`) ist geprüft geschrieben und wird beim Start nur
auf Form und Autoren gelesen; die Signaturen prüft der erste Lauf.

## Konsequenzen

- Leichter: Was die Seite zeigt, stammt nachweislich vom genannten
  Schlüssel. Ein kaputtes Event (`tags: null`) hält den Spiegel nicht
  mehr an.
- Schwerer: Der erste Lauf nach dem Start braucht die Rechenzeit oben.
  Ein Test kann keine „neuere Fassung“ eines Fixture-Events bauen, weil
  der Schlüssel fehlt; Tests der Zusammenführung umgehen die Prüfung
  ausdrücklich (`pruefen: ungeprueft`).
- Falsch wäre die Entscheidung, wenn ein Relay Events absichtlich
  verändert ausliefern soll (etwa gekürzt) — dann fielen sie weg.
