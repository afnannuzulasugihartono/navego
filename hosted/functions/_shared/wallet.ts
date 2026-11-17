// @last-edited: 2026-11-04 UTC+7.
// @title: wallet - what one task may cost, and how a plan is split before money is held.
// @state: the ten-action bound, the thirty-minute hold, the classification of a plan into one task or a batch, and the quote that turns the price list into one number.
// @dependencies: none.

// WHY THE PRICE IS DECIDED FROM THE PLAN'S SHAPE AND NOT FROM A LIST OF TASK TYPES.
// A list of types is a list somebody has to maintain, and the moment it lags the product the price is wrong for the newest thing the product can do.
// The plan already says what it produces and roughly how many actions it takes, so those two facts are what the price reads: one artifact, a document, or a list of independent items.
// The numbers themselves stay in the price table; this module only decides which row a plan belongs to and how many of it a plan needs.

// WHY THE CLIENT'S OWN PLAN IS TRUSTED AS THE INPUT.
// The work runs on the customer's device with the customer's own model, so an understated plan buys a cheaper price for work they still have to do themselves.
// The bound that matters is not the estimate but the ten actions one job may take, and that bound is enforced where the money is: in the database, on the reservation.

export const ACTION_CAP = 10;
const BATCH_SIZE = 10;
export const HOLD_MS = 30 * 60 * 1000;
export const DEPOSIT_KIND = 'wallet.deposit';

export interface PriceRow {
  kind: string;
  amount_cents?: number;
  amountCents?: number;
  currency?: string;
}

export interface Plan {
  artifact?: string;
  estSteps?: number;
  steps?: number;
  items?: number;
}

export interface ClassifySingle {
  ok: true;
  mode: 'single';
  kind: string;
  items: 1;
  chunks: 1;
  stepsPerChunk: number;
  why?: undefined;
  steps?: undefined;
}

export interface ClassifyBatch {
  ok: true;
  mode: 'batch';
  kind: string;
  items: number;
  chunks: number;
  stepsPerChunk: number;
  why?: undefined;
  steps?: undefined;
}

export interface ClassifyFailure {
  ok: false;
  why?: string;
  kind?: undefined;
  items?: undefined;
  chunks?: number;
  stepsPerChunk?: number;
  mode?: undefined;
  steps?: number;
}

export type ClassifyResult = ClassifySingle | ClassifyBatch | ClassifyFailure;

export const SINGLE_KIND: Readonly<Record<string, string>> = Object.freeze({ page: 'task.simple', document: 'task.report' });

function wholeNumber(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function unitPrice(prices: unknown, kind: string | undefined): { amountCents: number; currency: string } | null {
  const rows: PriceRow[] = Array.isArray(prices) ? (prices as PriceRow[]) : [];
  const row = rows.find((entry) => entry && entry.kind === kind);
  if (!row) return null;
  const amount = Number(row.amount_cents ?? row.amountCents);
  if (!Number.isInteger(amount) || amount <= 0) return null;
  return { amountCents: amount, currency: row.currency || 'IDR' };
}

// WHY A LIST IS SPLIT BEFORE ANY MONEY IS HELD.
// One reservation covers one bounded job, and a list of thirty items is three jobs of ten, each of which can fail and be refunded on its own.
// Splitting after the hold would mean one failed item drags the whole price into a refund or holds money for work that never started.

export function classifyPlan(plan: Plan | null | undefined): ClassifyResult {
  if (!plan || typeof plan !== 'object') return { ok: false, why: 'no-plan' };
  const artifact = plan.artifact;
  const estSteps = wholeNumber(plan.estSteps ?? plan.steps);
  if (estSteps === null) return { ok: false, why: 'no-step-estimate' };
  if (artifact === 'list') {
    const items = wholeNumber(plan.items);
    if (items === null || items < 1) return { ok: false, why: 'no-item-count' };
    const chunks = Math.ceil(items / BATCH_SIZE);
    const stepsPerChunk = Math.ceil(estSteps / chunks);
    if (stepsPerChunk > ACTION_CAP) return { ok: false, why: 'steps-per-chunk-over-cap', chunks, stepsPerChunk };
    return { ok: true, mode: 'batch', kind: 'task.batch_item', items, chunks, stepsPerChunk };
  }
  const kind = SINGLE_KIND[artifact ?? ''];
  if (!kind) return { ok: false, why: 'unknown-artifact' };
  if (estSteps > ACTION_CAP) return { ok: false, why: 'steps-over-cap', steps: estSteps };
  return { ok: true, mode: 'single', kind, items: 1, chunks: 1, stepsPerChunk: estSteps };
}

export function quotePlan(plan: Plan | null | undefined, prices: unknown) {
  const shape = classifyPlan(plan);
  if (!shape.ok) return shape;
  const okShape = shape as Extract<ClassifyResult, { ok: true }>;
  const price = unitPrice(prices, okShape.kind);
  if (!price) return { ok: false, why: 'no-price', kind: shape.kind };
  const amountCents = okShape.mode === 'batch' ? price.amountCents * (okShape.items ?? 0) : price.amountCents;
  return {
    ok: true,
    mode: okShape.mode,
    kind: okShape.kind,
    items: okShape.items,
    chunks: okShape.chunks,
    stepsPerChunk: okShape.stepsPerChunk,
    amountCents,
    currency: price.currency
  };
}

// WHY THE BATCH IS SPLIT BY ITEMS AND NOT BY STEPS.
// The person asked for thirty rows, so the unit they can judge is ten rows, not ten clicks.
// A chunk that is worth nothing to the person is a chunk they cannot refuse on its own.

export function splitBatch(items: unknown): number[] {
  const total = wholeNumber(items);
  if (total === null || total < 1) return [];
  const chunks: number[] = [];
  for (let left = total; left > 0; left -= BATCH_SIZE) chunks.push(Math.min(BATCH_SIZE, left));
  return chunks;
}
