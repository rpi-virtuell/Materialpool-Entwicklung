#!/usr/bin/env bash
# Startet Mock-Relay (Fixtures) und Vite-Dev-Server zusammen — zum Ansehen
# ohne Netz. Voraussetzung: .env mit RELAYS=ws://127.0.0.1:3790/
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
node test/mock-relay.mjs 3790 &
MOCK=$!
trap 'kill $MOCK 2>/dev/null' EXIT
exec node node_modules/vite/bin/vite.js dev --port 5174 --host 127.0.0.1
