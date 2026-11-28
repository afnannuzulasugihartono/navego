// @last-edited: 2026-11-28 WIB.
// @title: paypal-guest-checkout.test - a guest quote has no owner, one account claims it once, and a settlement still refuses a mismatch.
// @state: the migration adds the guest columns, creates the guest quote and the claim, keeps the settle locked to the claimed quote, and grants each function to exactly one role.
// @dependencies: node:test, strict, node:fs.

// The money path needs a database claim, not an application-side hopeful insert.
// A buyer without an account may still pay, so the quote is stored without an owner and one account binds itself to it after signing in.
// The token that proves the claim is stored as a hash, so a leaked database row cannot be replayed as a claim.

// decisions.json -> hosted-paypal-guest-checkout-01

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const migrationPath = path.join(fileURLToPath(root), 'hosted', 'migrations', '20261128000000_opera_paypal_guest_checkout.sql');
const migrationSql = () => fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

test('the guest checkout migration exists', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'the guest checkout migration must be in the tree');
});

test('a guest quote is stored without an owner and with the hash of its claim token', () => {
  const sql = migrationSql();
  assert.match(sql, /add column if not exists guest_token_hash text/);
  assert.match(sql, /add column if not exists claimed_at timestamptz/);
  assert.match(sql, /create or replace function public\.opera_paypal_create_guest_order\(/);
  assert.match(sql, /public\.opera_sha256\(v_token\)/);
  assert.match(sql, /values \(v_environment, v_order_id, null, v_plan, p_amount_cents, v_currency, 'created', true, 'guest-quote'/);
});

test('the claim binds the signed-in account, once, and the token dies with it', () => {
  const sql = migrationSql();
  assert.match(sql, /create or replace function public\.opera_paypal_claim_order\(/);
  assert.match(sql, /v_owner uuid := auth\.uid\(\)/);
  assert.match(sql, /set owner_id = v_owner::text,\s*claimed_at = now\(\),\s*guest_token_hash = null,/);
  assert.match(sql, /v_order\.owner_id is not null or v_order\.claimed_at is not null then/);
  assert.match(sql, /v_order\.guest_token_hash is null or v_order\.guest_token_hash is distinct from public\.opera_sha256\(v_token\) then/);
});

test('the claim refuses a quote whose plan, amount, or currency no longer match', () => {
  const sql = migrationSql();
  const claim = sql.slice(sql.indexOf('create or replace function public.opera_paypal_claim_order('));
  const claimBody = claim.slice(0, claim.indexOf('create or replace function public.opera_paypal_settle_order('));
  assert.match(claimBody, /v_order\.plan is distinct from v_plan/);
  assert.match(claimBody, /v_order\.amount_cents is distinct from p_amount_cents/);
  assert.match(claimBody, /v_order\.currency is distinct from v_currency/);
  assert.equal(claimBody.includes('opera_paypal_activate_order'), false, 'the claim never activates a plan, it only binds the owner');
});

test('a settlement accepts the guest marker only for a quote an account claimed', () => {
  const sql = migrationSql();
  const settle = sql.slice(sql.indexOf('create or replace function public.opera_paypal_settle_order('));
  assert.match(settle, /elsif v_order\.claimed_at is not null then/);
  assert.match(settle, /v_actual_owner_id is distinct from 'guest'/);
  assert.match(settle, /v_order\.owner_id is distinct from v_actual_owner_id/);
});

test('each function is granted to exactly one role', () => {
  const sql = migrationSql();
  assert.match(sql, /revoke all on function public\.opera_paypal_create_guest_order\(text, text, text, text, integer, text\) from public, anon, authenticated;/);
  assert.match(sql, /grant execute on function public\.opera_paypal_create_guest_order\(text, text, text, text, integer, text\) to service_role;/);
  assert.match(sql, /revoke all on function public\.opera_paypal_claim_order\(text, text, text, text, integer, text\) from public, anon;/);
  assert.match(sql, /grant execute on function public\.opera_paypal_claim_order\(text, text, text, text, integer, text\) to authenticated;/);
  assert.match(sql, /revoke all on function public\.opera_paypal_settle_order\(text, text, text, text, integer, text, text\) from public, anon, authenticated;/);
  assert.match(sql, /grant execute on function public\.opera_paypal_settle_order\(text, text, text, text, integer, text, text\) to service_role;/);
});
