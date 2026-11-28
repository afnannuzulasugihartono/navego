// @last-edited: 2026-11-28 UTC+7.
// @title: message - labelled, whitelisted, delivery-verified review messages between lanes.
// @state: the label and whitelist are pinned by tests; a receipt is printed only after the service holds the message.
// @dependencies: node:test, node:assert, docs/agent-roles/keys.json, scripts/dev/agent-fleet/watch.ts.
// decisions.json -> docs-agent-roles-16, docs-agent-org-spec-01, scripts-message-01 A lane message is a notification and a pointer, never the source of truth.
// The visible label keeps a report from being mistaken for the owner speaking.
// The receipt is a delivery, not an acknowledgement: the service has to hold the message before the CLI says sent.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readEvidence } from './watch.ts';
import { opencodeCandidates } from './dispatch.ts';

const rosterPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/agent-roles/keys.json');

export type MessageKind = 'report' | 'review' | 'approve';
export type LaneId = 'operator' | 'engineer' | 'sales-rep' | 'onboarding-guide';

export interface MessageInput {
  kind: MessageKind;
  from: LaneId;
  to: LaneId;
  ticket: string;
  round: number;
  text: string;
}

export interface MessageRoster {
  operatorSessionTitle?: string;
  messagePairs?: Array<{ from: string; to: string; kinds: string[] }>;
}

export function labelOf(input: MessageInput): string {
  const tail = ` ticket=${input.ticket} round=${input.round}`;
  if (input.kind === 'report') return `[LANE-REPORT ${input.from}]${tail}`;
  if (input.kind === 'review') return `[LANE-REVIEW ${input.from} -> ${input.to}]${tail}`;
  return `[LANE-APPROVAL ${input.from} -> ${input.to}]${tail}`;
}

export function messageIdOf(input: MessageInput, attempt = 1): string {
  const base = `msg_${input.ticket}:${input.round}:${input.kind}`;
  return attempt === 1 ? base : `${base}:r${attempt}`;
}

export function assertAllowed(input: MessageInput, roster: MessageRoster): void {
  if (!Number.isInteger(input.round) || input.round < 1 || input.round > 3) {
    throw new Error('ROUND_LIMIT_REACHED');
  }
  const pairs = roster.messagePairs ?? [];
  const allowed = pairs.some((pair) => pair.from === input.from
    && pair.to === input.to
    && pair.kinds.includes(input.kind));
  if (!allowed) throw new Error('NOT_ALLOWED');
}

export type SessionInfo = {
  id: string;
  title: string;
  agent: string;
  parentId: string | null;
  outcome: string | null;
  updatedMs: number;
};

// The service holds a lane message in one of three places, and the receipt may only claim the third.

export type DeliveryState = 'absent' | 'queued' | 'delivered';

export type SendDeps = {
  cli: string;
  sessions: SessionInfo[];
  processLines?: string[];
  roster: MessageRoster;
  readBack?: (id: string, sessionId: string) => Promise<'message' | 'inbox' | null>;
  cancelQueued?: (baseId: string, sessionId: string) => Promise<string[]>;
  wake?: (sessionId: string) => Promise<void>;
  isBusy?: (sessionId: string) => Promise<boolean>;
  run: (args: string[]) => Promise<string>;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  waitMs?: number;
  pollMs?: number;
  attempts?: number;
};

export const DEFAULT_WAIT_MS = 60_000;
export const DEFAULT_POLL_MS = 2_000;
export const DEFAULT_ATTEMPTS = 2;

export type SendResult = {
  id: string;
  sessionId: string;
  alreadyDelivered: boolean;
  receipt: 'message';
  state: DeliveryState;
  waitedMs: number;
  ids: string[];
};

// The console session belongs to the running OpenCode service, whose process line carries no session title; keep it addressable while that service exists, but never let it rescue a lane worker.

export function resolveSessionId(titlePrefix: string, sessions: SessionInfo[], now = Date.now(), staleMs = 30 * 60_000, processLines: string[] = []): string | null {
  // Liveness is a fresh heartbeat, or a running process for a session that has not reported an outcome yet.
  // An old heartbeat alone is never enough, and an outcome alone is not death while the heartbeat is still fresh.
  const live = sessions.filter((session) => {
    if (!session.title.includes(titlePrefix)) return false;
    if (titlePrefix === 'slot-console' && processLines.some((line) => line.includes('serve --service'))) return true;
    if (now - session.updatedMs <= staleMs) return true;
    return !session.outcome && processLines.some((line) => line.includes(session.title));
  });
  if (live.length === 0) return null;
  const first = live[0];
  if (!first) return null;
  return live.reduce((best, next) => (next.updatedMs > best.updatedMs ? next : best), first).id;
}

