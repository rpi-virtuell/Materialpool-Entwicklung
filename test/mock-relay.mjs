#!/usr/bin/env node
/**
 * Mock-Relay für lokale Prüfungen des gebauten Servers ohne Netz:
 * beantwortet jede REQ mit den Events aus test/fixtures/amb-beispiele.json
 * und EOSE. Kein NIP-01-Filter, kein Schreiben — nur Lesen.
 *
 *   node test/mock-relay.mjs 3790
 *   RELAYS=ws://127.0.0.1:3790/ node build/index.js
 */
import { readFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';

const port = Number(process.argv[2] ?? 3790);
const events = JSON.parse(readFileSync(new URL('./fixtures/amb-beispiele.json', import.meta.url), 'utf8'));

const server = new WebSocketServer({ host: '127.0.0.1', port });
server.on('connection', (ws) => {
  ws.on('message', (roh) => {
    let nachricht;
    try {
      nachricht = JSON.parse(roh.toString());
    } catch {
      return;
    }
    if (nachricht[0] !== 'REQ') return;
    const sub = nachricht[1];
    for (const e of events) ws.send(JSON.stringify(['EVENT', sub, e]));
    ws.send(JSON.stringify(['EOSE', sub]));
  });
});
server.on('listening', () => console.log(`Mock-Relay auf ws://127.0.0.1:${port}/ mit ${events.length} Events`));
