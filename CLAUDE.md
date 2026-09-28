# Materialpool-Entwicklung

Lesender Client, der Materialien aus AMB-Events (`kind:30142`) auf Nostr
rendert — der Keim des nächsten rpi-virtuell-Materialpools. Gebaut nach dem
Muster von `Comenius-Institut/oer-community`; dessen `CLAUDE.md` und ADRs
sind die ausführliche Fassung der Regeln hier. Was dort gilt, gilt hier,
sofern eine ADR in `docs/entscheidungen/` nichts anderes sagt.

**Warum eine Regel gilt, steht in `docs/entscheidungen/`** — eine
Entscheidung, eine Datei, mit Status. Widerspricht diese Datei einer ADR,
gilt die ADR, und diese Datei ist zu korrigieren. **Neue Festlegungen aus
Besprechungen werden ADRs**, auch mit Status „offen“.

**Wo das Projekt steht: `docs/STATUS.md`** (Logbuch, neuester Eintrag oben).
Jede Arbeitssitzung beginnt dort und endet mit einem Eintrag dort.

## Zuschnitt

Nur Lesen: Übersicht und Detailansicht der Materialien aus dem Spiegel.
**Nicht Teil dieses Vorhabens (Stand ADR-0001):** Eingabe, Bewertung,
Anmeldung, Suche über Relays hinweg, Import aus dem WordPress-Materialpool.
**Was es nicht gibt, wird auch nicht angedeutet** — keine Schaltflächen oder
Menüpunkte für nicht vorhandene Funktionen, auch nicht abgeblendet.

## Die Regel, die am leichtesten erodiert

**Die Datenschicht kennt die Oberfläche nicht.** Nichts unter
`src/lib/models/`, `src/lib/routen/` oder `src/lib/services/` importiert eine
Komponente, eine Route oder `$app`/`$env`. Der Pfeil zeigt von `routes/` und
`komponenten/` nach `lib/`, nie zurück. **Nur `services/spiegel.js`
importiert `services/relay.js`.** Beides prüft `test/architektur.test.js`.

## Der Spiegel

Jede Anfrage rendert aus `src/lib/services/spiegel.js`, nie direkt vom
Relay. Ein Lauf baut über ALLE konfigurierten Relays einen neuen Stand und
tauscht ihn atomar ein; gültig ist er, wenn mindestens ein Relay geantwortet
hat. Der Stand liegt unter `SPIEGEL_PFAD` und überlebt Neustarts; scheitert
der letzte Lauf, nennt die Fußzeile das Alter des gezeigten Stands.

`kind:30142` ist ersetzbar: je `(pubkey, d)` zählt nur das jüngste Event,
bei gleichem `created_at` die kleinere `id`.

## Daten

**Tagnamen folgen dem edufeed-AMB-NIP, wie `amb-nostr-converter` sie
schreibt:** flache Felder (`d` = AMB-`id`, `name`, `description`, `image`,
`t`, `inLanguage`, `datePublished`) und Doppelpunkt-Pfade für Objekte
(`creator:name`, `publisher:name`, `license:id`, `about:id`,
`about:prefLabel:de`, `educationalLevel:…`, `learningResourceType:…`).
Das Modell ist `src/lib/models/material.js`; wer ein Feld ergänzt, ergänzt
den Test daneben.

**Wer publiziert, ist noch offen (ADR-0003).** Bis dahin ist
`QUELLE_AUTOREN` leer und der Spiegel zeigt alles, was die Relays bis
`SPIEGEL_LIMIT` liefern. Sobald der Schlüssel feststeht, kommt er in die
`.env` — nie in den Code.

**Events werden nie verändert.** Was zu säubern ist, wird beim Rendern
gesäubert.

## Serverseitig rendern

Alle Ansichten liefern fertiges HTML mit Inhalt; die Seite ist ohne
JavaScript lesbar. Keine Relay-Verbindung im Browser, keine
Live-Aktualisierung. `ssr = false` ist nie die Antwort.

## Fehlerfälle

- Kein Relay erreichbar → letzter gültiger Stand **mit Hinweis auf sein Alter**
- Spiegel leer → Meldung, die Relays und nächsten Schritt nennt
  (`leerstandErklaeren` in `src/lib/routen/uebersicht.js`)
- Pflichtwert fehlt → **Start bricht ab** (`konfigLesen`), statt später
  leere Seiten zu liefern

**Nie eine leere Liste ohne Erklärung.**

## Gestaltung

Token aus dem FOERBICO-Styleguide in `src/app.css`, übernommen aus
oer-community — kopiert, nicht verlinkt. Komponenten kennen nur Token; kein
Hex außerhalb `src/app.css`; Text auf `--fb-akzent` nie weiß. Schrift ist
vorerst System-UI (STATUS).

## Sprache

Oberfläche, Code, Bezeichner und Commits auf **Deutsch**. Ausnahme ist, was
der Nostr-Spezifikation oder AMB gehört: `kind`, `tags`, `d`, `t`,
`created_at`, `prefLabel`, `educationalLevel`.

## Technik

SvelteKit 2 + Svelte 5 (Runes) · TailwindCSS 4 + DaisyUI 5 · JavaScript mit
JSDoc, `checkJs` und `strict` über `svelte-check` · pnpm ·
`@sveltejs/adapter-node` · Relay-Abfrage ist eigener, schlanker Servercode
(`services/relay.js`, aus oer-community übernommen) — kein `nostr-tools`
für Relay-Kommunikation.

## Arbeitsweise

Superpowers: Brainstorming → Spec → Plan → TDD → Review. Specs
`docs/superpowers/specs/`, Pläne `docs/superpowers/plans/`, benannt
`YYYY-MM-DD-<thema>`.

**Branches:** `feat/<thema>` je Vorhaben · `main` freigegeben und
ausgeliefert.

**Vor jedem Merge:** `pnpm check && pnpm test`. Tests laufen ohne Netz gegen
`test/fixtures/`; Komponenten werden mit `svelte/server` gerendert. **Neue
Funktionen kommen mit einer Prüfung.**

## Umgebungen

| Umgebung | Quelle | Datenquelle |
|---|---|---|
| lokal (`pnpm dev`) | Arbeitskopie | `amb-relay.edufeed.org` |
| `material.rpi-virtuell.net` (Dev) | `main`, bei jedem Push per Woodpecker | `amb-relay.edufeed.org` |

Der Deploy-Weg und was ihm noch fehlt: `docs/betrieb.md`.
