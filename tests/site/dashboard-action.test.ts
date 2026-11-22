// @last-edited: 2026-11-22 UTC+7.
// @title: dashboard-action - the dashboard's run button reaches the device, because the enqueue and the wait are two transactions.
// @state: the client asks for the command first and waits for the answer in a second call, and the server functions are that pair.
// @dependencies: node:test, strict, fs, ../../hosted/migrations/20261122140000_opera_dashboard_action_two_phase.sql.

// THE DEFECT THIS FILE LOCKS.

// opera_run_on_my_device enqueued the command and waited for the answer inside one SQL function, so both happened in one transaction.
// The row the browser was supposed to claim stayed invisible to every other connection until the function returned, and the function returned only when its own wait had timed out.
// The measured result was a command that expired unclaimed while the dashboard reported a timeout, on a browser that was awake and claiming a directly committed command in about a tenth of a second.

// The fix is two functions and two client calls: one transaction enqueues, the next one waits.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const migration = fs.readFileSync(new URL('hosted/migrations/20261122140000_opera_dashboard_action_two_phase.sql', root), 'utf8');
const api = fs.readFileSync(new URL('site/app/lib/dashboardApi.ts', root), 'utf8');
const dashboard = fs.readFileSync(new URL('site/app/routes/dashboard.tsx', root), 'utf8');

test('the server offers the enqueue and the wait as two separate functions', () => {
  assert.match(migration, /create or replace function public\.opera_start_on_my_device\(/);
  assert.match(migration, /create or replace function public\.opera_await_my_command\(/);
});

test('the one-transaction function is gone rather than left beside the pair', () => {
  assert.match(migration, /drop function if exists public\.opera_run_on_my_device\(text, jsonb, integer, text\)/);
});

test('the client asks for the command first and waits in a second call', () => {
  assert.match(api, /rpc<[^>]*>\('opera_start_on_my_device', \{ p_method: method \}\)/);
  assert.match(api, /rpc<[^>]*>\('opera_await_my_command', \{ p_command_id: commandId, p_timeout_ms: timeoutMs \}\)/);
  assert.doesNotMatch(api, /opera_run_on_my_device/);
});

test('the dashboard waits for the answer of the command it just started', () => {
  assert.match(dashboard, /await startOnDevice\(method\)/);
  assert.match(dashboard, /await awaitMyCommand\(commandId\)/);
  assert.doesNotMatch(dashboard, /runOnDevice/);
});

test('the wait only reads a command that belongs to the caller', () => {
  assert.match(migration, /d\.user_id = auth\.uid\(\)/);
});

test('the wait outlives the API statement timeout the caller would otherwise hit', () => {
  assert.match(migration, /set statement_timeout = '60s'/);
});

test('the answer is a panel, not a one-line status', () => {
  assert.match(dashboard, /runResult/);
  assert.match(dashboard, /run-result__facts/);
  for (const field of ['Primitive', 'Status', 'Durasi', 'Device']) {
    assert.ok(dashboard.includes(`<dt>${field}</dt>`), `the result panel names ${field}`);
  }
  assert.match(dashboard, /totalMs/);
});
