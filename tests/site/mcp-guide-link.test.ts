// @last-edited: 2026-11-28 UTC+7.
// @title: mcp page links the signed-in Chrome answer people actually search for.
// @state: failing before the link exists, passing after it.
// @dependencies: node:test, node:assert, node:fs, site/app/routes/mcp.tsx.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../../site/app/routes/mcp.tsx', import.meta.url), 'utf8');

test('the MCP install page offers the signed-in Chrome guide', () => {
  assert.match(page, /to="\/panduan-mcp-chrome-login"/);
  assert.match(page, /Chrome yang sudah login|Chrome yang sudah Anda masuki/);
});