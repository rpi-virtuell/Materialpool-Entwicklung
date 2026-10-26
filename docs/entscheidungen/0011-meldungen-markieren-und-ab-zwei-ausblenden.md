# ADR-0011: Alle können ein Material melden; eine Meldung markiert es, ab zwei ist es vorläufig ausgeblendet, bis die Redaktion entscheidet

**Status:** angenommen (2026-10-26) · Nachtrag 2026-10-26: Was ausgeblendet ist, zeigt nur noch die Redaktionsseite (siehe unten)

## Kontext

Die Link-Prüfung (ADR-0010) findet tote Links, aber keine falsche Lizenz,
keinen problematischen Inhalt und keine falschen Angaben. Das sehen nur
Menschen. Die Materialien liegen als signierte Events auf fremden Relays
und können dort nicht gelöscht oder geändert werden. Ausblenden und
Markieren geht also nur im Schaufenster. Zur Wahl standen bei der
Wirkung: nur markieren, ab zwei Meldungen vorläufig ausblenden, sofort
ausblenden. Bei der Redaktion: E-Mail mit persönlichem Entscheidungslink,
eine Redaktionsseite mit gemeinsamem Kennwort, oder nur eine Liste. Dazu
kamen die Fragen, ob Meldungen ins Nostr-Netz gehen (NIP-56) und ob das
Formular Kontaktdaten erfragt.

## Entscheidung

Wir bauen eine Meldefunktion, die bei uns bleibt. Eine Meldung markiert
ein Material, ab der zweiten ist es vorläufig ausgeblendet, und die
Redaktion entscheidet auf einer eigenen Seite.

**Ablauf**

1. **Melden.** Auf der Detailseite steht unter den Angaben „Stimmt etwas
   nicht? Melden“ (`<details>`, ohne JavaScript). Das Formular fragt einen
   **Grund** (Lizenz falsch · Inhalt problematisch · Link oder Angaben
   falsch · Sonstiges) und eine **kurze Begründung** (Pflicht, höchstens
   1.000 Zeichen) ab. Danach sagt die Seite „Danke …“, und dieser Browser
   kann dasselbe Material nicht noch einmal melden.
2. **Speichern und benachrichtigen.** Der Server legt die Meldung in
   `MELDUNGEN_PFAD` ab (Standard `daten/meldungen.json`) und schickt
   der Redaktion eine E-Mail mit Grund, Begründung, Stand und den Links
   zum Material und zur Redaktionsseite. Ohne `MAIL_VERSAND=an` steht
   diese E-Mail nur im Protokoll des Servers. So läuft alles lokal und
   live, bevor die Zugangsdaten für den Versand auf dem Server liegen.
3. **Wirkung.**
   - **Eine offene Meldung:** Die Detailseite sagt „Zu diesem Material
     liegt eine Meldung vor. Die Redaktion prüft sie.“ Den Text der
     Meldung zeigt sie nicht.
   - **Zwei oder mehr offene Meldungen:** Das Material ist **vorläufig
     ausgeblendet**, wie bei ADR-0010: nicht in Liste, Suche und
     Startseite. Die Liste nennt die Zahl und verlinkt `/ausgeblendet`.
     Die Detailseite bleibt erreichbar, sagt, dass das Material gemeldet
     ist, und zeigt kein „Material öffnen“.
   - Eine zweite Meldung aus **demselben Browser** zählt nicht. Das
     merkt sich ein Cookie, mehr lässt sich ohne Daten über die
     meldende Person nicht erkennen.
4. **Entscheiden.** `/redaktion` (noindex, nicht in der Kopfzeile) listet
   die gemeldeten Materialien mit allen Meldungen. Je Material gibt es:
   - **Bestätigen:** Das Material bleibt ausgeblendet und steht mit dem
     Grund unter „Von der Redaktion ausgeblendet“, auch auf
     `/ausgeblendet`. Später geht **Wieder einblenden**, dann wird alles
     zu diesem Material gelöscht.
   - **Verwerfen:** Die offenen Meldungen werden gelöscht, Hinweis und
     Ausblenden enden.

   Ist `REDAKTION_KENNWORT` gesetzt, fragt die Seite zuerst danach. Ist
   es leer, ist die Seite vorerst offen und sagt das selbst. Wer die
   Adresse kennt, kann dann entscheiden. Das ist für den Prototyp so
   gewollt, damit die Redaktion schon arbeiten kann, bevor das Kennwort
   auf dem Server liegt. Ein gemeinsames Kennwort ist kein Konto
   (ADR-0006 gilt weiter).

