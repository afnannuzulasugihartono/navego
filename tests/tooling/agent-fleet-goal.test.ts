// @last-edited: 2026-11-28 UTC+7.
// @title: agent-fleet goal test - the operator picks its next action from state, not from an instruction.
// @state: failing before scripts/dev/agent-fleet/goal.ts exists, passing after it.
// @dependencies: node:test, node:assert, scripts/dev/agent-fleet/goal.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { selectNextAction, countOpenTickets, readMissionState, type MissionState } from '../../scripts/dev/agent-fleet/goal.ts';

const base: MissionState = {
  settledUsd: 0,
  daysSinceSettlement: 1,
  buyerRepliesWaiting: 0,
  openTickets: 0,
  blockedLanes: 0,
  claimDrift: 0
};

test('a waiting buyer reply outranks everything, because attention decays', () => {
  const chosen = selectNextAction({ ...base, buyerRepliesWaiting: 1, blockedLanes: 3 });
  assert.equal(chosen.action, 'answer-buyer');
  assert.equal(chosen.signal, 'buyer-reply-waiting');
  assert.ok(chosen.exit.length > 0, 'every action carries its exit condition');
});

test('no settlement for a week means the revenue path itself is the work', () => {
  const chosen = selectNextAction({ ...base, daysSinceSettlement: 7, openTickets: 4 });
  assert.equal(chosen.action, 'close-revenue-path');
  assert.equal(chosen.signal, 'no-settlement-7d');
});

test('an open ticket is closed before new work is chosen', () => {
  const chosen = selectNextAction({ ...base, openTickets: 2 });
  assert.equal(chosen.action, 'close-ticket');
  assert.equal(chosen.signal, 'open-ticket');
});

test('a blocked lane is unblocked before another ticket is opened', () => {
  const chosen = selectNextAction({ ...base, blockedLanes: 1 });
  assert.equal(chosen.action, 'unblock-lane');
  assert.equal(chosen.signal, 'blocked-lane');
});

test('a claim that outruns its evidence is corrected before anything else', () => {
  const chosen = selectNextAction({ ...base, claimDrift: 1 });
  assert.equal(chosen.action, 'fix-claim-drift');
  assert.equal(chosen.signal, 'claim-drift');
});

test('with nothing pending the operator still ships one customer-visible improvement', () => {
  const chosen = selectNextAction(base);
  assert.equal(chosen.action, 'one-customer-visible-defect');
  assert.equal(chosen.signal, 'default');
});

test('the queue counts tickets that no reply has closed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goal-queue-'));
  try {
    fs.writeFileSync(path.join(dir, 'operator-to-engineer-20261128-0100.md'), 'open\n');
    fs.writeFileSync(path.join(dir, 'engineer-reply-20261128-0110.md'), 'answered: operator-to-engineer-20261128-0100.md\n');
    fs.writeFileSync(path.join(dir, 'operator-to-sales-rep-20261128-0200.md'), 'open\n');
    fs.mkdirSync(path.join(dir, 'blocked'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocked', 'operator-to-onboarding-guide-20261128-0300.md'), 'open\n');
    assert.equal(countOpenTickets(dir), 1, 'one ticket is open, one is answered, one is blocked');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('time since settlement is derived from the ledger date, not a typed number', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goal-derive-'));
  try {
    fs.writeFileSync(path.join(dir, 'economy.json'), JSON.stringify({
      revenue: { settled_usd: 12, last_settled_at: '2026-11-21T00:00:00Z' }, mission: {}
    }));
    const state = readMissionState(path.join(dir, 'economy.json'), dir, { now: Date.parse('2026-11-28T00:00:00Z') });
    assert.equal(state.settledUsd, 12);
    assert.equal(state.daysSinceSettlement, 7);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('with no settlement ever, the clock starts at the one-time mission start', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goal-derive-'));
  try {
    fs.writeFileSync(path.join(dir, 'economy.json'), JSON.stringify({
      revenue: { settled_usd: 0, last_settled_at: null }, mission: { started_at: '2026-11-25' }
    }));
    const state = readMissionState(path.join(dir, 'economy.json'), dir, { now: Date.parse('2026-11-28T12:00:00Z') });
    assert.equal(state.daysSinceSettlement, 3);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('blocked lanes are counted from the generated fleet state, not typed by the operator', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goal-derive-'));
  try {
    fs.writeFileSync(path.join(dir, 'state.md'), '| a.md | engineer | blocked | - | 3 |\n| b.md | sales-rep | ready | - | 0 |\n| c.md | ceo | blocked | - | 1 |\n');
    const state = readMissionState(path.join(dir, 'economy.json'), dir, { statePath: path.join(dir, 'state.md') });
    assert.equal(state.blockedLanes, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('an unanswered buyer reply in an outreach proof is a live signal', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goal-derive-'));
  try {
    const replies = path.join(dir, 'replies');
    fs.mkdirSync(replies, { recursive: true });
    fs.writeFileSync(path.join(replies, '2026-11-28-harbor.md'), 'surface: github\nanswered: no\n');
    fs.writeFileSync(path.join(replies, '2026-11-27-agno.md'), 'surface: github\nanswered: yes\n');
    const state = readMissionState(path.join(dir, 'economy.json'), dir, { repliesDir: replies });
    assert.equal(state.buyerRepliesWaiting, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});