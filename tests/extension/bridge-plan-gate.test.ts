// @last-edited: 2026-11-21 UTC+7.
// @title: bridge-plan-gate.test — refuse who cannot pay, name the plan when refusing, and let the firm through.
// @state: paused plans cannot connect, the account profile quota overrides the bundled plan table, the quota refuses at the last command, the firm-only page keeps the firm, and everything else passes.
// @dependencies: node:test, strict, ../hosted/functions/navego-bridge/plan-gate.ts, ../hosted/functions/_shared/plans.ts.

import test from 'node:test';
import assert from 'node:assert/strict';

import { PLANS } from '../../hosted/functions/_shared/plans.ts';
import {
  capabilityAllowed,
  gateVerdict,
  handshakeVerdict,
  planIsActive,
  quotaAllowance
} from '../../hosted/functions/navego-bridge/plan-gate.ts';

const pilot = { plan: 'plan.usd-1', status: 'active', dailyQuota: 1000, usedToday: 0 };
const firm = { plan: 'plan.usd-17', status: 'active', dailyQuota: 17000, usedToday: 0 };

test('an account with no active plan cannot connect, and the refusal names the plan', () => {
  assert.equal(planIsActive('paused'), false);
  const paused = { ...pilot, status: 'paused' };
  const verdict = handshakeVerdict(paused);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.code, 'PLAN_LIMIT_REACHED');
  assert.match(verdict.message, /plan.usd-1/);
  assert.equal(handshakeVerdict(pilot).ok, true);
});

// THE QUOTA COMES FROM THE PROFILE, AND THE BUNDLED TABLE IS THE FALLBACK.
// One table carries every case, so the rule is proven once and each row only names its own account.

const QUOTA_CASES = [
  { name: 'a profile quota admits below its limit and refuses at it', profile: { plan: 'plan.usd-17', status: 'active', dailyQuota: 17000 }, quota: 17000 },
  { name: 'a profile without a quota falls back to the bundled plan table', profile: { plan: 'plan.usd-1', status: 'active' }, quota: 1000 },
  { name: 'an unknown plan uses the quota the profile carries', profile: { plan: 'plan.unreleased', status: 'active', dailyQuota: 17000 }, quota: 17000 }
];

for (const { name, profile, quota } of QUOTA_CASES) {
  test(name, () => {
    const admitted = gateVerdict({ ...profile, usedToday: quota - 1 }, { method: 'page.read', params: {} });
    assert.equal(admitted.ok, true);
    if (admitted.ok) {
      assert.equal(admitted.plan, profile.plan);
      assert.equal(admitted.quota, quota);
    }

    const refused = gateVerdict({ ...profile, usedToday: quota }, { method: 'page.read', params: {} });
    assert.equal(refused.ok, false);
    if (!refused.ok) {
      assert.match(refused.message, new RegExp(String(quota)));
      assert.match(refused.message, new RegExp(profile.plan.replace('.', '\\.')));
    }
  });
}

test('the daily quota refuses at the command that breaks it, and names the plan', () => {
  const pilotPlan = PLANS['plan.usd-1'];
  assert.ok(pilotPlan);
  const atLimit = { ...pilot, usedToday: pilotPlan.dailyQuota };
  const verdict = gateVerdict(atLimit, { method: 'page.read', params: {} });
  assert.equal(verdict.ok, false);
  assert.equal(verdict.code, 'PLAN_LIMIT_REACHED');
  assert.match(verdict.message, /1000/);
  const oneBefore = quotaAllowance('plan.usd-1', Number(pilotPlan.dailyQuota) - 1);
  assert.equal(oneBefore.ok, true);
});

test('the whole-page map is the firm only, and says so', () => {
  const refusal = capabilityAllowed('plan.usd-1', 'page.read', { view: 'map', all: true });
  assert.equal(refusal.ok, false);
  assert.equal(refusal.feature, 'all');
  assert.equal(capabilityAllowed('plan.usd-17', 'page.read', { view: 'map', all: true }).ok, true);
  assert.equal(capabilityAllowed('plan.usd-1', 'page.read', { view: 'map' }).ok, true, 'and the default page read stays free');
});

test('statement delivery is the firm only', () => {
  assert.equal(capabilityAllowed('plan.usd-1', 'statement.download', {}).ok, false);
  assert.equal(capabilityAllowed('plan.usd-17', 'statement.download', {}).ok, true);
  assert.equal(capabilityAllowed('plan.usd-1', 'statement.manifest', {}).ok, false);
  assert.equal(capabilityAllowed('plan.usd-1', 'page.read', {}).ok, true, 'and a plain command passes on both plans');
});

test('the gate verdict on a bad day is a refusal, on a good day a pass', () => {
  const bad = gateVerdict({ ...firm, usedToday: 17000, status: 'active' }, { method: 'page.read', params: { view: 'map', all: true } });
  assert.equal(bad.ok, false);
  const good = gateVerdict(firm, { method: 'page.read', params: { view: 'map', all: true } });
  assert.equal(good.ok, true);
  assert.equal(good.quota, 17000);
});
