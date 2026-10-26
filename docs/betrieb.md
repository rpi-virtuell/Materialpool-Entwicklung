# Betrieb

## Dev-Umgebung (Ziel)

Jeder Push auf `main` löst die Woodpecker-Pipeline aus (`.woodpecker.yml`):
`pnpm install`, `pnpm check`, `pnpm test`, `pnpm build`, dann per SSH das
Skript `~/ServerSetup/scripts/deploy-app.sh materialpool` auf
`material.rpi-virtuell.net`. Das Skript zieht das Server-Repo per
`git pull`, synchronisiert eine git-freie Kopie und baut das Image aus dem
`Dockerfile` mit Podman — so läuft es bei oer-community (dort
`docs/betrieb.md`, eingerichtet von Ludger, PR #3, 08.09.2026).

**Der Spiegel braucht `daten/` als Volume.** Ohne Volume startet er nach
jedem Neustart leer und lädt neu; die Fußzeile sagt dann „Noch kein
Spiegelstand“, bis der erste Lauf durch ist (höchstens
`SPIEGEL_STARTWARTEZEIT_S` Sekunden nach dem Start).

Status und Logs: Forgejo zeigt den Commit-Status, die Pipelines liegen unter
`https://woody.git.rpi-virtuell.de/` (Repo-Nummer nach der Aktivierung).

## Was am 28.09.2026 noch fehlt

| Punkt | Befund | Wer |
|---|---|---|
| Woodpecker | Repository ist nicht aktiviert (`/api/repos/lookup/…` leer) | Ludger |
| Secrets | `deploy_ssh_user`, `deploy_ssh_key` fehlen; Name für `deploy-app.sh` offen (`materialpool`?) | Ludger |
| DNS | `material.rpi-virtuell.net` → CNAME `rpi-virtuell.de` → 88.99.213.122 | Ludger |
| vHost | HTTP 200 mit leerer Apache-Seite, HTTPS mit Zertifikat `rpivirt02.intranda.com` | Ludger / Hosting |
| `.env` auf dem Server | RELAYS, später QUELLE_AUTOREN | Jörg |

Alternative, falls der intranda-Server nicht der Container-Host ist: die
Adresse auf den Server umziehen, auf dem `community-hub.rpi-virtuell.net`
(46.225.82.96) läuft, und dort einen zweiten Container betreiben.

## Hinter Apache: ORIGIN, Cookies, Rechte

- **`ORIGIN` setzen** (`.env` auf dem Server:
  `ORIGIN=https://material.rpi-virtuell.net`). SvelteKit prüft bei jedem
  Formular per POST, ob dessen Origin zur Adresse des Servers passt.
  Ohne `ORIGIN` nimmt adapter-node `https://` plus die Host-Kopfzeile —
  hinter einem `ProxyPass` ohne `ProxyPreserveHost` ist das
  `127.0.0.1:8080`, und jedes Anmelden und Speichern unter `/konto`
  endet mit 403. Alternative, wenn Apache beide Kopfzeilen setzt:
  `PROTOCOL_HEADER=x-forwarded-proto`, `HOST_HEADER=x-forwarded-host`.
  `docker-compose.yml` reicht `ORIGIN` durch (Standard
  `http://localhost:8080`).
- **Cookies sind Secure** (SvelteKit-Standard, außer auf
  `http://localhost`). Über `http://<IP>:8080` bleiben Anmeldung und
  Farbe darum nicht hängen — geprüft wird über HTTPS.
- **Der Container läuft als `node` (uid 1000)**, nicht als root. Das
  Volume `./daten` muss für ihn beschreibbar sein: mit Docker
  `chown 1000:1000 daten`, mit rootless Podman
  `podman unshare chown 1000:1000 daten`. Sonst läuft der Spiegel weiter,
  schreibt aber keinen Stand (Warnung im Log) und startet nach jedem
  Neustart leer.

## Meldungen und E-Mail an die Redaktion (ADR-0011)

- Meldungen liegen in `daten/meldungen.json` (`MELDUNGEN_PFAD`), im
  selben Volume wie der Spiegel. Ohne Schreibrecht gehen sie nach einem
  Neustart verloren (Warnung im Log).
- **`REDAKTION_KENNWORT` setzen**, bevor die Seite wirklich öffentlich
  wird. Leer ist `/redaktion` offen — so gewollt für den Prototyp, aber
  dann kann jede Person mit der Adresse Meldungen bestätigen oder
  verwerfen.
- **E-Mail:** Ohne `MAIL_VERSAND=an` steht jede Meldung als E-Mail-Text
  im Protokoll des Containers (`docker compose logs`, Zeilen ab „E-Mail an
  die Redaktion“). Für den echten Versand in der Server-`.env`:
  `MAIL_VERSAND=an`, `MAIL_AN` (Postfach der Redaktion), `MAIL_VON`
  (Absender, den der SMTP-Server erlaubt), `SMTP_HOST`, `SMTP_PORT`
  (587 STARTTLS oder 465), `SMTP_BENUTZER`, `SMTP_KENNWORT`. Fehlt eine
  der drei Pflichtangaben, bricht der Start ab. Scheitert ein Versand,
  steht die E-Mail mit dem Fehler im Protokoll.

## Lokal wie auf dem Server

```
docker compose up -d --build     # Port 8080 → 3000 im Container
```

Ohne Docker: `pnpm build && ORIGIN=http://localhost:3000 pnpm start`
(Port über `PORT`, Host über `HOST`; adapter-node liest beides, und ohne
`ORIGIN` lehnt er `/konto`-Formulare ab).

## Stolpersteine aus oer-community, die hier genauso gelten

- Der Deploy-Schlüssel darf auf dem Server nur das Skript ausführen;
  vorgeschaltete Befehle in der Pipeline kommen nicht an.
- Steht das Server-Repo auf einem Branch, den es auf dem Remote nicht mehr
  gibt, bricht `git pull` still ab — Ludger muss dort einmal
  `git checkout main` ausführen.
