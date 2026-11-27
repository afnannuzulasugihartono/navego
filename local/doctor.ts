// @last-edited: 2026-11-27 UTC+7.
// @title: doctor - the operator's one question about this machine, answered in words and in JSON.
// @state: the bridge's state, the device's meter, the pairing, the cloud login, and the CRX link.
// The --json flag emits the same answers as a single object for MCP clients and scripts.
// @dependencies: ./wallet-client.js, ./oauth.js, ./lib/endpoints.js.
// decisions.json -> local-doctor-verdict-01, local-doctor-session-expiry-01

// THIS FILE EXISTS

// An install that cannot say what it is doing misleads the operator into debugging the wrong thing: a missing pairing looks like a broken install, and a refused meter looks like a broken extension.
// The doctor reads the only state that is real - the loopback bridge's own health answer, the paired device file, and the cloud login - and prints one line per answer plus the one fix that applies, or emits the same thing as JSON for scripts.

import { readDevice } from './wallet-client.js';
import { readStoredToken, cloudSession } from './oauth.js';
import { resolveBridgeToken } from './bridge-token.js';
import { UPDATE_BASE_URL } from './lib/endpoints.js';

const CRX_URL = `${UPDATE_BASE_URL}/download/navego.crx`;
const PROBE_TIMEOUT_MS = 2000;

interface BridgeProbe {
  ok: boolean;
  error?: string;
  health?: unknown;
}

export interface DoctorReport {
  ready: boolean;
  port: number;
  deviceFile: string | null;
  cloudLogin: 'token' | 'signed-in' | 'none';
  bridge: {
    ok: boolean;
    devices: Array<Record<string, unknown>>;
    linked: boolean;
    refusal: string | null;
    preferredSlot: number | null;
  };
  problems: string[];
  crxUrl: string;
}

async function probeBridge(port: number, fetchImpl: typeof fetch): Promise<BridgeProbe> {
  try {
    const response = await fetchImpl(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS), headers: { 'x-opera-bridge-token': resolveBridgeToken() } });
    if (!response.ok) return { ok: false, error: `the bridge answered ${response.status}` };
    return { ok: true, health: await response.json().catch(() => null) };
  } catch (error: unknown) {
    return { ok: false, error: String((error as Error)?.message ?? error) };
  }
}

function setupAdvice(cloudLogin: DoctorReport['cloudLogin'], paired: boolean): string | null {
  const steps: string[] = [];
  if (cloudLogin === 'none') steps.push('sign in with `navego auth`');
  if (!paired) steps.push('pair the browser');
  return steps.length ? steps.join(', then ') : null;
}

function expiryText(expiresAt: number | null): string {
  return expiresAt === null ? 'at an unknown time' : new Date(expiresAt).toISOString();
}

