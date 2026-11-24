// @last-edited: 2026-11-20 UTC+7.
// @title: integration-postgres - the migration contract, proven against a disposable database.
// @state: asserts against the live database only when NAVEGO_TEST_DATABASE_URL is set - the ci.yml postgres job sets it after applying every migration under ON_ERROR_STOP; without it the test skips.
// @dependencies: node:test, strict, pg.

// decisions.json -> tests-hosted-integration-postgres-01

// The migration files are plain SQL: the opera_commands lifecycle check and the billing RLS lockdown.
// A reader of the text proves the text; this lane proves the engine that would run it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';

const DATABASE_URL = process.env.NAVEGO_TEST_DATABASE_URL;

const BILLING_TABLES = ['opera_price_list', 'opera_invoices', 'opera_notification_log'];
const CORE_TABLES = ['opera_commands', 'opera_devices', 'opera_pairing_codes', 'opera_workflows'];
const COMMAND_STATUSES = ['queued', 'claimed', 'completed', 'failed', 'expired', 'cancelled'];

test('the migrations produce opera_commands with its full lifecycle and RLS on the billing tables', { skip: DATABASE_URL === undefined }, async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const { rows: tables } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    const names = new Set(tables.map((row) => row.tablename));
    for (const table of [...CORE_TABLES, ...BILLING_TABLES]) {
      assert.ok(names.has(table), `the migrations must produce public.${table}`);
    }
    const { rows: rls } = await client.query("SELECT c.relname, n.nspname AS schema, c.relkind, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname IN ('opera_price_list', 'opera_invoices', 'opera_notification_log') ORDER BY n.nspname, c.relname");
    for (const table of BILLING_TABLES) {
      const named = rls.filter((row: any) => row.relname === table);
      assert.equal(named.length, 1, `a billing table name belongs to one relation, so the billing function cannot read a different one; the relations with that name are ${JSON.stringify(named)}`);
      const relation = named[0];
      assert.equal(relation.schema, 'public', `public.${table} must be the public table; the relations with that name are ${JSON.stringify(named)}`);
      assert.equal(relation.relkind, 'r', `public.${table} must be a table; the relations with that name are ${JSON.stringify(named)}`);
      assert.equal(relation.relrowsecurity, true, `public.${table} must carry row level security once the billing lockdown migration lands; the relations with that name are ${JSON.stringify(named)}`);
    }
    const { rows: constraints } = await client.query("SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid = 'public.opera_commands'::regclass AND contype = 'c'");
    const definition = constraints.map((row) => row.definition).join(' ');
    for (const status of COMMAND_STATUSES) {
      assert.ok(definition.includes(status), `the opera_commands status check must carry '${status}'`);
    }

    const first = (await client.query("select public.opera_create_pairing_code('chrome-integration') as answer")).rows[0].answer;
    const second = (await client.query("select public.opera_create_pairing_code('chrome-integration') as answer")).rows[0].answer;
    assert.equal(first.ok, true, `the first pairing code must be issued: ${JSON.stringify(first)}`);
    assert.equal(second.ok, true, `the second code for the same browser must not collide: ${JSON.stringify(second)}`);
    assert.notEqual(first.code, second.code, 'two pairing codes are random, not the device name');
    const stored = await client.query("select code_hash from public.opera_pairing_codes where device_name = 'chrome-integration'");
    const expected = new Set<string>();
    for (const answer of [first, second]) {
      expected.add((await client.query('select public.opera_sha256($1) as hash', [answer.code])).rows[0].hash);
    }
    assert.deepEqual(new Set(stored.rows.map((row: any) => row.code_hash)), expected, 'the stored hashes are the hashes of the issued codes, so opera_pair_device can redeem them');
  } finally {
    await client.end();
  }
});

