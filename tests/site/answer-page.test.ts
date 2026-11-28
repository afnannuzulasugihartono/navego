// @last-edited: 2026-11-28 UTC+7.
// @title: answer-page test - one public page answers one real search question.
// @state: failing before the route exists, passing after it ships.
// @dependencies: node:test, node:assert, fs, path.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const site = path.join(root, 'site');
const read = (file: string): string => fs.readFileSync(path.join(site, file), 'utf8');

const SOURCE = 'app/routes/panduan-mcp-chrome-login.tsx';

test('the answer page is registered as a public route and in the sitemap', () => {
  assert.match(read('app/routes.ts'), /panduan-mcp-chrome-login/);
  assert.match(read('public/sitemap.xml'), /panduan-mcp-chrome-login/);
  assert.match(read('react-router.config.ts'), /panduan-mcp-chrome-login/);
});

test('the page title and heading use the words a person would search', () => {
  const page = read(SOURCE);
  assert.match(page, /Cara pakai MCP di Chrome yang sudah login/);
  assert.match(page, /Pakai MCP di Chrome yang sudah Anda masuki/);
});

test('the page carries real commands, honest limits and a proof link', () => {
  const page = read(SOURCE);
  assert.match(page, /npx -y navego local/);
  assert.match(page, /npx -y navego doctor/);
  assert.match(page, /tidak/);
  assert.match(page, /578\.104 byte/);
  assert.match(page, /application\/ld\+json/);
});

test('the homepage links to the answer so it can be discovered', () => {
  assert.match(read('app/routes/index.tsx'), /panduan-mcp-chrome-login/);
});
