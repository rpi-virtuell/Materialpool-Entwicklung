# Fixtures

`amb-beispiele.json`: vier handgeschriebene, **unsignierte** kind:30142-Events
mit der Tagstruktur, die `amb-nostr-converter` (git.edufeed.org) schreibt.
Sie dienen den Modell- und Oberflächentests ohne Netz:

1. Abraham — vollständig belegt (Bild, Lizenz, SKOS-Labels, `t`).
2. Material ohne Labels — nur `d`, `name`, Lizenz, Stufen-URI ohne Label.
3. Erntedank in der Kita — saisonales Schlagwort, fünf `t` (Kappung auf 4),
   `contributor:name`, `d` ohne http (Fallback `encoding:contentUrl`),
   Elementarbereich, Unterrichtsplanung.
4. Reformation Berufsschule — keine `t` (Fallback `about:prefLabel:de`),
   keine Urheber (Fallback Hostname), Berufsbildung, Video, `image` ohne
   http (gilt als kein Bild).

Sobald der Materialpool tatsächlich publiziert (ADR-0003), kommen echte
Events vom Relay dazu — mit Signatur, damit auch die Prüfung getestet
werden kann.
