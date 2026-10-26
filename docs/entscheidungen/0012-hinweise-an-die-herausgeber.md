# ADR-0012: Hinweise zu falschen Angaben gehen an die, die das Material veröffentlicht haben, nicht an eine zentrale Redaktion

**Status:** offen

## Kontext

Heute geht jeder Hinweis an die Redaktion des Materialpools (ADR-0011).
Im offenen, dezentralen Netz kann der Materialpool einen Eintrag aber
nicht berichtigen, er kann ihn nur ausblenden. Ändern kann ihn nur, wer
ihn veröffentlicht hat. Später soll es keine große Redaktion mehr geben
müssen. Zur Wahl stehen: (a) alles weiter an die Redaktion, (b) Hinweise
zu den Angaben an die Herausgeber und Inhaltliches an die Redaktion, (c)
Hinweise offen im Netz, und der Materialpool folgt dem Urteil von
Menschen und Stellen, denen er vertraut.

## Entscheidung

Favorisiert ist **(b)**, mit (c) als Fernziel:

- **„Lizenz falsch“ und „Link oder Angaben falsch“** gehen an den, der
  den Eintrag veröffentlicht hat. Nur er kann ihn berichtigen.
- **„Inhalt problematisch“** bleibt beim Materialpool. Wer Material
  zeigt, entscheidet, was er zeigt, und Herausgeber haben selten ein
  Interesse daran, ihr eigenes Material auszublenden. Vielleicht sollte
  nur dieser Grund ausblenden (siehe ADR-0011, Nachtrag zum Wort).
- **Bis das geht**, landet alles bei der Redaktion, die es weitergibt.
  Die Redaktionsseite könnte dazu nennen, wer den Eintrag veröffentlicht
  hat.
- **Fernziel (c):** Hinweise liegen offen im Netz, und der Materialpool
  blendet aus, wenn genug Menschen oder Stellen, denen er vertraut, sie
  bestätigen. Dann braucht es kaum noch eine eigene Redaktion. Das steht
  im Spannungsverhältnis zu ADR-0011: Dort haben wir öffentliche
  Meldungen (NIP-56) abgelehnt, weil falsche Meldungen dort nicht
  zurückzunehmen sind.

**Was zur Entscheidung noch fehlt:**

- **Ein eigener Schlüssel für den Materialpool** (ADR-0003, offen).
  Ohne ihn kann er im Netz nichts schicken.
- **Erreichbarkeit der Herausgeber.** Rund 7.700 Einträge hat der
  Materialpool selbst unter einem gemeinsamen Schlüssel veröffentlicht;
  bei sodix und oersi veröffentlichen Sammelstellen. Urheber wie „Horst
  Heller“ stehen nur als Name in den Daten, ohne Kontakt. Zu klären ist,
  ob jemand die Nachrichten an diese Schlüssel liest, und ob man die
  Urheber anders erreicht.
- **Wie eine Nachricht im Netz aussieht:** eine verschlüsselte
  Direktnachricht an den Schlüssel (NIP-17) oder ein offener Hinweis am
  Eintrag (NIP-32/NIP-56). Das hängt an (b) oder (c).
- **Wem der Materialpool bei (c) vertraut**, und wie viele Bestätigungen
  ein Material ausblenden.

## Konsequenzen

- Leichter: Fehler werden dort berichtigt, wo sie entstehen, und
  erreichen jede Plattform, die den Eintrag zeigt, nicht nur unseren
  Materialpool. Die Redaktion schrumpft auf die inhaltlichen Fälle.
- Schwerer: Antworten die Herausgeber nicht, bleibt der Fehler stehen.
  Dann braucht es doch jemanden, der nachhakt oder ausblendet.
- Falsch wäre (b), wenn die Herausgeber Hinweise praktisch nie lesen.
  Dann bleibt es bei (a), bis die Urheber selbst veröffentlichen.
