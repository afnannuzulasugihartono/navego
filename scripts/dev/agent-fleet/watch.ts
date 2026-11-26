// @last-edited: 2026-11-26 UTC+7.
// @title: agent-fleet watch - the manager's liveness check over the handoff queue.
// @state: reads docs/agent-roles/queue, classifies every ticket (ready, working, returned, stalled, unknown, blocked) from the operating system's process table and the OpenCode session heartbeat, releases a marker whose worker is gone or silent, and writes docs/agent-roles/loop/state.md.
// @dependencies: node:fs, node:path, node:child_process, node:url, strict.

// The queue is the memory between the manager and the lanes (docs/agent-roles/loop/README.md).
// A marker's age is not liveness: an agent can die two minutes after it starts, and it can also sit alive on a provider error while its session stops moving.
// The process table says the worker is there; the session's own heartbeat says the agent is still working.
// A failed read is not evidence of death.

import fs from 'node:fs';
import os from 'node:os';
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
  class: string;
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
  startedMs: number;
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

export interface ProcessInfo {
  processId: number;
  commandLine: string;
  port: number | null;
}

export interface SessionInfo {
  id: string;
  title: string;
  agent: string;
  parentId: string | null;
  outcome: string | null;
  updatedMs: number;
}

export interface Evidence {
  processLines: string[] | null;
  sessions: SessionInfo[] | null;
  staleMinutes: number;
  remoteAnswers: Set<string> | null;
}

export interface LoopRow {
  ticket: string;
  lane: string;
  state: TicketState;
  started: string | null;
  releases: number;
  worker: string | null;
  session: string | null;
  subagents: number;
  outcome: string | null;
  reply: string | null;
  slow: boolean;
  note: string | null;
}

export interface WatchResult {
  rows: LoopRow[];
  released: string[];
  blocked: string[];
  processesAvailable: boolean;
  sessionsAvailable: boolean;
  stateWritten: boolean;
}

const TICKET = /^(.+)-to-(.+)-(\d{8}-\d{4})\.md$/;
const MARKER = /^(.+)-started-(\d{8}-\d{4})\.md$/;
const RELEASED = /^(.+)-released-(\d{8}-\d{4})\.md$/;

export const DEFAULT_STALE_MINUTES = 30;

const stripTail = (value: string): string => value.replace(/[.,;:]+$/, '');

const GIT = process.platform === 'win32' ? 'C:\\Program Files\\Git\\cmd\\git.exe' : '/usr/bin/git';

// A lane's merge lands on the remote before the local checkout has it, and a stale checkout must not read an answered ticket as unanswered: the release would send the next worker to redo work that already landed.

export const readRemoteAnswers = (cwd = process.cwd()): Set<string> | null => {
  try {
    const output = execFileSync(GIT, ['grep', '-h', '^answered:', 'origin/main', '--', 'docs/agent-roles/queue'], { cwd, encoding: 'utf8' });
    const answers = new Set<string>();
    for (const line of output.split('\n')) {
      const match = line.match(/^answered:\s*(\S+)/);
      if (match?.[1]) answers.add(match[1]);
    }
    return answers;
  } catch {
    return null;
  }
};

// The marker's own stamp is the dispatch time, and it is the only time the fleet wrote down.
// A file's mtime can be bumped by anything that touches it, so it is never the evidence that a lane is still working.

