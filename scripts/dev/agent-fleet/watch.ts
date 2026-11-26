// @last-edited: 2026-11-26 UTC+7.
// @title: agent-fleet watch - the manager's liveness check over the handoff queue.
// @state: reads docs/agent-roles/queue, classifies every ticket (ready, working, returned, stalled, blocked), releases a marker whose worker process is gone, and writes docs/agent-roles/loop/state.md.
// @dependencies: node:fs, node:path, node:child_process, node:url, strict.

// The queue is the memory between the manager and the lanes (docs/agent-roles/loop/README.md).
// A marker's age is not liveness: an agent can die two minutes after it starts.
// The process table is the evidence, and a failed read is not evidence of death.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));

export type TicketState = 'ready' | 'working' | 'returned' | 'stalled' | 'unknown' | 'blocked';

export interface TicketFile {
  file: string;
  from: string;
  lane: string;
  stamp: string;
  blocked: boolean;
}

export interface MarkerFile {
  file: string;
  lane: string;
  stamp: string;
  ticket: string;
  slot: string | null;
  released: boolean;
  mtimeMs: number;
}

export interface ReplyFile {
  file: string;
  answered: string;
}

export interface QueueSnapshot {
  tickets: TicketFile[];
  markers: MarkerFile[];
  replies: ReplyFile[];
}

export interface LoopRow {
  ticket: string;
  lane: string;
  state: TicketState;
  started: string | null;
  releases: number;
  worker: string | null;
  reply: string | null;
  slow: boolean;
  note: string | null;
}

export interface WatchResult {
  rows: LoopRow[];
  released: string[];
  blocked: string[];
  processesAvailable: boolean;
  stateWritten: boolean;
}

const TICKET = /^(.+)-to-(.+)-(\d{8}-\d{4})\.md$/;
const MARKER = /^(.+)-started-(\d{8}-\d{4})\.md$/;
const RELEASED = /^(.+)-released-(\d{8}-\d{4})\.md$/;

const stripTail = (value: string): string => value.replace(/[.,;:]+$/, '');

const readText = (file: string): string => fs.readFileSync(file, 'utf8');

export const readQueue = (queueDir: string): QueueSnapshot => {
  const tickets: TicketFile[] = [];
  const markers: MarkerFile[] = [];
  const replies: ReplyFile[] = [];
  const blockedDir = path.join(queueDir, 'blocked');
  const scan = (dir: string, blocked: boolean): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const file = path.join(dir, entry.name);
      const text = readText(file);
      // The answered line wins over the file name: a reply that happens to be named like a ticket is still a reply, and dispatching it as work would send a lane to answer its own result.
      const answered = text.match(/^answered:\s*([^\s]+)/m);
      if (answered) {
        replies.push({ file: entry.name, answered: stripTail(answered[1] ?? '') });
        continue;
      }
      const ticket = TICKET.exec(entry.name);
      if (ticket) {
        tickets.push({ file: entry.name, from: ticket[1] ?? '', lane: ticket[2] ?? '', stamp: ticket[3] ?? '', blocked });
        continue;
      }
      const marker = MARKER.exec(entry.name);
      if (marker) {
        const ticketLine = text.match(/^Ticket:\s*([^\s]+)/m);
        const slotLine = text.match(/Slot:\s*([A-Za-z0-9-]+)/);
        markers.push({
          file: entry.name,
          lane: marker[1] ?? '',
          stamp: marker[2] ?? '',
          ticket: ticketLine ? stripTail(ticketLine[1] ?? '') : '',
          slot: slotLine ? (slotLine[1] ?? null) : null,
          released: false,
          mtimeMs: fs.statSync(file).mtimeMs,
        });
        continue;
      }
      const released = RELEASED.exec(entry.name);
      if (released) {
        const ticketLine = text.match(/^Ticket:\s*([^\s]+)/m);
        markers.push({
          file: entry.name,
          lane: released[1] ?? '',
          stamp: released[2] ?? '',
          ticket: ticketLine ? stripTail(ticketLine[1] ?? '') : '',
          slot: null,
          released: true,
          mtimeMs: fs.statSync(file).mtimeMs,
        });
      }
    }
  };
  scan(queueDir, false);
  scan(blockedDir, true);
  return { tickets, markers, replies };
};

