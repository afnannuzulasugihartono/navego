// @last-edited: 2026-11-28 UTC+7.
// @title: support page - a paid buyer can find the claim path without writing to support.
// @state: failing before the payment fix is listed, passing after it.
// @dependencies: node:test, node:assert, node:fs, site/app/routes/dukungan.tsx.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../../site/app/routes/dukungan.tsx', import.meta.url), 'utf8');

test('the support page answers the paid-but-not-active buyer', () => {
  assert.match(page, /Sudah bayar, plan belum aktif/);
  assert.match(page, /Klaim pesanan saya/, 'the answer names the button the buyer will see');
  assert.match(page, /order ID/i, 'a buyer who still needs help knows what to include');
});

test('the payment fix links back to the pricing page where the claim lives', () => {
  assert.match(page, /fix\.id === 'bayar'/, 'the payment fix carries its own next step');
  assert.match(page, /Enam perbaikan|Enam yang paling sering/, 'the page count matches its content');
});
