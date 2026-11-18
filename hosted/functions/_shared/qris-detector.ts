// @last-edited: 2026-11-04 UTC+7.
// @title: qris-detector — read the merchant feed and match money in to open invoices, in dry mode until the units are proven.
// @state: the feed query and headers that were accepted on 2026-11-02, the feed parser, exact-amount FIFO matching in both amount units, and the dry/live plan.
// @dependencies: none.

// THE DETECTOR MATCHES BY AMOUNT AND NOT BY A UNIQUE CODE.
// That was the owner's decision in the 2026-11-02 spec: exact amount plus first-in-first-out, no magic number in the payment.
// It means a wrong match is possible in principle, which is exactly why the mode is dry until the feed's amount unit is measured from real transactions.

// BOTH AMOUNT UNITS ARE TRIED.
// Whether the feed reports rupiah or minor units was never verified, and a wrong guess closes the wrong invoice.
// So a run reports matches under both readings, and only a measured unit ever goes live.

export const FEED_URL = 'https://api.gojekapi.com/merchant-analytics/v2/merchants/transactions';
export const TOKEN_URL = 'https://api.gobiz.co.id/goid/token';

const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

interface ParsedRow {
  id: string;
  amount: number;
  at: string;
  method: string;
  payment: string;
  channel: string;
  status: string;
  usable: boolean;
}

interface Match {
  invoiceId: string;
  transactionId: string;
  amountRupiah: number;
  at: string;
  method: string;
}

interface DetectorPlan {
  mode: string;
  closes: Match[];
  wouldClose: Match[];
  rupiahMatches: Match[];
  minorMatches: Match[];
}

// THE PAGE IS CAPPED AT 100 AND NOT 200.
// The API answered 422 for size=200 on 2026-11-04 and 200 for size=100, so the page is capped here instead of failing at runtime.
// THE SERVER-SIDE FILTERS.
// The feed also carries cards, GoPay wallet payments and refunds, and one page of 100 rows is cheap to read only while it holds money we can use.

export function feedQuery({ merchantId, from = 0, size = 100, startTime, endTime }: { merchantId: unknown; from?: number; size?: number; startTime: unknown; endTime: unknown }): string | null {
  if (!merchantId) return null;
  if (!Number.isInteger(from) || from < 0) return null;
  if (!Number.isInteger(size) || size < 1 || size > 100) return null;
  if (!RFC3339.test(String(startTime || '')) || !RFC3339.test(String(endTime || ''))) return null;
  const params = new URLSearchParams({
    merchant_id: String(merchantId),
    from: String(from),
    size: String(size),
    start_time: String(startTime),
    end_time: String(endTime),
    statuses: 'SETTLEMENT',
    payment_types: 'QRIS'
  });
  return params.toString();
}

// x-uniqueid IS A PARAMETER AND NOT A CONSTANT.
// The 2026-11-02 probe measured that a new UUID per call is refused with 401: the server binds the session to one device id.
// So the id is a session property held with the token, and one id per deployed detector.

export function feedHeaders({ accessToken, uniqueId }: { accessToken: unknown; uniqueId: unknown }): Record<string, string> | null {
  if (!accessToken || !uniqueId) return null;
  return {
    authorization: `Bearer ${accessToken}`,
    'x-uniqueid': String(uniqueId),
    'X-AppVersion': '5.12.0',
    'x-appId': 'com.gojek.gopay',
    'X-Platform': 'gojek',
    'x-DeviceOS': 'Android',
    'X-User-Type': 'consumer',
    'Gojek-Country-Code': 'ID',
    'Gojek-Timezone': 'Asia/Jakarta'
  };
}

// THE REFRESH CALL HAS ITS OWN HEADERS.
// The token route is the merchant portal's route, not the consumer app's, and on 2026-11-04 it answered 400 for the feed headers and 201 for these.

export function sessionHeaders({ accessToken, uniqueId }: { accessToken: unknown; uniqueId: unknown }): Record<string, string> | null {
  if (!accessToken || !uniqueId) return null;
  return {
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Authentication-Type': 'go-id',
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-AppVersion': 'platform-v3.129.0-edffae48',
    'X-PhoneMake': 'Windows 10 64-bit',
    'X-PhoneModel': 'Chrome 153.0.0.0 on Windows 10 64-bit',
    'X-Platform': 'Web',
    'X-User-Locale': 'en-US',
    'X-User-Type': 'merchant',
    'x-DeviceOS': 'Web',
    'x-appId': 'go-biz-web-dashboard',
    'x-uniqueid': String(uniqueId)
  };
}

// THE TOKEN BODY IS NESTED.
// The route answered 400 "At least one required parameter is missing" for a flat body and 201 for this one.

