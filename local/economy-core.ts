// @last-edited: 2026-11-24 UTC+7.
// @title: economy-core - the rules that turn money movement into points, spend permission, and upgrade choice.
// @state: the event shape, the decision score, the spend gate, the upgrade choice, and the objective summary.
// @dependencies: none.

// The event is the only money record.
// One row, one direction, one currency, one decision it belongs to.
// A correction is another event, never an edit, so the history stays true.

export const ECONOMY_EVENT_KINDS = ['revenue', 'cost', 'subscription', 'refund'] as const;
export type EconomyEventKind = (typeof ECONOMY_EVENT_KINDS)[number];

export interface EconomyEvent {
  id: string;
  at: string;
  kind: EconomyEventKind;
  amountMinor: number;
  currency: string;
  decisionId: string;
  source: string;
  note?: string;
}

export class EconomyError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'EconomyError';
    this.code = code;
  }
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, limit: number, fieldName: string): string {
  if (typeof value !== 'string') throw new EconomyError('BAD_EVENT', `${fieldName} must be a string.`);
  const normalized = value.trim();
  if (!normalized) throw new EconomyError('BAD_EVENT', `${fieldName} must not be empty.`);
  if (normalized.length > limit) throw new EconomyError('BAD_EVENT', `${fieldName} is longer than ${limit} characters.`);
  return normalized;
}

// An event crosses a trust boundary when it is read from disk, so every named field is read and checked here.

export function normalizeEvent(raw: unknown): EconomyEvent {
  if (!isObject(raw)) throw new EconomyError('BAD_EVENT', 'an economy event must be an object.');
  const id = text(Reflect.get(raw, 'id'), 128, 'id');
  if (!ID_PATTERN.test(id)) throw new EconomyError('BAD_EVENT', 'id has an unsupported shape.');
  const at = text(Reflect.get(raw, 'at'), 40, 'at');
  if (!Number.isFinite(Date.parse(at))) throw new EconomyError('BAD_EVENT', 'at must be a timestamp.');
  const kind = text(Reflect.get(raw, 'kind'), 20, 'kind');
  if (!ECONOMY_EVENT_KINDS.includes(kind as EconomyEventKind)) {
    throw new EconomyError('BAD_EVENT', `kind must be one of ${ECONOMY_EVENT_KINDS.join(', ')}.`);
  }
  const amountMinor = Reflect.get(raw, 'amountMinor');
  if (typeof amountMinor !== 'number' || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new EconomyError('BAD_EVENT', 'amountMinor must be a positive integer.');
  }
  const currency = text(Reflect.get(raw, 'currency'), 3, 'currency');
  if (!CURRENCY_PATTERN.test(currency)) throw new EconomyError('BAD_EVENT', 'currency must be three uppercase letters.');
  const decisionId = text(Reflect.get(raw, 'decisionId'), 128, 'decisionId');
  if (!ID_PATTERN.test(decisionId)) throw new EconomyError('BAD_EVENT', 'decisionId has an unsupported shape.');
  const source = text(Reflect.get(raw, 'source'), 500, 'source');
  const rawNote = Reflect.get(raw, 'note');
  const note = rawNote === undefined || rawNote === null ? undefined : text(rawNote, 1000, 'note');
  return {
    id,
    at: new Date(at).toISOString(),
    kind: kind as EconomyEventKind,
    amountMinor,
    currency,
    decisionId,
    source,
    ...(note ? { note } : {})
  };
}

// Cash is the sum of the events, per currency.
// No balance column exists, because a column is overwritten by whoever writes last.

export function cashByCurrency(events: readonly EconomyEvent[]): Record<string, number> {
  const cash: Record<string, number> = {};
  for (const event of events) {
    const signed = event.kind === 'revenue' || event.kind === 'refund' ? event.amountMinor : -event.amountMinor;
    cash[event.currency] = (cash[event.currency] ?? 0) + signed;
  }
  return cash;
}

