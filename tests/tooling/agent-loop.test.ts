// @last-edited: 2026-11-26 UTC+7.
// @title: agent loop - the manager sees a lane as working only while its worker is alive and its session is moving.
// @state: the classifier reads the queue, a marker is released when no process carries its worktree or its session went silent, a reply closes the ticket, and three releases block it.
// @dependencies: node:test, strict, node:fs, node:os, node:path.

// A marker's age is not liveness.
// These tests pin the process-table rule, the session heartbeat, the release note, the reply that closes a ticket and the block after three releases (docs/agent-roles/loop/README.md).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classify, readQueue, renderState, watch } from '../../scripts/dev/agent-fleet/watch.ts';

const TICKET = 'operator-to-engineer-20261126-0725.md';
const MARKER = 'engineer-started-20261126-0725.md';
const REPLY = 'engineer-reply-20261126-0800.md';
const MARKER_TEXT = `# engineer - started 20261126-0725\nTicket: ${TICKET}. Slot: nvidia-1.\n`;
const REPLY_TEXT = `class: measurement\nanswered: ${TICKET}\nshipped: the fix\n`;
const NOW = Date.parse('2026-11-26T10:40:00.000Z');
const LIVE = ['opencode.exe run --model nvidia/minimaxai/minimax-m3.1-flash --agent engineer --worktree lane-engineer-20261126-0725'];

const makeQueue = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'agent-loop-'));

const write = (dir: string, name: string, text: string): void => {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), text);
};

const session = (overrides: Partial<{ id: string; title: string; parentId: string | null; outcome: string | null; updatedMs: number }> = {}) => ({
  id: 'ses_lane',
  title: 'slot-nvidia-1/engineer-20261126-0725',
  agent: 'engineer',
  parentId: null,
  outcome: 'succeeded',
  updatedMs: NOW - 2 * 60000,
  ...overrides,
});

const evidence = (overrides: Partial<{ processLines: string[] | null; sessions: ReturnType<typeof session>[] | null; staleMinutes: number }> = {}) => ({
  processLines: LIVE,
  sessions: null,
  staleMinutes: 30,
  ...overrides,
});

