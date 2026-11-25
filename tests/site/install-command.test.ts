// @last-edited: 2026-11-25 UTC+7.
// @title: install-command.test - one Windows command can start an install from the landing page.
// @state: the command is exact, and a successful landing copy records install intent on the landing path.
// @dependencies: node:test, strict, ../../site/app/lib/install-command.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const modulePath = pathToFileURL(path.join(root, 'site', 'app', 'lib', 'install-command.ts')).href;
const funnelModulePath = pathToFileURL(path.join(root, 'site', 'app', 'lib', 'funnel.ts')).href;
const memory = new Map<string, string>();
const sent: Array<Record<string, unknown>> = [];

(globalThis as Record<string, unknown>).localStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value); }
};
(globalThis as Record<string, unknown>).location = { pathname: '/' };
Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => 'landing-browser' }, configurable: true });
(globalThis as Record<string, unknown>).fetch = async (_url: string, init?: { body?: string }) => {
  sent.push(JSON.parse(String(init?.body ?? '{}')));
  return { ok: true, status: 204 } as Response;
};

type InstallCommandModule = {
  WINDOWS_INSTALL_COMMAND: string;
};

type FunnelModule = {
  recordInstallCopy: (surface: 'landing' | 'download') => void;
  recordInstallView: (surface: 'landing' | 'download') => void;
};

async function installCommandModule(): Promise<InstallCommandModule> {
  try {
    return await import(modulePath) as InstallCommandModule;
  } catch {
    assert.fail('site/app/lib/install-command.ts must expose the tested landing install command');
  }
}

test('the landing command is the exact Windows one-liner the visitor must run', async () => {
  const { WINDOWS_INSTALL_COMMAND } = await installCommandModule();
  assert.equal(WINDOWS_INSTALL_COMMAND, 'irm https://navego.pages.dev/install.ps1 | iex');
});

test('the landing install surface records its view before a copy', async () => {
  memory.clear();
  sent.length = 0;
  const { recordInstallCopy, recordInstallView } = await import(funnelModulePath) as FunnelModule;
  assert.equal(typeof recordInstallView, 'function', 'the landing install surface needs a view step');
  recordInstallView('landing');
  recordInstallCopy('landing');
  assert.deepEqual(sent.map((write) => write.p_name), ['install.view', 'install.click']);
  assert.equal(sent[0]?.p_path, '/');
  assert.deepEqual(sent[0]?.p_meta, { surface: 'landing' });
});

test('a successful landing copy records install intent on the landing path', async () => {
  memory.clear();
  sent.length = 0;
  const { recordInstallCopy } = await import(funnelModulePath) as FunnelModule;
  recordInstallCopy('landing');
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.p_name, 'install.click');
  assert.equal(sent[0]?.p_path, '/');
  assert.deepEqual(sent[0]?.p_meta, {
    browser: 'windows',
    artifact: 'powershell',
    surface: 'landing'
  });
});
