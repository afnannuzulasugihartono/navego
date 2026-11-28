// @last-edited: 2026-11-28 UTC+7.
// @title: executor - closes only the work that already has an answer, and defers every action that needs judgment or an owner.
// @state: deterministic handlers for close-ticket; every other selected action is returned as deferred with a reason; no receipt claims money moved.
// @dependencies: node:fs, node:path, node:url, ./goal.ts, strict.

// The selector decides what is next. This is the part that can run without a model: the work whose finish is already written in a file.
// MetaGPT's finding applies here: an SOP is only an SOP when the handoff is verified between steps, not trusted to the same session that claimed it.
// https://arxiv.org/abs/2308.00352

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMissionState, selectNextAction, type MissionState, type NextAction } from './goal.ts';
import { growthTicket, type GrowthInput } from './growth.ts';

export interface ExecutorPaths {
  queueDir: string;
  proofDir: string;
  now?: number;
  growthState?: GrowthInput;
  findingsDir?: string;
}

export interface ExecutionResult extends NextAction {
  executed: boolean;
  deferred: boolean;
  reason: string;
  receipt?: string;
  routed?: string;
  growthTicket?: string | undefined;
}

interface AnsweredTicket {
  ticket: string;
  reply: string;
}

// Only a reply file that names this exact ticket can close it; a queue entry that merely exists is not evidence.

const findAnsweredTicket = (queueDir: string, proofDir: string): AnsweredTicket | null => {
  const answers = new Map<string, string>();
  const tickets: string[] = [];
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(queueDir);
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    let text = '';
    try {
      text = fs.readFileSync(path.join(queueDir, entry), 'utf8');
    } catch {
      continue;
    }
    const match = text.match(/^answered:\s*(\S+)/m);
    if (match?.[1]) answers.set(match[1], entry);
    if (/^operator-to-.*\.md$/.test(entry) && !entry.includes('-reply-')) tickets.push(entry);
  }
  const receipts = fs.existsSync(proofDir) ? fs.readdirSync(proofDir) : [];
  const closed = tickets.filter((ticket) => answers.has(ticket)
    && !receipts.some((name) => name.endsWith(`-executor-close-${ticket.replace(/\.md$/, '')}.md`)))
    .sort((left, right) => left.localeCompare(right));
  if (!closed[0]) return null;
  return { ticket: closed[0], reply: String(answers.get(closed[0])) };
};

const writeReceipt = (paths: ExecutorPaths, found: AnsweredTicket, chosen: NextAction): string => {
  const now = paths.now ?? Date.now();
  const date = new Date(now).toISOString().slice(0, 10);
  const name = `${date}-executor-close-${found.ticket.replace(/\.md$/, '')}.md`;
  const target = path.join(paths.proofDir, name);
  const body = [
    '# Ticket closed by the fleet executor',
    '',
    `closed: ${found.ticket}`,
    `answered-by: ${found.reply}`,
    `closed-at: ${new Date(now).toISOString()}`,
    `signal: ${chosen.signal}`,
    `exit: ${chosen.exit}`,
    '',
    'The reply file above names this ticket. The executor performed no capture, no external message and no deployment.'
  ].join('\n') + '\n';
  fs.writeFileSync(target, body);
  return target;
};

// A deferred action still needs an owner of the work.
// Writing that ticket is deterministic, so a person never has to decide which lane receives it.

const ROUTES: Record<string, { lane: string; kind: string }> = {
  'answer-buyer': { lane: 'sales-rep', kind: 'money' },
  'close-revenue-path': { lane: 'engineer', kind: 'money' },
  'unblock-lane': { lane: 'operator', kind: 'measurement' },
  'fix-claim-drift': { lane: 'engineer', kind: 'measurement' },
  'one-customer-visible-defect': { lane: 'engineer', kind: 'product' }
};

// One ticket per action per day keeps the loop idempotent when the hourly automation fires again before the lane has picked the work up.

