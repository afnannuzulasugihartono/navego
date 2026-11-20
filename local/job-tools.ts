// @last-edited: 2026-11-20 UTC+7.
// @title: job-tools — the calls that are server or disk work, so they never open a tab.
// @state: delivery_plan, delivery_record, artifact_build and the wallet_* calls are answered from disk and the server; the browser dispatcher hands these off before it resolves a tab.
// @dependencies: ./statements.js, ./reports.js, ./spreadsheets.js, ./decks.js, ./documents.js, ./wallet-client.js, ./tidy.js, ./types.js.

// THE SAME TIDY FUNCTION THE HOSTED SURFACE USES, AND WHY IT RIDES THE PACKAGE.
// The rejections that keep a model from wasting tokens on envelopes, transport keys and duplicated chain fields apply to the local stdio surface too - a rule that lives in one place stays consistent and changes for one reason.
// The copy is written at pack time (scripts/pack/pack-mcp.ts) because a path outside the package does not exist on the machine that runs the install: reading ../supabase at run time died with ENOENT for every installed user.

import { statementCard, statementDelivered } from './statements.js';
import { reportFromFile } from './reports.js';
import { spreadsheetFromFile } from './spreadsheets.js';
import { deckFromFile } from './decks.js';
import { documentFromFile, documentDocxFromFile } from './documents.js';
import { pairDevice, taskRefund, taskReserve, taskSettle, walletBalance, walletQuote, walletTopUp } from './wallet-client.js';
import { tidyForAi } from './tidy.js';
import type { JsonRecord } from './types.js';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// The tool result is the same envelope mcp-server.ts returns: the driver returns the payload, the dispatcher wraps it.

const asText = (value: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(isObject(value) ? tidyForAi(value) : value) }] });

// A PLAN IS BUILT FIELD BY FIELD.
// The server prices what it is told the job will produce, so an object passed straight through is an object a caller could widen with a price or an owner the server would then read.
// Three named fields are the whole vocabulary of a quote, and a fourth is refused by not being read.

function planFrom(args: JsonRecord): { artifact: string; estSteps: number; items?: number } {
  const plan: { artifact: string; estSteps: number; items?: number } = { artifact: String(args.artifact), estSteps: Number(args.estSteps) };
  if (typeof args.items === 'number') plan.items = args.items;
  return plan;
}

export interface JobToolsContext {
  version?: string | undefined;
}

// THESE CALLS NEVER RESOLVE A TAB.
// A wallet lives on the server, so a wallet call that needed a tab would refuse to answer with the browser closed — which is exactly when a person checks their balance or pays for the last job.
// The plan is assembled from named fields rather than passed through, so a caller cannot smuggle a price or an owner into the object the server prices.

export async function runJobTools(name: string, args: JsonRecord, context: JobToolsContext): Promise<{ handled: boolean; result?: unknown }> {
  if (name === 'delivery_plan') {
    return { handled: true, result: asText(statementCard({
      client: args.client,
      portal: args.portal,
      period: args.period,
      url: args.url ?? null,
      root: args.root ?? null,
      ext: args.ext ?? 'pdf'
    })) };
  }
  if (name === 'delivery_record') {
    return { handled: true, result: asText(statementDelivered({
      client: args.client,
      portal: args.portal,
      period: args.period,
      path: args.path,
      balance: args.balance ?? null,
      manifest: args.manifest ?? null,
      replace: args.replace === true
    })) };
  }
  if (name === 'artifact_build') {
    const target = args.target === undefined ? 'word' : String(args.target);
    if (!['word', 'xlsx', 'pptx', 'docx'].includes(target)) {
      throw new Error(`artifact_build target must be "word", "xlsx", "pptx" or "docx" - got: ${String(args.target)}`);
    }
    if (target === 'pptx') {
      return { handled: true, result: asText(deckFromFile({
        source: args.source,
        out: args.out ?? null,
        report: args.report ?? null
      })) };
    }
    if (target === 'docx') {
      const plan = documentFromFile({
        source: args.source,
        out: null
      });
      const written = documentDocxFromFile({
        source: args.source,
        out: args.out ?? null
      });
      return { handled: true, result: asText({ ...written, plan: plan.out, planVerified: plan.verified }) };
    }
    const job = {
      source: args.source,
      client: args.client,
      title: args.title,
      period: args.period,
      periodColumn: args.periodColumn ?? null,
      groupBy: args.groupBy,
      valueColumn: args.valueColumn,
      out: args.out ?? null
    };
    return { handled: true, result: asText(target === 'xlsx' ? spreadsheetFromFile(job) : reportFromFile(job)) };
  }
  if (name === 'wallet_pair_device') {
    return { handled: true, result: asText(await pairDevice({ code: args.code, deviceName: args.deviceName, version: context.version })) };
  }
  if (name === 'wallet_get_balance') return { handled: true, result: asText(await walletBalance()) };
  if (name === 'wallet_add_funds') return { handled: true, result: asText(await walletTopUp()) };
  if (name === 'wallet_get_price') return { handled: true, result: asText(await walletQuote(planFrom(args))) };
  if (name === 'wallet_hold_price') return { handled: true, result: asText(await taskReserve(planFrom(args))) };
  if (name === 'wallet_charge') {
    return { handled: true, result: asText(await taskSettle({
      reservationId: args.reservationId,
      artifactHash: args.artifactHash,
      actionsActual: typeof args.actionsActual === 'number' ? args.actionsActual : null
    })) };
  }
  if (name === 'wallet_refund') {
    return { handled: true, result: asText(await taskRefund({ reservationId: args.reservationId, reason: args.reason ?? null })) };
  }
  return { handled: false };
}
