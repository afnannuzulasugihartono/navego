// @last-edited: 2026-11-17 UTC+7.
// @title: bridge-token — the per-machine secret the local driver presents to the loopback bridge.
// @state: exports resolveBridgeToken and header constants; bridge-ws reads it once per server to gate POST endpoints.
// @dependencies: node:crypto, node:fs, node:os, node:path.

// IT EXISTS.
// The loopback bridge owns the browser, and any local web page could reach its /command endpoint with a plain POST before it was gated.
// A random secret per machine answers "indistinguishable to a page on this machine, trivially readable by the processes that legitimately drive the browser".
// The token is never sent in a browser request: pages cannot read the file it lives in.

import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { homeFile } from './legacy-names.js';

const TOKEN_FILE = path.join(os.homedir(), '.opera', 'bridge-token');

let cached: string | null = null;

export function resolveBridgeToken() {
  if (cached) return cached;
  if (process.env.OPERA_BRIDGE_TOKEN) {
    cached = process.env.OPERA_BRIDGE_TOKEN;
    return cached;
  }
  try {
    const stored = fs.readFileSync(homeFile(os.homedir(), 'bridge-token').file, 'utf8').trim();
    if (stored) {
      cached = stored;
      return cached;
    }
  } catch {
  }
  const token = randomBytes(32).toString('hex');
  try {
    fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true, mode: 0o700 });
    fs.writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
  } catch {
  }
  cached = token;
  return cached;
}

export function header() {
  return { 'x-opera-bridge-token': resolveBridgeToken() };
}
