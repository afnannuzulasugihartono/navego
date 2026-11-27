// @last-edited: 2026-11-28 UTC+7.
// @title: doctor-verdict - a fresh machine and a lapsed session are told to sign in before either is blamed for a stale extension.
// @state: no login or no device file turns a meter refusal into auth-and-pair advice; a lapsed cloud session with nothing to renew it is no login; a signed-in paired machine still gets the stale-extension advice.
// @dependencies: node:test, strict, node:fs, node:os, node:path, ../../local/doctor.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { doctor } from '../../local/doctor.js';

const refusal = 'the meter could not be reached: the cloud answered 403';

function homeWithDevice(): string {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'navego-doctor-verdict-'));
  fs.mkdirSync(path.join(home, '.navego'), { recursive: true });
  fs.writeFileSync(path.join(home, '.navego', 'device.json'), JSON.stringify({
    deviceName: 'paired-machine',
    token: 'a'.repeat(64)
  }));
  return home;
}

// The login writes the expiry with the token, and the runtime treats a file without one as no session at all.

function homeWithLogin(): string {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'navego-doctor-login-'));
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, 'token.json'), JSON.stringify({ access_token: 'signed-in', expires_at: Date.now() + 3600_000 }));
  return home;
}

// A machine that carries a token file of its own, so the session under test is the only thing that changes.

function homeWithToken(token: Record<string, unknown>): string {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'navego-doctor-token-'));
  fs.mkdirSync(path.join(home, '.navego'), { recursive: true });
  fs.writeFileSync(path.join(home, '.navego', 'device.json'), JSON.stringify({
    deviceName: 'paired-machine',
    token: 'a'.repeat(64)
  }));
  const config = path.join(home, 'config');
  fs.mkdirSync(config, { recursive: true });
  fs.writeFileSync(path.join(config, 'token.json'), JSON.stringify(token));
  return home;
}

async function runDoctor(env: NodeJS.ProcessEnv): Promise<{ code: number; output: string }> {
  let output = '';
  const stdout = { write(chunk: string): boolean { output += chunk; return true; } };
  const fetchImpl = (async () => new Response(JSON.stringify({
    ok: true,
    linked: true,
    devices: [],
    meterRefusal: refusal
  }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
  const code = await doctor({ env, stdout, fetchImpl });
  return { code, output };
}

test('an unauthenticated unpaired machine is told to sign in and pair', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'navego-doctor-clean-'));
  try {
    const { code, output } = await runDoctor({
      NAVEGO_HOME: home,
      NAVEGO_MCP_CONFIG_HOME: path.join(home, 'config')
    });
    assert.equal(code, 1, 'the machine is not ready before sign-in and pairing');
    assert.match(output, /navego auth/, 'the verdict names the sign-in command');
    assert.match(output, /pair the browser/i, 'the verdict names the pairing step');
    assert.doesNotMatch(output, /update the extension/i, 'a current extension must not be blamed');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('an authenticated paired machine keeps the stale-extension advice', async () => {
  const home = homeWithDevice();
  const login = homeWithLogin();
  try {
    const { code, output } = await runDoctor({
      NAVEGO_HOME: home,
      NAVEGO_MCP_CONFIG_HOME: login
    });
    assert.equal(code, 1, 'the refused meter leaves the machine degraded');
    assert.match(output, /update the extension to the current release and reload it/i, 'a signed-in paired machine still gets the stale-extension fix');
    assert.doesNotMatch(output, /navego auth/, 'a signed-in machine must not be told to sign in');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(login, { recursive: true, force: true });
  }
});

test('a machine whose cloud session lapsed is told to sign in again', async () => {
  const home = homeWithToken({ access_token: 'lapsed', expires_at: Date.now() - 3600_000 });
  try {
    const { code, output } = await runDoctor({ NAVEGO_HOME: home, NAVEGO_MCP_CONFIG_HOME: path.join(home, 'config') });
    assert.equal(code, 1, 'the refused meter leaves the machine degraded');
    assert.match(output, /navego auth/i, 'the verdict names the sign-in command the lapsed session owes');
    assert.doesNotMatch(output, /update the extension/i, 'a lapsed cloud session must not be blamed on the extension');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('a machine whose token lapsed but whose refresh token can renew it stays signed in', async () => {
  const home = homeWithToken({ access_token: 'lapsed', refresh_token: 'r'.repeat(32), expires_at: Date.now() - 3600_000 });
  try {
    const { code, output } = await runDoctor({ NAVEGO_HOME: home, NAVEGO_MCP_CONFIG_HOME: path.join(home, 'config') });
    assert.equal(code, 1, 'the refused meter leaves the machine degraded');
    assert.match(output, /update the extension to the current release and reload it/i, 'a renewable session still gets the stale-extension fix');
    assert.doesNotMatch(output, /navego auth/i, 'a renewable session must not be told to sign in');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
