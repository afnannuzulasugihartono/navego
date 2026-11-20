// @last-edited: 2026-11-18 UTC+7.
// @title: plan-gate — the questions the bridge asks before it moves a command.
// @state: the plan check, the daily quota (null = unlimited), the firm-only methods, and the refusal that names the plan.
// @dependencies: ./index.ts through the claim path.

// THIS FILE EXISTS

// The gate lives in the service, and the service is the bridge: a device whose account has no active plan should never see a command, and one whose quota is spent should never see another one today.
// The checks are plain functions here so a unit test can refuse every bad door without a socket, a database, or a browser.

// THE REFUSAL IS INTENTIONAL.
// A silent refusal is a bug report nobody writes; a named one is a support question that names the fix.
// Every refusal below carries the plan that ran out.

import { DEFAULT_PLAN, planFor } from '../_shared/plans.ts';

const FIRM_FEATURES: Record<string, string> = Object.freeze({
  all: 'the whole-page map',
  statements: 'statement delivery'
});

export function planIsActive(status: unknown): boolean {
  return String(status || '') === 'active';
}

function firmOnlyMethods() {
  return [{ prefix: 'statement.', feature: 'statements' }];
}

function hasAllFeatures(plan: string): boolean {
  return planFor(plan).features.all === true;
}

interface CapabilityResult { ok: boolean; feature?: string }

export function capabilityAllowed(plan: unknown, method: unknown, params: unknown = {}): CapabilityResult {
  const p = (params && typeof params === 'object' ? params : {}) as Record<string, unknown>;
  const name = String(method ?? '');
  const mode = p.all === true && p.view === 'map';
  if (name === 'page.read' && mode) return { ok: hasAllFeatures(String(plan ?? DEFAULT_PLAN)), feature: 'all' };
  for (const { prefix, feature } of firmOnlyMethods()) {
    if (name.startsWith(prefix)) return { ok: hasAllFeatures(String(plan ?? DEFAULT_PLAN)), feature };
  }
  return { ok: true };
}

export function dailyQuota(plan: unknown): number | null {
  return planFor(String(plan ?? DEFAULT_PLAN)).dailyQuota;
}

export interface PlanProfile { status?: unknown; plan?: unknown; usedToday?: unknown }
export interface GateCommand { method?: unknown; params?: unknown }

export function handshakeVerdict(profile: PlanProfile | null | undefined): { ok: true } | { ok: false; code: string; message: string } {
  if (!planIsActive(profile?.status)) {
    return { ok: false, code: 'PLAN_LIMIT_REACHED', message: `plan ${profile?.plan ?? 'plan.usd-1'} is not active for this account` };
  }
  return { ok: true };
}

export function quotaAllowance(plan: unknown, usedToday: unknown): { ok: boolean; quota: number | null; used: number } {
  const quota = dailyQuota(plan);
  const used = Number(usedToday) || 0;
  if (quota === null) return { ok: true, quota: null, used };
  return { ok: used < quota, quota, used };
}

export function gateVerdict(profile: PlanProfile | null | undefined, command: GateCommand | null | undefined): { ok: true; plan: string; quota: number | null; used: number } | { ok: false; code: string; message: string } {
  const plan = String(profile?.plan ?? 'plan.usd-1');
  const standing = handshakeVerdict(profile);
  if (!standing.ok) return standing;

  const method = String(command?.method ?? '');
  const params = command?.params && typeof command.params === 'object' ? command.params : {};
  const capability = capabilityAllowed(plan, method, params);
  if (!capability.ok) {
    const feature = capability.feature ?? 'statements';
    return {
      ok: false,
      code: 'PLAN_LIMIT_REACHED',
      message: `${FIRM_FEATURES[feature] ?? feature} requires a paid plan; plan is ${plan}`
    };
  }
  const allowance = quotaAllowance(plan, profile?.usedToday);
  if (!allowance.ok) {
    return {
      ok: false,
      code: 'PLAN_LIMIT_REACHED',
      message: `today's quota of ${allowance.quota} commands for ${plan} is used; resets tomorrow`
    };
  }
  return { ok: true, plan, quota: allowance.quota, used: allowance.used };
}
