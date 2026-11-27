// @last-edited: 2026-11-27 UTC+7.
// @title: support form - the declared support inbox has a front door.
// @state: pins that /dukungan posts to navego-feedback and no longer asks for a personal Gmail.
// @dependencies: node:test, node:assert, site/app/routes/dukungan.tsx, site/app/components/FeedbackForm.tsx.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file: string): string => fs.readFileSync(path.join(root, file), 'utf8');

test('the support page offers the feedback form instead of a private email', () => {
  const page = read('site/app/routes/dukungan.tsx');
  assert.match(page, /<FeedbackForm\s*\/>/, 'the page renders the feedback form');
  assert.doesNotMatch(page, /mailto:afnannuzulasugihartono@gmail\.com/, 'no personal email as the support door');
});

test('the feedback form posts the fields the edge function accepts', () => {
  const form = read('site/app/components/FeedbackForm.tsx');
  assert.match(form, /navego-feedback/, 'the form targets the edge function');
  for (const field of ['name', 'contact', 'firm', 'portal', 'clients', 'pain']) {
    assert.ok(form.includes(`name="${field}"`), `the form sends ${field}`);
  }
  assert.match(form, /role="status"/, 'the result is announced');
});