export function refreshBody(refreshToken: unknown): Record<string, unknown> | null {
  if (!refreshToken) return null;
  return {
    client_id: 'go-biz-web-new',
    grant_type: 'refresh_token',
    data: { refresh_token: String(refreshToken) }
  };
}

// ONLY A DYNAMIC QR COUNTS.
// A payment against the printed static QR is the merchant's own money with no invoice behind it, so crediting a wallet from it would be money out of thin air.
// gross_amount.
// That is the field the live feed carries, measured on 2026-11-04: a Rp1.000 payment reads 100000, so the feed counts minor units.

export function parseFeed(body: unknown): ParsedRow[] {
  const carrier = (body && typeof body === 'object' && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
  const list = Array.isArray(carrier.data) ? carrier.data : Array.isArray(carrier.transactions) ? carrier.transactions : [];
  const out: ParsedRow[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const amount = Number(row.gross_amount ?? row.real_gross_amount ?? row.amount ?? row.nominal ?? row.total);
    if (!Number.isFinite(amount)) continue;
    const payment = String(row.payment_type ?? '').toUpperCase();
    const channel = String(row.channel_type ?? '').toUpperCase();
    const status = String(row.transaction_status ?? row.status ?? '').toUpperCase();
    out.push({
      id: String(row.id ?? row.transaction_id ?? ''),
      amount,
      at: String(row.transaction_time ?? row.created_at ?? ''),
      method: payment ? payment.toLowerCase() : 'qris',
      payment,
      channel,
      status,
      usable: payment === 'QRIS' && channel === 'DYNAMIC_QR' && status === 'SETTLEMENT'
    });
  }
  return out;
}

// MATCHING IS EXACT AMOUNT, FIFO, ONE TRANSACTION PER INVOICE.
// Each transaction closes at most one invoice and each invoice needs one transaction; consuming a transaction prevents the same money closing two invoices.

// THE CLOCK IS CHECKED.
// The feed is a window over the last day, so yesterday's payment of the same amount would otherwise close today's invoice.
// Money that arrived before the invoice was opened is not this invoice's money.

const CLOCK_SKEW_MS = 10 * 60 * 1000;

function paidAfterInvoice(transactionAt: unknown, invoiceCreatedAt: unknown): boolean {
  const paid = Date.parse(String(transactionAt || ''));
  const opened = Date.parse(String(invoiceCreatedAt || ''));
  if (!Number.isFinite(paid) || !Number.isFinite(opened)) return false;
  return paid >= opened - CLOCK_SKEW_MS;
}

export function matchOpenInvoices(invoices: unknown, transactions: unknown, unit: unknown): Array<Match> {
  const scale = unit === 'minor' ? 100 : 1;
  const open = (Array.isArray(invoices) ? invoices : [])
    .map((invoice) => ({ invoice: invoice as Record<string, unknown>, cents: Number((invoice as Record<string, unknown>).amount_cents) }))
    .filter((entry) => String(entry.invoice.status || '') === 'open')
    .sort((a, b) => String(a.invoice.created_at).localeCompare(String(b.invoice.created_at)));
  const txs = (Array.isArray(transactions) ? transactions : []) as ParsedRow[];
  const used = new Set<string>();
  const matches: Match[] = [];
  for (const entry of open) {
    const wantRupiah = entry.cents / 100;
    const hit = txs.find((tx) => !used.has(tx.id) && tx.usable && tx.amount / scale === wantRupiah && paidAfterInvoice(tx.at, entry.invoice.created_at));
    if (hit) {
      used.add(hit.id);
      matches.push({ invoiceId: String(entry.invoice.id), transactionId: hit.id, amountRupiah: wantRupiah, at: hit.at, method: hit.method });
    }
  }
  return matches;
}

// THE PLAN IS A SEPARATE FUNCTION.
// Dry mode must be indistinguishable in shape from live mode, so the only difference is what happens to the matches.
// A detector that behaves differently in dry mode would prove nothing about live mode.

// ONLY THE MINOR READING MAY CLOSE AN INVOICE.
// The feed counts minor units, measured on 2026-11-04, so the rupiah reading of the same number is a wrong amount that happens to match a bigger invoice.

export function detectorPlan(mode: unknown, matchesByUnit: { minor: Match[]; rupiah: Match[] }): DetectorPlan {
  const live = String(mode || 'dry').toLowerCase() === 'live';
  return {
    mode: live ? 'live' : 'dry',
    closes: live ? matchesByUnit.minor : [],
    wouldClose: live ? [] : matchesByUnit.minor,
    rupiahMatches: matchesByUnit.rupiah,
    minorMatches: matchesByUnit.minor
  };
}
