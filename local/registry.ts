// @last-edited: 2026-11-15 UTC+7.
// @title: registry - the one place that writes a browser policy, and the seam that keeps it honest.
// @state: HKCU only, per-user, no elevation; a failure is reported, never thrown.
// @dependencies: node:child_process.

// WHY THE EXECFILE IS A PARAMETER.
// The command runs in CI where there is no registry and on developer machines where there is.
// The test injects a fake; production passes nothing and gets execFileSync.

// WHY A FORCELIST, NOT THE CLASSIC EXTENSION KEY.
// The classic key asks the browser to install a build it cannot enforce; the person can turn it off.
// The forcelist asks the policy system to install and keep it: same signed CRX, same update URL, one numbered entry per browser, the browser's own machinery does the rest.
// 2026-11-15 owner decision: one route, this one. The classic route is deleted, not hidden behind a flag.

// WHY A NUMBERED VALUE.
// ExtensionInstallForcelist is a numbered list. Our entry names the extension id and the update manifest, so the installer finds its own entry at any number and never touches an entry somebody else created.
// Uninstall removes exactly the entries whose data starts with the id, at whatever number they landed.

import { execFileSync } from 'node:child_process';

export const EXTENSION_ID = 'ofgemipoobcnbjkfanmofjbdonjapmgl';
export const UPDATE_URL = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl';
const EXTENSION_PREFIX = `${EXTENSION_ID};`;
const EXTENSION_ENTRY = `${EXTENSION_ID};${UPDATE_URL}`;

// Chrome for Testing is deliberately absent: no verified HKCU policy path exists for it, and writing one would be a guess, not a route.
const policyKeys: Record<string, string> = {
  chrome: `HKCU\\Software\\Policies\\Google\\Chrome\\ExtensionInstallForcelist`,
  brave: `HKCU\\Software\\Policies\\BraveSoftware\\Brave-Browser\\ExtensionInstallForcelist`,
  edge: `HKCU\\Software\\Policies\\Microsoft\\Edge\\ExtensionInstallForcelist`,
};

type Exec = (cmd: string, args: string[]) => string;
const defaultExec: Exec = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

export interface ForcelistEntry { number: number; data: string; }

// reg query answers with the key path, a blank line and one line per value; only the value lines match.
export function parseForcelistEntries(output: string): ForcelistEntry[] {
  const entries: ForcelistEntry[] = [];
  for (const line of String(output).split(/\r?\n/)) {
    const match = /^\s+(\d+)\s+REG_SZ\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const number = Number(match[1]);
    if (Number.isFinite(number) && match[2]) entries.push({ number, data: match[2] as string });
  }
  return entries.sort((a, b) => a.number - b.number);
}

const isOurs = (data: string) => data.startsWith(EXTENSION_PREFIX);

function queryEntries(key: string, exec: Exec): ForcelistEntry[] {
  try {
    return parseForcelistEntries(exec('reg', ['query', key]));
  } catch {
    return [];
  }
}

export function writeExtensionKey({ vendor, exec = defaultExec }: { vendor: string; exec?: Exec }): { ok: boolean; error?: string; value?: string } {
  const key = policyKeys[vendor];
  if (!key) return { ok: false, error: `unknown vendor: ${vendor}` };
  try {
    const entries = queryEntries(key, exec);
    const taken = new Set<number>();
    for (const entry of entries) {
      if (isOurs(entry.data)) {
        exec('reg', ['delete', key, '/v', String(entry.number), '/f']);
        continue;
      }
      taken.add(entry.number);
    }
    let number = 1;
    while (taken.has(number)) number++;
    exec('reg', ['add', key, '/v', String(number), '/t', 'REG_SZ', '/d', EXTENSION_ENTRY, '/f']);
    return { ok: true, value: String(number) };
  } catch (error: unknown) {
    return { ok: false, error: String((error as Error)?.message || error) };
  }
}

export function deleteExtensionKey({ vendor, exec = defaultExec }: { vendor: string; exec?: Exec }): { ok: boolean; error?: string; deleted?: number } {
  const key = policyKeys[vendor];
  if (!key) return { ok: false, error: `unknown vendor: ${vendor}` };
  try {
    const entries = queryEntries(key, exec).filter((entry) => isOurs(entry.data));
    for (const entry of entries) exec('reg', ['delete', key, '/v', String(entry.number), '/f']);
    return { ok: true, deleted: entries.length };
  } catch (error: unknown) {
    return { ok: false, error: String((error as Error)?.message || error) };
  }
}