export interface DecisionScore {
  decisionId: string;
  revenueMinor: number;
  costMinor: number;
  netMinor: number;
  points: number;
  earning: boolean;
}

// A decision earns points only when it left money in the account.
// A decision that spent money without bringing any back is minus, and the rule does not soften itself.

export const EARNING_POINTS = 10;
export const LOSING_POINTS = -1;

export function decisionScores(events: readonly EconomyEvent[]): DecisionScore[] {
  const byDecision = new Map<string, { revenueMinor: number; costMinor: number }>();
  for (const event of events) {
    const row = byDecision.get(event.decisionId) ?? { revenueMinor: 0, costMinor: 0 };
    if (event.kind === 'revenue' || event.kind === 'refund') row.revenueMinor += event.amountMinor;
    else row.costMinor += event.amountMinor;
    byDecision.set(event.decisionId, row);
  }
  const scores: DecisionScore[] = [];
  for (const [decisionId, row] of byDecision) {
    const netMinor = row.revenueMinor - row.costMinor;
    const earning = netMinor > 0;
    scores.push({ decisionId, ...row, netMinor, points: earning ? EARNING_POINTS : LOSING_POINTS, earning });
  }
  scores.sort((left, right) => right.netMinor - left.netMinor || (left.decisionId < right.decisionId ? -1 : 1));
  return scores;
}

export function totalPoints(events: readonly EconomyEvent[]): number {
  return decisionScores(events).reduce((sum, score) => sum + score.points, 0);
}

// The spend gate is a fraction of arrived cash, so it works the same in every currency.

export interface SpendPolicy {
  maxSpendFractionOfCash: number;
  reserveFractionOfCash: number;
}

export const DEFAULT_SPEND_POLICY: SpendPolicy = Object.freeze({
  maxSpendFractionOfCash: 0.5,
  reserveFractionOfCash: 0.5
});

export interface SpendDecision {
  allowed: boolean;
  why: string;
  currency: string;
  cashMinor: number;
  spendableMinor: number;
  amountMinor: number;
}

function spendableFor(cashMinor: number, policy: SpendPolicy): number {
  const fraction = Math.min(policy.maxSpendFractionOfCash, 1 - policy.reserveFractionOfCash);
  return Math.max(0, Math.floor(cashMinor * fraction));
}

// Money can be spent only out of revenue that actually arrived, and only while the reserve holds.

export function evaluateSpend(
  events: readonly EconomyEvent[],
  request: { amountMinor: number; currency: string; policy?: SpendPolicy }
): SpendDecision {
  const policy = request.policy ?? DEFAULT_SPEND_POLICY;
  const currency = request.currency.toUpperCase();
  const amountMinor = request.amountMinor;
  const cashMinor = cashByCurrency(events)[currency] ?? 0;
  const spendableMinor = spendableFor(cashMinor, policy);
  const arrived = events.some((event) => event.currency === currency && (event.kind === 'revenue' || event.kind === 'refund'));
  const base = { currency, cashMinor, spendableMinor, amountMinor };

  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    return { allowed: false, why: 'the amount must be a positive integer in minor units.', ...base };
  }
  if (!arrived) {
    return { allowed: false, why: `no revenue has arrived in ${currency} yet.`, ...base };
  }
  if (cashMinor <= 0) {
    return { allowed: false, why: `the ${currency} balance is not positive.`, ...base };
  }
  if (amountMinor > spendableMinor) {
    return { allowed: false, why: `the spend leaves the reserve short: ${spendableMinor} ${currency} is spendable.`, ...base };
  }
  return { allowed: true, why: `the spend keeps the ${currency} reserve intact.`, ...base };
}

export interface SubscriptionOption {
  id: string;
  label: string;
  monthlyMinor: number;
  currency: string;
  capabilityScore: number;
  capacityUnits: number;
  source: string;
}

export interface CurrentSubscription {
  currency: string;
  capabilityScore: number;
  capacityUnits: number;
}

