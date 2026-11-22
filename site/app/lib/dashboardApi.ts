// Typed fetchers for the dashboard's owner-scoped RPCs and the billing function.
// Server responses are never fully trusted: fields are optional and the UI degrades to dashes.

import { AUTH_HOST, BILLING, REST, ensureSession, headersFor } from './auth';

export interface DeviceCommand {
  method?: string;
  status?: string;
  provider?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface Device {
  id?: string;
  name?: string;
  status?: string;
  extensionVersion?: string;
  browserName?: string;
  lastSeenAt?: string | null;
  completedCommands?: number;
  totalCommands?: number;
  commands?: DeviceCommand[];
}

export interface PlanAnswer {
  plan?: string;
  status?: string;
  expiresAt?: string | null;
  dailyQuota?: number | null;
  usedToday?: number;
  sessionAllowance?: number;
  rpm?: number | null;
}

export interface AwaitAnswer {
  commandId?: string;
  status?: string;
  result?: unknown;
  timing?: { queuedMs?: number; totalMs?: number };
}

export interface KonsolColumn { name: string; type: string; }
export interface KonsolTableAnswer {
  ok?: boolean;
  table?: string;
  columns?: KonsolColumn[];
  rows?: Record<string, unknown>[];
  total?: number;
  error?: string;
}

const SERVER_ERRORS: Record<string, string> = {
  'Too many pairing codes this hour. Try again later.': 'Terlalu banyak kode pairing dalam satu jam. Coba lagi nanti.',
  'Invalid device name.': 'Nama device tidak valid.',
  'No such device on this account.': 'Device itu tidak ada di akun ini.',
  'No paired device on this account.': 'Belum ada device ter-pairing di akun ini.',
  'Device is offline. Open the extension so it can check in.': 'Device sedang offline. Buka extension agar ia terhubung.',
  'Unknown or disabled method.': 'Primitive itu tidak dikenal atau dinonaktifkan.',
  'Not signed in.': 'Sesi tidak ada. Masuk lagi.',
  'Timed out waiting for command result.': 'Device belum menjawab dalam batas waktu.',
  'Unknown table.': 'Tabel itu tidak dikenal.',
  'That table belongs to the operator account.': 'Tabel itu hanya untuk akun operator.'
};

export function say(raw: unknown): string {
  const s = String(raw ?? '');
  return SERVER_ERRORS[s] || s || 'Terjadi kesalahan.';
}

// the second pass exists because an access token ages out in about an hour and a caller page can stay open across that hour.

async function rpc<T = Record<string, unknown>>(name: string, body: Record<string, unknown> = {}): Promise<(T & { ok?: boolean; error?: unknown }) | null> {
  const token = await ensureSession();
  if (!token) return null;
  let response = await fetch(`${REST}/rpc/${name}`, { method: 'POST', headers: headersFor(token), body: JSON.stringify(body) }).catch(() => null);
  if (response && response.status === 401) {
    const renewed = await ensureSession();
    if (renewed) {
      response = await fetch(`${REST}/rpc/${name}`, { method: 'POST', headers: headersFor(renewed), body: JSON.stringify(body) }).catch(() => null);
    }
  }
  if (!response) return null;
  return (await response.json().catch(() => null)) as (T & { ok?: boolean; error?: unknown }) | null;
}

async function billing<T = Record<string, unknown>>(action: string, body: Record<string, unknown> = {}): Promise<(T & { ok?: boolean; why?: string; error?: string; url?: string; status?: number }) | null> {
  const token = await ensureSession();
  if (!token) return null;
  const response = await fetch(BILLING, { method: 'POST', headers: headersFor(token), body: JSON.stringify({ action, ...body }) }).catch(() => null);
  if (!response) return null;
  const answer = await response.json().catch(() => ({}));
  return { status: response.status, ...answer };
}

export const fetchPlan = () => rpc<PlanAnswer>('opera_my_plan');
export const fetchDevices = () => rpc<{ devices?: Device[] }>('opera_my_devices');
export const fetchListen = () => rpc<{ sessions?: Array<{ id?: string; deviceName?: string; status?: string; startedAt?: string; segments?: number }> }>('opera_my_listen');
export const revokeDevice = (deviceId: string) => rpc('opera_revoke_my_device', { p_device_id: deviceId });

// The command and the answer are two calls because one SQL call cannot do both.
// The enqueue and the wait in one function share one transaction, so the paired device cannot see the row until the wait has already timed out; the device then claims the command in a tenth of a second on the next transaction.

// decisions.json -> site-dashboard-action-two-phase-01

export const startOnDevice = (method: string) => rpc<{ commandId?: string; deviceName?: string; status?: string }>('opera_start_on_my_device', { p_method: method });
export const awaitMyCommand = (commandId: string, timeoutMs = 45000) => rpc<AwaitAnswer>('opera_await_my_command', { p_command_id: commandId, p_timeout_ms: timeoutMs });
export const createPairingCode = (name: string) => rpc<{ code?: string; deviceName?: string }>('opera_create_pairing_code', { p_device_name: name });
export const revokeConsent = (p_client_id: string) => rpc('opera_revoke_consent', { p_client_id });
export const listConsents = () => rpc<{ consents?: Array<{ clientId?: string; clientName?: string; scopes?: string; grantedAt?: string }> }>('opera_my_consents');

export const konsolTables = () => rpc<{ operator?: boolean; tables?: Array<{ name: string; scope?: string; readable?: boolean; total?: number | null }> }>('opera_konsol_tables');
export const konsolTable = (body: Record<string, unknown>) => rpc<KonsolTableAnswer>('opera_konsol_table', body);

export const walletBalance = () => billing<{ balanceCents?: number; availableCents?: number }>('wallet-balance');
export const walletHistory = () => billing<{ entries?: Array<{ at?: string; kind?: string; amountCents?: number; note?: string | null }> }>('wallet-history');
export const walletTopUp = () => billing<{ url?: string }>('wallet-deposit');
export async function priceList() {
  const response = await fetch(`${BILLING}?prices=1`).catch(() => null);
  if (!response) return null;
  const answer = await response.json().catch(() => ({}));
  return Array.isArray(answer?.prices) ? (answer.prices as Array<{ kind: string; amount_cents: number }>) : null;
}
