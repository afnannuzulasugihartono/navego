// @last-edited: 2026-11-17 UTC+7.
// @title: type-debt - the monotone ratchet for the strict-TypeScript debt recorded at the migration.
// @state: the count of TypeScript errors under tsconfig.tests.json can only go down, never up; a regression fails the gate.
// @dependencies: typescript compiler, tsconfig.tests.json.

// WHY THIS FILE EXISTS
// The repo compiles shared/, local/, extension/ and scripts/ under strict TypeScript, and those surfaces are pinned at zero errors.
// tests/ and hosted/functions/ (Deno edge functions) are not: the 2026-11-17 migration found 1796 errors there, almost all of them implicit-`any` parameters and unchecked index access in code written before the tree was strict.
// Rewriting all of it at once would fill the diff without fixing a single bug, so the debt is paid down in reviewable steps: every change that touches these files must leave the count the same or lower.
// When the number reaches zero, this gate can be deleted and the strict rule enforced absolutely everywhere.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const lockPath = path.join(root, 'scripts/verify/type-debt.lock');

function measure(): number {
  let output = '';
  try {
    output = execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '-p', 'tsconfig.tests.json'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error: unknown) {
    output = String((error as { stdout?: unknown; stderr?: unknown } | undefined)?.stdout ?? '') + String((error as { stderr?: unknown } | undefined)?.stderr ?? '');
  }
  const matches = output.match(/error TS\d+/g);
  return matches?.length ?? 0;
}

const current = measure();
const baseline = Number(fs.readFileSync(lockPath, 'utf8').trim());
if (!Number.isFinite(baseline)) {
  console.error('type-debt: scripts/verify/type-debt.lock is missing or not a number');
  process.exit(2);
}
if (current > baseline) {
  console.error(`type-debt: ${current} errors under tsconfig.tests.json — up from ${baseline}. The count may only go down.`);
  console.error('type-debt: fix the new errors, or narrow the baseline only after removing real errors.');
  process.exit(1);
}
if (current < baseline) {
  console.log(`type-debt: ${current} errors — down from ${baseline}. Lower scripts/verify/type-debt.lock to ${current} and commit it.`);
  process.exit(1);
}
console.log(`type-debt: ${current} errors — at baseline ${baseline}.`);
