// @last-edited: 2026-11-28 UTC+7.
// @title: research gate - the machine decides whether a research ticket runs, before any agent is dispatched.
// @state: run only for a bounded ticket with a decision, a public URL, a fresh date and a numbered destination; skip duplicates and outreach; ask a person when the ticket is incomplete.
// @dependencies: node:fs, node:path, node:url, strict.

// Decision automation for research is routing, not research. A model should not spend a run discovering that a question was already answered, that no decision would change, or that the ticket secretly asks for outreach. Those are deterministic checks and they belong in code.
// https://www.anthropic.com/engineering/building-effective-agents (routing and orchestrator-workers)
// https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns (deterministic routing and handoff)
// https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents (groundedness, coverage and source quality)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ResearchTicket {
  decision: string;
  urls: string[];
  date: string;
  resultPath: string;
  asksOutreach?: boolean;
}

export interface PriorFinding {
  id: string;
  decision: string;
  date: string;
  urls: string[];
}

export interface ResearchVerdict {
  verdict: 'run' | 'skip' | 'needs-human';
  reasons: string[];
}

export interface GateOptions {
  prior?: PriorFinding[];
  now?: number;
}

const DAY_MS = 86_400_000;

export function decideResearch(ticket: ResearchTicket, options: GateOptions = {}): ResearchVerdict {
  const reasons: string[] = [];
  const now = options.now ?? Date.now();

  if (ticket.asksOutreach) reasons.push('a research task never performs outreach');
  if (!ticket.decision.trim()) reasons.push('no decision named - the evidence cannot change anything');
  if (!ticket.urls.length || ticket.urls.some((url) => !/^https:\/\//.test(url))) {
    reasons.push('no openable public URL named');
  }
  if (!/^RF-\d{3}-\d{4}-\d{2}-\d{2}-.+\.md$/.test(ticket.resultPath)) {
    reasons.push('result path must be RF-<number>-<ISO date>-<slug>.md');
  }

  const date = Date.parse(ticket.date);
  if (!Number.isFinite(date)) {
    reasons.push('no valid reading date');
  } else if (now - date > 30 * DAY_MS) {
    reasons.push('stale evidence - older than thirty days');
  }

  const prior = options.prior ?? [];
  const duplicate = Number.isFinite(date) ? prior.find((finding) => {
    const priorDate = Date.parse(finding.date);
    if (!Number.isFinite(priorDate) || Math.abs(date - priorDate) > 30 * DAY_MS) return false;
    if (finding.decision.trim().toLowerCase() !== ticket.decision.trim().toLowerCase()) return false;
    return finding.urls.some((url) => ticket.urls.includes(url));
  }) : undefined;
  if (duplicate) reasons.push(`already answered by ${duplicate.id}`);

  if (reasons.some((reason) => /outreach/i.test(reason))) return { verdict: 'skip', reasons };
  const blocking = reasons.filter((reason) => !/already answered/i.test(reason));
  if (blocking.length) return { verdict: 'needs-human', reasons: blocking };
  if (reasons.length) return { verdict: 'skip', reasons };
  return { verdict: 'run', reasons: [] };
}

export function parseTicket(text: string): ResearchTicket {
  const lines = text.split(/\r?\n/);
  const values = (key: string): string[] => {
    const found: string[] = [];
    const pattern = new RegExp(`^${key}:\\s*(.+)$`, 'im');
    for (const line of lines) {
      const match = line.match(pattern);
      if (match?.[1]) found.push(match[1].trim());
    }
    return found;
  };
  return {
    decision: values('decision')[0] ?? '',
    urls: values('url'),
    date: values('date')[0] ?? '',
    resultPath: values('result')[0] ?? '',
    asksOutreach: /^outreach:\s*yes/im.test(text) || /perform outreach|send a message/i.test(text)
  };
}

export function readPrior(findingsDir: string): PriorFinding[] {
  try {
    return fs.readdirSync(findingsDir).filter((name) => /^RF-\d{3}-/.test(name) && name.endsWith('.md')).map((name) => {
      const text = fs.readFileSync(path.join(findingsDir, name), 'utf8');
      const dateMatch = name.match(/RF-\d{3}-(\d{4}-\d{2}-\d{2})-/) ?? text.match(/(\d{4}-\d{2}-\d{2})/);
      const lines = text.split(/\r?\n/);
      const decisionLine = lines.find((line) => line.startsWith('Decision supported:'));
      const decision = decisionLine ? decisionLine.slice('Decision supported:'.length).trim() : (lines[2] ?? '');
      const urls = [...text.matchAll(/https:\/\/[^\s)\]]+/g)].map((match) => match[0]);
      return { id: name.slice(0, 6), decision, date: dateMatch?.[1] ?? '', urls };
    });
  } catch {
    return [];
  }
}

// A research ticket that the gate would skip or send to a person must never open a model session; every other lane keeps the existing dispatcher path.

export function researchDispatchAllowed(ticketFile: string, queueDir: string, findingsDir: string): boolean {
  if (!/^operator-to-researcher-.*\.md$/.test(ticketFile)) return true;
  try {
    const ticket = parseTicket(fs.readFileSync(path.join(queueDir, ticketFile), 'utf8'));
    return decideResearch(ticket, { prior: readPrior(findingsDir) }).verdict === 'run';
  } catch {
    return false;
  }
}

export function isTicketPath(file: string, root: string): boolean {
  const resolved = path.resolve(file);
  const allowed = ['docs/agent-roles/queue', 'agents/shared'].map((dir) => path.resolve(path.join(root, dir)));
  return path.extname(resolved) === '.md' && allowed.some((dir) => resolved.startsWith(dir + path.sep));
}

const invokedDirectly = process.argv[1] ? import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href : false;

if (invokedDirectly) {
  const name = process.argv[2];
  if (!name || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.md$/.test(name)) {
    console.error('usage: node scripts/dev/agent-fleet/research-gate.ts <ticket-name.md>');
    process.exitCode = 2;
  } else {
    // The CLI argument is only a name to match against directory entries.
    // It never becomes a path, so a caller cannot choose a file outside the ticket folders.
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    const folders = ['docs/agent-roles/queue', 'agents/shared'].map((dir) => path.join(root, dir));
    let found: string | undefined;
    for (const folder of folders) {
      try {
        for (const entry of fs.readdirSync(folder)) {
          if (entry === name) found = path.join(folder, entry);
        }
      } catch {
      }
    }
    if (!found) {
      console.error('ticket not found in docs/agent-roles/queue or agents/shared');
      process.exitCode = 2;
    } else {
      const ticket = parseTicket(fs.readFileSync(found, 'utf8'));
      const prior = readPrior(path.join(root, 'agents/shared/findings'));
      const verdict = decideResearch(ticket, { prior });
      console.log(JSON.stringify({ file: found, ticket, priorFindings: prior.length, ...verdict }, null, 2));
      process.exitCode = verdict.verdict === 'run' ? 0 : verdict.verdict === 'skip' ? 1 : 2;
    }
  }
}
