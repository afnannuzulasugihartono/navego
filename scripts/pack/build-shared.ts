// @last-edited: 2026-11-13 UTC+7.
// @title: build-shared - compiles the one pure core both roads import.
// @state: cleans every emitted .js under shared/, then compiles the .ts sources; a removed source leaves no artefact.
// @dependencies: node:fs, node:path, node:child_process, node:url.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const target = path.join(repo, 'shared');

if (!fs.existsSync(path.join(repo, 'node_modules', 'typescript'))) {
  console.error('build-shared: typescript is not installed; run npm ci first.');
  process.exit(1);
}

// THE CLEAN RUNS FIRST, AND WHY IT REFUSES.
// tsc writes beside the sources, so a file deleted from the source tree would keep its old emitted twin forever, and a stale twin is a module the tests can still import and pass with.
// The clean therefore removes every emitted twin - .js and .d.ts together - and refuses to remove a .js or .d.ts that has no .ts source beside it.
// The declarations are written beside the .js so Deno can read them for typechecking hosted functions; they are generated artifacts, never hand-written.

const removed = [];
const refused = [];
const tracked = new Set(
  nodeGitList()
);

function nodeGitList(): string[] {
  return execFileSync('git', ['ls-files', 'shared'], { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean);
}

// THE TRACKED DECLARATION SURVIVES THE CLEAN.
// git ls-files knows which .d.ts is hand-written; those (host.d.ts) are never removed by the clean, whatever source beside them says.

for (const entry of fs.readdirSync(target)) {
  if (!entry.endsWith('.js') && !entry.endsWith('.d.ts')) continue;
  const fullPath = path.join('shared', entry).replace(/\\/g, '/');
  const hasSource = fs.existsSync(path.join(target, entry.replace(/\.d?\.ts$|\.js$/, '.ts')));
  const isHandWritten = tracked.has(fullPath);
  if (hasSource) { fs.rmSync(path.join(target, entry)); removed.push(entry); }
  else if (!isHandWritten) refused.push(entry);
}

if (refused.length) {
  console.error(`build-shared: refusing to compile - these emitted files have no .ts source beside them:\n  ${refused.join('\n  ')}`);
  process.exit(1);
}

execFileSync(process.execPath, [path.join(repo, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', path.join(repo, 'tsconfig.shared.json')], { cwd: repo, stdio: 'inherit' });

// THE DECLARATIONS ARE REWRITTEN FROM .js TO .d.ts BEFORE ANY CONSUMER SEES THEM.
// Deno resolves flat-ESM imports against the actual .js file; the .d.ts file only matters for tsc, and for type-only consumers (hosted functions) the .d.ts path is the one loaded.
// Keeping .js inside the declarations would force hosted functions to typecheck the .js implementation and fail on missing type-only exports, so the spec path inside the declarations is rewritten to the .d.ts file itself.

for (const name of fs.readdirSync(target)) {
  if (!name.endsWith('.d.ts')) continue;
  const file = path.join(target, name);
  const source = fs.readFileSync(file, 'utf8');
  const rewritten = source.replace(/from '(\.\/[^']+)\.js'/g, "from '$1.d.ts'");
  fs.writeFileSync(file, rewritten);
}

process.stderr.write('build-shared: compiled shared/ into bespoke .js beside each source, declarations rewritten for Deno\n');
