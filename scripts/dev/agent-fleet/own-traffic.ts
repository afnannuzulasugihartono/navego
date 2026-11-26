// @last-edited: 2026-11-26 UTC+7.
// @title: agent-fleet own-traffic - tells the manager which acted browser is our own test drive.
// @state: reads the funnel's acted events, the live PayPal orders and the operator accounts, and separates the browsers that acted like strangers from the ones that are our own checkout tests.
// @dependencies: node:fs, node:path, node:url, strict.

// The hourly read counts an acted browser, and our own checkout tests are acted browsers too: on 2026-11-26 the only acted traffic in 24 hours was the operator's own signed-in test (a live $1 PayPal order created at 14:48:15Z for the operator account).
// A manager that reads "1 acted browser, 2 buy clicks" as a lead is chasing its own tail, so the read says whose traffic it is before anyone acts on it.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export interface ActedEvent {
  anon_id: string;
  name: string;
  path: string;
  created_at: string;
  user_id?: string | null;
  meta?: Record<string, unknown>;
}

export interface PayPalOrder {
  order_id: string;
  owner_id: string;
  plan: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

export interface OwnTrafficVerdict {
  actedBrowsers: string[];
  strangerBrowsers: string[];
  ownBrowsers: string[];
  ownOrders: string[];
}

// The order is created right after the click (the quote round trip to PayPal takes a second or two), so half a minute is the window in which an order belongs to the click that made it.

const WINDOW_MS = 30000;

const ms = (value: string): number => Date.parse(value);

export const readOwnTraffic = (
  acted: ActedEvent[],
  orders: PayPalOrder[],
  operatorAccounts: string[],
): OwnTrafficVerdict => {
  const operators = new Set(operatorAccounts.map((id) => id.trim()).filter(Boolean));
  const ownOrders = orders
    .filter((order) => operators.has(order.owner_id ?? ''))
    .map((order) => order.order_id);
  const ownBrowsers = new Set<string>();
  for (const event of acted) {
    if (event.user_id && operators.has(event.user_id)) {
      ownBrowsers.add(event.anon_id);
      continue;
    }
    if (event.name !== 'buy.click') continue;
    const plan = typeof event.meta?.plan === 'string' ? event.meta.plan : null;
    if (!plan) continue;
    const at = ms(event.created_at);
    const matched = orders.find((order) => order.plan === plan
      && operators.has(order.owner_id ?? '')
      && Number.isFinite(at)
      && Math.abs(ms(order.created_at) - at) <= WINDOW_MS);
    if (matched) ownBrowsers.add(event.anon_id);
  }
  const actedBrowsers = [...new Set(acted.map((event) => event.anon_id))];
  return {
    actedBrowsers,
    strangerBrowsers: actedBrowsers.filter((browser) => !ownBrowsers.has(browser)),
    ownBrowsers: [...ownBrowsers],
    ownOrders,
  };
};

// A file written by a Windows tool carries a byte order mark, and a JSON file with a mark is not JSON to a parser that has never seen one.

const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));

const usage = (): void => {
  console.error('usage: node scripts/dev/agent-fleet/own-traffic.ts --acted <file> --orders <file> --operators <file>');
  console.error('each file holds a JSON array; the verdict names the stranger browsers and our own.');
};

const main = (): void => {
  const args = process.argv.slice(2);
  const flagValue = (flag: string): string | undefined => {
    const at = args.indexOf(flag);
    return at >= 0 ? args[at + 1] : undefined;
  };
  const actedFile = flagValue('--acted');
  const ordersFile = flagValue('--orders');
  const operatorsFile = flagValue('--operators');
  if (!actedFile || !ordersFile || !operatorsFile) {
    usage();
    process.exitCode = 2;
    return;
  }
  const verdict = readOwnTraffic(
    readJson(actedFile) as ActedEvent[],
    readJson(ordersFile) as PayPalOrder[],
    readJson(operatorsFile) as string[],
  );
  console.log(`acted browsers: ${verdict.actedBrowsers.length}`);
  console.log(`stranger browsers: ${verdict.strangerBrowsers.length}${verdict.strangerBrowsers.length ? ` (${verdict.strangerBrowsers.join(', ')})` : ''}`);
  console.log(`our own browsers: ${verdict.ownBrowsers.length}${verdict.ownBrowsers.length ? ` (${verdict.ownBrowsers.join(', ')})` : ''}`);
  console.log(`our own orders: ${verdict.ownOrders.length}${verdict.ownOrders.length ? ` (${verdict.ownOrders.join(', ')})` : ''}`);
};

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main();
