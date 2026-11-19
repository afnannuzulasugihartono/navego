// @last-edited: 2026-11-20 UTC+7.
// @title: local-wallet-tools — a declared wallet tool is a branch the job-tools module the server delegates to answers.
// @state: the seven tools, their required arguments, and the order that keeps them reachable with the browser closed.
// @dependencies: node:test, node:assert/strict, node:fs, ../local/tools.js.

// THE DECLARATION AND THE BRANCH ARE CHECKED TOGETHER.
// A tool listed but not handled answers nothing, and the agent reads that as a refusal with no reason.
// The wallet tools are also the only ones that must work with no tab open, so their branch has to be answered before the tab is resolved - the dispatcher hands the job tools over before it asks for the tab.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { TOOLS } from '../../local/tools.js';

const WALLET_TOOLS = ['wallet_pair_device', 'wallet_get_balance', 'wallet_get_price', 'wallet_add_funds', 'wallet_hold_price', 'wallet_charge', 'wallet_refund'];

test('every wallet tool is declared once', () => {
  const names = TOOLS.map((tool) => tool.name);
  for (const name of WALLET_TOOLS) {
    assert.equal(names.filter((candidate) => candidate === name).length, 1, `${name} must be declared exactly once`);
  }
});

test('every declared wallet tool has a branch in the job tools the server delegates to', () => {
  const jobTools = fs.readFileSync(new URL('../../local/job-tools.js', import.meta.url), 'utf8');
  for (const name of WALLET_TOOLS) {
    assert.match(jobTools, new RegExp(`name === '${name}'`), `${name} is advertised but never answered`);
  }
});

test('a tool that spends money states what it needs', () => {
  const required = Object.fromEntries(TOOLS.map((tool) => [tool.name, tool.inputSchema.required || []]));
  assert.deepEqual(required.wallet_hold_price, ['artifact', 'estSteps']);
  assert.deepEqual(required.wallet_charge, ['reservationId', 'artifactHash']);
  assert.deepEqual(required.wallet_refund, ['reservationId', 'reason']);
  assert.deepEqual(required.wallet_pair_device, ['code', 'deviceName']);
  assert.deepEqual(required.wallet_get_balance, []);
});

test('the wallet answers before a tab is resolved, because a wallet has no tab', () => {
  const dispatcher = fs.readFileSync(new URL('../../local/mcp-server.js', import.meta.url), 'utf8');
  const walletBranch = dispatcher.indexOf('runJobTools');
  const tab = dispatcher.indexOf('runBrowserAction');
  assert.ok(walletBranch > 0 && tab > 0, 'both the job-tools delegation and the browser delegation must exist');
  assert.ok(walletBranch < tab, 'the job tools are answered before the tab is resolved');
});
