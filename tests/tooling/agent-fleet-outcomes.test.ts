// @last-edited: 2026-11-28 UTC+7.
// @title: outcome register - one machine-readable shape for money, replies and receipts.
// @state: failing before scripts/dev/agent-fleet/outcomes.ts exists, passing after it.
// @dependencies: node:test, node:assert, node:fs, node:os, node:path, scripts/dev/agent-fleet/outcomes.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildOutcomeRegister, OUTCOME_SCHEMA } from '../../scripts/dev/agent-fleet/outcomes.ts';
import { readMissionState } from '../../scripts/dev/agent-fleet/goal.ts';

function fixture(): { root: string; economy: string; queue: string; replies: string; proof: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'outcomes-'));
  const economy = path.join(root, 'economy.json');
  const queue = path.join(root, 'queue');
  const replies = path.join(root, 'replies');
  const proof = path.join(root, 'proof');
  fs.mkdirSync(queue, { recursive: true });
  fs.mkdirSync(replies, { recursive: true });
  fs.mkdirSync(proof, { recursive: true });
  fs.writeFileSync(economy, JSON.stringify({ revenue: { settled_usd: 12, settled_orders: 1, last_settled_at: '2026-11-28T00:00:00Z' } }));
  fs.writeFileSync(path.join(replies, '2026-11-28-harbor.md'), 'answered: no\n');
  fs.writeFileSync(path.join(replies, 'README.md'), 'answered: no | yes\n');
  fs.writeFileSync(path.join(queue, 'operator-to-engineer-20261128-0900.md'), 'class: product\n');
  fs.writeFileSync(path.join(queue, 'engineer-reply-20261128-0910.md'), 'answered: operator-to-engineer-20261128-0900.md\n');
  fs.writeFileSync(path.join(proof, '2026-11-28-executor-close-operator-to-engineer-20261128-0900.md'), 'closed: operator-to-engineer-20261128-0900.md\n');
  return { root, economy, queue, replies, proof };
}

test('the register derives money, replies, receipts and answered tickets from files', () => {
  const f = fixture();
  const register = buildOutcomeRegister({ economyPath: f.economy, queueDir: f.queue, repliesDir: f.replies, proofDir: f.proof });
  assert.equal(register.schema, OUTCOME_SCHEMA);
  assert.equal(register.settled_usd, 12);
  assert.equal(register.settled_orders, 1);
  assert.equal(register.buyer_replies_waiting, 1, 'the README example is still not a buyer');
  assert.equal(register.receipts_verified, 1);
  assert.equal(register.answered_tickets, 1);
});

test('the selector reads the register when one is supplied', () => {
  const f = fixture();
  const registerPath = path.join(f.root, 'outcomes.json');
  fs.writeFileSync(registerPath, JSON.stringify({
    schema: OUTCOME_SCHEMA,
    settled_usd: 42,
    settled_orders: 3,
    buyer_replies_waiting: 1,
    receipts_verified: 0,
    answered_tickets: 0,
    updated_at: '2026-11-28'
  }));
  const state = readMissionState(f.economy, f.queue, { outcomesPath: registerPath });
  assert.equal(state.settledUsd, 42);
  assert.equal(state.buyerRepliesWaiting, 1);
});
