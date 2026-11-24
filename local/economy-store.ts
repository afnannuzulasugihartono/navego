// @last-edited: 2026-11-24 UTC+7.
// @title: economy-store - the append-only money ledger and the knowledge library the loop reads.
// @state: where both live, how an event is appended, how a knowledge note is written and read.
// @dependencies: node:fs, node:path, node:os, ./economy-core.js.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { normalizeEvent, type EconomyEvent } from './economy-core.js';

// The ledger and the knowledge library live in the repository, so the record that justifies a decision travels with the code.
// A machine with no repository keeps them in its own home folder instead.

const LEDGER_FILE = 'ledger.jsonl';
const KNOWLEDGE_DIR = 'knowledge';
const SUBSCRIPTION_FILE = 'subscription.json';

export interface KnowledgeNote {
  id: string;
  title: string;
  kind: string;
  source: string;
  observed: string;
  body: string;
  file: string;
}

export function economyDir(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): string {
  const override = String(env.NAVEGO_ECONOMY_DIR ?? '').trim();
  if (override) return path.resolve(override);
  let current = path.resolve(cwd);
  for (;;) {
    const candidate = path.join(current, 'docs', 'economy');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.join(os.homedir(), '.navego', 'economy');
}

function ledgerFile(dir: string): string {
  return path.join(dir, LEDGER_FILE);
}

function knowledgeDir(dir: string): string {
  return path.join(dir, KNOWLEDGE_DIR);
}

// A corrupt line is skipped, not fatal: one damaged row must not hide every other row.

export function readEvents(dir: string): EconomyEvent[] {
  const file = ledgerFile(dir);
  if (!fs.existsSync(file)) return [];
  const events: EconomyEvent[] = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(normalizeEvent(JSON.parse(line)));
    } catch {
      continue;
    }
  }
  return events;
}

export function appendEvent(dir: string, event: EconomyEvent): EconomyEvent {
  const normalized = normalizeEvent(event);
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(ledgerFile(dir), `${JSON.stringify(normalized)}\n`, 'utf8');
  return normalized;
}

function frontmatterOf(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  const lines = body.split('\n');
  if (lines[0]?.trim() !== '---') return fields;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (line.trim() === '---') break;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key) fields.set(key, value);
  }
  return fields;
}

// The note text is the part after the frontmatter, so a reader sees the claim before the metadata.

export function readKnowledge(dir: string): KnowledgeNote[] {
  const folder = knowledgeDir(dir);
  if (!fs.existsSync(folder)) return [];
  const notes: KnowledgeNote[] = [];
  for (const name of fs.readdirSync(folder).sort()) {
    if (!name.endsWith('.md')) continue;
    const file = path.join(folder, name);
    const body = fs.readFileSync(file, 'utf8');
    const fields = frontmatterOf(body);
    const marker = body.indexOf('\n---', 3);
    const text = marker >= 0 ? body.slice(marker + 4).trim() : body.trim();
    notes.push({
      id: fields.get('id') ?? name.replace(/\.md$/, ''),
      title: fields.get('title') ?? name.replace(/\.md$/, ''),
      kind: fields.get('kind') ?? 'note',
      source: fields.get('source') ?? '',
      observed: fields.get('observed') ?? '',
      body: text,
      file: path.join(KNOWLEDGE_DIR, name)
    });
  }
  return notes;
}

export function writeKnowledge(dir: string, note: {
  id: string;
  title: string;
  kind: string;
  source: string;
  observed: string;
  body: string;
}): KnowledgeNote {
  const folder = knowledgeDir(dir);
  fs.mkdirSync(folder, { recursive: true });
  const file = path.join(folder, `${note.id}.md`);
  const text = [
    '---',
    `id: ${note.id}`,
    `title: ${note.title}`,
    `kind: ${note.kind}`,
    `source: ${note.source}`,
    `observed: ${note.observed}`,
    '---',
    '',
    note.body.trim(),
    ''
  ].join('\n');
  fs.writeFileSync(file, text, 'utf8');
  return { ...note, body: note.body.trim(), file: path.join(KNOWLEDGE_DIR, `${note.id}.md`) };
}

export interface SubscriptionState {
  provider: string;
  plan: string;
  currency: string;
  monthlyMinor: number;
  capabilityScore: number;
  capacityUnits: number;
  source: string;
  renewedAt: string;
}

export function readSubscription(dir: string): SubscriptionState | null {
  const file = path.join(dir, SUBSCRIPTION_FILE);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
    const provider = typeof raw.provider === 'string' ? raw.provider : '';
    const plan = typeof raw.plan === 'string' ? raw.plan : '';
    const currency = typeof raw.currency === 'string' ? raw.currency.toUpperCase() : '';
    const monthlyMinor = typeof raw.monthlyMinor === 'number' ? raw.monthlyMinor : 0;
    const capabilityScore = typeof raw.capabilityScore === 'number' ? raw.capabilityScore : 0;
    const capacityUnits = typeof raw.capacityUnits === 'number' ? raw.capacityUnits : 0;
    const source = typeof raw.source === 'string' ? raw.source : '';
    const renewedAt = typeof raw.renewedAt === 'string' ? raw.renewedAt : '';
    if (!provider || !plan || !currency) return null;
    return { provider, plan, currency, monthlyMinor, capabilityScore, capacityUnits, source, renewedAt };
  } catch {
    return null;
  }
}

export function writeSubscription(dir: string, state: SubscriptionState): SubscriptionState {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, SUBSCRIPTION_FILE), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return state;
}
