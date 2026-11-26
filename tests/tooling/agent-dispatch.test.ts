// @last-edited: 2026-11-26 UTC+7.
// @title: agent dispatch - the fleet opens one lane session for the oldest ready ticket.
// @state: the selection takes the money ticket before the measurement one, skips a ticket that was answered or whose lane is busy, and the lane prompt asks for the reply that closes the ticket.
// @dependencies: node:test, strict, node:fs, node:os, node:path.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildPrompt, checkCredential, credentialPresent, markerText, selectTicket, slotBusy, stampOf } from '../../scripts/dev/agent-fleet/dispatch.ts';
import type { Evidence } from '../../scripts/dev/agent-fleet/watch.ts';

const evidence = (overrides: Partial<Evidence> = {}): Evidence => ({
  processLines: null,
  sessions: null,
  staleMinutes: 30,
  remoteAnswers: null,
  ...overrides,
});

const root = fileURLToPath(new URL('../../', import.meta.url));
import { readQueue } from '../../scripts/dev/agent-fleet/watch.ts';

const NOW = Date.parse('2026-11-26T11:40:00.000Z');

const makeQueue = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'agent-dispatch-'));

const write = (dir: string, name: string, text: string): void => {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), text);
};

const ticketText = (kind: string): string => `class: ${kind}\n\n# ticket\n`;

