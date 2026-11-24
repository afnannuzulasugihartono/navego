// @last-edited: 2026-11-25 UTC+7.
// @title: paypal-settlement.test - one PayPal order is one sale and one plan activation.
// @state: the settlement table is unique, RLS is closed, the three RPCs claim and activate an order under a lock, and the revenue event is written once.
// @dependencies: node:test, strict, node:fs.

// The money path needs a database claim, not an application-side hopeful insert.
// Two requests can carry the same PayPal order: the buyer returns from PayPal while the verified webhook arrives.
// One order may therefore create two rows, and two activations would extend the plan twice.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const migrationPath = path.join(fileURLToPath(root), 'hosted', 'migrations', '20261125000000_opera_paypal_orders.sql');
const migrationSql = () => fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

test('the PayPal settlement migration exists', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'the PayPal settlement migration must be in the tree');
});

test('one environment and PayPal order id can hold only one settlement', () => {
  const sql = migrationSql();
  assert.match(sql, /create table if not exists public\.opera_paypal_orders/);
  assert.match(sql, /unique \(environment, order_id\)/);
  assert.match(sql, /status in \('created', 'settled', 'review', 'activated'\)/);
  assert.match(sql, /alter table public\.opera_paypal_orders enable row level security/);
  assert.match(sql, /revoke all on public\.opera_paypal_orders from public, anon, authenticated/);
});

test('the order, settlement, and activation RPCs claim the same order under one lock', () => {
  const sql = migrationSql();
  assert.match(sql, /create or replace function public\.opera_paypal_create_order\(/);
  assert.match(sql, /create or replace function public\.opera_paypal_settle_order\(/);
  assert.match(sql, /create or replace function public\.opera_paypal_activate_order\(/);
  assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\(p_environment \|\| ':' \|\| p_order_id, 0\)\)/);
  assert.match(sql, /on conflict \(environment, order_id\)/);
  assert.match(sql, /insert into public\.opera_notification_log/);
});

test('only the activation RPC can activate the plan, and only once per order', () => {
  const sql = migrationSql();
  const settle = sql.slice(sql.indexOf('create or replace function public.opera_paypal_settle_order('));
  const activate = settle.slice(settle.indexOf('create or replace function public.opera_paypal_activate_order('));
  assert.doesNotMatch(settle.slice(0, settle.indexOf('create or replace function public.opera_paypal_activate_order(')), /opera_plan_activate_purchase/);
  assert.match(activate, /opera_plan_activate_purchase/);
  assert.match(activate, /status = 'activated'/);
  assert.match(activate, /'already', true/);
});
