// @last-edited: 2026-11-28 UTC+7.
// @title: known-failure gate - the three lies the fleet already told must stay impossible in one check.
// @state: a dated reply counts and a README does not; a queued message is not a receipt; an owner's buy click is not a stranger browser.
// @dependencies: node:fs, node:os, node:path, node:url, ./goal.ts, ./own-traffic.ts, strict.

// Anthropic's eval guidance says to turn real failures into a small regression suite. These three failures already happened here: a README was read as a buyer, a queued message was called sent, and an owner buy click was called a lead.
// https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMissionState } from './goal.ts';
import { readOwnTraffic, type ActedEvent, type PayPalOrder } from './own-traffic.ts';

export interface RegressionCheck {
  id: string;
  ok: boolean;
  detail: string;
}

export interface RegressionPaths {
  repliesDir: string;
  queueDir: string;
  root: string;
}

const read = (file: string): string => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
};

const replyRegisterCheck = (paths: RegressionPaths): RegressionCheck => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'navego-regression-'));
  const dated = path.join(temp, 'dated');
  const undated = path.join(temp, 'undated');
  fs.mkdirSync(dated, { recursive: true });
  fs.mkdirSync(undated, { recursive: true });
  fs.writeFileSync(path.join(dated, '2026-11-28-harbor.md'), 'answered: no\n');
  fs.writeFileSync(path.join(undated, 'README.md'), 'answered: no\n');
  const ledger = path.join(paths.root, 'docs/economy.json');
  const counted = readMissionState(ledger, paths.queueDir, { repliesDir: dated }).buyerRepliesWaiting;
  const ignored = readMissionState(ledger, paths.queueDir, { repliesDir: undated }).buyerRepliesWaiting;
  fs.rmSync(temp, { recursive: true, force: true });
  return {
    id: 'reply-register',
    ok: counted === 1 && ignored === 0,
    detail: `dated answer counted ${counted}; README counted ${ignored}`
  };
};

const queuedReceiptCheck = (paths: RegressionPaths): RegressionCheck => {
  const message = read(path.join(paths.root, 'scripts/dev/agent-fleet/message.ts'));
  const executor = read(path.join(paths.root, 'scripts/dev/agent-fleet/executor.ts'));
  const ok = /DELIVERY_QUEUED/.test(message) && /DELIVERY_UNVERIFIED/.test(message)
    && /No secret, cash request/.test(executor);
  return { id: 'queued-receipt', ok, detail: ok ? 'queued and unverified are named; receipts exclude money' : 'a queued message could be read as sent' };
};

const ownBuyClickCheck = (): RegressionCheck => {
  const acted: ActedEvent[] = [{
    anon_id: 'browser-1', name: 'buy.click', path: '/harga',
    created_at: '2026-11-27T23:50:02Z', meta: { plan: 'plan.usd-1' }
  }];
  const orders: PayPalOrder[] = [{
    order_id: 'OWN-1', owner_id: 'owner-1', plan: 'plan.usd-1', amount_cents: 100,
    status: 'created', created_at: '2026-11-27T23:50:05Z'
  }];
  const verdict = readOwnTraffic(acted, orders, ['owner-1']);
  const ok = verdict.strangerBrowsers.length === 0 && verdict.ownBrowsers.includes('browser-1');
  return { id: 'own-buy-click', ok, detail: `strangers ${verdict.strangerBrowsers.length}; own ${verdict.ownBrowsers.length}` };
};

export function checkKnownFailures(paths: RegressionPaths): RegressionCheck[] {
  return [replyRegisterCheck(paths), queuedReceiptCheck(paths), ownBuyClickCheck()];
}

const invokedDirectly = process.argv[1] ? import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href : false;

if (invokedDirectly) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const checks = checkKnownFailures({
    root,
    queueDir: path.join(root, 'docs/agent-roles/queue'),
    repliesDir: path.join(root, 'docs/proof/outreach/replies')
  });
  console.log(JSON.stringify(checks, null, 2));
  process.exitCode = checks.some((check) => !check.ok) ? 1 : 0;
}
