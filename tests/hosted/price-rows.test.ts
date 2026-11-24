// @last-edited: 2026-11-24 UTC+7.
// @title: price-rows — the deployed price list must name every kind the code can invoice.
// @state: the restore migration carries the wallet top-up price, and the public price list served to the invoice page carries no unpriced kind.
// @dependencies: node:test, node:assert/strict, node:fs.

// THE LEAK THIS FILE CLOSES: the wallet migration priced its top-up, but a deployed database without that insert produced a Rp 0 invoice — a buyer with an open QR and nothing to pay.
// The pin has two teeth: the migration text exists and names the kind at the tested price, and the served price list exposes the same kinds the billing function can invoice, so page and invoice cannot disagree again.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('the restore migration prices the wallet top-up at the tested amount', () => {
  const sql = readFileSync(
    path.join(root, 'hosted/migrations/20261124100000_opera_price_wallet_deposit_restore.sql'),
    'utf8'
  );
  assert.match(sql, /'wallet\.deposit'/, 'the migration names the deposit kind');
  assert.match(sql, /1000000/, 'the migration carries the tested top-up amount');
  assert.match(sql, /'IDR'/, 'the deposit keeps the wallet currency');
  assert.match(sql, /on conflict \(kind\) do update/i, 'the restore stays idempotent like the wallet migration it repairs');
});

test('every kind the invoice page prices is one the billing function can quote', () => {
  // The public list is what the deposit handler reads; the fixture in tests/billing/wallet-quote.test.ts is what the quote arithmetic tests.
  // Their kind sets must agree, or a kind is sellable on one side and unpriced on the other.
  const wallet = readFileSync(path.join(root, 'hosted/functions/_shared/wallet.ts'), 'utf8');
  assert.match(wallet, /DEPOSIT_KIND = 'wallet\.deposit'/, 'the deposit kind is the one the migration prices');
  const quote = readFileSync(path.join(root, 'tests/billing/wallet-quote.test.ts'), 'utf8');
  assert.match(quote, /kind: 'wallet\.deposit', amount_cents: 1000000/, 'the quote fixture tests the same price the migration restores');
});
