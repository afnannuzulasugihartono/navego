// @last-edited: 2026-11-28 UTC+7.
// @title: outcome register - the machine-readable mirror of money, buyer replies, receipts and answered tickets.
// @state: one stable JSON shape derived from artefacts the fleet already writes; prose proof stays the human explanation.
// @dependencies: node:fs, node:path, node:url, strict.

// A selector that parses prose will eventually read a README example as a waiting buyer. This register gives it one deterministic shape instead.
// https://github.com/open-telemetry/semantic-conventions-genai makes the same point for agent spans and metrics at a larger scale.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const OUTCOME_SCHEMA = 'navego-outcomes-v1';

export interface OutcomeRegister {
  schema: string;
  settled_usd: number;
  settled_orders: number;
  buyer_replies_waiting: number;
  receipts_verified: number;
  answered_tickets: number;
  updated_at: string;
}

export interface OutcomePaths {
  economyPath: string;
  queueDir: string;
  repliesDir: string;
  proofDir: string;
  now?: number;
}

const entriesIn = (dir: string): string[] => {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
};

const readText = (file: string): string => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
};

const count = (items: string[], predicate: (item: string) => boolean): number => items.filter(predicate).length;

export function buildOutcomeRegister(paths: OutcomePaths): OutcomeRegister {
  const economy = JSON.parse(readText(paths.economyPath) || '{}') as {
    revenue?: { settled_usd?: number; settled_orders?: number };
  };
  const replies = entriesIn(paths.repliesDir).filter((name) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(name));
  const queue = entriesIn(paths.queueDir);
  const proof = entriesIn(paths.proofDir);
  const now = paths.now ?? Date.now();
  return {
    schema: OUTCOME_SCHEMA,
    settled_usd: Number(economy.revenue?.settled_usd ?? 0),
    settled_orders: Number(economy.revenue?.settled_orders ?? 0),
    buyer_replies_waiting: count(replies, (name) => /^answered:\s*no\s*$/im.test(readText(path.join(paths.repliesDir, name)))),
    receipts_verified: count(proof, (name) => /^\d{4}-\d{2}-\d{2}-executor-close-.*\.md$/.test(name)),
    answered_tickets: count(queue, (name) => /^answered:\s*\S+/m.test(readText(path.join(paths.queueDir, name)))),
    updated_at: new Date(now).toISOString()
  };
}

const invokedDirectly = process.argv[1] ? import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href : false;

if (invokedDirectly) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const register = buildOutcomeRegister({
    economyPath: path.join(root, 'docs/economy.json'),
    queueDir: path.join(root, 'docs/agent-roles/queue'),
    repliesDir: path.join(root, 'docs/proof/outreach/replies'),
    proofDir: path.join(root, 'docs/proof')
  });
  const target = path.join(root, 'docs/agent-roles/loop/outcomes.json');
  fs.writeFileSync(target, JSON.stringify(register, null, 2) + '\n');
  console.log(JSON.stringify({ target, ...register }, null, 2));
}
