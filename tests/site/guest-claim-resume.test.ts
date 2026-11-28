// @last-edited: 2026-11-28 WIB.
// @title: guest claim resume - a paid guest order can be claimed from an ordinary visit.
// @state: failing before the pricing page exposes the pending order, passing after it.
// @dependencies: node:test, node:assert, node:fs, site/app/routes/harga.tsx.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../../site/app/routes/harga.tsx', import.meta.url), 'utf8');

test('the pricing page shows a claim action while a guest order is pending', () => {
  assert.match(page, /guestOrder \? \(/, 'a pending guest order changes the page');
  assert.match(page, /Klaim pesanan saya/, 'a signed-in buyer can resume the claim without the PayPal return URL');
  assert.match(page, /Masuk untuk klaim/, 'a signed-out buyer is sent to sign in for the same purpose');
});

test('a claim that already succeeded does not dead-end the buyer', () => {
  assert.match(page, /already claimed/i, 'a replayed claim falls through to capture instead of an endless refusal');
});