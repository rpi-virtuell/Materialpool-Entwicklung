# Fixtures

`amb-beispiele.json`: sieben **echte, signierte** kind:30142-Events vom
Materialpool-Schlüssel `610df6d6…` auf `amb-relay.edufeed.org`, geholt am
29.09.2026 und unverändert übernommen. Sie dienen den Modell- und
Oberflächentests ohne Netz und decken ab:

1. Religionen und miteinander leben (Arbeitsheft) — Bild, zwei Publisher,
   Primar- und Sekundarbereich I, vier Ressourcentypen, `datePublished`.
2. Berufsorientierung — kein Bild, keine Bildungsstufe, nur Urheber.
3. EKD: Erntedankfest — saisonales Schlagwort, elf `t` (Kappung auf 4),
   sechs Bildungsstufen (Elementar bis Fortbildung), Bild.
4. Ein frischer Geist weht — Video, Bild mit `http://`.
5. Jenseits des Wissens — keine `t` (Fallback `about:prefLabel:de`),
   keine Bildungsstufe, Publisher Landeskirche.
6. Flüchtlinge schützen — sieben Ressourcentypen, Sekundarbereich I/II und
   Postsekundar, Bild.
7. Ein Material mit Lizenz CC BY-SA 4.0, Bild, Urheber, Primarbereich.

`amb-faecher.json`: zwei **echte, signierte** kind:30142-Events für die
Fach-Facette, geholt am 30.09.2026 und unverändert übernommen (Event-id
gegen den Inhalt geprüft). Eigene Datei, damit die Zählungen der
Tests über `amb-beispiele.json` gleich bleiben:

1. Lesepause – Magazin für Religionslehrkräfte im Erzbistum Paderborn
   (`amb-relay.edufeed.org`, Schlüssel `78a65199…`) — `about:id`
   s1024 und s1026, also evangelisch und katholisch.
2. Kein Frieden ohne Frieden der Religionen (`sodix.edufeed.org`,
   Schlüssel `da60d98e…`) — nur s1055, also überkonfessionell.

Keine handgeschriebenen Beispieldaten mehr (Wunsch vom 29.09.2026):
Was hier steht, liegt so auf dem Relay. Neue Fixtures kommen mit demselben
Weg dazu — vom Relay holen, nicht erfinden.
