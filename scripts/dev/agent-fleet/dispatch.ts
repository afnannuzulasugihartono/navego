// @last-edited: 2026-11-26 UTC+7.
// @title: agent-fleet dispatch - opens one lane session for the oldest ready ticket on a credential slot.
// @state: reads the queue and the credential roster, picks one ready ticket (money before measurement), writes the started marker with the ticket, the slot and the session title, and starts the lane session detached.
// @dependencies: node:fs, node:path, node:child_process, node:url, node:os, strict.

// The dispatcher is the fleet's one entry to a lane (docs/agent-roles/loop/README.md).
// The logic lives here, in the repository, where a test reads it, instead of in a one-line command inside the harness where nobody can change it.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readQueue, type QueueSnapshot, type TicketFile } from './watch.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));

export interface Slot {
  id: string;
  provider: string;
  model: string;
  credential: string;
  session: string;
  serves: string[];
  status: string;
  runsLaneWorkers: boolean;
}

export interface Roster {
  version: number;
  slots: Slot[];
}

export const DEFAULT_MARKER_MINUTES = 120;

export const readRoster = (file: string): Roster =>
  JSON.parse(fs.readFileSync(file, 'utf8')) as Roster;

export const credentialPresent = (credential: string): boolean => {
  if (credential.startsWith('env:')) return Boolean(process.env[credential.slice(4)]);
  if (credential.startsWith('file:')) {
    const target = credential.slice(5).replace(/^~/, os.homedir());
    return fs.existsSync(target);
  }
  return false;
};

const laneBusy = (snapshot: QueueSnapshot, lane: string, now: number, markerMinutes: number): boolean =>
  snapshot.markers.some((marker) => !marker.released
    && marker.lane === lane
    && now - marker.mtimeMs < markerMinutes * 60000);

export const selectTicket = (
  snapshot: QueueSnapshot,
  now: number,
  markerMinutes = DEFAULT_MARKER_MINUTES,
): TicketFile | null => {
  const ready = snapshot.tickets.filter((ticket) => {
    if (ticket.blocked) return false;
    if (snapshot.replies.some((reply) => reply.answered === ticket.file)) return false;
    return !laneBusy(snapshot, ticket.lane, now, markerMinutes);
  });
  const money = ready.filter((ticket) => ticket.class === 'money').sort((left, right) => left.stamp.localeCompare(right.stamp));
  if (money[0]) return money[0];
  const measurement = ready.filter((ticket) => ticket.class !== 'money').sort((left, right) => left.stamp.localeCompare(right.stamp));
  return measurement[0] ?? null;
};

export const buildPrompt = (ticket: TicketFile, stamp: string): string => [
  `Read the ticket ${ticket.file} in docs/agent-roles/queue/ and your role file docs/agent-roles/${ticket.lane}.md, then do that ticket's scopeRequested and nothing else.`,
  'Work only inside your scope and the shared communication surface (the queue, docs/agent-roles/status.md, docs/proof/).',
  'Act first: send or write the thing the ticket asks for, then record it (docs/proof/<date>-' + ticket.lane + '.md and a reply artifact next to the ticket named ' + ticket.lane + '-reply-' + stamp + '.md whose text carries the line answered: ' + ticket.file + '), then refresh your line in docs/agent-roles/status.md.',
  'When the owner rule in docs/autonomy.md and a ticket text disagree, the owner rule wins; if the text you are asked to send misses what that rule requires, fix the text first and send the compliant one.',
  'Ship it the way docs/autonomy.md says: npm test and npm run check, a pull request, and merge by gate.',
  'Never claim money that did not move.',
  'Do not dispatch subagents: you are the only worker on this key, and a child session multiplies requests against the same 40 rpm limit.',
].join(' ');

export const stampOf = (now: number): string => {
  const iso = new Date(now).toISOString();
  return `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}`;
};

export const opencodeExecutable = (): string | null => {
  const candidates = process.platform === 'win32'
    ? [
      path.join(process.env.APPDATA ?? '', 'npm', 'node_modules', '@opencode', 'cli', 'bin', 'opencode.exe'),
      'C:\\Program Files\\nodejs\\node_modules\\@opencode\\cli\\bin\\opencode.exe',
    ]
    : ['/usr/local/bin/opencode', '/usr/bin/opencode'];
  for (const candidate of candidates) if (candidate && fs.existsSync(candidate)) return candidate;
  return null;
};

