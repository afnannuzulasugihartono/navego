// @last-edited: 2026-11-28 UTC+7.
// @title: research gate - a machine decides whether a research ticket runs, before any agent is dispatched.
// @state: failing before scripts/dev/agent-fleet/research-gate.ts exists, passing after it.
// @dependencies: node:test, node:assert, scripts/dev/agent-fleet/research-gate.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { decideResearch, isTicketPath, researchDispatchAllowed, type ResearchTicket, type PriorFinding } from '../../scripts/dev/agent-fleet/research-gate.ts';

const now = Date.parse('2026-11-28T00:00:00Z');
const ticket: ResearchTicket = {
  decision: 'which public organisation gets the next bounded outreach',
  urls: ['https://developers.google.com/search/docs/essentials'],
  date: '2026-11-28',
  resultPath: 'RF-014-2026-11-28-research-automation.md'
};

const prior: PriorFinding[] = [];

test('a bounded ticket with a decision, a public URL and a numbered destination runs', () => {
  const verdict = decideResearch(ticket, { prior, now });
  assert.equal(verdict.verdict, 'run');
  assert.deepEqual(verdict.reasons, []);
});

test('a ticket that asks for outreach is skipped before any agent reads it', () => {
  const verdict = decideResearch({ ...ticket, asksOutreach: true }, { prior, now });
  assert.equal(verdict.verdict, 'skip');
  assert.match(verdict.reasons.join(' '), /outreach/i);
});

test('a ticket with no decision to change cannot be graded and waits for a person', () => {
  const verdict = decideResearch({ ...ticket, decision: '' }, { prior, now });
  assert.equal(verdict.verdict, 'needs-human');
  assert.match(verdict.reasons.join(' '), /decision/i);
});

test('a ticket with no source URL cannot produce dated evidence', () => {
  const verdict = decideResearch({ ...ticket, urls: [] }, { prior, now });
  assert.equal(verdict.verdict, 'needs-human');
  assert.match(verdict.reasons.join(' '), /URL/i);
});

test('a question already answered by a recent finding is skipped', () => {
  const verdict = decideResearch(ticket, {
    now,
    prior: [{
      id: 'RF-004',
      decision: 'which public organisation gets the next bounded outreach',
      date: '2026-11-27',
      urls: ['https://developers.google.com/search/docs/essentials']
    }]
  });
  assert.equal(verdict.verdict, 'skip');
  assert.match(verdict.reasons.join(' '), /already answered/i);
});

test('evidence older than thirty days is not fresh enough for a decision', () => {
  const verdict = decideResearch({ ...ticket, date: '2026-09-01' }, { prior, now });
  assert.equal(verdict.verdict, 'needs-human');
  assert.match(verdict.reasons.join(' '), /stale/i);
});

test('a result outside the numbered findings folder has no place to land', () => {
  const verdict = decideResearch({ ...ticket, resultPath: 'notes/idea.md' }, { prior, now });
  assert.equal(verdict.verdict, 'needs-human');
  assert.match(verdict.reasons.join(' '), /RF-/);
});

test('the CLI reads only markdown tickets inside the two ticket folders', () => {
  const root = path.resolve(new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  assert.equal(isTicketPath(path.join(root, 'docs/agent-roles/queue/operator-to-researcher-20261128.md'), root), true);
  assert.equal(isTicketPath(path.join(root, 'agents/shared/research/ticket.md'), root), true);
  assert.equal(isTicketPath(path.join(root, 'docs/economy.json'), root), false);
  assert.equal(isTicketPath(path.join(root, 'docs/agent-roles/queue/ticket.txt'), root), false);
  assert.equal(isTicketPath(path.join(root, '..', 'outside.md'), root), false);
});
test('dispatch is blocked for a research ticket the gate would skip', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-gate-'));
  try {
    fs.writeFileSync(path.join(dir, 'operator-to-researcher-20261128-0900.md'),
      'decision: which public surface to try next\nurl: https://developers.google.com/search/docs/essentials\ndate: 2026-11-28\nresult: RF-099-2026-11-28-example.md\noutreach: yes\n');
    fs.writeFileSync(path.join(dir, 'operator-to-engineer-20261128-0900.md'), 'class: product\n');
    assert.equal(researchDispatchAllowed('operator-to-engineer-20261128-0900.md', dir, dir), true, 'non-research tickets are unaffected');
    assert.equal(researchDispatchAllowed('operator-to-researcher-20261128-0900.md', dir, dir), false, 'a research ticket asking for outreach is not dispatched');
    assert.equal(researchDispatchAllowed('operator-to-researcher-missing.md', dir, dir), false, 'a missing ticket is not dispatched');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});