// @last-edited: 2026-11-28 UTC+7.
// @title: executor - the machine closes only what the evidence already closed, and defers everything else.
// @state: failing before scripts/dev/agent-fleet/executor.ts exists, passing after it.
// @dependencies: node:test, node:assert, node:fs, node:os, node:path, scripts/dev/agent-fleet/executor.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executeNext, type ExecutorPaths } from '../../scripts/dev/agent-fleet/executor.ts';
import type { NextAction } from '../../scripts/dev/agent-fleet/goal.ts';

const close: NextAction = {
  action: 'close-ticket',
  signal: 'open-ticket',
  reason: 'an open ticket already carries evidence',
  exit: 'the ticket has a reply artifact, a proof and a closed line on the board'
};

function fixtures(withAnswer: boolean): ExecutorPaths & { queue: string; proof: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'executor-'));
  const queue = path.join(root, 'queue');
  const proof = path.join(root, 'proof');
  fs.mkdirSync(queue, { recursive: true });
  fs.mkdirSync(proof, { recursive: true });
  fs.writeFileSync(path.join(queue, 'operator-to-engineer-20261128-0900.md'), 'class: product\n');
  if (withAnswer) {
    fs.writeFileSync(path.join(queue, 'engineer-reply-20261128-0910.md'), 'answered: operator-to-engineer-20261128-0900.md\n');
  }
  return { queueDir: queue, proofDir: proof, queue, proof, now: Date.parse('2026-11-28T07:30:00Z') };
}

test('a ticket with a real answer is closed by a receipt that names both files', () => {
  const paths = fixtures(true);
  const result = executeNext(close, paths);
  assert.equal(result.executed, true);
  assert.equal(result.deferred, false);
  assert.ok(result.receipt, 'a receipt path is returned');
  const text = fs.readFileSync(String(result.receipt), 'utf8');
  assert.match(text, /closed: operator-to-engineer-20261128-0900\.md/);
  assert.match(text, /answered-by: engineer-reply-20261128-0910\.md/);
});

test('without an answer nothing is closed and nothing is written', () => {
  const paths = fixtures(false);
  const result = executeNext(close, paths);
  assert.equal(result.executed, false);
  assert.equal(result.deferred, true);
  assert.equal(fs.readdirSync(paths.proof).length, 0, 'no receipt was fabricated');
});

test('the receipt never claims money moved', () => {
  const paths = fixtures(true);
  const result = executeNext(close, paths);
  const text = fs.readFileSync(String(result.receipt), 'utf8');
  assert.doesNotMatch(text, /\$|settled|revenue/i);
});

test('actions that need a model or an owner are deferred, not pretended', () => {
  for (const action of ['answer-buyer', 'close-revenue-path', 'unblock-lane', 'fix-claim-drift', 'one-customer-visible-defect']) {
    const result = executeNext({ ...close, action }, fixtures(true));
    assert.equal(result.executed, false, `${action} is not executed by the machine`);
    assert.equal(result.deferred, true, `${action} is deferred`);
    assert.ok(result.reason.length > 0, `${action} carries a reason`);
  }
});
