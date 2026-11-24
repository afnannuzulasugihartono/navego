// @last-edited: 2026-11-24 UTC+7.
// @title: survival-economy - the ledger of what Navego earns and what it costs, held to the shape the rules promise.
// @state: the file parses, a sale is only a settled sale, every cost names its payer and its source, and AGENTS.md still carries the rule that points here.
// @dependencies: node:test, strict, fs, ../../docs/economy.json, ../../AGENTS.md.

// THE DEFECT THIS FILE LOCKS.
// The product had one active plan and zero settled orders, and nothing in the tree said so: a session could spend a month on polish while the thing that keeps the agent alive never moved.
// A file that must name its numbers makes that silence visible, and the gate makes a stale file fail instead of flattering the next reader.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const economy = JSON.parse(readFileSync(new URL('docs/economy.json', root), 'utf8')) as Record<string, unknown>;
const agents = readFileSync(new URL('AGENTS.md', root), 'utf8');

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const PERIODS = ['monthly', 'yearly', 'once'];

test('the ledger is dated and cannot be dated in the future', () => {
  const updated = String(economy.updated_at ?? '');
  assert.match(updated, ISO_DAY);
  const stamp = Date.parse(`${updated}T00:00:00Z`);
  assert.ok(Number.isFinite(stamp), 'updated_at must parse');
  assert.ok(stamp <= Date.now() + 24 * 60 * 60 * 1000, 'the ledger may not claim a date that has not happened');
});

test('a sale is a settled sale: zero orders means no settlement date, and orders mean one', () => {
  const revenue = (economy.revenue ?? {}) as Record<string, unknown>;
  const orders = Number(revenue.settled_orders);
  assert.ok(Number.isInteger(orders) && orders >= 0, 'settled_orders is a whole number of charges');
  assert.ok(Number(revenue.settled_usd) >= 0, 'settled_usd is a number');
  assert.ok(String(revenue.verified_by ?? '').length > 10, 'the number must say how it was checked');
  if (orders === 0) assert.equal(revenue.last_settled_at, null, 'no orders means no settlement date');
  else assert.match(String(revenue.last_settled_at ?? ''), /^\d{4}-\d{2}-\d{2}/, 'orders carry the date of the last settlement');
});

test('every cost names an amount, a period, a payer and a source', () => {
  const costs = economy.costs;
  assert.ok(Array.isArray(costs), 'costs is a list');
  for (const cost of costs as Array<Record<string, unknown>>) {
    assert.ok(String(cost.name ?? '').length > 0, 'a cost has a name');
    assert.ok(Number(cost.amount_usd) >= 0, `${String(cost.name)} has an amount`);
    assert.ok(PERIODS.includes(String(cost.period)), `${String(cost.name)} has a period`);
    assert.ok(String(cost.paid_from ?? '').length > 0, `${String(cost.name)} says who pays`);
    assert.ok(String(cost.source ?? '').length > 0, `${String(cost.name)} says where the figure came from`);
  }
});

test('the ledger carries one next money action, not a plan', () => {
  const next = String(economy.next_action ?? '');
  assert.ok(next.length > 20, 'the next action is specific enough to do');
  assert.ok(!/\bvarious\b|\betc\b/i.test(next), 'a next action is one action');
});

test('AGENTS.md still carries the rule that makes this file load-bearing', () => {
  assert.match(agents, /docs\/economy\.json/, 'the rule names the ledger');
  assert.match(agents, /A sale is a settled, signed payment and nothing else/, 'revenue is defined as a settlement');
  assert.match(agents, /Earn enough to keep the agent alive/, 'the mission binds every session');
  assert.match(agents, /Pay the bills from the product/, 'the product pays, not the owner');
});