const writeRoute = (chosen: NextAction, paths: ExecutorPaths, reason: string): string => {
  const route = ROUTES[chosen.action];
  if (!route) return '';
  const now = paths.now ?? Date.now();
  const date = new Date(now).toISOString().slice(0, 10);
  const name = `${date}-auto-route-${chosen.action}.md`;
  const target = path.join(paths.queueDir, name);
  if (!fs.existsSync(target)) {
    const body = [
      '# Action routed by the fleet executor',
      '',
      `auto-routed: ${chosen.action}`,
      `lane: ${route.lane}`,
      `class: ${route.kind}`,
      `signal: ${chosen.signal}`,
      `reason: ${reason}`,
      `scopeRequested: ${chosen.exit}`,
      `stop: ${chosen.exit}`,
      '',
      'No secret, cash request or owner-only path is part of this ticket. The dispatcher may open the lane session without a human choosing it.'
    ].join('\n') + '\n';
    fs.writeFileSync(target, body);
  }
  return target;
};

// When no stranger has paid, the metric gap itself is the question.
// Writing this ticket is deterministic, so nobody has to tell the operator what to investigate.

const ensureGrowthTicket = (paths: ExecutorPaths): string | undefined => {
  if (!paths.growthState || !paths.findingsDir || paths.growthState.settledUsd > 0) return undefined;
  const now = paths.now ?? Date.now();
  const date = new Date(now).toISOString().slice(0, 10);
  const name = `operator-to-researcher-${date}-growth.md`;
  const target = path.join(paths.queueDir, name);
  if (fs.existsSync(target)) return target;
  const researchQueued = fs.readdirSync(paths.queueDir).some((entry) =>
    /^operator-to-researcher-.*\.md$/.test(entry) && !entry.includes('-reply-'));
  if (researchQueued) return undefined;
  let max = 23;
  try {
    const index = fs.readFileSync(path.join(paths.findingsDir, 'index.md'), 'utf8');
    for (const match of index.matchAll(/RF-(\d{3})/g)) max = Math.max(max, Number(match[1]));
  } catch {
  }
  const next = `RF-${String(max + 1).padStart(3, '0')}`;
  const tomorrow = new Date(now + 86_400_000).toISOString().slice(0, 10);
  const text = growthTicket(paths.growthState, {
    date: tomorrow,
    resultPath: `${next}-${date}-self-formed.md`,
    sourceUrl: 'https://baymard.com/research/checkout-usability'
  });
  fs.writeFileSync(target, text);
  return target;
};

export function executeNext(chosen: NextAction, paths: ExecutorPaths): ExecutionResult {
  const growth = ensureGrowthTicket(paths);
  if (chosen.action === 'close-ticket') {
    const found = findAnsweredTicket(paths.queueDir, paths.proofDir);
    if (!found) {
      return { ...chosen, executed: false, deferred: true, reason: 'no answered ticket exists to close', growthTicket: growth };
    }
    const receipt = writeReceipt(paths, found, chosen);
    return { ...chosen, executed: true, deferred: false, reason: `closed ${found.ticket} from ${found.reply}`, receipt, growthTicket: growth };
  }
  const reasons: Record<string, string> = {
    'answer-buyer': 'an external answer needs the one public action of the day and an owner-owned identity',
    'close-revenue-path': 'closing a revenue path needs a model to write and verify a bounded change',
    'unblock-lane': 'unblocking a lane needs a judgment about why it stopped',
    'fix-claim-drift': 'a claim drift needs evidence read by a model before it is corrected',
    'one-customer-visible-defect': 'shipping a customer-visible defect needs a test, code and a live verification'
  };
  const reason = reasons[chosen.action] ?? 'no deterministic handler for this action';
  return {
    ...chosen,
    executed: false,
    deferred: true,
    reason,
    routed: writeRoute(chosen, paths, reason),
    growthTicket: growth
  };
}

const invokedDirectly = process.argv[1] ? import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href : false;

if (invokedDirectly) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const queueDir = path.join(root, 'docs/agent-roles/queue');
  const proofDir = path.join(root, 'docs/proof');
  const state: MissionState = readMissionState(path.join(root, 'docs/economy.json'), queueDir);
  const chosen = selectNextAction(state);
  const result = executeNext(chosen, {
    queueDir,
    proofDir,
    findingsDir: path.join(root, 'agents/shared/findings'),
    growthState: {
      settledUsd: state.settledUsd,
      daysSinceSettlement: state.daysSinceSettlement,
      pricingBrowsers: 0,
      strangerBuyClicks: 0
    }
  });
  console.log(JSON.stringify({ state, ...result }, null, 2));
  process.exitCode = result.deferred ? 3 : 0;
}
