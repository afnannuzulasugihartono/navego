// @last-edited: 2026-11-28 WIB.
// @title: guest-copy - a buyer is told the new path exists before clicking buy.
// @state: failing before the pricing page explains that a guest can pay and claim later, passing after it.
// @dependencies: node:test, node:assert, node:fs, site/app/routes/harga.tsx.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('the pricing page says a signed-out buyer may pay and claim later', () => {
  const page = fs.readFileSync(new URL('../../site/app/routes/harga.tsx', import.meta.url), 'utf8');
  assert.match(page, /tanpa akun/i, 'the new path is discoverable before the click');
  assert.match(page, /klaim/i, 'the buyer knows what happens after paying');
});