export const stampMs = (stamp: string): number | null => {
  const match = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(stamp);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
};

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
        const classLine = text.match(/^class:\s*(\w+)/m);
        tickets.push({
          file: entry.name,
          from: ticket[1] ?? '',
          lane: ticket[2] ?? '',
          stamp: ticket[3] ?? '',
          class: classLine ? (classLine[1] ?? 'measurement') : 'measurement',
          blocked,
        });
        continue;
      }
      const marker = MARKER.exec(entry.name);
      if (marker) {
        const ticketLine = text.match(/^Ticket:\s*([^\s]+)/m);
        const slotLine = text.match(/Slot:\s*([A-Za-z0-9-]+)/);
        const stamp = marker[2] ?? '';
        markers.push({
          file: entry.name,
          lane: marker[1] ?? '',
          stamp,
          ticket: ticketLine ? stripTail(ticketLine[1] ?? '') : '',
          slot: slotLine ? (slotLine[1] ?? null) : null,
          released: false,
          mtimeMs: fs.statSync(file).mtimeMs,
          startedMs: stampMs(stamp) ?? fs.statSync(file).mtimeMs,
        });
        continue;
      }
      const released = RELEASED.exec(entry.name);
      if (released) {
        const ticketLine = text.match(/^Ticket:\s*([^\s]+)/m);
        const stamp = released[2] ?? '';
        markers.push({
          file: entry.name,
          lane: released[1] ?? '',
          stamp,
          ticket: ticketLine ? stripTail(ticketLine[1] ?? '') : '',
          slot: null,
          released: true,
          mtimeMs: fs.statSync(file).mtimeMs,
          startedMs: stampMs(stamp) ?? fs.statSync(file).mtimeMs,
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

const sessionFor = (sessions: SessionInfo[] | null, marker: MarkerFile): SessionInfo | null => {
  if (!sessions) return null;
  const suffix = `${marker.lane}-${marker.stamp}`;
  const found = sessions.find((session) => session.title === suffix || session.title.endsWith(`/${suffix}`));
  return found ?? null;
};

const subagentCount = (sessions: SessionInfo[] | null, session: SessionInfo | null): number => {
  if (!sessions || !session) return 0;
  return sessions.filter((candidate) => candidate.parentId === session.id).length;
};

export const classify = (
  snapshot: QueueSnapshot,
  evidence: Evidence,
  now: number,
): LoopRow[] => {
  const { processLines, sessions, staleMinutes } = evidence;
  const rows: LoopRow[] = [];
  for (const ticket of snapshot.tickets) {
    const reply = snapshot.replies.find((candidate) => candidate.answered === ticket.file) ?? null;
    const answeredRemotely = reply === null && (evidence.remoteAnswers?.has(ticket.file) ?? false);
    const marker = latestMarker(snapshot, ticket.file);
    const releases = releaseCount(snapshot, ticket.file);
    const session = marker ? sessionFor(sessions, marker) : null;
    const subagents = subagentCount(sessions, session);
    let state: TicketState = ticket.blocked ? 'blocked' : 'ready';
    if (reply || answeredRemotely) state = 'returned';
    else if (marker) {
      const processAlive = processLines !== null
        && processLines.some((line) => line.includes(`lane-${marker.lane}-${marker.stamp}`));
      const sessionAge = session ? Math.round((now - session.updatedMs) / 60000) : null;
      const sessionFailed = session?.outcome === 'error';
      const sessionSilent = sessionAge !== null && sessionAge > staleMinutes;
      if (sessionFailed || sessionSilent) state = 'stalled';
      else if (session) state = 'working';
      else if (processLines === null) state = 'unknown';
      else state = processAlive ? 'working' : 'stalled';
    }
    if (state !== 'returned' && state !== 'working' && releases >= 3) state = 'blocked';
    const age = marker ? Math.round((now - marker.startedMs) / 60000) : null;
    const sessionAge = session ? Math.round((now - session.updatedMs) / 60000) : null;
    rows.push({
      ticket: ticket.file,
      lane: ticket.lane,
      state,
      started: marker ? marker.stamp : null,
      releases,
      worker: marker && marker.slot ? `${marker.slot}/${marker.lane}-${marker.stamp}` : null,
      session: session ? session.id : null,
      subagents,
      outcome: session ? (session.outcome ?? '-') : null,
      reply: reply ? reply.file : answeredRemotely ? 'answered on origin/main' : null,
      slow: state === 'working' && sessionAge !== null && sessionAge > 120,
      note: sessionAge === null ? (age === null ? null : `${age} min since the marker`) : `${sessionAge} min since the session spoke`,
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
    '| ticket | lane | state | started | releases | slow | worker | session | subagents | reply |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map((row) =>
      `| ${row.ticket} | ${row.lane} | ${row.state} | ${row.started ?? '-'} | ${row.releases} | ${row.slow ? 'yes' : '-'} | ${row.worker ?? '-'} | ${row.session ?? '-'} | ${row.subagents} | ${row.reply ?? '-'} |`,
    ),
  ];
  return [...header, ...table, ''].join('\n');
};

export const watch = (options: {
  queueDir: string;
  statePath: string;
  evidence: Evidence;
  now: number;
  dryRun?: boolean;
}): WatchResult => {
  const { queueDir, statePath, evidence, now, dryRun = false } = options;
  const snapshot = readQueue(queueDir);
  const rows = classify(snapshot, evidence, now);
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
  const finalRows = dryRun ? rows : classify(readQueue(queueDir), evidence, now);
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
  return {
    rows: finalRows,
    released,
    blocked,
    processesAvailable: evidence.processLines !== null,
    sessionsAvailable: evidence.sessions !== null,
    stateWritten,
  };
};

const POWERSHELL = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

const processScript = [
  '$rows = @()',
  'foreach ($p in (Get-CimInstance Win32_Process -Filter "Name=\'opencode.exe\'")) {',
  '  $port = $null',
  "  if ($p.CommandLine -match 'serve') {",
  '    $conn = Get-NetTCPConnection -State Listen -OwningProcess $p.ProcessId -ErrorAction SilentlyContinue | Select-Object -First 1',
  '    if ($conn) { $port = $conn.LocalPort }',
  '  }',
  '  $rows += [pscustomobject]@{ ProcessId = $p.ProcessId; CommandLine = $p.CommandLine; Port = $port }',
  '}',
  '$rows | ConvertTo-Json -Compress',
].join('\n');

export const readProcesses = (): ProcessInfo[] | null => {
  try {
    const output = process.platform === 'win32'
      ? execFileSync(POWERSHELL, ['-NoProfile', '-Command', processScript], { encoding: 'utf8', windowsHide: true })
      : execFileSync('/bin/ps', ['-eo', 'args'], { encoding: 'utf8', windowsHide: true });
    const text = output.trim();
    if (!text) return [];
    const parsed = JSON.parse(text) as Array<{ ProcessId?: number; CommandLine?: string; Port?: number | null }> | { ProcessId?: number; CommandLine?: string; Port?: number | null };
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.map((row) => ({
      processId: Number(row.ProcessId ?? 0),
      commandLine: String(row.CommandLine ?? ''),
      port: row.Port === null || row.Port === undefined ? null : Number(row.Port),
    }));
  } catch {
    return null;
  }
};

export const readSessions = async (port: number): Promise<SessionInfo[] | null> => {
  try {
    const registrationPath = path.join(os.homedir(), '.config', 'opencode', 'service.json');
    if (!fs.existsSync(registrationPath)) return null;
    const registration = JSON.parse(fs.readFileSync(registrationPath, 'utf8')) as { password?: string };
    if (!registration.password) return null;
    const token = Buffer.from(`opencode:${registration.password}`).toString('base64');
    const response = await fetch(`http://127.0.0.1:${port}/api/session`, {
      headers: { Authorization: `Basic ${token}`, 'x-opencode-directory': root },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: unknown };
    const data = Array.isArray(body.data) ? body.data : [];
    return data.map((entry) => {
      const record = entry as {
        id?: string;
        title?: string;
        agent?: string;
        parentID?: string;
        parentId?: string;
        outcome?: string;
        time?: { updated?: number };
      };
      return {
        id: String(record.id ?? ''),
        title: String(record.title ?? ''),
        agent: String(record.agent ?? ''),
        parentId: record.parentID ?? record.parentId ?? null,
        outcome: record.outcome ?? null,
        updatedMs: Number(record.time?.updated ?? 0),
      };
    });
  } catch {
    return null;
  }
};

export const readEvidence = async (
  staleMinutes = DEFAULT_STALE_MINUTES,
  overrides: { processLines?: string[] | null; sessions?: SessionInfo[] | null; remoteAnswers?: Set<string> | null } = {},
): Promise<Evidence> => {
  const processes = readProcesses();
  const processLines = overrides.processLines ?? (processes === null ? null : processes.map((row) => row.commandLine));
  const servicePort = processes?.find((row) => row.port !== null)?.port ?? null;
  const sessions = overrides.sessions ?? (servicePort === null ? null : await readSessions(servicePort));
  const remoteAnswers = overrides.remoteAnswers ?? readRemoteAnswers();
  return { processLines, sessions, staleMinutes, remoteAnswers };
};

const usage = (): void => {
  console.error('usage: node scripts/dev/agent-fleet/watch.ts [--queue <dir>] [--state <file>] [--processes <json>] [--sessions <json>] [--stale-minutes <n>] [--now <iso>] [--dry-run]');
  console.error('the process table and the session heartbeat are the liveness evidence; --processes and --sessions exist for the test and accept JSON arrays.');
};

const main = async (): Promise<void> => {
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
  const sessionsPath = flagValue('--sessions');
  const staleFlag = flagValue('--stale-minutes');
  const staleMinutes = staleFlag ? Number(staleFlag) : DEFAULT_STALE_MINUTES;
  const now = flagValue('--now') ? Date.parse(flagValue('--now') ?? '') : Date.now();
  if (!Number.isFinite(now)) {
    console.error('--now is not a date');
    process.exitCode = 2;
    return;
  }
  const overrides: { processLines?: string[] | null; sessions?: SessionInfo[] | null } = {};
  if (processesPath) overrides.processLines = JSON.parse(readText(processesPath)) as string[];
  if (sessionsPath) overrides.sessions = JSON.parse(readText(sessionsPath)) as SessionInfo[];
  const evidence = await readEvidence(staleMinutes, overrides);
  const result = watch({ queueDir, statePath, evidence, now, dryRun: args.includes('--dry-run') });
  const counts = result.rows.reduce<Record<string, number>>((all, row) => {
    all[row.state] = (all[row.state] ?? 0) + 1;
    return all;
  }, {});
  const summary = Object.entries(counts).map(([state, count]) => `${count} ${state}`).join(', ') || 'no ticket';
  console.log(`loop: ${summary}${result.stateWritten ? ' (state written)' : ''}`);
  if (args.includes('--print')) console.log(renderState(result.rows));
  for (const file of result.released) console.log(`released: ${file}`);
  for (const ticket of result.blocked) console.log(`blocked: ${ticket}`);
  for (const row of result.rows) {
    if (row.subagents > 0) console.log(`subagents: ${row.ticket} dispatched ${row.subagents}`);
  }
  if (!result.processesAvailable) console.log('process table unreadable: no marker was released');
  if (!result.sessionsAvailable) console.log('session list unreadable: the process table carried the check');
};

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) void main();
