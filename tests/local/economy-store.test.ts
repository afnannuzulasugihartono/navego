// @last-edited: 2026-11-24 UTC+7.
// @title: economy-store - the ledger appends, the knowledge library reads back, and a corrupt row does not hide the rest.
// @state: the on-disk shapes of the ledger, the notes, and the subscription state.
// @dependencies: node:test, strict, node:fs, node:os, node:path, ../../local/economy-store.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  appendEvent,
  economyDir,
  readEvents,
  readKnowledge,
  readSubscription,
  writeKnowledge,
  writeSubscription,
  type SubscriptionState
} from '../../local/economy-store.js';

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'navego-economy-'));
}

test('the economy folder is found in the repository, and the override wins', () => {
  const repo = new URL('../../', import.meta.url);
  const repoPath = repo.pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/[\\/]$/, '');
  const found = economyDir({}, repoPath);
  assert.ok(found.endsWith(path.join('docs', 'economy')), `expected the repository economy folder, got ${found}`);
  const override = path.join(tempDir(), 'elsewhere');
  assert.equal(economyDir({ NAVEGO_ECONOMY_DIR: override }, repoPath), override);
});

test('an appended event is read back, and a corrupt line is skipped', () => {
  const dir = tempDir();
  appendEvent(dir, {
    id: 'evt-1',
    at: '2026-11-20T00:00:00.000Z',
    kind: 'revenue',
    amountMinor: 5000,
    currency: 'USD',
    decisionId: 'decision-1',
    source: 'https://navego.pages.dev/harga'
  });
  fs.appendFileSync(path.join(dir, 'ledger.jsonl'), 'not-json\n', 'utf8');
  appendEvent(dir, {
    id: 'evt-2',
    at: '2026-11-21T00:00:00.000Z',
    kind: 'cost',
    amountMinor: 1000,
    currency: 'USD',
    decisionId: 'decision-2',
    source: 'https://ml.ai/pricing'
  });
  const events = readEvents(dir);
  assert.equal(events.length, 2);
  assert.equal(events[0]?.id, 'evt-1');
  assert.equal(events[1]?.kind, 'cost');
});

test('a knowledge note keeps its source and reads back with its body', () => {
  const dir = tempDir();
  const written = writeKnowledge(dir, {
    id: 'pricing-2026-11',
    title: 'AI subscription prices, November 2026',
    kind: 'pricing',
    source: 'https://www.anthropic.com/pricing',
    observed: '2026-11-24',
    body: 'Claude Pro is $20 monthly. Source checked on 2026-11-24.'
  });
  assert.equal(written.file, path.join('knowledge', 'pricing-2026-11.md'));
  const notes = readKnowledge(dir);
  assert.equal(notes.length, 1);
  assert.equal(notes[0]?.id, 'pricing-2026-11');
  assert.equal(notes[0]?.source, 'https://www.anthropic.com/pricing');
  assert.match(notes[0]?.body ?? '', /Claude Pro is \$20 monthly/);
});

test('the subscription state reads back, and a broken file reads as no subscription', () => {
  const dir = tempDir();
  const state: SubscriptionState = {
    provider: 'ml.ai',
    plan: 'infinite',
    currency: 'USD',
    monthlyMinor: 9900,
    capabilityScore: 90,
    capacityUnits: 1000,
    source: 'https://ml.ai/',
    renewedAt: '2026-11-24T00:00:00.000Z'
  };
  writeSubscription(dir, state);
  assert.deepEqual(readSubscription(dir), state);
  fs.writeFileSync(path.join(dir, 'subscription.json'), '{broken', 'utf8');
  assert.equal(readSubscription(dir), null);
});
