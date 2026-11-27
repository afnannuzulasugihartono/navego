// @last-edited: 2026-11-28 UTC+7.
// @title: doctor-session-expiry - a lapsed cloud session is told to sign in again, not to update the extension.
// @state: a lapsed access token with nothing to renew it reads as no login, so the verdict names the sign-in step; a lapsed access token with a refresh token still reads as signed in.
// @dependencies: node:test, strict, node:fs, node:os, node:path, ../../local/doctor.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { doctor } from '../../local/doctor.js';

const refusal = 'the meter could not be reached: the cloud answered 403';

function homeWithDevice(): string {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'navego-doctor-expiry-device-'));
  fs.mkdirSync(path.join(home, '.navego'), { recursive: true });
  fs.writeFileSync(path.join(home, '.navego', 'device.json'), JSON.stringify({
    deviceName: 'paired-machine',
    token: 'a'.repeat(64)
  }));
  return home;
}

function homeWithToken(token: Record<string, unknown>): string {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'navego-doctor-expiry-login-'));
  fs.writeFileSync(path.join(home, 'token.json'), JSON.stringify(token));
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

test('a machine whose cloud session lapsed is told to sign in again', async () => {
  const home = homeWithDevice();
  const login = homeWithToken({ access_token: 'lapsed', expires_at: Date.now() - 3600_000 });
  try {
    const { code, output } = await runDoctor({ NAVEGO_HOME: home, NAVEGO_MCP_CONFIG_HOME: login });
    assert.equal(code, 1, 'the refused meter leaves the machine degraded');
    assert.match(output, /navego auth/i, 'the verdict names the sign-in command the lapsed session owes');
    assert.doesNotMatch(output, /update the extension/i, 'a lapsed cloud session must not be blamed on the extension');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(login, { recursive: true, force: true });
  }
});

test('a machine whose token lapsed but whose refresh token can renew it stays signed in', async () => {
  const home = homeWithDevice();
  const login = homeWithToken({ access_token: 'lapsed', refresh_token: 'r'.repeat(32), expires_at: Date.now() - 3600_000 });
  try {
    const { code, output } = await runDoctor({ NAVEGO_HOME: home, NAVEGO_MCP_CONFIG_HOME: login });
    assert.equal(code, 1, 'the refused meter leaves the machine degraded');
    assert.match(output, /update the extension to the current release and reload it/i, 'a renewable session still gets the stale-extension fix');
    assert.doesNotMatch(output, /navego auth/i, 'a renewable session must not be told to sign in');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(login, { recursive: true, force: true });
  }
});
