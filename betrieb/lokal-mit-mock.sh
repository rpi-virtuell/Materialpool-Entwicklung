#!/usr/bin/env bash
# Startet Mock-Relay (Fixtures) und Vite-Dev-Server zusammen — zum Ansehen
# ohne Netz. Voraussetzung: RELAYS=ws://127.0.0.1:3790/ — hier gesetzt, die
# .env bleibt auf dem echten Relay. Das Mock-Relay liefert die echten Fixtures.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
node test/mock-relay.mjs 3790 &
MOCK=$!
trap 'kill $MOCK 2>/dev/null' EXIT
RELAYS=ws://127.0.0.1:3790/ QUELLE_AUTOREN= SPIEGEL_PFAD=daten/spiegel-mock.json exec node node_modules/vite/bin/vite.js dev --port 5174 --host 127.0.0.1
