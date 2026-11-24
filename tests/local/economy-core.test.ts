// @last-edited: 2026-11-24 UTC+7.
// @title: economy-core - the money rules that decide points, spend permission, and upgrade choice.
// @state: the event contract, the earning rule, the reserve gate, the upgrade choice, and the objective summary.
// @dependencies: node:test, strict, ../../local/economy-core.js.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  chooseUpgrade,
  decisionScores,
  evaluateSpend,
  normalizeEvent,
  summarizeEconomy,
  totalPoints,
  type EconomyEvent
} from '../../local/economy-core.js';

const event = (overrides: Partial<EconomyEvent> = {}): EconomyEvent => ({
  id: 'evt-1',
  at: '2026-11-20T00:00:00.000Z',
  kind: 'revenue',
  amountMinor: 100_000,
  currency: 'USD',
  decisionId: 'decision-1',
  source: 'https://navego.pages.dev/harga',
  ...overrides
});

test('an event read from outside is checked once, at the boundary', () => {
  const normalized = normalizeEvent({ ...event(), at: '2026-11-20T00:00:00.000Z', note: undefined });
  assert.equal(normalized.kind, 'revenue');
  assert.equal(normalized.amountMinor, 100_000);
  assert.equal(normalized.note, undefined);
  assert.throws(() => normalizeEvent({ ...event(), amountMinor: -1 }), /positive integer/);
  assert.throws(() => normalizeEvent({ ...event(), currency: 'usd' }), /three uppercase letters/);
  assert.throws(() => normalizeEvent({ ...event(), kind: 'guess' }), /kind must be one of/);
  assert.throws(() => normalizeEvent('not-an-object'), /must be an object/);
});

test('cash is the sum of the events, and a cost subtracts', () => {
  const events = [
    event({ id: 'e1' }),
    event({ id: 'e2', kind: 'cost', amountMinor: 25_000, decisionId: 'decision-2' })
  ];
  const summary = summarizeEconomy(events, { asOf: '2026-11-21T00:00:00.000Z', windowDays: 30, currency: 'USD' });
  assert.equal(summary.cashByCurrency.USD, 75_000);
  assert.equal(summary.windowRevenueMinor, 100_000);
  assert.equal(summary.windowCostMinor, 25_000);
  assert.equal(summary.windowNetMinor, 75_000);
});

test('a decision that brought money scores plus, a decision that did not scores minus', () => {
  const events = [
    event({ id: 'e1', decisionId: 'winner' }),
    event({ id: 'e2', kind: 'cost', amountMinor: 10_000, decisionId: 'loser' })
  ];
  const scores = decisionScores(events);
  const winner = scores.find((score) => score.decisionId === 'winner');
  const loser = scores.find((score) => score.decisionId === 'loser');
  assert.equal(winner?.points, 10);
  assert.equal(winner?.earning, true);
  assert.equal(loser?.points, -1);
  assert.equal(loser?.earning, false);
  assert.equal(totalPoints(events), 9);
});

test('a decision that only spent money is minus, never zero', () => {
  const events = [event({ kind: 'cost', decisionId: 'burn' })];
  assert.equal(totalPoints(events), -1);
});

test('money cannot be spent before revenue arrived', () => {
  const decision = evaluateSpend([], { amountMinor: 1_000, currency: 'USD' });
  assert.equal(decision.allowed, false);
  assert.match(decision.why, /no revenue has arrived/);
});

test('the reserve keeps half of the arrived cash, so a spend above it is refused', () => {
  const events = [event({ amountMinor: 100_000 })];
  const refused = evaluateSpend(events, { amountMinor: 60_000, currency: 'USD' });
  assert.equal(refused.allowed, false);
  assert.equal(refused.spendableMinor, 50_000);
  assert.match(refused.why, /reserve/);
  const allowed = evaluateSpend(events, { amountMinor: 50_000, currency: 'USD' });
  assert.equal(allowed.allowed, true);
});

test('a cost is a real cost, so the reserve shrinks after spending', () => {
  const events = [
    event({ id: 'e1', amountMinor: 100_000 }),
    event({ id: 'e2', kind: 'cost', amountMinor: 60_000, decisionId: 'other' })
  ];
  const decision = evaluateSpend(events, { amountMinor: 20_000, currency: 'USD' });
  assert.equal(decision.cashMinor, 40_000);
  assert.equal(decision.spendableMinor, 20_000);
  assert.equal(decision.allowed, true);
});

test('the best affordable subscription is chosen, and a better one the reserve cannot carry is refused', () => {
  const events = [event({ amountMinor: 100_000 })];
  const options = [
    {
      id: 'pro',
      label: 'Pro $20',
      monthlyMinor: 2_000,
      currency: 'USD',
      capabilityScore: 90,
      capacityUnits: 100,
      source: 'https://www.anthropic.com/pricing'
    },
    {
      id: 'max',
      label: 'Max $100',
      monthlyMinor: 10_000,
      currency: 'USD',
      capabilityScore: 95,
      capacityUnits: 200,
      source: 'https://www.anthropic.com/pricing'
    }
  ];
  const affordable = chooseUpgrade({
    current: { currency: 'USD', capabilityScore: 50, capacityUnits: 50 },
    options,
    events
  });
  assert.equal(affordable.action, 'upgrade');
  assert.equal(affordable.option?.id, 'max');

  const expensive = options[1];
  assert.ok(expensive);
  const thin = chooseUpgrade({
    current: { currency: 'USD', capabilityScore: 50, capacityUnits: 50 },
    options: [expensive],
    events: [event({ amountMinor: 6_000 })]
  });
  assert.equal(thin.action, 'keep');
  assert.match(thin.why, /reserve cannot carry/);
});

test('an option without a source is never an upgrade candidate', () => {
  const choice = chooseUpgrade({
    current: { currency: 'USD', capabilityScore: 10, capacityUnits: 10 },
    options: [
      {
        id: 'claim',
        label: 'Unverified better plan',
        monthlyMinor: 100,
        currency: 'USD',
        capabilityScore: 99,
        capacityUnits: 99,
        source: ''
      }
    ],
    events: [event({ amountMinor: 1_000_000 })]
  });
  assert.equal(choice.action, 'keep');
  assert.match(choice.why, /source-backed/);
});

test('the objective reads the window, the points, and the runway', () => {
  const events = [
    event({ id: 'e1', at: '2026-11-20T00:00:00.000Z', amountMinor: 300_000 }),
    event({ id: 'e2', at: '2026-11-20T00:00:00.000Z', kind: 'cost', amountMinor: 100_000, decisionId: 'cost-1' }),
    event({ id: 'e3', at: '2026-08-01T00:00:00.000Z', amountMinor: 900_000, decisionId: 'decision-3' })
  ];
  const summary = summarizeEconomy(events, { asOf: '2026-11-21T00:00:00.000Z', windowDays: 30, currency: 'USD' });
  assert.equal(summary.cashByCurrency.USD, 1_100_000);
  assert.equal(summary.windowRevenueMinor, 300_000);
  assert.equal(summary.windowCostMinor, 100_000);
  assert.equal(summary.windowNetMinor, 200_000);
  assert.equal(summary.decisions, 3);
  assert.equal(summary.earningDecisions, 2);
  assert.equal(summary.points, 19);
  assert.equal(summary.runwayMonths, 11);
});
