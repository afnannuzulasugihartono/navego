// @last-edited: 2026-11-28 UTC+7.
// @title: tests for the labelled, whitelisted, delivery-verified review message contract.
// @state: pins labels, sender whitelist, round cap, session resolution and the receipt the live service has to confirm.
// @dependencies: node:test, node:assert, scripts/dev/agent-fleet/message.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import { labelOf, messageIdOf, assertAllowed, resolveSessionId, sendMessage } from '../../scripts/dev/agent-fleet/message.ts';
import type { SendDeps } from '../../scripts/dev/agent-fleet/message.ts';

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

test('the console session stays addressable while its service process runs', () => {
  const now = 1_000_000;
  const consoleSession = session('console', 'slot-console/agent-manager', 'succeeded', now - 43 * 60_000);
  const service = ['opencode.exe serve --service'];
  assert.equal(resolveSessionId('slot-console', [consoleSession], now, 30 * 60_000, service), 'console');
  assert.equal(resolveSessionId('slot-console', [consoleSession], now, 30 * 60_000, []), null);
});

test('the service process does not rescue a finished lane worker', () => {
  const now = 1_000_000;
  const worker = session('worker', 'slot-nvidia-1/engineer-20261127-2025', 'succeeded', now - 43 * 60_000);
  assert.equal(
    resolveSessionId('/engineer-', [worker], now, 30 * 60_000, ['opencode.exe serve --service']),
    null,
    'console service is not a worker process',
  );
});

// The fake below is the live service as the CLI sees it: a post either becomes a message, waits in the target's inbox, or is dropped by the service.
// The clock is fake so a sixty-second wait costs no wall time and every read is counted.

type Accept = 'deliver' | 'queue' | 'drop';

type FakeOptions = {
  busy?: boolean;
  accept?: Accept | ((id: string) => Accept);
  deliverAfter?: number;
  deliverOnWake?: boolean;
};

type FakeService = {
  deps: SendDeps;
  calls: string[][];
  cancelled: string[];
  postedIds: () => string[];
  wakes: () => number;
  seed: (id: string) => void;
};

const fakeService = (options: FakeOptions = {}): FakeService => {
  const acceptOf = (id: string): Accept => {
    const accept = options.accept ?? 'deliver';
    return typeof accept === 'function' ? accept(id) : accept;
  };
  const postedAt = new Map<string, number>();
  const delivered = new Set<string>();
  const calls: string[][] = [];
  const cancelled: string[] = [];
  let reads = 0;
  let wakes = 0;
  let clock = 0;
  const deps: SendDeps = {
    cli: 'opencode',
    roster,
    sessions: [
      session('console', 'slot-console/agent-manager', null, Date.now()),
      session('engineer', 'slot-nvidia-1/engineer-20261128-1200', null, Date.now()),
    ],
    readBack: async (id: string) => {
      reads += 1;
      if (delivered.has(id)) return 'message' as const;
      const at = postedAt.get(id);
      if (at === undefined) return null;
      const accept = acceptOf(id);
      if (accept === 'queue') return 'inbox' as const;
      if (accept === 'drop') return null;
      return reads - at > (options.deliverAfter ?? 0) ? 'message' as const : null;
    },
    cancelQueued: async (baseId: string) => {
      cancelled.push(baseId);
      return [];
    },
    wake: async () => {
      wakes += 1;
      if (options.deliverOnWake) for (const id of postedAt.keys()) delivered.add(id);
    },
    isBusy: async () => options.busy ?? false,
    run: async (args: string[]) => {
      calls.push(args);
      const body = JSON.parse(args[args.length - 1]!) as { id: string };
      postedAt.set(body.id, reads);
      return '{}';
    },
    now: () => clock,
    sleep: async (ms: number) => { clock += ms; },
    waitMs: 60_000,
    pollMs: 2_000,
  };
  return {
    deps,
    calls,
    cancelled,
    postedIds: () => [...postedAt.keys()],
    wakes: () => wakes,
    seed: (id: string) => { delivered.add(id); },
  };
};

const failure = async (promise: Promise<unknown>): Promise<Error | null> => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error as Error;
  }
};

test('sendMessage queues a labelled message without interrupting the target', async () => {
  const svc = fakeService();
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 'resolver.md', round: 1, text: 'pointer' };
  const result = await sendMessage(input, svc.deps);
  assert.equal(result.sessionId, 'console');
  assert.equal(result.alreadyDelivered, false);
  assert.equal(result.receipt, 'message');
  const body = JSON.parse(svc.calls[0]![svc.calls[0]!.length - 1]!);
  assert.equal(body.id, 'msg_resolver.md:1:report');
  assert.equal(body.delivery, 'queue');
  assert.equal(body.resume, true);
  assert.equal(body.metadata.fromAgent, 'engineer');
  assert.ok(body.text.startsWith('[LANE-REPORT engineer] ticket=resolver.md round=1'));
  assert.ok(svc.calls[0]!.some((arg) => arg.endsWith('/synthetic')));
});

