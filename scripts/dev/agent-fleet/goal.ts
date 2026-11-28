// @last-edited: 2026-11-28 UTC+7.
// @title: agent-fleet goal - the operator's next action, chosen from state instead of from an instruction.
// @state: the selection order is money first, then the queue, then the lanes, then one customer-visible defect; every action carries an exit condition.
// @dependencies: node:fs, node:path, node:url, strict.

// The mission is long and the agent's reliable horizon is short, so the mission is cut into steps that each finish in one run and can be checked.
// METR measures the length of tasks a model completes reliably; a mission that cannot be cut into one-run steps is what fails.
// https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface MissionState {
  settledUsd: number;
  daysSinceSettlement: number;
  buyerRepliesWaiting: number;
  openTickets: number;
  blockedLanes: number;
  claimDrift: number;
}

export interface NextAction {
  action: string;
  signal: string;
  reason: string;
  exit: string;
}

export function selectNextAction(state: MissionState): NextAction {
  if (state.buyerRepliesWaiting > 0) {
    return {
      action: 'answer-buyer',
      signal: 'buyer-reply-waiting',
      reason: 'a buyer is waiting; attention decays and the answer is the shortest path to money',
      exit: 'the reply is recorded in docs/proof/outreach/ and the ticket is answered'
    };
  }
  if (state.settledUsd === 0 && state.daysSinceSettlement >= 7) {
    return {
      action: 'close-revenue-path',
      signal: 'no-settlement-7d',
      reason: 'no external money has settled for a week, so the revenue path itself is the work',
      exit: 'one bounded step toward a settled stranger payment is shipped and proved live'
    };
  }
  if (state.openTickets > 0) {
    return {
      action: 'close-ticket',
      signal: 'open-ticket',
      reason: 'an open ticket already carries evidence and a defined finish',
      exit: 'the ticket has a reply artifact, a proof and a closed line on the board'
    };
  }
  if (state.blockedLanes > 0) {
    return {
      action: 'unblock-lane',
      signal: 'blocked-lane',
      reason: 'a lane that cannot run is worth more than new work',
      exit: 'the lane starts on its own ticket and the fix is proved by a live run'
    };
  }
  if (state.claimDrift > 0) {
    return {
      action: 'fix-claim-drift',
      signal: 'claim-drift',
      reason: 'a claim that outruns its evidence costs trust faster than a missing feature',
      exit: 'the claim matches a proof file again and a test pins it'
    };
  }
  return {
    action: 'one-customer-visible-defect',
    signal: 'default',
    reason: 'nothing is pending, so the next unit of value is one defect a customer would feel',
    exit: 'one runtime change and its test ship and the live behaviour is re-read'
  };
}

export function countOpenTickets(queueDir: string): number {
  const answered = new Set<string>();
  let tickets: string[] = [];
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(queueDir);
  } catch {
    return 0;
  }
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(queueDir, entry), 'utf8');
    const reply = text.match(/^answered:\s*(\S+)/m);
    if (reply?.[1]) answered.add(reply[1]);
    if (/^operator-to-.*\.md$/.test(entry) && !entry.includes('-reply-')) tickets.push(entry);
  }
  const blockedDir = path.join(queueDir, 'blocked');
  try {
    for (const entry of fs.readdirSync(blockedDir)) {
      if (/^operator-to-.*\.md$/.test(entry) && !entry.includes('.blocked.md')) tickets = tickets.filter((name) => name !== entry);
    }
  } catch {
  }
  return tickets.filter((name) => !answered.has(name)).length;
}

interface EconomyShape {
  revenue?: { settled_usd?: number; last_settled_at?: string | null };
  mission?: { started_at?: string };
}

export interface MissionSources {
  now?: number;
  statePath?: string;
  repliesDir?: string;
  outcomesPath?: string;
}

const DAY_MS = 86_400_000;

// A signal nobody maintains is a signal nobody can trust.
// Each of these is read from an artefact the fleet already writes; none is typed by the operator each run.

