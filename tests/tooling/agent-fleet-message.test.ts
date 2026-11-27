import test from 'node:test';
import assert from 'node:assert/strict';
import { labelOf, messageIdOf, assertAllowed } from '../../scripts/dev/agent-fleet/message.ts';

const roster = {
  version: 1,
  operatorSessionTitle: 'slot-console',
  messagePairs: [
    { from: 'engineer', to: 'operator', kinds: ['report'] },
    { from: 'sales-rep', to: 'operator', kinds: ['report'] },
    { from: 'onboarding-guide', to: 'operator', kinds: ['report'] },
    { from: 'operator', to: 'engineer', kinds: ['review', 'approve'] },
    { from: 'operator', to: 'sales-rep', kinds: ['review', 'approve'] },
    { from: 'operator', to: 'onboarding-guide', kinds: ['review', 'approve'] },
  ],
};

test('a report carries a visible sender label and a stable idempotency id', () => {
  const input = { kind: 'report' as const, from: 'engineer' as const, to: 'operator' as const, ticket: 't.md', round: 1, text: 'pointer' };
  assert.equal(labelOf(input), '[LANE-REPORT engineer] ticket=t.md round=1');
  assert.equal(messageIdOf(input), 't.md:1:report');
});

test('only a lane report to the operator and an operator review are allowed', () => {
  assert.doesNotThrow(() => assertAllowed({ kind: 'report', from: 'engineer', to: 'operator', ticket: 't.md', round: 1, text: 'x' }, roster));
  assert.doesNotThrow(() => assertAllowed({ kind: 'review', from: 'operator', to: 'engineer', ticket: 't.md', round: 2, text: 'x' }, roster));
  assert.throws(() => assertAllowed({ kind: 'report', from: 'engineer', to: 'sales-rep', ticket: 't.md', round: 1, text: 'x' }, roster), /NOT_ALLOWED/);
  assert.throws(() => assertAllowed({ kind: 'review', from: 'sales-rep', to: 'engineer', ticket: 't.md', round: 1, text: 'x' }, roster), /NOT_ALLOWED/);
  assert.throws(() => assertAllowed({ kind: 'approve', from: 'operator', to: 'operator', ticket: 't.md', round: 1, text: 'x' }, roster), /NOT_ALLOWED/);
});

test('round four is refused so the loop cannot run forever', () => {
  assert.throws(
    () => assertAllowed({ kind: 'review', from: 'operator', to: 'engineer', ticket: 't.md', round: 4, text: 'x' }, roster),
    /ROUND_LIMIT_REACHED/,
  );
});
