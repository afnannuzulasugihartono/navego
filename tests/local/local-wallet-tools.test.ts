// @last-edited: 2026-11-04 UTC+7.
// @title: local-wallet-tools — a declared wallet tool is a branch the local server actually answers.
// @state: the seven tools, their required arguments, and the order that keeps them reachable with the browser closed.
// @dependencies: node:test, node:assert/strict, node:fs, ../local/tools.js.

// THE DECLARATION AND THE BRANCH ARE CHECKED TOGETHER.
// A tool listed but not handled answers nothing, and the agent reads that as a refusal with no reason.
// The wallet tools are also the only ones that must work with no tab open, so their branch has to come before the tab is resolved.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { TOOLS } from '../../local/tools.js';

const server = fs.readFileSync(new URL('../../local/mcp-server.js', import.meta.url), 'utf8');
const WALLET_TOOLS = ['wallet_pair_device', 'wallet_get_balance', 'wallet_get_price', 'wallet_add_funds', 'wallet_hold_price', 'wallet_charge', 'wallet_refund'];

test('every wallet tool is declared once', () => {
  const names = TOOLS.map((tool) => tool.name);
  for (const name of WALLET_TOOLS) {
    assert.equal(names.filter((candidate) => candidate === name).length, 1, `${name} must be declared exactly once`);
  }
});

test('every declared wallet tool has a branch in the server', () => {
  for (const name of WALLET_TOOLS) {
    assert.match(server, new RegExp(`name === '${name}'`), `${name} is advertised but never answered`);
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
  const walletBranch = server.indexOf("name === 'wallet_get_balance'");
  const tab = server.indexOf("name === 'browser_close_tab'");
  assert.ok(walletBranch > 0 && tab > 0, 'both the wallet branch and the tab resolution must exist');
  assert.ok(walletBranch < tab, 'a wallet call that needed a tab would fail with the browser closed');
});
