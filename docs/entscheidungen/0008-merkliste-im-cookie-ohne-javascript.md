# ADR-0008: Eine Merkliste „Gemerkt“ sammelt Materialien per Lesezeichen — als Cookie des Browsers, ohne JavaScript

**Status:** offen (umgesetzt am 2026-10-02 als Vorschlag, Branch `feat/prototyp-nachzug`)
**Beteiligte:** Christina Kreutz (Vorschlag, Prototyp Materialpool 2.0), Claude (Umsetzung); zu bestätigen mit Jörg Lohrer

## Kontext

ADR-0004 hat die Merkliste und die Navigation „Gemerkt“ des Prototyps
weggelassen („nur Lesen“) und festgehalten: Falsch wäre das, wenn das
Team eine Merkliste will — dann braucht es eine ADR zur Client-Schicht.
Christina möchte die Merkliste haben. Im Prototyp liegt sie im
`localStorage`; hier gibt es kein Client-JavaScript. Zur Wahl standen:
(a) weiter weglassen, (b) eine Client-Schicht nur dafür, (c) dieselbe
Merkliste serverseitig, gespeichert in einem Cookie.

## Entscheidung

Vorgeschlagen ist (c), ohne Client-Schicht: Jede Karte (Liste,
Startseite, Merkliste) trägt oben rechts ein Lesezeichen, die
Detailseite einen Knopf „Merken“/„Gemerkt“ — beides ein POST-Formular
auf `/merkliste?/umschalten`, danach zurück auf dieselbe Seite und per
Anker an dieselbe Karte. Die Liste liegt als httpOnly-Cookie `merkliste`
in diesem Browser, unabhängig von der Anmeldung (ADR-0006). Gespeichert
wird je Material ein 12-stelliger Schlüssel aus SHA-256 über `d` —
dieselbe Adresse, über die die Detailseite das Material findet; die
Event-id taugt nicht, sie ändert sich mit jeder Fassung. Höchstens 200
Einträge, damit das Cookie unter 4 kB bleibt. `/merkliste` zeigt alles
Gemerkte ungefiltert, neueste Merkung zuerst, und nennt, was nicht mehr
im Spiegel steht.

Zur Entscheidung fehlt: Jörgs Bestätigung (dann Nachtrag in ADR-0004).

## Konsequenzen

- Leichter: Materialien lassen sich wiederfinden, ohne Konto und ohne
  JavaScript. Echte Konten könnten die Liste später übernehmen (dieselben
  Schlüssel).
- Schwerer: Jedes Merken lädt die Seite neu (Post/Redirect/Get); der
  Anker bringt einen an die Karte zurück. Die Merkliste gilt nur in
  diesem Browser. Mehr als 200 Einträge gehen nicht.
- Falsch wäre die Entscheidung, wenn der Materialpool bis zu echten
  Konten nichts im Browser speichern soll — dann entfallen Lesezeichen,
  `/merkliste` und „Gemerkt“; alles andere bleibt unverändert.
