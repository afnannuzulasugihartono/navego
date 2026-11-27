// @last-edited: 2026-11-27 UTC+7.
// @title: tests for the labelled, whitelisted, idempotent review message contract.
// @state: pins labels, sender whitelist, round cap, session resolution and queue delivery.
// @dependencies: node:test, node:assert, scripts/dev/agent-fleet/message.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import { labelOf, messageIdOf, assertAllowed, resolveSessionId, sendMessage } from '../../scripts/dev/agent-fleet/message.ts';

const roster = {
  version: 1,
  operatorSessionTitle: 'slot-console',
  messagePairs: [
    { from: 'engineer', to: 'operator', kinds: ['report'] },
    { from: 'sales-rep', to: 'operator', kinds: ['report'] },
    { from: 'onboarding-guide', to: 'operator', kinds: ['report'] },
    { from: 'operator', to: 'engineer', kinds: ['review', 'approve'] },
    { from: 'operator', to: 'sales-rep', kinds: ['review', 'approve'] },
    { from: 'operator', to: 'onboarding-guide', kinds: ['review', 'approve'] },
  ],
};

type SessionInfo = { id: string; title: string; agent: string; parentId: string | null; outcome: string | null; updatedMs: number };

const session = (id: string, title: string, outcome: string | null, updatedMs: number): SessionInfo =>
  ({ id, title, agent: 'engineer', parentId: null, outcome, updatedMs });

test('a report carries a visible sender label and a stable idempotency id', () => {
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 't.md', round: 1, text: 'pointer' };
  assert.equal(labelOf(input), '[LANE-REPORT engineer] ticket=t.md round=1');
  assert.equal(messageIdOf(input), 'msg_t.md:1:report');
});

test('only a lane report to the operator and an operator review are allowed', () => {
  assert.doesNotThrow(() => assertAllowed({ kind: 'report', from: 'engineer', to: 'operator', ticket: 't.md', round: 1, text: 'x' }, roster));
  assert.doesNotThrow(() => assertAllowed({ kind: 'review', from: 'operator', to: 'engineer', ticket: 't.md', round: 2, text: 'x' }, roster));
  assert.throws(() => assertAllowed({ kind: 'report', from: 'engineer', to: 'sales-rep', ticket: 't.md', round: 1, text: 'x' }, roster), /NOT_ALLOWED/);
  assert.throws(() => assertAllowed({ kind: 'review', from: 'sales-rep', to: 'engineer', ticket: 't.md', round: 1, text: 'x' }, roster), /NOT_ALLOWED/);
  assert.throws(() => assertAllowed({ kind: 'approve', from: 'operator', to: 'operator', ticket: 't.md', round: 1, text: 'x' }, roster), /NOT_ALLOWED/);
});

test('round four is refused so the loop cannot run forever', () => {
  assert.throws(
    () => assertAllowed({ kind: 'review', from: 'operator', to: 'engineer', ticket: 't.md', round: 4, text: 'x' }, roster),
    /ROUND_LIMIT_REACHED/,
  );
});

test('session resolution picks the newest live session and refuses stale ones', () => {
  const now = Date.now();
  const sessions = [
    session('old', 'slot-console/agent-manager', null, now - 10 * 60_000),
    session('new', 'slot-console/agent-manager', null, now - 60_000),
    session('done', 'slot-console/agent-manager', 'succeeded', now - 40 * 60_000),
  ];
  assert.equal(resolveSessionId('slot-console', sessions, now), 'new');
  assert.equal(resolveSessionId('slot-console', [sessions[2]!], now), null);
});

test('a just-finished session with a fresh heartbeat still receives the review', () => {
  const now = 1_000_000;
  const fresh = session('live', 'slot-console/agent-manager', 'succeeded', now - 60_000);
  const stale = session('dead', 'slot-console/agent-manager', 'succeeded', now - 31 * 60_000);
  assert.equal(resolveSessionId('slot-console', [fresh], now), 'live', 'outcome alone does not mean dead');
  assert.equal(resolveSessionId('slot-console', [stale], now), null, 'a stale heartbeat is still refused');
});

test('an idle session with no outcome is refused at the same age', () => {
  const now = 1_000_000;
  const idle = session('idle', 'slot-console/agent-manager', null, now - 40 * 60_000);
  assert.equal(resolveSessionId('slot-console', [idle], now), null, 'no outcome is not a licence to post into a stale session');
});

test('a running process keeps a stale session addressable while it has no outcome', () => {
  const now = 1_000_000;
  const active = session('active', 'slot-console/agent-manager', null, now - 40 * 60_000);
  const processLines = ['opencode.exe run --agent operator --title slot-console/agent-manager-20261126'];
  assert.equal(resolveSessionId('slot-console', [active], now, 30 * 60_000, processLines), 'active');
});

test('sendMessage queues a labelled message without interrupting the target', async () => {
  const calls: string[][] = [];
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 'resolver.md', round: 1, text: 'pointer' };
  const result = await sendMessage(input, {
    cli: 'opencode',
    roster,
    sessions: [session('op', 'slot-console/agent-manager', null, Date.now())],
    run: async (args) => { calls.push(args); return '{}'; },
  });
  assert.equal(result.sessionId, 'op');
  assert.equal(result.alreadyDelivered, false);
  const body = JSON.parse(calls[0]![calls[0]!.length - 1]!);
  assert.equal(body.id, 'msg_resolver.md:1:report');
  assert.equal(body.delivery, 'queue');
  assert.equal(body.resume, true);
  assert.equal(body.metadata.fromAgent, 'engineer');
  assert.ok(body.text.startsWith('[LANE-REPORT engineer] ticket=resolver.md round=1'));
  assert.ok(calls[0]!.some((arg) => arg.endsWith('/synthetic')));
});

test('a repeated send returns the original id without posting twice', async () => {
  let calls = 0;
  const input = { kind: 'review' as const, from: 'operator' as const, to: 'engineer' as const, ticket: 'retry.md', round: 2, text: 'fix this' };
  const deps = {
    cli: 'opencode',
    roster,
    sessions: [session('eng', 'slot-nvidia-2/engineer-20261127-1235', null, Date.now())],
    run: async (_args: string[]) => { calls += 1; return '{}'; },
  };
  const first = await sendMessage(input, deps);
  const second = await sendMessage(input, deps);
  assert.equal(second.id, first.id);
  assert.equal(second.alreadyDelivered, true);
  assert.equal(calls, 1);
  assert.ok(deps.cli === 'opencode');
});