test('the queue reader finds the ticket, the marker and the reply', () => {
  const dir = makeQueue();
  try {
    write(dir, TICKET, 'class: measurement\n');
    write(dir, MARKER, MARKER_TEXT);
    write(dir, REPLY, REPLY_TEXT);
    const snapshot = readQueue(dir);
    assert.equal(snapshot.tickets.length, 1, 'one ticket');
    assert.equal(snapshot.tickets[0]?.lane, 'engineer', 'the lane is read from the name');
    assert.equal(snapshot.markers[0]?.ticket, TICKET, 'the marker names its ticket');
    assert.equal(snapshot.markers[0]?.slot, 'nvidia-1', 'the marker names its slot');
    assert.equal(snapshot.replies[0]?.answered, TICKET, 'the reply names the ticket it answers');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a ticket with no marker is ready, and a live worktree with a moving session is working', () => {
  const dir = makeQueue();
  try {
    write(dir, TICKET, 'class: measurement\n');
    assert.equal(classify(readQueue(dir), evidence(), NOW)[0]?.state, 'ready', 'no marker means the ticket waits');
    write(dir, MARKER, MARKER_TEXT);
    const moving = evidence({ sessions: [session()] });
    assert.equal(classify(readQueue(dir), moving, NOW)[0]?.state, 'working', 'a live process and a session that spoke two minutes ago');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a live process with a silent session is stalled, because the agent is not working', () => {
  const dir = makeQueue();
  try {
    write(dir, TICKET, 'class: measurement\n');
    write(dir, MARKER, MARKER_TEXT);
    const silent = evidence({ sessions: [session({ updatedMs: NOW - 95 * 60000 })] });
    assert.equal(classify(readQueue(dir), silent, NOW)[0]?.state, 'stalled', 'the process is there but the session stopped talking');
    const failed = evidence({ sessions: [session({ outcome: 'error' })] });
    assert.equal(classify(readQueue(dir), failed, NOW)[0]?.state, 'stalled', 'a session that ended in an error is not working');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a marker without a live process is stalled, and an unreadable process table is unknown', () => {
  const dir = makeQueue();
  try {
    write(dir, TICKET, 'class: measurement\n');
    write(dir, MARKER, MARKER_TEXT);
    assert.equal(classify(readQueue(dir), evidence({ processLines: [] }), NOW)[0]?.state, 'stalled', 'no process means the agent died');
    assert.equal(classify(readQueue(dir), evidence({ processLines: null }), NOW)[0]?.state, 'unknown', 'a failed read is not evidence of death');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the state table counts the subagents a lane dispatched', () => {
  const dir = makeQueue();
  try {
    write(dir, TICKET, 'class: measurement\n');
    write(dir, MARKER, MARKER_TEXT);
    const sessions = [session(), session({ id: 'ses_child_1', title: 'Review diff', parentId: 'ses_lane' }), session({ id: 'ses_child_2', title: 'Review handoff', parentId: 'ses_lane' })];
    const row = classify(readQueue(dir), evidence({ sessions }), NOW)[0];
    assert.equal(row?.subagents, 2, 'two child sessions ran on the same key');
    assert.equal(row?.session, 'ses_lane', 'the row names the lane session');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a reply closes the ticket even while a stale marker sits beside it', () => {
  const dir = makeQueue();
  try {
    write(dir, TICKET, 'class: measurement\n');
    write(dir, MARKER, MARKER_TEXT);
    write(dir, REPLY, REPLY_TEXT);
    assert.equal(classify(readQueue(dir), evidence({ processLines: [] }), NOW)[0]?.state, 'returned', 'the reply is the result');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a reply named like a ticket is still a reply, because the answered line wins', () => {
  const dir = makeQueue();
  try {
    write(dir, TICKET, 'class: measurement\n');
    write(dir, 'engineer-to-operator-20261126-0800.md', `answered: ${TICKET}\n`);
    const snapshot = readQueue(dir);
    assert.equal(snapshot.tickets.length, 1, 'only the real ticket is work');
    assert.equal(snapshot.replies[0]?.answered, TICKET, 'the reply is read as a reply');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the watchdog releases a dead marker, writes the state and never releases a live one', () => {
  const dir = makeQueue();
  try {
    write(dir, TICKET, 'class: measurement\n');
    write(dir, MARKER, MARKER_TEXT);
    const statePath = path.join(dir, 'loop/state.md');
    const dead = watch({ queueDir: dir, statePath, evidence: evidence({ processLines: [] }), now: NOW });
    assert.equal(dead.released.length, 1, 'one marker released');
    assert.equal(fs.existsSync(path.join(dir, MARKER)), false, 'the started marker is gone');
    const released = fs.readFileSync(path.join(dir, 'engineer-released-20261126-0725.md'), 'utf8');
    assert.match(released, /^released: 2026-11-26T10:40:00\.000Z$/m, 'the release is dated');
    assert.match(released, /no live worker process carries --worktree lane-engineer-20261126-0725/, 'the reason names the worktree');
    assert.match(fs.readFileSync(statePath, 'utf8'), /\| engineer \| ready \|/, 'the ticket is ready for the next worker');
    assert.match(fs.readFileSync(statePath, 'utf8'), /\| 1 \|/, 'the release is counted');

    write(dir, MARKER, MARKER_TEXT);
    const live = watch({ queueDir: dir, statePath, evidence: evidence(), now: NOW });
    assert.equal(live.released.length, 0, 'a live marker is left alone');
    assert.equal(fs.existsSync(path.join(dir, MARKER)), true, 'the live marker stays');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('three releases block the ticket so the manager sees a repeated failure', () => {
  const dir = makeQueue();
  try {
    write(dir, TICKET, 'class: measurement\n');
    for (const stamp of ['20261126-0600', '20261126-0700', '20261126-0800']) {
      write(dir, `engineer-released-${stamp}.md`, `# engineer\nTicket: ${TICKET}.\nreleased: 2026-11-26T${stamp.slice(9)}:00:00.000Z\n`);
    }
    write(dir, MARKER, MARKER_TEXT);
    const result = watch({ queueDir: dir, statePath: path.join(dir, 'loop/state.md'), evidence: evidence({ processLines: [] }), now: NOW });
    assert.ok(result.blocked.includes(TICKET), 'the watchdog reports the block');
    assert.equal(fs.existsSync(path.join(dir, 'blocked', TICKET)), true, 'the ticket leaves the dispatch queue');
    assert.match(fs.readFileSync(path.join(dir, 'blocked', `${TICKET}.blocked.md`), 'utf8'), /three worker processes died/, 'the block carries its reason');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the state table names every state the manager must read', () => {
  const rows = [
    { ticket: 'a.md', lane: 'engineer', state: 'working' as const, started: '20261126-0725', releases: 0, worker: 'nvidia-1/engineer-20261126-0725', session: 'ses_a', subagents: 0, outcome: 'succeeded', reply: null, slow: true, note: null },
    { ticket: 'b.md', lane: 'sales-rep', state: 'returned' as const, started: null, releases: 0, worker: null, session: null, subagents: 0, outcome: null, reply: 'b.reply.md', slow: false, note: null },
    { ticket: 'c.md', lane: 'researcher', state: 'stalled' as const, started: '20261126-0700', releases: 1, worker: null, session: null, subagents: 0, outcome: null, reply: null, slow: false, note: null },
    { ticket: 'd.md', lane: 'marketer', state: 'blocked' as const, started: '20261126-0600', releases: 3, worker: null, session: null, subagents: 0, outcome: null, reply: null, slow: false, note: null },
  ];
  const text = renderState(rows);
  for (const state of ['working', 'returned', 'stalled', 'blocked']) assert.ok(text.includes(`| ${state} |`), `the table carries ${state}`);
  assert.ok(text.includes('b.reply.md'), 'the table names the reply');
  assert.ok(text.includes('| yes |'), 'the table flags a working session older than two hours');
  assert.ok(text.includes('ses_a'), 'the table names the lane session');
});
