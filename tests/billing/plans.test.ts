// @last-edited: 2026-11-18 UTC+7.
// @title: plans.test — what each plan allows, pinned to the one place that states it.
// @state: only the USD plans exist, the firm-shape tiers unlock what the cheap ones refuse, the daily quotas are the ones the price names, and the default is the safe one.
// @dependencies: node:test, strict, node:fs, ../../hosted/functions/_shared/plans.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PLANS, DEFAULT_PLAN, planFor, allowsFeature, planQuota, planRPM } from '../../hosted/functions/_shared/plans.ts';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const migration = fs.readFileSync(path.join(root, 'hosted', 'migrations', '20261118090000_opera_usd_plans.sql'), 'utf8');
const readers = fs.readFileSync(path.join(root, 'hosted', 'migrations', '20261118090100_opera_usd_plan_readers.sql'), 'utf8');

test('only the USD plans exist and the firm-shape tiers unlock what the cheap ones refuse', () => {
  const cheap = PLANS['plan.usd-1'];
  const starter = PLANS['plan.usd-9'];
  const business = PLANS['plan.usd-17'];
  const enterprise = PLANS['plan.usd-33'];
  assert.ok(cheap, 'the usd-1 plan is declared');
  assert.ok(starter, 'the usd-9 plan is declared');
  assert.ok(business, 'the usd-17 plan is declared');
  assert.ok(enterprise, 'the usd-33 plan is declared');
  assert.equal(typeof cheap.dailyQuota === 'number' && cheap.dailyQuota > 0, true);
  assert.equal(typeof starter.dailyQuota === 'number' && typeof cheap.dailyQuota === 'number' && starter.dailyQuota > cheap.dailyQuota, true);
  assert.equal(cheap.features.all, false);
  assert.equal(cheap.features.vm, false);
  assert.equal(cheap.features.statement, false);
  assert.equal(cheap.features.remoteDrive, false);
  assert.equal(starter.dailyQuota, 9000);
  assert.equal(starter.features.all, false);
  assert.equal(cheap.rpm, null);
  assert.equal(starter.rpm, null);
});

test('the cheap USD plans exist with the daily quotas their price names and no minute cap', () => {
  const cheap: Record<string, [number, number]> = {
    'plan.usd-1': [1000, 50],
    'plan.usd-3': [3000, 50],
    'plan.usd-5': [5000, 50],
    'plan.usd-7': [7000, 50],
    'plan.usd-9': [9000, 50]
  };
  for (const [name, [quota, session]] of Object.entries(cheap)) {
    const plan = PLANS[name];
    assert.ok(plan, `${name} is declared`);
    assert.equal(plan.dailyQuota, quota, `${name} daily quota`);
    assert.equal(plan.sessionAllowance, session, `${name} session allowance`);
    assert.equal(planQuota(name), quota, `${name} pinned quota`);
    assert.equal(plan.rpm, null, `${name} has no per-minute cap`);
    assert.equal(planRPM(name), null, `${name} pinned rpm`);
  }
});

test('the usd-17 and usd-33 tiers carry the firm features, the rest do not, and none has a minute cap', () => {
  for (const name of ['plan.usd-17', 'plan.usd-33']) {
    const plan = PLANS[name];
    assert.ok(plan, `${name} is declared`);
    assert.equal(plan.features.all, true, `${name} opens the whole-map read`);
    assert.equal(allowsFeature(name, 'statement'), true, `${name} opens statements`);
    assert.equal(allowsFeature(name, 'vm'), true, `${name} opens the vm`);
    assert.equal(allowsFeature(name, 'remoteDrive'), true, `${name} opens remote drive`);
    assert.equal(plan.sessionAllowance, 500, `${name} session allowance`);
    assert.equal(plan.rpm, null, `${name} has no per-minute cap`);
  }
  assert.equal(PLANS['plan.usd-17']?.dailyQuota, 17000, 'usd-17 daily quota');
  assert.equal(PLANS['plan.usd-33']?.dailyQuota, null, 'usd-33 is unlimited');
  for (const name of ['plan.usd-1', 'plan.usd-3', 'plan.usd-5', 'plan.usd-7', 'plan.usd-9']) {
    assert.equal(allowsFeature(name, 'all'), false, `${name} does not open the whole-map read`);
    assert.equal(allowsFeature(name, 'statement'), false, `${name} does not open statements`);
  }
});

test('one plan-price map states the cents charged and shown for every tier', async () => {
  const module = await import('../../hosted/functions/_shared/plans.ts') as unknown as Record<string, unknown>;
  const priceOf = module.planPriceCents;
  assert.equal(typeof priceOf, 'function');
  const price = priceOf as (name: string) => unknown;
  const expected: Record<string, number> = {
    'plan.usd-1': 100,
    'plan.usd-3': 300,
    'plan.usd-5': 500,
    'plan.usd-7': 700,
    'plan.usd-9': 900,
    'plan.usd-17': 1700,
    'plan.usd-33': 3300
  };
  for (const [name, cents] of Object.entries(expected)) assert.equal(price(name), cents, `${name} price`);
  const site = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'harga.tsx'), 'utf8');
  for (const [name, cents] of Object.entries(expected)) {
    assert.match(site, new RegExp(`id: '${name.replace('.', '\\.')}', price: '\\$${cents / 100}'`), `${name} display price`);
  }
});

test('an unknown plan falls back to the safe default', () => {
  assert.equal(DEFAULT_PLAN, 'plan.usd-1');
  assert.deepEqual(planFor('plan.unknown'), PLANS['plan.usd-1']);
  assert.equal(planQuota('plan.unknown'), PLANS['plan.usd-1']?.dailyQuota);
  assert.equal(allowsFeature('plan.usd-17', 'all'), true);
  assert.equal(allowsFeature('plan.unknown', 'all'), false);
});

test('the migration creates the usd plans, restates the same quotas, and grants access', () => {
  assert.match(migration, /opera_account_plans_plan_check/);
  assert.match(migration, /add constraint opera_account_plans_plan_check/);
  assert.match(readers, /create or replace function public\.opera_my_plan\(\)/);
  assert.match(migration, /grant execute on function public\.opera_plan_activate_purchase\(uuid, text\) to service_role/);
  for (const plan of ['plan.usd-1', 'plan.usd-3', 'plan.usd-5', 'plan.usd-7', 'plan.usd-9', 'plan.usd-17', 'plan.usd-33']) {
    assert.match(migration, new RegExp(plan.replace(/\./g, '\\.')), `${plan} is named in the USD migration`);
    assert.match(readers, new RegExp(plan.replace(/\./g, '\\.')), `${plan} is named in the USD readers migration`);
  }
  assert.match(migration, /'plan\.usd-1', 'usd-month', 100, 'USD'/);
  assert.match(migration, /'plan\.usd-33', 'usd-year', 3300, 'USD'/);
  assert.match(readers, /when 'plan\.usd-17' then 17000/);
  assert.match(readers, /when 'plan\.usd-33' then null/);
  assert.match(readers, /when 'plan\.usd-1' then 1000/);
  assert.match(readers, /then null/);
  assert.equal(String(PLANS['plan.usd-17']?.dailyQuota), '17000');
  assert.equal(PLANS['plan.usd-33']?.dailyQuota, null);
});
