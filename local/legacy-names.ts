// @last-edited: 2026-11-20 UTC+7.
// @title: legacy-names - the names a 1.x install still carries, and where 2.0 reads them.
// @state: env prefix adoption, the device and bridge-token files a home may still hold, and the token header alias.
// @dependencies: node:fs, node:path.

// THE 2.0 RENAME IS A BREAKING NAME CHANGE, SO THE 1.x NAMES KEEP WORKING FOR ONE MAJOR.
// An install that exported NAVEGO_BRIDGE_PORT, or paired into ~/.navego/device.json, has to drive after the upgrade without editing an env file or pairing again.
// The canonical name wins whenever both are present; a legacy name is read, never written.

import { existsSync } from 'node:fs';
import path from 'node:path';

export const ENV_PREFIX = 'OPERA_';
export const LEGACY_ENV_PREFIX = 'NAVEGO_';

export interface LegacyEnvAdoption {
  adopted: string[];
}

// Called once at process start, before any module reads configuration.
// Returns the canonical names it filled so a caller can say so without guessing.

export function adoptLegacyEnv(env: NodeJS.ProcessEnv = process.env): LegacyEnvAdoption {
  const adopted: string[] = [];
  for (const key of Object.keys(env)) {
    if (!key.startsWith(LEGACY_ENV_PREFIX)) continue;
    const canonical = ENV_PREFIX + key.slice(LEGACY_ENV_PREFIX.length);
    const legacy = env[key];
    if (legacy === undefined || env[canonical] !== undefined) continue;
    env[canonical] = legacy;
    adopted.push(canonical);
  }
  return { adopted };
}

export interface HomeFileChoice {
  file: string;
  legacy: boolean;
}

// A file the product reads (and where it writes, the canonical path is the target).
// The legacy directory is only a fallback for reads, so an existing pair keeps working and the next write lands in the new home.

export function homeFile(
  home: string,
  name: string,
  exists: (candidate: string) => boolean = existsSync
): HomeFileChoice {
  const canonical = path.join(home, '.opera', name);
  if (exists(canonical)) return { file: canonical, legacy: false };
  const legacy = path.join(home, '.navego', name);
  if (exists(legacy)) return { file: legacy, legacy: true };
  return { file: canonical, legacy: false };
}

// The token header the hosted functions read: the 2.0 name first, the 1.x name as a fallback.
// It lives here rather than in each function so one list decides both the read and the CORS advertisement.

export const TOKEN_HEADERS = ['x-opera-token', 'x-navego-token'] as const;

export function tokenFromHeaders(headers: { get(name: string): string | null }): string | null {
  for (const name of TOKEN_HEADERS) {
    const value = headers.get(name);
    if (value && value.trim().length > 0) return value.trim();
  }
  return null;
}
