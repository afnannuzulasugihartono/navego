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