const latestMarker = (snapshot: QueueSnapshot, ticket: string): MarkerFile | null => {
  const found = snapshot.markers
    .filter((marker) => !marker.released && marker.ticket === ticket)
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  return found[0] ?? null;
};

const releaseCount = (snapshot: QueueSnapshot, ticket: string): number =>
  snapshot.markers.filter((marker) => marker.released && marker.ticket === ticket).length;

export const classify = (
  snapshot: QueueSnapshot,
  processes: string[] | null,
  now: number,
): LoopRow[] => {
  const rows: LoopRow[] = [];
  for (const ticket of snapshot.tickets) {
    const reply = snapshot.replies.find((candidate) => candidate.answered === ticket.file) ?? null;
    const marker = latestMarker(snapshot, ticket.file);
    const releases = releaseCount(snapshot, ticket.file);
    let state: TicketState = ticket.blocked ? 'blocked' : 'ready';
    let alive = false;
    if (reply) state = 'returned';
    else if (marker) {
      if (processes === null) state = 'unknown';
      else {
        alive = processes.some((line) => line.includes(`lane-${marker.lane}-${marker.stamp}`));
        state = alive ? 'working' : 'stalled';
      }
    }
    if (state !== 'returned' && state !== 'working' && processes !== null && releases >= 3) state = 'blocked';
    const age = marker ? Math.round((now - marker.mtimeMs) / 60000) : null;
    rows.push({
      ticket: ticket.file,
      lane: ticket.lane,
      state,
      started: marker ? marker.stamp : null,
      releases,
      worker: marker && marker.slot ? `${marker.slot}/${marker.lane}-${marker.stamp}` : null,
      reply: reply ? reply.file : null,
      slow: state === 'working' && age !== null && age > 120,
      note: age === null ? null : `${age} min since the marker`,
    });
  }
  return rows.sort((left, right) => left.ticket.localeCompare(right.ticket));
};

const releaseMarker = (queueDir: string, marker: MarkerFile, now: number): string => {
  const target = marker.file.replace('-started-', '-released-');
  const source = path.join(queueDir, marker.file);
  const destination = path.join(queueDir, target);
  const note = [
    '',
    `released: ${new Date(now).toISOString()}`,
    `reason: no live worker process carries --worktree lane-${marker.lane}-${marker.stamp}`,
  ].join('\n');
  if (fs.existsSync(destination)) {
    fs.appendFileSync(destination, `${note}\n`);
    fs.unlinkSync(source);
    return target;
  }
  fs.appendFileSync(source, `${note}\n`);
  fs.renameSync(source, destination);
  return target;
};

const blockTicket = (queueDir: string, ticket: string, now: number): void => {
  const blockedDir = path.join(queueDir, 'blocked');
  fs.mkdirSync(blockedDir, { recursive: true });
  const source = path.join(queueDir, ticket);
  const destination = path.join(blockedDir, ticket);
  if (!fs.existsSync(source)) return;
  fs.renameSync(source, destination);
  fs.writeFileSync(
    `${destination}.blocked.md`,
    `blocked: ${new Date(now).toISOString()}\nreason: three worker processes died before a reply\n`,
  );
};

export const renderState = (rows: LoopRow[]): string => {
  const header = [
    '# Fleet loop state',
    '',
    'The manager view of every ticket. Generated by',
    '`scripts/dev/agent-fleet/watch.ts`; the contract is in',
    '[`README.md`](README.md).',
    '',
  ];
  if (rows.length === 0) return [...header, 'No ticket is open.', ''].join('\n');
  const table = [
    '| ticket | lane | state | started | releases | slow | worker | reply |',
    '|---|---|---|---|---|---|---|---|',
    ...rows.map((row) =>
      `| ${row.ticket} | ${row.lane} | ${row.state} | ${row.started ?? '-'} | ${row.releases} | ${row.slow ? 'yes' : '-'} | ${row.worker ?? '-'} | ${row.reply ?? '-'} |`,
    ),
  ];
  return [...header, ...table, ''].join('\n');
};

