// @last-edited: 2026-11-27 UTC+7.
// @title: funnel.test - the install view belongs to the rendered command and the pairing view to a visitor with a session.
// @state: a page load writes its own page view, the rendered install block writes the install view once, and an anonymous dashboard writes no pairing view.
// @dependencies: node:test, strict, node:fs, node:path, node:url, ./funnel.ts.
// decisions.json -> site-funnel-views-01

// The two rows the operator reads were measuring page loads: the landing's install view was written by the page view, and the dashboard's pairing view was written by a route that also serves an anonymous probe.
// This test drives the tracker the way the pages drive it and reads the rows that come out.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(libDir, '..', '..');
const memory = new Map<string, string>();

const store = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  }
};

const sent: Array<{ url: string; body: Record<string, unknown> }> = [];

(globalThis as Record<string, unknown>).localStorage = store;
(globalThis as Record<string, unknown>).location = { pathname: '/' };

Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => 'browser-1' }, configurable: true });
(globalThis as Record<string, unknown>).fetch = async (url: string, init?: { body?: string }) => {
  sent.push({ url, body: JSON.parse(String(init?.body ?? '{}')) });
  return { ok: true, status: 204 } as Response;
};

const { recordInstallView, recordPairView, trackView } = await import('./funnel.ts');

const landingSource = fs.readFileSync(path.join(siteRoot, 'app', 'routes', 'index.tsx'), 'utf8');
const downloadSource = fs.readFileSync(path.join(siteRoot, 'app', 'routes', 'unduh.tsx'), 'utf8');
const dashboardSource = fs.readFileSync(path.join(siteRoot, 'app', 'routes', 'dashboard.tsx'), 'utf8');
const copyCommandSource = fs.readFileSync(path.join(siteRoot, 'app', 'components', 'CopyCommand.tsx'), 'utf8');

const names = (): string[] => sent.map((write) => String(write.body.p_name));

// The browser reports the path it is standing on, so every case says where it stands first.

const fresh = (pathname: string): void => {
  memory.clear();
  sent.length = 0;
  (globalThis as Record<string, unknown>).location = { pathname };
};

test('a landing page load writes its own page view and no install view', () => {
  fresh('/');
  trackView('/');
  trackView('/');
  assert.deepEqual(names(), ['page.view'], 'the page load is one step, and the install command is not on screen yet');
  assert.equal(sent[0]?.body.p_path, '/');
});

test('a download page load writes its own page view and no install view', () => {
  fresh('/unduh');
  trackView('/unduh');
  assert.deepEqual(names(), ['page.view']);
});

test('the rendered install command writes the install view once, with the surface that showed it', () => {
  fresh('/');
  recordInstallView('landing');
  recordInstallView('landing');
  assert.deepEqual(names(), ['install.view'], 'a re-render is not a second visitor');
  assert.equal(sent[0]?.body.p_path, '/');
  assert.deepEqual(sent[0]?.body.p_meta, { surface: 'landing' });
});

test('the download page install block writes the install view under its own surface', () => {
  fresh('/unduh');
  recordInstallView('download');
  assert.deepEqual(names(), ['install.view']);
  assert.equal(sent[0]?.body.p_path, '/unduh');
  assert.deepEqual(sent[0]?.body.p_meta, { surface: 'download' });
});

test('a pairing view is written only for a visitor with a session', () => {
  fresh('/dashboard');
  recordPairView(false);
  assert.deepEqual(names(), [], 'a path probe reaches no human, so it writes no funnel step');
  recordPairView(true);
  assert.deepEqual(names(), ['pair.view']);
  assert.equal(sent[0]?.body.p_path, '/dashboard');
});

test('the landing and the download page report the install view from their install block', () => {
  assert.match(landingSource, /onRendered=\{\(\) => recordInstallView\('landing'\)\}/);
  assert.match(downloadSource, /onRendered=\{\(\) => recordInstallView\('download'\)\}/);
  assert.match(copyCommandSource, /onRenderedRef\.current\?\.\(\)/, 'the block reports that the command is on screen');
});

test('the dashboard reports the pairing view with the session it found', () => {
  assert.match(dashboardSource, /recordPairView\(hasSession\)/);
  assert.match(dashboardSource, /setHasSession\(true\)/);
  assert.doesNotMatch(dashboardSource, /track\('pair\.view'\)/, 'the pairing view is not written without the session gate');
});
