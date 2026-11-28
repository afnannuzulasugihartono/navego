// @last-edited: 2026-11-28 UTC+7.
// @title: FAQ matches the checkout that actually ships - no account wall, and a claim path when a plan is not active.
// @state: failing while the FAQ still asks for an account to buy, passing after it is corrected.
// @dependencies: node:test, node:assert, node:fs, site/app/routes/faq.tsx.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../../site/app/routes/faq.tsx', import.meta.url), 'utf8');

test('the account answer no longer tells a buyer that an account is required to pay', () => {
  const account = page.split('\n').find((line) => line.includes("['akun',")) ?? '';
  assert.match(account, /tanpa akun/i);
  assert.doesNotMatch(account, /Untuk membeli plan dan memakai Dashboard, ya/i);
});

test('the activation answer names the claim path the buyer can actually take', () => {
  const activation = page.split('\n').find((line) => line.includes("['verifikasi',")) ?? '';
  assert.match(activation, /Klaim pesanan saya/);
  assert.match(activation, /harga/, 'the answer points back to the pricing page');
});