export const watch = (options: {
  queueDir: string;
  statePath: string;
  processes: string[] | null;
  now: number;
  dryRun?: boolean;
}): WatchResult => {
  const { queueDir, statePath, processes, now, dryRun = false } = options;
  const snapshot = readQueue(queueDir);
  const rows = classify(snapshot, processes, now);
  const released: string[] = [];
  const blocked: string[] = [];
  if (!dryRun) {
    for (const row of rows) {
      if (row.state === 'blocked') {
        const ticket = snapshot.tickets.find((candidate) => candidate.file === row.ticket);
        if (ticket && !ticket.blocked) {
          blockTicket(queueDir, row.ticket, now);
          blocked.push(row.ticket);
        }
        continue;
      }
      if (row.state !== 'stalled') continue;
      const marker = latestMarker(snapshot, row.ticket);
      if (!marker) continue;
      released.push(releaseMarker(queueDir, marker, now));
      const count = releaseCount(readQueue(queueDir), row.ticket);
      if (count >= 3) {
        blockTicket(queueDir, row.ticket, now);
        blocked.push(row.ticket);
      }
    }
  }
  const finalRows = dryRun ? rows : classify(readQueue(queueDir), processes, now);
  const rendered = renderState(finalRows);
  let stateWritten = false;
  if (!dryRun) {
    const current = fs.existsSync(statePath) ? readText(statePath) : '';
    if (current !== rendered) {
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, rendered);
      stateWritten = true;
    }
  }
  return { rows: finalRows, released, blocked, processesAvailable: processes !== null, stateWritten };
};

export const readProcesses = (): string[] | null => {
  try {
    const output = process.platform === 'win32'
      ? execFileSync(
        'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='opencode.exe'\" | Select-Object -ExpandProperty CommandLine"],
        { encoding: 'utf8', windowsHide: true },
      )
      : execFileSync('/bin/ps', ['-eo', 'args'], { encoding: 'utf8', windowsHide: true });
    return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } catch {
    return null;
  }
};

const usage = (): void => {
  console.error('usage: node scripts/dev/agent-fleet/watch.ts [--queue <dir>] [--state <file>] [--processes <json>] [--now <iso>] [--dry-run]');
  console.error('the process table is the liveness evidence; --processes exists for the test and accepts a JSON array of command lines.');
};

const main = (): void => {
  const args = process.argv.slice(2);
  const flagValue = (flag: string): string | undefined => {
    const at = args.indexOf(flag);
    return at >= 0 ? args[at + 1] : undefined;
  };
  if (args.includes('--help')) {
    usage();
    return;
  }
  const queueDir = flagValue('--queue') ?? path.join(root, 'docs/agent-roles/queue');
  const statePath = flagValue('--state') ?? path.join(root, 'docs/agent-roles/loop/state.md');
  const processesPath = flagValue('--processes');
  const now = flagValue('--now') ? Date.parse(flagValue('--now') ?? '') : Date.now();
  if (!Number.isFinite(now)) {
    console.error('--now is not a date');
    process.exitCode = 2;
    return;
  }
  const processes = processesPath
    ? (JSON.parse(readText(processesPath)) as string[])
    : readProcesses();
  const result = watch({ queueDir, statePath, processes, now, dryRun: args.includes('--dry-run') });
  const counts = result.rows.reduce<Record<string, number>>((all, row) => {
    all[row.state] = (all[row.state] ?? 0) + 1;
    return all;
  }, {});
  const summary = Object.entries(counts).map(([state, count]) => `${count} ${state}`).join(', ') || 'no ticket';
  console.log(`loop: ${summary}${result.stateWritten ? ' (state written)' : ''}`);
  if (args.includes('--print')) console.log(renderState(result.rows));
  for (const file of result.released) console.log(`released: ${file}`);
  for (const ticket of result.blocked) console.log(`blocked: ${ticket}`);
  if (!result.processesAvailable) console.log('process table unreadable: no marker was released');
};

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main();