export const markerText = (ticket: TicketFile, slot: Slot, stamp: string, title: string): string => [
  `# ${ticket.lane} - started ${stamp}`,
  `Ticket: ${ticket.file}. Slot: ${slot.id}. Worker: ${title}.`,
  '',
].join('\n');

export const dispatchNote = (slot: Slot, ticket: TicketFile, stamp: string, title: string, logDir: string): string => [
  `# Dispatch ${stamp}`,
  '',
  `- slot: ${slot.id} (provider ${slot.provider}, model ${slot.model})`,
  `- lane: ${ticket.lane}`,
  `- ticket: ${ticket.file}`,
  `- session title: ${title} (listed by: opencode session list)`,
  `- worker log: ${logDir}`,
  '',
  'The session is not archived, so it can be watched and exported while it runs; it holds its own credential, its own session and its own worktree.',
  '',
].join('\n');

export const dispatch = async (options: {
  slot: Slot;
  snapshot: QueueSnapshot;
  queueDir: string;
  now: number;
  repoRoot: string;
}): Promise<{ title: string; pid: number | undefined; stamp: string } | null> => {
  const { slot, snapshot, queueDir, now, repoRoot } = options;
  const ticket = selectTicket(snapshot, now);
  if (!ticket) return null;
  const cli = opencodeExecutable();
  if (!cli) return null;
  const stamp = stampOf(now);
  const title = `slot-${slot.id}/${ticket.lane}-${stamp}`;
  const worktree = `lane-${ticket.lane}-${stamp}`;
  const logDir = path.join(os.tmpdir(), 'opencode', 'lane-logs');
  fs.mkdirSync(logDir, { recursive: true });
  const out = fs.openSync(path.join(logDir, `${stamp}-${ticket.lane}.out`), 'a');
  const err = fs.openSync(path.join(logDir, `${stamp}-${ticket.lane}.err`), 'a');
  const child = spawn(cli, [
    'run',
    '--model', slot.model,
    '--agent', ticket.lane,
    '--worktree', worktree,
    '--title', title,
    '--format', 'json',
    '--auto', buildPrompt(ticket, stamp),
  ], { cwd: repoRoot, detached: true, stdio: ['ignore', out, err], windowsHide: true });
  child.unref();
  fs.writeFileSync(path.join(queueDir, `${ticket.lane}-started-${stamp}.md`), markerText(ticket, slot, stamp, title));
  fs.writeFileSync(path.join(repoRoot, 'docs', 'proof', `${stamp}-dispatch-${slot.id}.md`), dispatchNote(slot, ticket, stamp, title, logDir));
  return { title, pid: child.pid, stamp };
};

const usage = (): void => {
  console.error('usage: node scripts/dev/agent-fleet/dispatch.ts --slot <slot-id>');
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const slotAt = args.indexOf('--slot');
  const slotId = slotAt >= 0 ? args[slotAt + 1] : undefined;
  if (!slotId) {
    usage();
    process.exitCode = 2;
    return;
  }
  if (!fs.existsSync(path.join(root, 'scripts/verify/role-scope.ts'))) {
    console.log('SCOPE_GATE_PENDING');
    return;
  }
  const roster = readRoster(path.join(root, 'docs/agent-roles/keys.json'));
  const slot = roster.slots.find((candidate) => candidate.id === slotId);
  if (!slot) {
    console.log('NO_SLOT');
    return;
  }
  if (!slot.runsLaneWorkers) {
    console.log('SLOT_DOES_NOT_RUN_LANES');
    return;
  }
  if (!credentialPresent(slot.credential)) {
    console.log('CREDENTIAL_MISSING');
    return;
  }
  if (slot.status !== 'ready') {
    console.log(`slot ${slot.id} says ${slot.status} in the roster but its credential is there; dispatching`);
  }
  const queueDir = path.join(root, 'docs/agent-roles/queue');
  const snapshot = readQueue(queueDir);
  const started = await dispatch({ slot, snapshot, queueDir, now: Date.now(), repoRoot: root });
  if (!started) {
    console.log('NO_READY_TICKET');
    return;
  }
  console.log(`dispatched ${started.title} (pid ${started.pid ?? '?'})`);
};

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main();