export interface UpgradeChoice {
  action: 'keep' | 'upgrade';
  option: SubscriptionOption | null;
  why: string;
  spendableMinor: number;
}

// The upgrade is the better option that the reserve can carry, and the cheapest one wins a tie.

export function chooseUpgrade(request: {
  current: CurrentSubscription;
  options: readonly SubscriptionOption[];
  events: readonly EconomyEvent[];
  policy?: SpendPolicy;
}): UpgradeChoice {
  const policy = request.policy ?? DEFAULT_SPEND_POLICY;
  const cashMinor = cashByCurrency(request.events)[request.current.currency] ?? 0;
  const spendableMinor = spendableFor(cashMinor, policy);
  const currency = request.current.currency.toUpperCase();
  const better = request.options.filter((option) => {
    if (!option.source) return false;
    if (option.currency.toUpperCase() !== currency) return false;
    if (option.capabilityScore > request.current.capabilityScore) return true;
    return option.capabilityScore === request.current.capabilityScore && option.capacityUnits > request.current.capacityUnits;
  });
  if (!better.length) {
    return { action: 'keep', option: null, why: 'no source-backed option beats the current subscription.', spendableMinor };
  }
  const affordable = better.filter((option) => {
    const spend = evaluateSpend(request.events, { amountMinor: option.monthlyMinor, currency, policy });
    return spend.allowed;
  });
  if (!affordable.length) {
    return { action: 'keep', option: null, why: `the ${currency} reserve cannot carry a better subscription yet.`, spendableMinor };
  }
  affordable.sort((left, right) =>
    right.capabilityScore - left.capabilityScore ||
    right.capacityUnits - left.capacityUnits ||
    left.monthlyMinor - right.monthlyMinor ||
    (left.id < right.id ? -1 : 1)
  );
  const chosen = affordable[0];
  return {
    action: 'upgrade',
    option: chosen ?? null,
    why: `${chosen?.label ?? 'the chosen option'} is the best affordable improvement.`,
    spendableMinor
  };
}

export interface ObjectiveSummary {
  cashByCurrency: Record<string, number>;
  points: number;
  decisions: number;
  earningDecisions: number;
  windowRevenueMinor: number;
  windowCostMinor: number;
  windowNetMinor: number;
  runwayMonths: number | null;
  currency: string;
}

// The objective is plain: arrived cash must cover the running cost, and the surplus must grow.

export function summarizeEconomy(
  events: readonly EconomyEvent[],
  request: { asOf: string; windowDays: number; currency?: string; policy?: SpendPolicy }
): ObjectiveSummary {
  const asOf = Date.parse(request.asOf);
  if (!Number.isFinite(asOf)) throw new EconomyError('BAD_WINDOW', 'asOf must be a timestamp.');
  const windowMs = request.windowDays * 24 * 60 * 60 * 1000;
  const from = asOf - windowMs;
  const cash = cashByCurrency(events);
  const currency = (request.currency ?? Object.keys(cash).sort()[0] ?? 'USD').toUpperCase();
  let windowRevenueMinor = 0;
  let windowCostMinor = 0;
  for (const event of events) {
    if (event.currency !== currency) continue;
    const at = Date.parse(event.at);
    if (!Number.isFinite(at) || at < from || at > asOf) continue;
    if (event.kind === 'revenue' || event.kind === 'refund') windowRevenueMinor += event.amountMinor;
    else windowCostMinor += event.amountMinor;
  }
  const windowNetMinor = windowRevenueMinor - windowCostMinor;
  const scores = decisionScores(events);
  const runwayMonths = windowCostMinor > 0 ? Number(((cash[currency] ?? 0) / windowCostMinor).toFixed(2)) : null;
  return {
    cashByCurrency: cash,
    points: scores.reduce((sum, score) => sum + score.points, 0),
    decisions: scores.length,
    earningDecisions: scores.filter((score) => score.earning).length,
    windowRevenueMinor,
    windowCostMinor,
    windowNetMinor,
    runwayMonths,
    currency
  };
}