**Schutz vor Missbrauch, ohne JavaScript**

- Ein **Fangfeld**, das Menschen nicht sehen: Ist es ausgefüllt, gilt
  die Meldung als Spam und wird stillschweigend verworfen.
- Das Formular trägt einen **signierten Zeitstempel**. Wer nach weniger
  als drei Sekunden abschickt, wird ebenfalls stillschweigend verworfen.
  Ist der Stempel älter als einen Tag oder ungültig (etwa nach einem
  Neustart), wird freundlich um erneutes Absenden gebeten.
- Höchstens `MELDUNGEN_JE_TAG` Meldungen in 24 Stunden insgesamt
  (Standard 30). Danach heißt es: bitte morgen noch einmal.

**Datenschutz**

Gespeichert werden nur: Material, Titel, Grund, Begründung, Zeitpunkt und
Stand. Wir speichern keinen Namen, keine E-Mail-Adresse und keine
IP-Adresse. Das Formular bittet darum, keine Namen oder Kontaktdaten
in die Begründung zu schreiben. Verworfene Meldungen werden ganz
gelöscht. Ein freiwilliges Feld für eine Kontaktadresse kommt erst, wenn
die Datenschutzstelle des Comenius-Instituts zugestimmt hat.

**Nicht ins Nostr-Netz (NIP-56)**

NIP-56 sieht Meldungen als `kind:1984` vor. Wir nutzen das vorerst
nicht:

- Solche Meldungen sind öffentlich und lassen sich nicht zurücknehmen,
  auch eine falsche nicht.
- Die Meldearten dort (Nacktheit, Schadsoftware, Beleidigung, Illegales,
  Spam, Identitätsbetrug, Sonstiges) kennen keine falsche Lizenz.
- Der Materialpool hat noch keinen eigenen Schlüssel, um zu signieren
  (ADR-0003).

Denkbar ist später: Hat der Materialpool einen Schlüssel, veröffentlicht
er die von der Redaktion bestätigten Fälle, damit andere Plattformen
davon erfahren.

## Konsequenzen

- Leichter: Fehler, die keine Maschine findet, kommen bei der Redaktion
  an. Problematische Inhalte verschwinden nach zwei Meldungen, ohne auf
  die Redaktion zu warten.
- Schwerer: Wer es darauf anlegt, kann mit zwei Browsern ein Material
  vorläufig ausblenden. Die Tagesgrenze begrenzt das, und die Redaktion
  blendet mit einem Klick wieder ein.
- Solange die Redaktionsseite ohne Kennwort offen ist, kann jede Person,
  die die Adresse kennt, Meldungen bestätigen oder verwerfen. Vor einem
  echten Start: `REDAKTION_KENNWORT` setzen.
- Für den Versand der E-Mails braucht der Server Zugangsdaten
  (`MAIL_VERSAND=an`, `SMTP_*`, `MAIL_AN`, `MAIL_VON`, siehe
  `docs/betrieb.md`). Bis dahin muss jemand selbst nach `/redaktion`
  schauen.
- **Nachtrag 2026-10-26:** Gemeldete Materialien stehen nicht mehr
  öffentlich auf `/ausgeblendet`. Sonst stünde dort mit Anbieter
  „Inhalt problematisch“, schon nach zwei anonymen Meldungen und bevor
  die Redaktion geprüft hat. `/redaktion` ist jetzt die einzige Seite
  für alles Ausgeblendete: offene Meldungen, von der Redaktion
  Ausgeblendetes und die toten Links aus ADR-0010. `/ausgeblendet`
  gibt es nicht mehr, auch keine Weiterleitung. Die Liste sagt weiter, wie viele Materialien
  nach Meldungen fehlen, aber ohne Link. Die Detailseite eines
  Materials nennt wie bisher seinen Stand.
- Falsch wäre die Entscheidung, wenn häufig Materialien zu Unrecht
  verschwinden: Dann die Schwelle anheben oder auf „nur markieren“
  umstellen. Kommen kaum Meldungen, aber viel Spam: das Formular hinter
  die Kontoebene legen oder ein Rätsel ergänzen.
