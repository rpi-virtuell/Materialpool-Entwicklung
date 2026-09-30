# ADR-0007: Der Spiegel liest alle Religionsfächer von amb-relay, sodix und oersi — nicht nur den Materialpool-Schlüssel

**Status:** offen (umgesetzt am 2026-09-30 in `.env.example`, Branch `feat/prototyp-nachzug`)
**Beteiligte:** Christina Kreutz (Vorschlag), Claude (Befund und Umsetzung); zu bestätigen mit Jörg Lohrer

## Kontext

Seit dem Befund in ADR-0003 fragt `.env.example` nur `amb-relay.edufeed.org`
und nur den Materialpool-Schlüssel `610df6d6…` (7.701 Events, alle
evangelisch). Der Prototyp Materialpool 2.0 fragt dagegen alle drei
edufeed-Relays nach allen KIM-Kennungen für Religion (s1024 evangelisch,
s1025 islamisch, s1026 katholisch, s1055 überkonfessionell, s1056
alevitisch, s1057 jüdisch), ohne Autorenfilter. Christina möchte die
anderen Fächer auch im Bestand und damit in der Facette „Fach“ haben.
Befund 30.09.2026: amb-relay 7.736 (davon 7.701 Materialpool), sodix 645,
oersi 14 — zusammen 8.382 Materialien, davon rund 7.710 evangelisch,
670 überkonfessionell, 4 katholisch.

## Entscheidung

Vorgeschlagen: `RELAYS` nennt alle drei Relays, `QUELLE_AUTOREN` bleibt
leer, `QUELLE_FAECHER` nennt die sechs Religions-Kennungen. Die Facette
„Fach“ liest dieselben Kennungen (`models/typen.js`). Nur den
Materialpool zu zeigen bleibt eine Zeile in `.env` (auskommentiert in der
Vorlage).

Zur Entscheidung fehlt: Jörgs Bestätigung, und die `.env` auf dem
Entwicklungsserver. Die zeigte am 30.09. 290 Materialien von
`relay.edufeed.org` und `relay-rpi.edufeed.org` — weder der
Materialpool-Bestand noch diese Auswahl.

## Konsequenzen

- Leichter: Die Liste zeigt Religionsmaterial auch anderer Anbieter; die
  Fach-Facette hat mehr als einen Wert.
- Schwerer: sodix taggt fachübergreifendes Material („KI und
  Facharbeiten“) zusätzlich als Religion; das kommt mit. Katholisches
  Material ist trotz allem selten (4), weil kaum ein Anbieter
  konfessionsspezifisch taggt. Der erste Spiegellauf dauert länger.
- Falsch wäre die Entscheidung, wenn der Materialpool nur den eigenen,
  redaktionell geprüften Bestand zeigen soll — dann `QUELLE_AUTOREN`
  wieder setzen (ADR-0003).
