// @last-edited: 2026-11-20 UTC+7.
// @title: canvas-typing — a canvas editor gets its editing host focused before the text goes in.
// @state: the worker asks the page for its editable host and focuses it before every text insertion, so a canvas editor (Google Docs) takes the text instead of its chrome.
// @dependencies: node:test, strict, node:fs, node:path, node:url.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (file: string): string => fs.readFileSync(path.join(root, file), 'utf8');

test('the worker focuses an editing host before it inserts text', () => {
  const source = read('extension/worker/action-focus.ts');
  assert.match(source, /FOCUS_EDITABLE_EXPRESSION/, 'the worker needs the editing-host expression');
  assert.match(source, /async function ensureTextTarget\(/, 'the worker needs the text-target guard');
  assert.match(source, /await ensureTextTarget\(target\)/, 'the guard must run before the text goes in');
  assert.match(source, /Runtime\.evaluate/, 'the guard asks the page itself for the host');
});

test('the frozen content surface is not touched by this fix', () => {
  const source = read('extension/content.ts');
  assert.doesNotMatch(source, /focus_editable/, 'the public read projection stays byte-for-byte unchanged');
});