test('the dispatcher takes the money ticket before the measurement one, and the oldest first', () => {
  const dir = makeQueue();
  try {
    write(dir, 'operator-to-sales-rep-20261126-0920.md', ticketText('money'));
    write(dir, 'operator-to-marketer-20261126-1045.md', ticketText('measurement'));
    write(dir, 'operator-to-engineer-20261125-2115.md', ticketText('measurement'));
    const snapshot = readQueue(dir);
    const picked = selectTicket(snapshot, NOW);
    assert.equal(picked?.file, 'operator-to-sales-rep-20261126-0920.md', 'the money ticket goes first');

    write(dir, 'operator-to-ceo-20261126-1040.md', ticketText('money'));
    const both = readQueue(dir);
    assert.equal(selectTicket(both, NOW)?.file, 'operator-to-sales-rep-20261126-0920.md', 'the older money ticket goes first');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the dispatcher skips a ticket that was answered and a lane that is busy', () => {
  const dir = makeQueue();
  try {
    write(dir, 'operator-to-sales-rep-20261126-0920.md', ticketText('money'));
    write(dir, 'sales-rep-reply-20261126-1000.md', 'answered: operator-to-sales-rep-20261126-0920.md\n');
    write(dir, 'operator-to-marketer-20261126-1045.md', ticketText('measurement'));
    write(dir, 'marketer-started-20261126-1100.md', 'Ticket: operator-to-marketer-20261126-1045.md. Slot: nvidia-1.\n');
    const snapshot = readQueue(dir);
    const picked = selectTicket(snapshot, NOW);
    assert.equal(picked, null, 'the answered ticket and the busy lane are both skipped');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the dispatcher skips a lane whose worker process is still alive', () => {
  const dir = makeQueue();
  try {
    write(dir, 'operator-to-marketer-20261126-1045.md', ticketText('measurement'));
    const snapshot = readQueue(dir);
    const alive = ['opencode.exe run --agent marketer --worktree lane-marketer-20261126-1000'];
    assert.equal(selectTicket(snapshot, NOW, 120, evidence({ processLines: alive })), null, 'a live worker holds the lane');
    assert.ok(selectTicket(snapshot, NOW, 120, evidence({ processLines: [] })), 'with no live worker the ticket is ready');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a marker holds the lane by its own stamp, not by the file time', () => {
  const dir = makeQueue();
  try {
    write(dir, 'operator-to-marketer-20261126-1045.md', ticketText('measurement'));
    write(dir, 'marketer-started-20261126-0500.md', 'Ticket: operator-to-marketer-20261126-1045.md. Slot: nvidia-1.\n');
    const old = readQueue(dir);
    assert.ok(selectTicket(old, NOW, 120, evidence()), 'an old stamp frees the lane, whatever the file time says');
    write(dir, 'marketer-started-20261126-1130.md', 'Ticket: operator-to-marketer-20261126-1045.md. Slot: nvidia-1.\n');
    const fresh = readQueue(dir);
    assert.equal(selectTicket(fresh, NOW, 120, evidence()), null, 'a stamp from ten minutes ago holds the lane');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a slot with a live session does not start a second one on the same key', () => {
  const slot = { id: 'nvidia-1', provider: 'nvidia1', model: 'nvidia1/minimaxai/minimax-m3.1-flash', credential: 'file:~/.config/opencode/nvidia-api-key-1', session: 'slot-nvidia-1', serves: ['lane worker 1'], status: 'ready', runsLaneWorkers: true };
  const running = ['opencode.exe run --title slot-nvidia-1/engineer-20261126-1233'];
  const now = Date.now();
  assert.equal(slotBusy(slot, evidence({ processLines: running }), now), true, 'the slot holds a session');
  assert.equal(slotBusy(slot, evidence({ processLines: ['opencode.exe run --title slot-nvidia-2/ceo-20261126-1233'] }), now), false, 'another slot is a different key');
  assert.equal(slotBusy(slot, evidence(), now), false, 'an unreadable process table is not a busy slot');
  const session = { id: 'ses_a', title: 'slot-nvidia-1/engineer-20261126-1233', agent: 'engineer', parentId: null, outcome: null, updatedMs: now };
  assert.equal(slotBusy(slot, evidence({ sessions: [session] }), now), true, 'a live session holds the slot even when its launcher process is gone');
  assert.equal(slotBusy(slot, evidence({ sessions: [{ ...session, outcome: 'error' }] }), now), false, 'a session that ended in an error releases the key');
  assert.equal(slotBusy(slot, evidence({ sessions: [{ ...session, updatedMs: now - 3 * 3600000 }] }), now), false, 'a session that went silent releases the key');
});

test('the dry run prints the plan, prints no credential, and writes nothing', () => {
  const dir = makeQueue();
  try {
    const keyFile = path.join(dir, 'key');
    fs.writeFileSync(keyFile, 'nvapi-the-secret-value');
    write(dir, 'operator-to-marketer-20261126-1045.md', ticketText('measurement'));
    const rosterPath = path.join(dir, 'roster.json');
    fs.writeFileSync(rosterPath, JSON.stringify({
      version: 1,
      slots: [
        { id: 'dry-run-slot', provider: 'nvidia1', model: 'nvidia1/minimaxai/minimax-m3.1-flash', credential: `file:${keyFile}`, session: 'slot-dry-run', serves: ['lane worker 1'], status: 'ready', runsLaneWorkers: true },
      ],
    }));
    const script = path.join(root, 'scripts/dev/agent-fleet/dispatch.ts');
    const run = spawnSync(process.execPath, ['--experimental-strip-types', script, '--slot', 'dry-run-slot', '--dry-run', '--queue', dir, '--roster', rosterPath], { encoding: 'utf8' });
    assert.equal(run.status, 0, `the dry run exits zero: ${run.stderr}`);
    assert.match(run.stdout, /^slot: dry-run-slot$/m, 'the plan names the slot');
    assert.match(run.stdout, /^lane: marketer$/m, 'the plan names the lane');
    assert.match(run.stdout, /^ticket: operator-to-marketer-20261126-1045\.md$/m, 'the plan names the ticket');
    assert.match(run.stdout, /^credential digest: [0-9a-f]{8}$/m, 'the plan carries the digest prefix');
    assert.match(run.stdout, /^command: .*opencode.*run.*--agent marketer/m, 'the plan carries the command');
    assert.ok(!run.stdout.includes('nvapi-the-secret-value'), 'the dry run prints no credential value');
    const queueFiles = fs.readdirSync(dir).filter((name) => name.includes('started-'));
    assert.deepEqual(queueFiles, [], 'the dry run writes no marker');
    const proofs = fs.readdirSync(path.join(root, 'docs/proof')).filter((name) => name.includes('dispatch-dry-run-slot'));
    assert.deepEqual(proofs, [], 'the dry run writes no proof note');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the command refuses a credential collision and starts nothing', () => {
  const dir = makeQueue();
  try {
    const first = path.join(dir, 'key-1');
    const second = path.join(dir, 'key-2');
    fs.writeFileSync(first, 'nvapi-same-key');
    fs.writeFileSync(second, 'nvapi-same-key');
    write(dir, 'operator-to-marketer-20261126-1045.md', ticketText('measurement'));
    const rosterPath = path.join(dir, 'roster.json');
    fs.writeFileSync(rosterPath, JSON.stringify({
      version: 1,
      slots: [
        { id: 'collision-slot', provider: 'nvidia1', model: 'nvidia1/minimaxai/minimax-m3.1-flash', credential: `file:${first}`, session: 'slot-collision', serves: ['lane worker 1'], status: 'ready', runsLaneWorkers: true },
        { id: 'other-slot', provider: 'nvidia2', model: 'nvidia2/minimaxai/minimax-m3.1-flash', credential: `file:${second}`, session: 'slot-other', serves: ['lane worker 2'], status: 'ready', runsLaneWorkers: true },
      ],
    }));
    const script = path.join(root, 'scripts/dev/agent-fleet/dispatch.ts');
    const run = spawnSync(process.execPath, ['--experimental-strip-types', script, '--slot', 'collision-slot', '--dry-run', '--queue', dir, '--roster', rosterPath], { encoding: 'utf8' });
    assert.notEqual(run.status, 0, 'the refusal exits non-zero');
    assert.match(run.stderr, /credential collision/, 'the refusal says why');
    assert.ok(!run.stdout.includes('nvapi-same-key'), 'the refusal prints no credential value');
    const queueFiles = fs.readdirSync(dir).filter((name) => name.includes('started-'));
    assert.deepEqual(queueFiles, [], 'the refusal writes no marker');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('two slots that resolve to the same key are refused, and different keys are not', () => {
  const dir = makeQueue();
  try {
    const first = path.join(dir, 'key-1');
    const second = path.join(dir, 'key-2');
    fs.writeFileSync(first, 'nvapi-same-key');
    fs.writeFileSync(second, 'nvapi-same-key');
    const roster = {
      version: 1,
      slots: [
        { id: 'nvidia-1', provider: 'nvidia1', model: 'nvidia1/minimaxai/minimax-m3.1-flash', credential: `file:${first}`, session: 'slot-nvidia-1', serves: ['lane worker 1'], status: 'ready', runsLaneWorkers: true },
        { id: 'nvidia-2', provider: 'nvidia2', model: 'nvidia2/minimaxai/minimax-m3.1-flash', credential: `file:${second}`, session: 'slot-nvidia-2', serves: ['lane worker 2'], status: 'ready', runsLaneWorkers: true },
      ],
    };
    const collision = checkCredential(roster, 'nvidia-1');
    assert.equal(collision.ok, false, 'the same bytes behind two slots are one key');
    assert.equal(collision.collisionWith, 'nvidia-2', 'the collision names the other slot');
    assert.equal(collision.digestPrefix?.length, 8, 'only the digest prefix is kept');
    fs.writeFileSync(second, 'nvapi-a-different-key');
    const distinct = checkCredential(roster, 'nvidia-1');
    assert.equal(distinct.ok, true, 'different keys are accepted');
    assert.equal(distinct.collisionWith, null, 'no collision to name');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a ticket answered on the remote is never dispatched again', () => {
  const dir = makeQueue();
  try {
    write(dir, 'operator-to-marketer-20261126-1045.md', ticketText('measurement'));
    const snapshot = readQueue(dir);
    const answered = new Set(['operator-to-marketer-20261126-1045.md']);
    assert.equal(selectTicket(snapshot, NOW, 120, evidence({ remoteAnswers: answered })), null, 'the answer on origin/main closes the ticket');
    assert.ok(selectTicket(snapshot, NOW, 120, evidence()), 'without that answer the ticket is ready');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a lane with a live session is busy, whatever its marker says', () => {
  const dir = makeQueue();
  try {
    write(dir, 'operator-to-marketer-20261126-1045.md', ticketText('measurement'));
    write(dir, 'marketer-started-20261126-0500.md', 'Ticket: operator-to-marketer-20261126-1045.md. Slot: nvidia-1.\n');
    const session = { id: 'ses_m', title: 'slot-nvidia-3/marketer-20261126-1233', agent: 'marketer', parentId: null, outcome: null, updatedMs: NOW };
    assert.equal(selectTicket(readQueue(dir), NOW, 120, evidence({ sessions: [session] })), null, 'the live session holds the lane');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the lane prompt asks for the reply that closes the ticket and forbids subagents', () => {
  const ticket = {
    file: 'operator-to-engineer-20261126-0725.md',
    from: 'operator',
    lane: 'engineer',
    stamp: '20261126-0725',
    class: 'measurement',
    blocked: false,
  };
  const prompt = buildPrompt(ticket, '20261126-1140');
  assert.ok(prompt.includes('operator-to-engineer-20261126-0725.md'), 'the prompt names the ticket');
  assert.ok(prompt.includes('docs/agent-roles/engineer.md'), 'the prompt names the role file');
  assert.ok(prompt.includes('answered: operator-to-engineer-20261126-0725.md'), 'the prompt asks for the line that closes the ticket');
  assert.ok(prompt.includes('engineer-reply-20261126-1140.md'), 'the prompt names the reply file');
  assert.ok(prompt.includes('Do not dispatch subagents'), 'the prompt forbids subagents');
});

test('the marker names the ticket, the slot and the session title', () => {
  const marker = markerText(
    { file: 'operator-to-engineer-20261126-0725.md', from: 'operator', lane: 'engineer', stamp: '20261126-0725', class: 'measurement', blocked: false },
    { id: 'nvidia-1', provider: 'nvidia', model: 'nvidia/minimaxai/minimax-m3.1-flash', credential: 'env:NVIDIA_API_KEY', session: 'slot-nvidia-1', serves: ['lane worker 1'], status: 'ready', runsLaneWorkers: true },
    '20261126-1140',
    'slot-nvidia-1/engineer-20261126-1140',
  );
  assert.ok(marker.includes('Ticket: operator-to-engineer-20261126-0725.md.'), 'the marker names the ticket');
  assert.ok(marker.includes('Slot: nvidia-1.'), 'the marker names the slot');
  assert.ok(marker.includes('Worker: slot-nvidia-1/engineer-20261126-1140.'), 'the marker names the session title');
});

test('the credential check asks whether the key is there without reading it', () => {
  process.env.AGENT_DISPATCH_TEST_KEY = 'present';
  assert.equal(credentialPresent('env:AGENT_DISPATCH_TEST_KEY'), true, 'an environment key that exists');
  assert.equal(credentialPresent('env:AGENT_DISPATCH_TEST_KEY_MISSING'), false, 'an environment key that is missing');
  delete process.env.AGENT_DISPATCH_TEST_KEY;
  const file = path.join(os.tmpdir(), 'agent-dispatch-key');
  fs.writeFileSync(file, 'secret');
  assert.equal(credentialPresent(`file:${file}`), true, 'a key file that exists');
  fs.rmSync(file, { force: true });
  assert.equal(credentialPresent(`file:${file}`), false, 'a key file that is missing');
});

test('the stamp is the same shape the queue and the session titles use', () => {
  assert.equal(stampOf(NOW), '20261126-1140', 'the stamp is the UTC minute');
});
