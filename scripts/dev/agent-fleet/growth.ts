// @last-edited: 2026-11-28 UTC+7.
// @title: growth engine - name the problem from live metrics, then judge the result without flattering it.
// @state: problem statements come from numbers; a flat result stays flat; a rise on a small sample stays weak; generated tickets pass the research gate.
// @dependencies: node:fs, node:path, node:url, ./research-gate.ts, strict.

// The owner should not have to ask "why is the money still zero?" every hour. The metric gap itself is the question.
// https://theleanstartup.com/principles (build-measure-learn) and https://en.wikipedia.org/wiki/PDCA (act, then compare predicted to actual)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTicket } from './research-gate.ts';

export interface GrowthInput {
  settledUsd: number;
  daysSinceSettlement: number;
  pricingBrowsers: number;
  strangerBuyClicks: number;
}

export type EffectVerdict = 'effective' | 'flat' | 'worse' | 'weak';

export interface EffectJudgement {
  verdict: EffectVerdict;
  delta: number;
  note: string;
}

export interface TicketOptions {
  date: string;
  resultPath: string;
  sourceUrl: string;
}

const MIN_SAMPLE = 30;

export function formulateProblem(input: GrowthInput): string {
  if (input.settledUsd === 0) return `Why do zero strangers pay after ${input.daysSinceSettlement} days?`;
  if (input.pricingBrowsers === 0) return 'Why does nobody reach the pricing page?';
  if (input.strangerBuyClicks === 0) return 'Why does nobody who reaches pricing click buy?';
  return 'Why do real buy clicks never settle into revenue?';
}

export function judgeEffect(before: number, after: number): EffectJudgement {
  const delta = after - before;
  if (delta === 0) return { verdict: 'flat', delta, note: 'no change; the hypothesis is not supported' };
  if (delta < 0) return { verdict: 'worse', delta, note: 'the metric moved backwards' };
  if (before < MIN_SAMPLE) return { verdict: 'weak', delta, note: 'sample is too small to call this effective' };
  return { verdict: 'effective', delta, note: 'the metric rose above the minimum sample' };
}

// A verdict that is never written down becomes a memory, and memories are easy to rewrite.
// Keep the before, after and judgement together.

export function recordEffect(file: string, key: string, before: number, after: number, now = Date.now()): EffectJudgement {
  const judgement = judgeEffect(before, after);
  let rows: Array<Record<string, unknown>> = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Array<Record<string, unknown>>;
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
  }
  rows.push({ key, before, after, verdict: judgement.verdict, delta: judgement.delta, note: judgement.note, at: new Date(now).toISOString() });
  fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');
  return judgement;
}

export function growthTicket(input: GrowthInput, options: TicketOptions): string {
  const problem = formulateProblem(input);
  const measure = input.settledUsd === 0 ? 'settled stranger orders' : 'stranger buy clicks';
  return [
    'class: measurement',
    `not-before: ${options.date}T00:00:00+07:00`,
    '',
    `# operator -> researcher -> ${options.date} - self-formed problem`,
    '',
    `decision: ${problem}`,
    `decision-change: choose one bounded change that could move ${measure}`,
    `url: ${options.sourceUrl}`,
    'url: https://navego.pages.dev/harga',
    `date: ${options.date}`,
    `result: ${options.resultPath}`,
    'outreach: no',
    '',
    '## Evidence to extract',
    '',
    'Read the public source and the live pricing page. Name one measurable reason the problem persists. Include one counter-evidence: the visitor may never have arrived at all.',
    '',
    'No invented customer, no outreach, no revenue claim.'
  ].join('\n') + '\n';
}

const invokedDirectly = process.argv[1] ? import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href : false;

if (invokedDirectly) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const queue = path.join(root, 'docs/agent-roles/queue');
  const date = new Date().toISOString().slice(0, 10);
  const name = `operator-to-researcher-${date}-growth.md`;
  const target = path.join(queue, name);
  const economy = JSON.parse(fs.readFileSync(path.join(root, 'docs/economy.json'), 'utf8')) as {
    revenue?: { settled_usd?: number }; mission?: { days_since_settlement?: number };
  };
  const state: GrowthInput = {
    settledUsd: Number(economy.revenue?.settled_usd ?? 0),
    daysSinceSettlement: Number(economy.mission?.days_since_settlement ?? 0),
    pricingBrowsers: 0,
    strangerBuyClicks: 0
  };
  const text = growthTicket(state, {
    date,
    resultPath: `RF-024-${date}-self-formed.md`,
    sourceUrl: 'https://baymard.com/research/checkout-usability'
  });
  if (!fs.existsSync(target) && parseTicket(text).decisionChange) fs.writeFileSync(target, text);
  console.log(JSON.stringify({ target, written: fs.existsSync(target), problem: formulateProblem(state) }, null, 2));
}
