// @last-edited: 2026-11-28 UTC+7.
// @title: growth engine - the agent names its own problem from metrics and judges an outcome honestly.
// @state: failing before scripts/dev/agent-fleet/growth.ts exists, passing after it.
// @dependencies: node:test, node:assert, scripts/dev/agent-fleet/growth.ts, scripts/dev/agent-fleet/research-gate.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { formulateProblem, judgeEffect, growthTicket, type GrowthInput } from '../../scripts/dev/agent-fleet/growth.ts';
import { decideResearch, parseTicket } from '../../scripts/dev/agent-fleet/research-gate.ts';

const base: GrowthInput = {
  settledUsd: 0,
  daysSinceSettlement: 3,
  pricingBrowsers: 10,
  strangerBuyClicks: 0
};

test('the problem is named from the metric, not from a hunch', () => {
  assert.match(formulateProblem(base), /zero strangers pay/i);
  assert.match(formulateProblem({ ...base, settledUsd: 3, pricingBrowsers: 0 }), /nobody reach the pricing/i);
  assert.match(formulateProblem({ ...base, settledUsd: 3, strangerBuyClicks: 1 }), /buy clicks never settle/i);
});

test('a flat result is never called effective', () => {
  assert.equal(judgeEffect(0, 0).verdict, 'flat');
  assert.equal(judgeEffect(100, 100).verdict, 'flat');
});

test('a rise on a tiny sample is weak evidence, not proof', () => {
  const small = judgeEffect(10, 11);
  assert.equal(small.verdict, 'weak');
  assert.match(small.note, /sample/i);
  assert.equal(judgeEffect(100, 110).verdict, 'effective');
});

test('a drop is called a drop', () => {
  assert.equal(judgeEffect(100, 95).verdict, 'worse');
});

test('the generated ticket passes the research gate', () => {
  const text = growthTicket(base, {
    date: '2026-11-29',
    resultPath: 'RF-024-2026-11-29-self-formed.md',
    sourceUrl: 'https://baymard.com/research/checkout-usability'
  });
  const verdict = decideResearch(parseTicket(text), { prior: [], now: Date.parse('2026-11-29T00:00:00Z') });
  assert.equal(verdict.verdict, 'run', JSON.stringify(verdict));
  assert.match(text, /decision-change:/);
  assert.match(text, /outreach: no/);
});

test('an outcome is recorded with its before, after and honest verdict', async () => {
  const { recordEffect } = await import('../../scripts/dev/agent-fleet/growth.ts');
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'effect-')), 'effects.json');
  const first = recordEffect(file, 'pricing-copy', 10, 11);
  assert.equal(first.verdict, 'weak');
  const second = recordEffect(file, 'pricing-copy', 100, 110);
  assert.equal(second.verdict, 'effective');
  const rows = JSON.parse(fs.readFileSync(file, 'utf8')) as Array<{ key: string; before: number; after: number }>;
  assert.equal(rows.length, 2);
  assert.equal(rows[1]?.after, 110);
});