export async function doctor({ env = process.env, stdout = process.stdout, fetchImpl = fetch, args = [] }: { env?: NodeJS.ProcessEnv; stdout?: { write(chunk: string): unknown }; fetchImpl?: typeof fetch; args?: readonly string[] } = {}): Promise<number> {
  const port = Number(env.NAVEGO_BRIDGE_PORT || 9451);
  const home = typeof env.NAVEGO_HOME === 'string' ? env.NAVEGO_HOME : undefined;
  const jsonMode = args.includes('--json');
  const lines: string[] = [];
  const problems: string[] = [];
  const say = (label: string, value: unknown) => lines.push(`${label.padEnd(14)}${String(value)}`);

  const paired = readDevice(home === undefined ? {} : { home });

  const envToken = typeof env.NAVEGO_MCP_TOKEN === 'string' && env.NAVEGO_MCP_TOKEN.trim();
  const stored = envToken ? null : readStoredToken(env);
  const session = cloudSession(stored);

  const probe = await probeBridge(port, fetchImpl);

  const deviceFile: DoctorReport['deviceFile'] = paired ? paired.deviceName : null;

  const cloudLogin: DoctorReport['cloudLogin'] = envToken ? 'token' : session.signedIn ? 'signed-in' : 'none';

  const bridgeOk = probe.ok;
  if (!bridgeOk) {
    problems.push('start the everyday browser with the Navego extension installed');
  } else {
    const healthForDevices = probe.health as Record<string, unknown> | undefined;
    const devicesRaw = Array.isArray(healthForDevices?.devices) ? (healthForDevices?.devices as Array<Record<string, unknown>>) : [];
    const linked = healthForDevices?.linked === true;
    const refusal = typeof healthForDevices?.meterRefusal === 'string' && healthForDevices.meterRefusal.trim() ? (healthForDevices.meterRefusal as string).trim() : null;
    const setup = setupAdvice(cloudLogin, Boolean(paired));
    if (refusal) problems.push(setup ?? 'the meter refused the session; update the extension to the current release and reload it');
    else if (!devicesRaw.length && !linked) problems.push('the extension is not linked to this bridge; reload the everyday browser with Navego installed');
    else if (!devicesRaw.length) problems.push('the bridge runs pre-meter code; restart the driver process so it can report the session');
    for (const device of devicesRaw) {
      if (!device?.meter) {
        problems.push('reload the everyday browser so its hello reaches the bridge');
        break;
      }
    }
  }

  if (jsonMode) {
    const healthRecord = probe.health as Record<string, unknown> | undefined;
    const devicesOut = Array.isArray(healthRecord?.devices) ? (healthRecord?.devices as Array<Record<string, unknown>>) : [];
    const linkedOut = healthRecord?.linked === true;
    const refusalOut = typeof healthRecord?.meterRefusal === 'string' && (healthRecord.meterRefusal as string).trim() ? (healthRecord.meterRefusal as string).trim() : null;
    const preferRaw = healthRecord?.preferredSlot as unknown;
    const report: DoctorReport = {
      ready: problems.length === 0,
      port,
      deviceFile,
      cloudLogin,
      bridge: { ok: bridgeOk, devices: devicesOut, linked: linkedOut, refusal: refusalOut, preferredSlot: typeof preferRaw === 'number' ? preferRaw : null },
      problems,
      crxUrl: CRX_URL,
    };
    stdout.write(JSON.stringify(report, null, 2) + '\n');
    return report.ready ? 0 : 1;
  }

  say('device file', paired ? `paired as ${paired.deviceName} (wallet and hosted tools use it)` : 'none (only the wallet and hosted tools need it)');

  if (envToken) {
    say('cloud login', 'NAVEGO_MCP_TOKEN (a static token from the environment)');
  } else if (session.live) {
    say('cloud login', `signed in (token expires ${expiryText(session.expiresAt)})`);
  } else if (session.renewable) {
    say('cloud login', `signed in (the token expired ${expiryText(session.expiresAt)}; the session renews on use)`);
  } else if (session.expiresAt !== null) {
    say('cloud login', `not signed in - the cloud session expired ${expiryText(session.expiresAt)}; \`navego auth\` signs in again`);
  } else {
    say('cloud login', 'not signed in - cloud mode needs it (`navego auth`, or NAVEGO_MCP_TOKEN)');
  }

  if (!probe.ok) {
    say('bridge', `not listening on 127.0.0.1:${port} (${probe.error})`);
  } else {
    const health = (probe.health ?? {}) as Record<string, unknown>;
    const devices = (Array.isArray(health.devices) ? health.devices : []) as Array<Record<string, unknown>>;
    const linked = health.linked === true;
    const refusal = typeof health.meterRefusal === 'string' && health.meterRefusal.trim() ? health.meterRefusal.trim() : null;
    say('bridge', devices.length
      ? `listening on 127.0.0.1:${port}; ${devices.length} device(s) linked`
      : linked
        ? `listening on 127.0.0.1:${port}; linked to a bridge from before the meter - restart the driver and reload the extension`
        : `listening on 127.0.0.1:${port}; nothing linked`);
    if (refusal) {
      say('meter', refusal);
    }
    const preferRaw = health.preferredSlot as unknown;
    say('preferred', typeof preferRaw === 'number' ? `slot ${preferRaw} (tab-less commands follow it)` : 'none (tab-less commands follow the first ready browser)');
    for (const device of devices) {
      const slot = device?.slot ?? '?';
      say(`device ${slot}`, `version ${device?.extensionVersion ?? 'unknown (the hello carried none)'}; id ${device?.id ?? 'unknown'}`);
      const meter = device?.meter as Record<string, unknown> | undefined;
      if (meter) {
        say('  plan', `${meter.plan}`);
        say('  allowance', `${meter.allowance} commands per session (this session sent ${meter.sent ?? 0})`);
        say('  daily quota', `${meter.dailyQuota} per day (${meter.usedToday ?? 0} used today across surfaces, ${meter.sent ?? 0} this session, ${meter.remaining ?? 0} left)`);
      } else {
        say('  meter', 'no session metered yet (a fresh bridge has not heard a hello)');
      }
    }
  }

  say('CRX download', CRX_URL);

  const ready = problems.length === 0;
  say('verdict', ready ? 'ready' : `degraded: ${problems[0]}`);
  for (const problem of problems.slice(1)) say('  also', problem);
  stdout.write(`navego doctor\n\n${lines.join('\n')}\n`);
  return ready ? 0 : 1;
}