const postMessage = async (id: string, sessionId: string, input: MessageInput, deps: SendDeps): Promise<void> => {
  const endpoint = input.kind === 'report' ? '/synthetic' : '/prompt';
  const body = {
    id,
    text: `${labelOf(input)}\n${input.text}`,
    description: `${input.from} -> ${input.to}`,
    delivery: 'queue',
    resume: true,
    metadata: { fromAgent: input.from, toAgent: input.to, ticket: input.ticket, round: input.round, kind: input.kind },
  };
  await deps.run([deps.cli, 'api', 'post', `/api/session/${sessionId}${endpoint}`, '--data', JSON.stringify(body)]);
};

// The receipt is earned by the service, not by the post: the message is read back for a bounded window and the window, the ids and the target's busy state are named when it gives up.

export async function sendMessage(input: MessageInput, deps: SendDeps, startAttempt = 1): Promise<SendResult> {
  assertAllowed(input, deps.roster);
  const readBack = deps.readBack;
  if (!readBack) throw new Error('DELIVERY_UNVERIFIED');
  const prefix = input.to === 'operator' ? 'slot-console' : `/${input.to}-`;
  const sessionId = resolveSessionId(prefix, deps.sessions, Date.now(), 30 * 60_000, deps.processLines ?? []);
  if (!sessionId) throw new Error('TARGET_SESSION_MISSING');
  const now = deps.now ?? (() => Date.now());
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); }));
  const waitMs = deps.waitMs ?? DEFAULT_WAIT_MS;
  const pollMs = deps.pollMs ?? DEFAULT_POLL_MS;
  const identities = Math.max(1, deps.attempts ?? DEFAULT_ATTEMPTS);
  const baseId = messageIdOf(input);
  const tried: string[] = [];
  let busyAnswer: Promise<boolean> | null = null;
  const targetBusy = (): Promise<boolean> => {
    busyAnswer ??= Promise.resolve(deps.isBusy ? deps.isBusy(sessionId) : false);
    return busyAnswer;
  };

  for (let attempt = startAttempt; attempt < startAttempt + identities; attempt += 1) {
    const id = messageIdOf(input, attempt);
    if (attempt > 1 && deps.cancelQueued) await deps.cancelQueued(baseId, sessionId);
    tried.push(id);
    const startedAt = now();
    const deadline = startedAt + waitMs;
    let state: 'message' | 'inbox' | null = await readBack(id, sessionId);
    let posted = false;
    if (state === null) {
      await postMessage(id, sessionId, input, deps);
      posted = true;
      state = await readBack(id, sessionId);
    }
    let woke = false;
    while (state !== 'message') {
      if (state === 'inbox') {
        const busy = await targetBusy();
        if (!busy && !woke && deps.wake) {
          await deps.wake(sessionId);
          woke = true;
        }
      }
      if (now() >= deadline) break;
      await sleep(pollMs);
      state = await readBack(id, sessionId);
    }
    if (state === 'message') {
      return {
        id,
        sessionId,
        alreadyDelivered: !posted,
        receipt: 'message',
        state: 'delivered',
        waitedMs: now() - startedAt,
        ids: tried,
      };
    }
    if (state === 'inbox') {
      const busy = await targetBusy();
      throw new Error(`DELIVERY_QUEUED waited ${waitMs}ms: ${id} is queued in ${sessionId} (target busy: ${busy ? 'yes' : 'no'})`);
    }
  }
  const busy = await targetBusy();
  throw new Error(`DELIVERY_UNVERIFIED waited ${waitMs}ms: ${tried.join(', ')} absent from ${sessionId} (target busy: ${busy ? 'yes' : 'no'})`);
}

