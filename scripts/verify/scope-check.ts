// @last-edited: 2026-10-10 UTC+7.
// @title: scope-check — a brief declares the files it may touch; this counts what actually moved.
// @state: reads the Files block of an SDD brief and reports which committed paths were never declared.
// @dependencies: node:fs, node:path, node:child_process, node:url.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_SIDE_EFFECTS = ['tests/helpers/boundary-locks.ts'];

const SECTION = /^\*\*(.+?):\*\*\s*$/;
const BACKTICKS = /`([^`]+)`/g;
const LINE_RANGE = /:\d+(?:-\d+)?\s*$/;
const COUNT_WITHOUT_PATH = /\b\d+\s+(?:berkas|files?)\b/i;

export interface ParsedBrief {
  declared: string[];
  sideEffects: string[];
  unparseable: boolean;
}
export interface ScopeResult {
  rows: Array<{ file: string; status: string; escalate: boolean }>;
  escalations: string[];
  undeclared: Array<{ file: string; status: string; escalate: boolean }>;
  complete: boolean;
  reliable: boolean;
  clean: boolean;
}

const HEADER = /^#{1,3}\s/;

export function parseBrief(text: string): ParsedBrief {
  const declared: string[] = [];
  const sideEffects: string[] = [];
  const seen = new Set<string>();
  let section: string | null = null;
  let unparseable = false;
  let bullet: string | null = null;

  const push = (file: string, bucket: string[]) => {
    if (!file || seen.has(file)) return;
    seen.add(file);
    bucket.push(file);
  };

  const consume = (bucket: string[], line: string) => {
    let found: string | null = null;
    let last: string | null = null;

    for (const match of line.matchAll(BACKTICKS)) {
      const span = match[1] ?? '';
      const value = span.trim();
      if (value.startsWith(':')) {

        if (last) found = last;
        continue;
      }
      const file = value.replace(LINE_RANGE, '');
      if (!file.includes('/')) continue;
      last = file;
      found = file;
      push(file, bucket);
    }

    if (!found && COUNT_WITHOUT_PATH.test(line)) unparseable = true;
  };

  const flush = () => {
    if (bullet === null) return;
    const bucket = section === 'side-effect' ? sideEffects : section === 'file' ? declared : null;

    if (bucket !== null) consume(bucket, bullet);
    bullet = null;
  };

  for (const raw of text.split(/\r?\n/)) {
    const header = raw.match(SECTION);
    if (header) {
      flush();
      section = (header[1] ?? '').toLowerCase().replace(/s$/, '');
      continue;
    }
    if (HEADER.test(raw)) {
      flush();
      section = null;
      continue;
    }
    if (raw.trim() === '') {
      flush();
      continue;
    }
    if (raw.startsWith('- ')) {
      flush();
      bullet = raw;
      continue;
    }

    if (bullet !== null && /^\s+\S/.test(raw)) {
      bullet += ` ${raw.trim()}`;
      continue;
    }
    flush();
  }
  flush();

  return { declared, sideEffects, unparseable };
}

export function classify(brief: ParsedBrief, actualFiles: string[], sideEffects: string[] = DEFAULT_SIDE_EFFECTS) {
  const declared = new Set(brief.declared);
  const allowedSideEffects = new Set([...sideEffects, ...brief.sideEffects]);
  const moved = new Set(actualFiles);
  const reliable = brief.unparseable !== true;
  const rows: Array<{ file: string; status: string; escalate: boolean }> = [];
  const escalations: string[] = [];

  const declares = (entries: Set<string>, file: string) => {
    if (entries.has(file)) return true;
    for (const entry of entries) {
      if (entry.endsWith('/') && file.startsWith(entry)) return true;
    }
    return false;
  };

  for (const file of actualFiles) {
    let status = 'undeclared';
    if (declares(declared, file)) status = 'declared';
    else if (declares(allowedSideEffects, file)) status = 'side-effect';

    const escalate = reliable && status === 'undeclared' && file.startsWith('tests/');
    if (escalate) escalations.push(file);
    rows.push({ file, status, escalate });
  }

  const satisfied = (entry: string) => {
    if (moved.has(entry)) return true;
    if (entry.endsWith('/')) {
      for (const file of moved) if (file.startsWith(entry)) return true;
    }
    return false;
  };

  const undeclared = rows.filter((row) => row.status === 'undeclared');
  const complete = [...declared].every(satisfied);
  return {
    rows,
    escalations,
    undeclared,
    complete,
    reliable,
    clean: reliable && undeclared.length === 0 && complete,
  };
}

const SYSTEM_PATH = process.platform === 'win32'
  ? [path.join(process.env.SystemRoot || 'C:\\Windows', 'System32'), process.env.SystemRoot || 'C:\\Windows'].join(';')
  : ['/usr/local/sbin', '/usr/local/bin', '/usr/sbin', '/usr/bin', '/sbin', '/bin'].join(':');

function locateGit() {
  const names = process.platform === 'win32' ? ['git.exe', 'git.cmd'] : ['git'];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return 'git';
}

function changedFiles(root: string, base: string, head: string): string[] {
  const out = execFileSync(locateGit(), ['diff', '--name-only', `${base}..${head}`], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PATH: SYSTEM_PATH },
  });
  return out.split(/\r?\n/).filter(Boolean);
}

const STATUS_MARK: Record<string, string> = {
  declared: '✓',
  'side-effect': '~',
  undeclared: '✗',
};

export function format(result: ScopeResult): string {
  const lines = result.rows.map((row) => {
    const note = row.escalate ? '  ← TIDAK DIDEKLARASI' : '';
    return `  ${STATUS_MARK[row.status]}  ${row.file}${note}`;
  });
  lines.push('');
  if (!result.reliable) {

    lines.push('⚠ DEKLARASI TIDAK BISA DIBACA MESIN — hasil di atas bersifat sementara.');
    lines.push(`   ${result.undeclared.length} file terlihat di luar deklarasi, tapi tidak bisa dituduh: brief menyebut jumlahnya tanpa menyebut isinya.`);
    lines.push('   Minta brief menuliskan path satu per satu, baru hasil ini bisa dipercaya.');
  } else if (result.escalations.length > 0) {
    lines.push(`${result.escalations.length} file menyentuh tests/ tanpa deklarasi. WAJIB ESKALASI sebelum dianggap selesai.`);
  } else if (result.undeclared.length > 0) {
    lines.push(`${result.undeclared.length} file di luar deklarasi; tidak ada yang di dalam tests/.`);
  } else {
    lines.push(`Bersih. ${result.rows.length} file, ${result.rows.length} terdeklarasi, 0 penyimpangan.`);
  }
  return lines.join('\n');
}

function flag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const briefPath = args.find((arg) => !arg.startsWith('--'));
  const base = flag(args, '--base');
  const head = flag(args, '--head') ?? 'HEAD';

  if (!briefPath) {
    console.error('usage: node scripts/verify/scope-check.ts <brief> --base <sha> [--head <sha>]');
    process.exit(2);
  }

  const root = fileURLToPath(new URL('../..', import.meta.url));
  const brief = parseBrief(fs.readFileSync(path.resolve(root, briefPath), 'utf8'));
  const actual = base ? changedFiles(root, base, head) : [];
  const result = classify(brief, actual);

  console.log(`Brief : ${briefPath}`);
  console.log(`Range : ${base ?? '(tanpa --base)'}..${head}`);
  console.log('');
  console.log(format(result));
  process.exit(result.escalations.length > 0 ? 1 : 0);
}
