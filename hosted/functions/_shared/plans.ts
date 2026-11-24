// @last-edited: 2026-11-18 UTC+7.
// @title: plans - what each plan costs and allows, in one place, for both bridges.
// @state: the seven USD tiers, five in the affordable band (1, 3, 5, 7, 9 dollars/month) and two in the enterprise band (17 dollars / 6 months and 33 dollars / year): their price, daily quota, sessions, minute cap, and the firm features the enterprise tiers get.
// @dependencies: none.
// decisions.json -> hosted-paypal-price-01

// THIS FILE EXISTS The gate lives in the service, never in the binary, so the service needs one place that says what a plan allows.
// Two surfaces read it: the hosted MCP for the account's plan, and the loopback bridge for the session allowance a paired device gets for that account.

// NULL MEANS UNLIMITED.
// A number says how much; null says there is no cap at all.
// The annual tier promises no minute limit and no daily limit, and the promise reads faster than a billion.

export interface PlanFeatures {
  all: boolean;
  statement: boolean;
  vm: boolean;
  remoteDrive: boolean;
}

export interface PlanDefinition {
  priceCents: number;
  dailyQuota: number | null;
  sessionAllowance: number;
  rpm: number | null;
  features: PlanFeatures;
}

export const PLANS: Readonly<Record<string, Readonly<PlanDefinition>>> = Object.freeze({
  'plan.usd-1': Object.freeze({
    priceCents: 100,
    dailyQuota: 1000,
    sessionAllowance: 50,
    rpm: null,
    features: Object.freeze({ all: false, statement: false, vm: false, remoteDrive: false })
  }),
  'plan.usd-3': Object.freeze({
    priceCents: 300,
    dailyQuota: 3000,
    sessionAllowance: 50,
    rpm: null,
    features: Object.freeze({ all: false, statement: false, vm: false, remoteDrive: false })
  }),
  'plan.usd-5': Object.freeze({
    priceCents: 500,
    dailyQuota: 5000,
    sessionAllowance: 50,
    rpm: null,
    features: Object.freeze({ all: false, statement: false, vm: false, remoteDrive: false })
  }),
  'plan.usd-7': Object.freeze({
    priceCents: 700,
    dailyQuota: 7000,
    sessionAllowance: 50,
    rpm: null,
    features: Object.freeze({ all: false, statement: false, vm: false, remoteDrive: false })
  }),
  'plan.usd-9': Object.freeze({
    priceCents: 900,
    dailyQuota: 9000,
    sessionAllowance: 50,
    rpm: null,
    features: Object.freeze({ all: false, statement: false, vm: false, remoteDrive: false })
  }),
  'plan.usd-17': Object.freeze({
    priceCents: 1700,
    dailyQuota: 17000,
    sessionAllowance: 500,
    rpm: null,
    features: Object.freeze({ all: true, statement: true, vm: true, remoteDrive: true })
  }),
  'plan.usd-33': Object.freeze({
    priceCents: 3300,
    dailyQuota: null,
    sessionAllowance: 500,
    rpm: null,
    features: Object.freeze({ all: true, statement: true, vm: true, remoteDrive: true })
  })
});

export const DEFAULT_PLAN = 'plan.usd-1';
export type PlanName = keyof typeof PLANS | (string & {});

export function planFor(name: string): PlanDefinition {
  const plan = PLANS[name] ?? PLANS[DEFAULT_PLAN];
  if (!plan) throw new Error('the default plan definition is missing');
  return plan;
}

export function planPriceCents(name: string): number {
  const plan = PLANS[name];
  if (!plan) throw new Error(`unknown plan ${name}`);
  return plan.priceCents;
}

export function allowsFeature(name: string, feature: keyof PlanFeatures): boolean {
  return planFor(name).features[feature] === true;
}

export function planQuota(name: string): number | null {
  return planFor(name).dailyQuota;
}

export function planRPM(name: string): number | null {
  return planFor(name).rpm;
}