test('one PayPal order settles once and activates the plan once', { skip: DATABASE_URL === undefined }, async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const owner = '00000000-0000-4000-8000-000000000001';
  const orderId = 'ORDER-PAYPAL-INTEGRATION';
  try {
    await client.query('delete from public.opera_notification_log where order_id = $1', [orderId]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', orderId]);
    await client.query('delete from public.opera_account_plans where user_id = $1', [owner]);
    await client.query("insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'paypal-integration@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()) on conflict (id) do nothing", [owner]);

    const created = (await client.query("select public.opera_paypal_create_order('sandbox', $1, $2, 'plan.usd-1', 100, 'USD') as answer", [orderId, owner])).rows[0].answer;
    assert.equal(created.ok, true, `the quote must be stored: ${JSON.stringify(created)}`);
    const invalidEnvironment = (await client.query("select public.opera_paypal_create_order('other', $1, $2, 'plan.usd-1', 100, 'USD') as answer", [orderId, owner])).rows[0].answer;
    const invalidOwner = (await client.query("select public.opera_paypal_create_order('sandbox', $1, null, 'plan.usd-1', 100, 'USD') as answer", [orderId])).rows[0].answer;
    const invalidPlan = (await client.query("select public.opera_paypal_create_order('sandbox', $1, $2, null, 100, 'USD') as answer", [orderId, owner])).rows[0].answer;
    assert.equal(invalidEnvironment.ok, false);
    assert.equal(invalidOwner.ok, false);
    assert.equal(invalidPlan.ok, false);

    const settled = (await client.query("select public.opera_paypal_settle_order('sandbox', $1, $2, 'plan.usd-1', 100, 'USD', 'integration') as answer", [orderId, owner])).rows[0].answer;
    const settledAgain = (await client.query("select public.opera_paypal_settle_order('sandbox', $1, $2, 'plan.usd-1', 100, 'USD', 'integration') as answer", [orderId, owner])).rows[0].answer;
    assert.equal(settled.status, 'settled');
    assert.equal(settledAgain.status, 'settled');

    const activated = (await client.query("select public.opera_paypal_activate_order('sandbox', $1) as answer", [orderId])).rows[0].answer;
    const expiryAfterFirst = (await client.query('select expires_at from public.opera_account_plans where user_id = $1', [owner])).rows[0]?.expires_at;
    const activatedAgain = (await client.query("select public.opera_paypal_activate_order('sandbox', $1) as answer", [orderId])).rows[0].answer;
    const expiryAfterSecond = (await client.query('select expires_at from public.opera_account_plans where user_id = $1', [owner])).rows[0]?.expires_at;
    assert.equal(activated.status, 'activated');
    assert.equal(activatedAgain.status, 'activated');
    assert.deepEqual(expiryAfterSecond, expiryAfterFirst, 'one order cannot extend the plan twice');

    const orderRows = (await client.query('select count(*)::int as count from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', orderId])).rows[0].count;
    const revenueRows = (await client.query("select count(*)::int as count from public.opera_notification_log where environment = 'paypal-sandbox' and order_id = $1", [orderId])).rows[0].count;
    assert.equal(orderRows, 1, 'one order id owns one settlement row');
    assert.equal(revenueRows, 1, 'one order id writes one revenue event');

    const unknownOrderId = 'ORDER-PAYPAL-UNKNOWN';
    const unknown = (await client.query("select public.opera_paypal_settle_order('sandbox', $1, null, null, 200, 'USD', 'integration') as answer", [unknownOrderId])).rows[0].answer;
    const unknownAgain = (await client.query("select public.opera_paypal_settle_order('sandbox', $1, null, null, 200, 'USD', 'integration') as answer", [unknownOrderId])).rows[0].answer;
    const unknownRevenue = (await client.query("select count(*)::int as count from public.opera_notification_log where environment = 'paypal-sandbox' and order_id = $1", [unknownOrderId])).rows[0].count;
    assert.equal(unknown.status, 'review');
    assert.equal(unknownAgain.status, 'review', 'an order without a stored quote never becomes activatable by repetition');
    assert.equal(unknownRevenue, 1, 'an unmatched real payment still enters the revenue ledger for review');
    await client.query('delete from public.opera_notification_log where order_id = $1', [unknownOrderId]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', unknownOrderId]);
  } finally {
    await client.query('delete from public.opera_notification_log where order_id = $1', [orderId]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', orderId]);
    await client.query('delete from public.opera_account_plans where user_id = $1', [owner]);
    await client.query('delete from auth.users where id = $1', [owner]);
    await client.end();
  }
});