export function parseArgs(argv: string[]): MessageInput {
  const flag = (name: string): string | undefined => {
    const at = argv.indexOf(name);
    return at >= 0 ? argv[at + 1] : undefined;
  };
  const kind = flag('--kind') as MessageKind | undefined;
  const from = flag('--from') as LaneId | undefined;
  const to = flag('--to') as LaneId | undefined;
  const ticket = flag('--ticket');
  const round = flag('--round');
  const text = flag('--text');
  if (!kind || !from || !to || !ticket || !round || !text) throw new Error('USAGE');
  return { kind, from, to, ticket, round: Number(round), text };
}

const invokedDirectly = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (invokedDirectly) {
  const flagValue = (name: string): string | undefined => {
    const at = process.argv.indexOf(name);
    return at >= 0 ? process.argv[at + 1] : undefined;
  };
  const numberFlag = (name: string, fallback: number): number => {
    const value = Number(flagValue(name));
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
  };
  try {
    const input = parseArgs(process.argv.slice(2));
    const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8')) as MessageRoster;
    const evidence = await readEvidence();
    const cli = opencodeCandidates().find((candidate) => fs.existsSync(candidate)) ?? 'opencode';
    const readJson = (args: string[]): Record<string, unknown> => {
      const child = spawnSync(args[0] ?? cli, args.slice(1), { encoding: 'utf8' });
      try {
        return JSON.parse(child.stdout ?? '{}') as Record<string, unknown>;
      } catch {
        return {};
      }
    };
    const run = async (args: string[]): Promise<string> => {
      const child = spawnSync(args[0] ?? cli, args.slice(1), { encoding: 'utf8' });
      if (child.status !== 0) throw new Error(child.stderr || child.stdout || 'OPENCODE_API_FAILED');
      return child.stdout ?? '';
    };
    const result = await sendMessage(input, {
      cli,
      roster,
      sessions: evidence.sessions ?? [],
      processLines: evidence.processLines ?? [],
      readBack: async (id, targetSessionId) => {
        const encoded = encodeURIComponent(id);
        const posted = readJson([cli, 'api', 'get', `/api/session/${targetSessionId}/message/${encoded}`]);
        const asData = posted['data'] as { id?: unknown } | undefined;
        if (asData?.id === id) return 'message';
        const inbox = readJson([cli, 'api', 'get', `/api/session/${targetSessionId}/inbox`]);
        const items = inbox['data'] as Array<{ id?: unknown }> | undefined;
        return Array.isArray(items) && items.some((item) => item.id === id) ? 'inbox' : null;
      },
      cancelQueued: async (baseId, targetSessionId) => {
        const inbox = readJson([cli, 'api', 'get', `/api/session/${targetSessionId}/inbox`]);
        const items = inbox['data'] as Array<{ id?: unknown }> | undefined;
        const stale = (items ?? []).filter((item) => typeof item.id === 'string'
          && (item.id === baseId || item.id.startsWith(`${baseId}:r`)));
        for (const item of stale) {
          readJson([cli, 'api', 'delete', `/api/session/${targetSessionId}/inbox/${encodeURIComponent(String(item.id))}`]);
        }
        return stale.map((item) => String(item.id));
      },
      wake: async (targetSessionId) => {
        const wakeBody = {
          id: `msg_wake-${Date.now()}`,
          text: '[WAKE] Read your inbox and continue the loop.',
          description: 'operator wake',
          delivery: 'steer',
          resume: true,
          metadata: { fromAgent: 'operator', kind: 'wake' },
        };
        await run([cli, 'api', 'post', `/api/session/${targetSessionId}/prompt`, '--data', JSON.stringify(wakeBody)]);
      },
      isBusy: async (targetSessionId) => {
        const record = readJson([cli, 'api', 'get', `/api/session/${targetSessionId}`]);
        const data = record['data'] as { time?: { busy?: number; idle?: number } } | undefined;
        const busy = Number(data?.time?.busy ?? 0);
        const idle = Number(data?.time?.idle ?? 0);
        return busy > 0 && busy > idle;
      },
      run,
      waitMs: numberFlag('--wait-ms', DEFAULT_WAIT_MS),
      pollMs: numberFlag('--poll-ms', DEFAULT_POLL_MS),
      attempts: numberFlag('--attempts', DEFAULT_ATTEMPTS),
    }, Math.max(1, numberFlag('--attempt', 1)));
    console.log(`${result.id} ${result.alreadyDelivered ? 'already-delivered' : `sent:${result.receipt}`} ${result.sessionId} waited=${result.waitedMs}ms`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
