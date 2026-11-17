// @last-edited: 2026-11-09 UTC+7.
// @title: plans.test — what each plan allows, pinned to the one place that states it.
// @state: both plans exist, the firm unlocks what the pilot refuses, the migration agrees with the module, and the default is the safe one.
// @dependencies: node:test, strict, node:fs, ../../hosted/functions/_shared/plans.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PLANS, DEFAULT_PLAN, planFor, allowsFeature, planQuota } from '../../hosted/functions/_shared/plans.ts';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const migration = fs.readFileSync(path.join(root, 'hosted', 'migrations', '20261109090000_opera_account_plans.sql'), 'utf8');

test('the two plans exist and the firm unlocks what the pilot refuses', () => {
  const pilot = PLANS['plan.pilot'];
  const firm = PLANS['plan.firm'];
  assert.ok(pilot, 'the pilot plan is declared');
  assert.ok(firm, 'the firm plan is declared');
  assert.equal(typeof PLANS['plan.pilot'], 'object');
  assert.equal(typeof PLANS['plan.firm'], 'object');
  assert.equal(pilot.dailyQuota > 0, true);
  assert.equal(firm.dailyQuota > pilot.dailyQuota, true);
  assert.equal(pilot.features.all, false);
  assert.equal(firm.features.all, true);
  assert.equal(pilot.features.vm, false);
  assert.equal(firm.features.vm, true);
  assert.equal(pilot.features.statement, false);
  assert.equal(firm.features.statement, true);
});

test('an unknown plan falls back to the safe default', () => {
  assert.equal(DEFAULT_PLAN, 'plan.pilot');
  assert.deepEqual(planFor('plan.unknown'), PLANS['plan.pilot']);
  const pilot = PLANS['plan.pilot'];
  assert.ok(pilot, 'the pilot plan is declared');
  assert.equal(planQuota('plan.unknown'), pilot.dailyQuota);
  assert.equal(allowsFeature('plan.firm', 'all'), true);
  assert.equal(allowsFeature('plan.unknown', 'all'), false);
});

test('the migration creates the table, keeps the grants, and restates the same quotas', () => {
  assert.match(migration, /create table if not exists public\.opera_account_plans/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.opera_account_plans from anon, authenticated/);
  assert.match(migration, /create or replace function public\.opera_my_plan\(\)/);
  assert.match(migration, /grant execute on function public\.opera_my_plan\(\) to authenticated, service_role/);

  for (const plan of ['plan.pilot', 'plan.firm']) {
    assert.match(migration, new RegExp(plan), `${plan} is named in the migration`);
  }
  assert.match(migration, /then 5000 else 200 end/, 'the firm quota in SQL is the firm quota in JavaScript');
  assert.match(migration, /then 500 else 50 end/, 'the firm session allowance in SQL is the session allowance in JavaScript');
  const firm = PLANS['plan.firm'];
  const pilot = PLANS['plan.pilot'];
  assert.ok(firm && pilot, 'both plans are declared');
  assert.equal(String(firm.dailyQuota), '5000');
  assert.equal(String(pilot.dailyQuota), '200');
  assert.equal(String(firm.sessionAllowance), '500');
  assert.equal(String(pilot.sessionAllowance), '50');
});
