// @last-edited: 2026-11-25 UTC+7.
// @title: paypal-settlement-hardening.test - malformed payments, equivalent keys, and replayed events fail closed.
// @state: actual quote values are separate from untrusted order values, every lock uses the normalized key, and PayPal revenue events are unique per environment and order.
// @dependencies: node:test, strict, node:fs.

// A real payment can carry a malformed owner or unknown plan, so those values cannot be written into constrained quote columns.
// Equivalent environment and order spellings must also reach one lock, and the database must refuse a second accepted revenue event for that order.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const migrationPath = path.join(fileURLToPath(root), 'hosted', 'migrations', '20261125010000_opera_paypal_orders_hardening.sql');
const migrationSql = () => fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

test('the PayPal settlement hardening migration exists', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'the PayPal settlement hardening migration must be in the tree');
});

test('quoted values and untrusted actual values live in separate columns', () => {
  const sql = migrationSql();
  assert.match(sql, /add column if not exists actual_owner_id text/);
  assert.match(sql, /add column if not exists actual_plan text/);
  assert.match(sql, /drop constraint if exists opera_paypal_orders_owner_id_check/);
  assert.match(sql, /drop constraint if exists opera_paypal_orders_plan_check/);
  assert.match(sql, /actual_owner_id = v_actual_owner_id/);
  assert.match(sql, /actual_plan = v_actual_plan/);
});

test('equivalent PayPal keys share one lock and one accepted revenue event', () => {
  const sql = migrationSql();
  assert.match(sql, /hashtextextended\(v_environment \|\| ':' \|\| v_order_id, 0\)/);
  assert.doesNotMatch(sql, /hashtextextended\(p_environment \|\| ':' \|\| p_order_id, 0\)/);
  assert.match(sql, /create unique index if not exists opera_notification_log_paypal_order_unique/);
  assert.match(sql, /on conflict \(environment, order_id\)\s+where accepted = true and transaction_status = 'paid'/);
});

test('the unknown-order branch derives a new row from the insert result', () => {
  const sql = migrationSql();
  assert.match(sql, /get diagnostics v_inserted = row_count/);
  assert.match(sql, /v_new := v_inserted = 1/);
  assert.doesNotMatch(sql, /v_new := true/);
});
