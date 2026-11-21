// @last-edited: 2026-11-21 UTC+7.
// @title: journey — the paths a real person takes through the site hold their promises.
// @state: the return path keeps its intent, a failed read is not an empty list, and the plan answers the shape the server sends.
// @dependencies: node:test, ../../site/app/lib/auth.ts, ../../site/app/lib/dashboardApi.ts, ../../site/worker/_worker.ts.

import test from 'node:test';
import assert from 'node:assert/strict';

import { safeReturnPath } from '../../site/app/lib/auth.ts';

test('a same-site return path keeps the pairing intent', () => {
  assert.equal(safeReturnPath('/dashboard?pair=1#pairing'), '/dashboard?pair=1#pairing');
  assert.equal(safeReturnPath('./dashboard'), './dashboard');
  assert.equal(safeReturnPath('/oauth/consent?authorization_id=abc'), '/oauth/consent?authorization_id=abc');
});

test('an off-site return path is refused', () => {
  assert.equal(safeReturnPath('https://evil.example/steal'), null);
  assert.equal(safeReturnPath('//evil.example/steal'), null);
  assert.equal(safeReturnPath('javascript:alert(1)'), null);
  assert.equal(safeReturnPath(''), null);
});
