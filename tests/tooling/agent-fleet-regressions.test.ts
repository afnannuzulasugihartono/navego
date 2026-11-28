// @last-edited: 2026-11-28 UTC+7.
// @title: known-failure gate - the three lies the fleet already told must stay impossible.
// @state: failing before scripts/dev/agent-fleet/regressions.ts exists, passing after it.
// @dependencies: node:test, node:assert, node:fs, node:os, node:path, scripts/dev/agent-fleet/regressions.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkKnownFailures } from '../../scripts/dev/agent-fleet/regressions.ts';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const queue = fs.mkdtempSync(path.join(os.tmpdir(), 'regression-queue-'));
const replies = fs.mkdtempSync(path.join(os.tmpdir(), 'regression-replies-'));

test('the gate passes when all three known failures are prevented', () => {
  const checks = checkKnownFailures({ repliesDir: replies, queueDir: queue, root });
  assert.deepEqual(checks.map((check) => check.id), ['reply-register', 'queued-receipt', 'own-buy-click']);
  assert.equal(checks.every((check) => check.ok), true, JSON.stringify(checks));
});

test('the gate fails if the message contract loses its queued receipt', () => {
  const fakeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'regression-root-'));
  const dir = path.join(fakeRoot, 'scripts/dev/agent-fleet');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'message.ts'), 'export const anything = 1;\n');
  fs.writeFileSync(path.join(dir, 'executor.ts'), 'export const anything = 1;\n');
  const checks = checkKnownFailures({ repliesDir: replies, queueDir: queue, root: fakeRoot });
  assert.equal(checks.find((check) => check.id === 'queued-receipt')?.ok, false);
});