const daysSince = (iso: string | null | undefined, now: number): number => {
  if (!iso) return 0;
  const stamp = Date.parse(iso);
  if (!Number.isFinite(stamp)) return 0;
  return Math.max(0, Math.floor((now - stamp) / DAY_MS));
};

const countBlocked = (statePath: string): number => {
  try {
    return fs.readFileSync(statePath, 'utf8').split(/\r?\n/)
      .filter((line) => /\|\s*blocked\s*\|/.test(line)).length;
  } catch {
    return 0;
  }
};

// The reply register's README documents the format with `answered: no | yes`; a documentation example is not a buyer waiting for an answer.

const countUnanswered = (dir: string): number => {
  try {
    return fs.readdirSync(dir).filter((name) => {
      if (!/^\d{4}-\d{2}-\d{2}-.+\.md$/.test(name)) return false;
      try {
        return /^answered:\s*no\s*$/im.test(fs.readFileSync(path.join(dir, name), 'utf8'));
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
};

const countDrift = (queueDir: string): number => {
  try {
    return fs.readdirSync(queueDir).filter((name) => {
      if (!/^claim-drift-.*\.md$/.test(name)) return false;
      try {
        return !/^answered:/m.test(fs.readFileSync(path.join(queueDir, name), 'utf8'));
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
};

// The register is a mirror with one schema, not a second truth; if it is missing or malformed the selector falls back to reading the artefacts directly.

const readOutcomeRegister = (file?: string): { settled_usd: number; buyer_replies_waiting: number } | null => {
  if (!file) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      schema?: string; settled_usd?: number; buyer_replies_waiting?: number;
    };
    if (parsed.schema !== 'navego-outcomes-v1') return null;
    if (!Number.isFinite(parsed.settled_usd) || !Number.isFinite(parsed.buyer_replies_waiting)) return null;
    return { settled_usd: Number(parsed.settled_usd), buyer_replies_waiting: Number(parsed.buyer_replies_waiting) };
  } catch {
    return null;
  }
};

export const readMissionState = (economyPath: string, queueDir: string, sources: MissionSources = {}): MissionState => {
  let economy: EconomyShape = {};
  try {
    economy = JSON.parse(fs.readFileSync(economyPath, 'utf8')) as EconomyShape;
  } catch {
  }
  const rolesDir = path.dirname(queueDir);
  const statePath = sources.statePath ?? path.join(rolesDir, 'loop', 'state.md');
  const repliesDir = sources.repliesDir ?? path.join(path.dirname(rolesDir), 'proof', 'outreach', 'replies');
  const now = sources.now ?? Date.now();
  const lastSettled = economy.revenue?.last_settled_at;
  const register = readOutcomeRegister(sources.outcomesPath);
  return {
    settledUsd: register?.settled_usd ?? economy.revenue?.settled_usd ?? 0,
    daysSinceSettlement: daysSince(lastSettled, now) || (lastSettled ? 0 : daysSince(economy.mission?.started_at, now)),
    buyerRepliesWaiting: register?.buyer_replies_waiting ?? countUnanswered(repliesDir),
    openTickets: countOpenTickets(queueDir),
    blockedLanes: countBlocked(statePath),
    claimDrift: countDrift(queueDir)
  };
};

const invokedDirectly = process.argv[1] ? import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href : false;

if (invokedDirectly) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const queueDir = path.join(root, 'docs/agent-roles/queue');
  const sources = {
    ledger: path.join(root, 'docs/economy.json'),
    queue: queueDir,
    fleetState: path.join(root, 'docs/agent-roles/loop/state.md'),
    replies: path.join(root, 'docs/proof/outreach/replies'),
    outcomes: path.join(root, 'docs/agent-roles/loop/outcomes.json')
  };
  const state = readMissionState(sources.ledger, queueDir, { statePath: sources.fleetState, repliesDir: sources.replies, outcomesPath: sources.outcomes });
  const chosen = selectNextAction(state);
  console.log(JSON.stringify({ state, sources, ...chosen }, null, 2));
}
