# ADR-0006: Eine prototypische Kontoebene stellt das Stöbern nach Bereich und Fach vor — ohne echte Konten, das Profil liegt im Cookie des Browsers

**Status:** offen (umgesetzt am 2026-09-30 als Vorschlag, Branch `feat/prototyp-nachzug`)
**Beteiligte:** Christina Kreutz (Vorschlag, Prototyp Materialpool 2.0), Claude (Umsetzung); zu bestätigen mit Jörg Lohrer

## Kontext

ADR-0001 und ADR-0004 schließen Anmeldung aus („nur Lesen“). Im
Prototyp Materialpool 2.0 hat Christina am 28.09.2026 eine prototypische
Kontoebene gebaut: Wer sich mit einem Namen anmeldet, sagt einmal, in
welchem Bereich (Grundschule … Erwachsenenbildung) und welchem Fach er
oder sie arbeitet; die Liste stellt danach Stufe und Fach von selbst ein,
die Startseite begrüßt mit dem Ort und zeigt „Neu für deine Arbeit …“.
Im Prototyp liegt das Profil im `localStorage`. Hier gibt es kein
Client-JavaScript (`csr = false`). Zur Wahl standen: (a) weglassen, bis
es echte Konten gibt, (b) echte Konten mit Server-Speicher, (c) dieselbe
prototypische Ebene, serverseitig gerendert, Profil im Cookie.

## Entscheidung

Vorgeschlagen ist (c): `/konto` mit POST-Formularen (Anmelden nur mit
Namen, Profil speichern, Abmelden), Profil als JSON in einem httpOnly-
Cookie `konto` dieses Browsers. Der Server speichert nichts. Einstiege
in die Liste tragen angemeldet `profil=1`; der Server setzt Stufe und
Fach aus dem Profil ein, soweit die Adresse sie nicht nennt, und leitet
auf die fertige Adresse um. Die Liste nennt, was noch aus dem Profil
stammt („Stufe und Fach sind aus deinem Profil voreingestellt · Profil
ändern“). Regeln und Texte folgen dem Prototyp (`models/konto.js`):
„Fach“ statt „Konfession“, nach dem Fach wird nur bei einem Schulbereich
gefragt (per CSS `:has`), Gemeinde grenzt nicht ein, eine Kachel oder ein
Satz wie „für Kinder“ schlägt die Stufe aus dem Profil, „Anderes …“ als
Freitext grenzt nichts ein. Das Bundesland wird gespeichert, aber nicht
verwendet (keine Länderangabe in den Materialdaten).

Anders als im Prototyp: „Speichern“ statt sofortiger Übernahme (ohne
JavaScript geht es nicht anders); „Anderes …“ ist ein immer sichtbares
Textfeld statt eines Knopfs, der es öffnet.

Zur Entscheidung fehlt: Jörgs Bestätigung, dass eine Kontoebene ohne
echte Konten zum Vorhaben gehört (dann Nachtrag in ADR-0001 und
ADR-0004), und ob sie auf dem Entwicklungsserver sichtbar sein soll.

## Konsequenzen

- Leichter: Das Stöbern kennt die eigene Arbeit, ohne Passwort, ohne
  Datenhaltung auf dem Server, ohne Client-JavaScript. Echte Konten
  können später dieselben Regeln (`profilFilter`) übernehmen.
- Schwerer: Der Name steht im Cookie dieses Browsers; wer sich abmeldet,
  behält ihn dort (wie im Prototyp), bis das Cookie gelöscht wird. Seiten
  sind je Profil verschieden und damit nicht mehr für alle gleich
  cachebar. Neue Profilfelder müssen auf bestehende Facetten und deren
  Namen abbilden, sonst entsteht ein zweites Vokabular.
- Falsch wäre die Entscheidung, wenn der Materialpool vor echten Konten
  keine Personalisierung zeigen soll — dann entfällt `/konto`, und die
  Einstiege verlieren `profil=1`; Liste und Startseite funktionieren
  ohne Profil unverändert.
