// @last-edited: 2026-11-27 UTC+7.
// @title: message - labelled, whitelisted, idempotent review messages between lanes.
// @state: built from the direct review loop plan; the label and whitelist are pinned by tests.
// @dependencies: node:test, node:assert, docs/agent-roles/keys.json, scripts/dev/agent-fleet/watch.ts.
// decisions.json -> docs-agent-roles-16, docs-agent-org-spec-01 A lane message is a notification and a pointer, never the source of truth.
// The visible label keeps a report from being mistaken for the owner speaking.

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

export function messageIdOf(input: MessageInput): string {
  return `msg_${input.ticket}:${input.round}:${input.kind}`;
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

export type SendDeps = {
  cli: string;
  sessions: SessionInfo[];
  processLines?: string[];
  roster: MessageRoster;
  readBack?: (id: string, sessionId: string) => Promise<'message' | 'inbox' | null>;
  run: (args: string[]) => Promise<string>;
};

const delivered = new Set<string>();

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

export async function sendMessage(input: MessageInput, deps: SendDeps): Promise<{ id: string; sessionId: string; alreadyDelivered: boolean; receipt?: 'message' | 'inbox' }> {
  assertAllowed(input, deps.roster);
  const id = messageIdOf(input);
  if (delivered.has(id)) return { id, sessionId: '', alreadyDelivered: true };
  const prefix = input.to === 'operator' ? 'slot-console' : `/${input.to}-`;
  const sessionId = resolveSessionId(prefix, deps.sessions, Date.now(), 30 * 60_000, deps.processLines ?? []);
  if (!sessionId) throw new Error('TARGET_SESSION_MISSING');
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
  const receipt = deps.readBack ? await deps.readBack(id, sessionId) : null;
  if (!receipt) throw new Error('DELIVERY_UNVERIFIED');
  delivered.add(id);
  return { id, sessionId, alreadyDelivered: false, receipt };
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
  const input = parseArgs(process.argv.slice(2));
  const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8')) as MessageRoster;
  assertAllowed(input, roster);
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
  const result = await sendMessage(input, {
    cli,
    roster,
    sessions: evidence.sessions ?? [],
    processLines: evidence.processLines ?? [],
    readBack: async (id, sessionId) => {
      const encoded = encodeURIComponent(id);
      const posted = readJson([cli, 'api', 'get', `/api/session/${sessionId}/message/${encoded}`]);
      const asData = posted['data'] as { id?: unknown } | undefined;
      if (asData?.id === id) return 'message';
      const inbox = readJson([cli, 'api', 'get', `/api/session/${sessionId}/inbox`]);
      const items = inbox['data'] as Array<{ id?: unknown }> | undefined;
      return Array.isArray(items) && items.some((item) => item.id === id) ? 'inbox' : null;
    },
    run: async (args) => {
      const child = spawnSync(args[0] ?? cli, args.slice(1), { encoding: 'utf8' });
      if (child.status !== 0) throw new Error(child.stderr || child.stdout || 'OPENCODE_API_FAILED');
      return child.stdout ?? '';
    },
  });
  console.log(`${result.id} ${result.alreadyDelivered ? 'already-delivered' : `sent:${result.receipt}`} ${result.sessionId}`);
}