test('a post the service drops is a loud failure, not a sent receipt', async () => {
  const svc = fakeService({ accept: 'drop' });
  const input = { kind: 'approve' as const, from: 'operator' as const, to: 'engineer' as const, ticket: 'delivery-unverified.md', round: 1, text: 'Status: APPROVED' };
  const error = await failure(sendMessage(input, svc.deps));
  assert.ok(error, 'the send failed loudly instead of printing a receipt');
  assert.match(error.message, /DELIVERY_UNVERIFIED/);
  assert.match(error.message, /waited 60000ms/, 'the failure names the window it waited');
  assert.match(error.message, /msg_delivery-unverified\.md:1:approve:r2/, 'the retry carried a fresh identity');
  assert.equal(svc.postedIds().length, 2, 'the dropped id was not posted twice');
});

test('a message that arrives late is still a delivered receipt', async () => {
  const svc = fakeService({ deliverAfter: 3 });
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 'late.md', round: 1, text: 'pointer' };
  const result = await sendMessage(input, svc.deps);
  assert.equal(result.receipt, 'message');
  assert.equal(result.id, 'msg_late.md:1:report');
  assert.ok(result.waitedMs >= 6_000, `the receipt waited ${result.waitedMs}ms for the late message`);
  assert.equal(svc.calls.length, 1, 'the late message was not posted twice');
});

test('a busy target is not a sent receipt until it accepts the message', async () => {
  const svc = fakeService({ accept: 'queue', busy: true });
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 'busy.md', round: 1, text: 'pointer' };
  const error = await failure(sendMessage(input, svc.deps));
  assert.ok(error, 'the send failed loudly instead of printing a receipt');
  assert.match(error.message, /DELIVERY_QUEUED/);
  assert.match(error.message, /target busy: yes/, 'the failure names the busy target');
  assert.equal(svc.wakes(), 0, 'a busy target is not steered');
});

test('a queued delivery wakes an idle target and is re-read before success', async () => {
  const svc = fakeService({ accept: 'queue', deliverOnWake: true });
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 'wake-test.md', round: 1, text: 'pointer' };
  const result = await sendMessage(input, svc.deps);
  assert.equal(result.receipt, 'message');
  assert.equal(svc.wakes(), 1, 'the idle target was woken once');
});

test('a queued but undelivered message is not reported as sent', async () => {
  const svc = fakeService({ accept: 'queue' });
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 'queued-only.md', round: 1, text: 'pointer' };
  const error = await failure(sendMessage(input, svc.deps));
  assert.ok(error, 'the send failed loudly instead of printing a receipt');
  assert.match(error.message, /DELIVERY_QUEUED/);
});

test('a dropped id is retried under a fresh identity', async () => {
  const svc = fakeService({ accept: (id) => (id.endsWith(':r2') ? 'deliver' : 'drop') });
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 'burnt.md', round: 1, text: 'pointer' };
  const result = await sendMessage(input, svc.deps);
  assert.equal(result.id, 'msg_burnt.md:1:report:r2');
  assert.equal(result.receipt, 'message');
  assert.equal(svc.calls.length, 2, 'the dropped id was not posted twice');
});

test('a dropped id is retryable with a fresh id after cancelling the queued one', async () => {
  const svc = fakeService();
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 'retry-id.md', round: 1, text: 'pointer' };
  const result = await sendMessage(input, svc.deps, 2);
  assert.equal(result.id, 'msg_retry-id.md:1:report:r2');
  assert.deepEqual(svc.cancelled, ['msg_retry-id.md:1:report']);
  assert.equal(JSON.parse(svc.calls[0]![svc.calls[0]!.length - 1]!).id, result.id);
});

test('a repeated send returns the original id without posting twice', async () => {
  const svc = fakeService();
  const input = { kind: 'review' as const, from: 'operator' as const, to: 'engineer' as const, ticket: 'retry.md', round: 2, text: 'fix this' };
  const first = await sendMessage(input, svc.deps);
  const second = await sendMessage(input, svc.deps);
  assert.equal(second.id, first.id);
  assert.equal(second.alreadyDelivered, true);
  assert.equal(svc.calls.length, 1);
});

test('a message the service already holds is not posted again', async () => {
  const svc = fakeService();
  svc.seed('msg_held.md:1:report');
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 'held.md', round: 1, text: 'pointer' };
  const result = await sendMessage(input, svc.deps);
  assert.equal(result.alreadyDelivered, true);
  assert.equal(result.id, 'msg_held.md:1:report');
  assert.equal(svc.calls.length, 0, 'the service already held the message');
});
