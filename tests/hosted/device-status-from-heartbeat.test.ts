// @last-edited: 2026-11-22 UTC+7.
// @title: device-status-from-heartbeat - the status the account sees is derived from the heartbeat.
// @state: reads the migration that replaces opera_my_devices and asserts the rule it derives.
// @dependencies: node:test, node:assert/strict, node:fs.

// THIS GATE EXISTS.
// The stored status column was written to 'online' by the heartbeat and never written back down, so a browser that stopped checking in days ago still answered 'online'.
// The dashboard counted that device as live, and the count on the account's own home page was false.
// The rule now lives in the reader, so this gate reads the SQL that carries it and refuses a migration that loses any part of it.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const migration = fs.readFileSync(path.join(root, 'hosted/migrations/20261122160000_opera_devices_status_from_heartbeat.sql'), 'utf8');

test('the account reader derives status from the heartbeat', () => {
  assert.match(migration, /create or replace function public\.opera_my_devices\(\)/);
  assert.match(migration, /when d\.last_seen_at is null then 'offline'/);
  assert.match(migration, /when d\.last_seen_at > now\(\) - interval '90 seconds' then 'online'/);
  assert.match(migration, /else 'offline'/);
});

test('the reader keeps the stored refusals and drops the revoked row', () => {
  assert.match(migration, /when d\.status = 'disabled' then 'disabled'/);
  assert.match(migration, /d\.status <> 'revoked'/);
  assert.match(migration, /revoke all on function public\.opera_my_devices\(\) from public;/);
  assert.match(migration, /grant execute on function public\.opera_my_devices\(\) to authenticated, service_role;/);
});

test('the migration never rewrites the stored status column', () => {
  assert.equal(/update\s+public\.opera_devices/i.test(migration), false, 'the stored column keeps its meaning; the reader derives the status');
});
