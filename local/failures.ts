// @last-edited: 2026-11-19 UTC+7.
// @title: failures - the navego command that prints what broke, and collects what the agent observed while driving.
// @state: read-mostly; feedback appends one line; nothing leaves this machine.
// @dependencies: ./tool-failures.js.

import { readRecords, recordFeedback, summarize } from './tool-failures.js';
import type { FailureReport } from './tool-failures.js';

const flag = (args: string[], name: string): string | undefined => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const formatWhen = (at: number): string => new Date(at).toISOString();

const printHuman = (report: FailureReport, toolFilter?: string): void => {
  const filtered = toolFilter ? report.byTool.filter((row) => row.tool === toolFilter) : report.byTool;
  const head = `navego failures - ${report.failures} failure${report.failures === 1 ? '' : 's'}, ${report.feedback} feedback note${report.feedback === 1 ? '' : 's'} on this machine`;
  process.stdout.write(head + '\n');
  if (filtered.length === 0) {
    process.stdout.write('no tool has failed yet on this machine - nothing to fix, nothing to replay\n');
  }
  for (const row of filtered) {
    process.stdout.write(`\n${row.tool} - ${row.failures} failure${row.failures === 1 ? '' : 's'}, ${row.feedback} note${row.feedback === 1 ? '' : 's'}\n`);
    for (const [code, count] of Object.entries(row.codes)) {
      process.stdout.write(`  ${code} x${count}\n`);
    }
    if (row.lastMessage) process.stdout.write(`  last: ${row.lastMessage}\n`);
  }
  if (report.notes.length > 0) {
    process.stdout.write('\nfeedback\n');
    for (const note of report.notes) {
      process.stdout.write(`  ${formatWhen(note.at)}  ${note.tool}: ${note.note}\n`);
    }
  }
  process.stdout.write('\nthe log lives at $OPERA_AGENT_HOME/tool-failures.jsonl (default ~/.opera-agent) - delete it freely; it is an observation channel, not a ledger\n');
};

export async function failures({ args }: { args: string[] }): Promise<number> {
  const json = args.includes('--json');
  const toolFilter = flag(args, 'tool');
  const limit = Number(flag(args, 'limit')) || undefined;
  const records = readRecords({ limit });
  const summary = summarize(records);
  if (json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    return 0;
  }
  printHuman(summary, toolFilter);
  return 0;
}

const usage = 'navego feedback <tool> <note...> - record what the agent saw, e.g. "browser_read_page: timeout on canvas editors blocks every docs drive"';

export async function feedback({ args }: { args: string[] }): Promise<number> {
  const [tool, ...noteParts] = args;
  const note = noteParts.join(' ').trim();
  if (!tool || !note) {
    process.stderr.write(usage + '\n');
    return 1;
  }
  recordFeedback({ tool, note });
  process.stdout.write(`noted: ${tool} - ${note}\n`);
  return 0;
}
