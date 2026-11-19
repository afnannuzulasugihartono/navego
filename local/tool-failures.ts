// @last-edited: 2026-11-19 UTC+7.
// @title: tool-failures - the append-only log an AI driver leaves when a tool broke, and the report a maintainer reads from it.
// @state: never throws; corrupt lines are skipped, not fatal; the file stays on this machine and is only read by the person who opens it.
// @dependencies: node:fs, node:path, node:os.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type FailureKind = 'failure' | 'feedback';

export interface ToolFailureRecord {
  at: number;
  kind: FailureKind;
  tool: string;
  code?: string;
  message?: string;
  note?: string;
}

const DEFAULT_CAP_BYTES = 2_000_000;
const KEEP_LINES = 1000;

const homeOf = (): string => process.env.OPERA_AGENT_HOME || path.join(os.homedir(), '.opera-agent');
const fileOf = (home: string): string => path.join(home, 'tool-failures.jsonl');

const sanitize = (value: unknown, max: number): string => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max).trim();

const append = (home: string, file: string, line: string, capBytes: number): void => {
  fs.mkdirSync(home, { recursive: true });
  fs.appendFileSync(file, line + '\n', 'utf8');
  const size = fs.statSync(file).size;
  if (size <= capBytes) return;
  const kept = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).slice(-KEEP_LINES);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, kept.join('\n') + '\n', 'utf8');
  fs.renameSync(tmp, file);
};

// a failure log that cannot keep the record must never turn a refusal into a crash

export function recordFailure({ tool, code, message }: { tool: string; code?: string; message?: string }, options: { home?: string; capBytes?: number } = {}): void {
  try {
    const home = options.home ?? homeOf();
    const record: ToolFailureRecord = {
      at: Date.now(),
      kind: 'failure',
      tool: sanitize(tool, 120),
      ...(code ? { code: sanitize(code, 80) } : {}),
      ...(message ? { message: sanitize(message, 500) } : {})
    };
    if (!record.tool) return;
    append(home, fileOf(home), JSON.stringify(record), options.capBytes ?? DEFAULT_CAP_BYTES);
  } catch {
    void 0;
  }
}

// a feedback note follows the same rule: the log never breaks the caller

export function recordFeedback({ tool, note }: { tool: string; note: string }, options: { home?: string; capBytes?: number } = {}): void {
  try {
    const home = options.home ?? homeOf();
    const record: ToolFailureRecord = { at: Date.now(), kind: 'feedback', tool: sanitize(tool, 120), note: sanitize(note, 800) };
    if (!record.tool || !record.note) return;
    append(home, fileOf(home), JSON.stringify(record), options.capBytes ?? DEFAULT_CAP_BYTES);
  } catch {
    return;
  }
}

// a corrupt line is skipped; the log is an observation channel, not a ledger

export function readRecords(options: { home?: string; limit?: number | undefined } = {}): ToolFailureRecord[] {
  try {
    const home = options.home ?? homeOf();
    const file = fileOf(home);
    if (!fs.existsSync(file)) return [];
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
    const out: ToolFailureRecord[] = [];
    for (const line of lines) {
      try {
        const record = JSON.parse(line) as Partial<ToolFailureRecord>;
        if (record && typeof record.at === 'number' && (record.kind === 'failure' || record.kind === 'feedback') && typeof record.tool === 'string') {
          out.push(record as ToolFailureRecord);
        }
      } catch {
        continue;
      }
    }
    return options.limit ? out.slice(-options.limit) : out;
  } catch {
    return [] as ToolFailureRecord[];
  }
}

export interface ToolSummary {
  tool: string;
  failures: number;
  feedback: number;
  codes: Record<string, number>;
  lastMessage?: string;
}

export interface FailureReport {
  total: number;
  failures: number;
  feedback: number;
  byTool: ToolSummary[];
  recent: ToolFailureRecord[];
  notes: Array<{ tool: string; note: string; at: number }>;
}

export function summarize(records: ToolFailureRecord[]): FailureReport {
  const byTool = new Map<string, ToolSummary>();
  const ensure = (tool: string): ToolSummary => {
    let row = byTool.get(tool);
    if (!row) {
      row = { tool, failures: 0, feedback: 0, codes: {} };
      byTool.set(tool, row);
    }
    return row;
  };
  const notes: Array<{ tool: string; note: string; at: number }> = [];
  for (const record of records) {
    if (record.kind === 'feedback') {
      const row = ensure(record.tool);
      row.feedback += 1;
      if (record.note) notes.push({ tool: record.tool, note: record.note, at: record.at });
      continue;
    }
    const row = ensure(record.tool);
    row.failures += 1;
    const code = record.code ?? 'MCP_EXECUTION_ERROR';
    row.codes[code] = (row.codes[code] ?? 0) + 1;
    if (record.message) row.lastMessage = record.message;
  }
  const sorted = [...byTool.values()].sort((a, b) => (b.failures + b.feedback) - (a.failures + a.feedback));
  const failures = records.filter((r) => r.kind === 'failure').length;
  return {
    total: records.length,
    failures,
    feedback: records.length - failures,
    byTool: sorted,
    recent: records.filter((r) => r.kind === 'failure').slice(-10),
    notes
  };
}
