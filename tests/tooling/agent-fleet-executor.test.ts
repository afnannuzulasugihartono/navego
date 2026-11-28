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

test('every deferred action is routed to an owning lane without a human choosing', () => {
  const paths = fixtures(true);
  const cases: Array<[string, string]> = [
    ['answer-buyer', 'sales-rep'],
    ['close-revenue-path', 'engineer'],
    ['unblock-lane', 'operator'],
    ['fix-claim-drift', 'engineer'],
    ['one-customer-visible-defect', 'engineer']
  ];
  for (const [action, lane] of cases) {
    const result = executeNext({ ...close, action }, paths);
    assert.equal(result.deferred, true, `${action} is still not executed by the machine`);
    assert.ok(result.routed, `${action} routes to a lane`);
    const text = fs.readFileSync(String(result.routed), 'utf8');
    assert.match(text, new RegExp(`lane: ${lane}`));
    assert.match(text, /auto-routed:/);
    assert.match(text, /stop:/);
    assert.match(text, /scopeRequested:/);
  }
});

test('the same deferred action is not ticketed twice in one day', () => {
  const paths = fixtures(true);
  const first = executeNext({ ...close, action: 'one-customer-visible-defect' }, paths);
  const before = fs.readdirSync(paths.queue).filter((name) => name.includes('auto-route')).length;
  const second = executeNext({ ...close, action: 'one-customer-visible-defect' }, paths);
  const after = fs.readdirSync(paths.queue).filter((name) => name.includes('auto-route')).length;
  assert.equal(before, 1);
  assert.equal(after, 1, 'a second call does not create a duplicate ticket');
  assert.equal(second.routed, first.routed);
});
test('the executor proposes the growth problem itself when no money settled', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'growth-propose-'));
  const findings = path.join(root, 'findings');
  fs.mkdirSync(findings, { recursive: true });
  fs.writeFileSync(path.join(findings, 'index.md'), '| RF-023 | RF-023-2026-11-28-self-forming-growth-loop.md | x | 7 public sources |\n');
  const paths = { ...fixtures(false), findingsDir: findings, growthState: { settledUsd: 0, daysSinceSettlement: 3, pricingBrowsers: 10, strangerBuyClicks: 0 } };
  const result = executeNext({ ...close, action: 'close-revenue-path' }, paths);
  assert.ok(result.growthTicket, 'a research ticket was written without an owner asking');
  const text = fs.readFileSync(String(result.growthTicket), 'utf8');
  assert.match(text, /decision-change:/);
  assert.match(text, /RF-024-/);
});

test('a settled customer stops the growth ticket generator', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'growth-propose-'));
  const findings = path.join(root, 'findings');
  fs.mkdirSync(findings, { recursive: true });
  const paths = { ...fixtures(false), findingsDir: findings, growthState: { settledUsd: 5, daysSinceSettlement: 0, pricingBrowsers: 10, strangerBuyClicks: 1 } };
  const result = executeNext({ ...close, action: 'close-revenue-path' }, paths);
  assert.equal(result.growthTicket, undefined);
  assert.equal(fs.readdirSync(paths.queue).filter((n) => n.includes('growth')).length, 0);
});
test('an existing research ticket stops another one being queued', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'growth-propose-'));
  const findings = path.join(root, 'findings');
  fs.mkdirSync(findings, { recursive: true });
  const paths = { ...fixtures(false), findingsDir: findings, growthState: { settledUsd: 0, daysSinceSettlement: 3, pricingBrowsers: 10, strangerBuyClicks: 0 } };
  fs.writeFileSync(path.join(paths.queue, 'operator-to-researcher-20261128-1300.md'), 'decision: another question\n');
  const result = executeNext({ ...close, action: 'close-revenue-path' }, paths);
  assert.equal(result.growthTicket, undefined);
  assert.equal(fs.readdirSync(paths.queue).filter((n) => n.includes('growth')).length, 0);
});
test('a ticket with an existing close receipt is not closed twice', () => {
  const paths = fixtures(true);
  const first = executeNext(close, paths);
  const second = executeNext(close, paths);
  assert.equal(first.executed, true);
  assert.equal(second.executed, false);
  assert.match(second.reason, /no answered ticket/i);
});