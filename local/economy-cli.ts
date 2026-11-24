// @last-edited: 2026-11-24 UTC+7.
// @title: economy-cli - the command an agent runs to read the ledger, score decisions, and ask whether to spend.
// @state: status, record, note, spend, and the subscription choice.
// @dependencies: ./economy-core.js, ./economy-store.js.

import {
  chooseUpgrade,
  decisionScores,
  evaluateSpend,
  summarizeEconomy,
  type EconomyEvent,
  type SubscriptionOption
} from './economy-core.js';
import {
  appendEvent,
  economyDir,
  readEvents,
  readKnowledge,
  readSubscription,
  writeKnowledge,
  writeSubscription,
  type SubscriptionState
} from './economy-store.js';

const USAGE = `navego economy <command> [args]

  status [--days=30] [--currency=USD]   read cash, points, window revenue and runway
  record --kind=revenue|cost|subscription|refund --amount=<minor> --currency=USD --decision=<id> --source=<text> [--note=<text>] [--at=<ISO>]
  note --id=<id> --title=<title> --kind=<kind> --source=<url> --observed=<ISO> --body=<text>
  spend --amount=<minor> --currency=USD  ask whether the reserve allows the spend
  subscription --current=<plan> --currency=USD --capability=<n> --capacity=<n> [--option=<json>]
  knowledge                             list the knowledge library
`;

interface Args {
  command: string;
  flags: Map<string, string>;
  positionals: string[];
}

function parseArgs(argv: string[]): Args {
  const flags = new Map<string, string>();
  const positionals: string[] = [];
  let command = '';
  for (const item of argv) {
    if (item.startsWith('--')) {
      const separator = item.indexOf('=');
      if (separator < 0) flags.set(item.slice(2), '');
      else flags.set(item.slice(2, separator), item.slice(separator + 1));
      continue;
    }
    if (!command) command = item;
    else positionals.push(item);
  }
  return { command, flags, positionals };
}

function required(args: Args, name: string): string {
  const value = args.flags.get(name);
  if (!value) throw new Error(`--${name} is required.`);
  return value;
}

function integer(args: Args, name: string): number {
  const raw = required(args, name);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`--${name} must be a positive integer.`);
  return value;
}

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function eventFrom(args: Args): EconomyEvent {
  const kind = required(args, 'kind');
  const at = args.flags.get('at') ?? new Date().toISOString();
  const note = args.flags.get('note');
  return {
    id: args.flags.get('id') ?? `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    kind: kind as EconomyEvent['kind'],
    amountMinor: integer(args, 'amount'),
    currency: required(args, 'currency').toUpperCase(),
    decisionId: required(args, 'decision'),
    source: required(args, 'source'),
    ...(note ? { note } : {})
  };
}

export async function economy({ args: argv, cwd = process.cwd() }: { args: string[]; cwd?: string }): Promise<number> {
  const args = parseArgs(argv);
  if (!args.command || args.command === 'help') {
    process.stdout.write(USAGE);
    return 0;
  }
  const dir = economyDir(process.env, cwd);
  const events = readEvents(dir);

  if (args.command === 'status') {
    const days = Number(args.flags.get('days') ?? '30');
    const currency = args.flags.get('currency');
    const summary = summarizeEconomy(events, {
      asOf: new Date().toISOString(),
      windowDays: Number.isFinite(days) && days > 0 ? days : 30,
      ...(currency ? { currency: currency.toUpperCase() } : {})
    });
    writeJson({ ...summary, scores: decisionScores(events), subscription: readSubscription(dir), dir });
    return 0;
  }

  if (args.command === 'record') {
    const written = appendEvent(dir, eventFrom(args));
    writeJson({ ok: true, event: written, dir });
    return 0;
  }

  if (args.command === 'note') {
    const note = writeKnowledge(dir, {
      id: required(args, 'id'),
      title: required(args, 'title'),
      kind: required(args, 'kind'),
      source: required(args, 'source'),
      observed: required(args, 'observed'),
      body: required(args, 'body')
    });
    writeJson({ ok: true, note, dir });
    return 0;
  }

  if (args.command === 'knowledge') {
    writeJson({ notes: readKnowledge(dir), dir });
    return 0;
  }

  if (args.command === 'spend') {
    const decision = evaluateSpend(events, {
      amountMinor: integer(args, 'amount'),
      currency: required(args, 'currency').toUpperCase()
    });
    writeJson(decision);
    return decision.allowed ? 0 : 3;
  }

  if (args.command === 'subscription') {
    const current = readSubscription(dir);
    const currency = required(args, 'currency').toUpperCase();
    const capabilityScore = integer(args, 'capability');
    const capacityUnits = integer(args, 'capacity');
    const options: SubscriptionOption[] = [];
    const optionFlag = args.flags.get('option');
    if (optionFlag) {
      const parsed = JSON.parse(optionFlag) as unknown;
      if (!Array.isArray(parsed)) throw new Error('--option must be a JSON array of subscription options.');
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const id = Reflect.get(item, 'id');
        const label = Reflect.get(item, 'label');
        const monthlyMinor = Reflect.get(item, 'monthlyMinor');
        const optionCurrency = Reflect.get(item, 'currency');
        const capability = Reflect.get(item, 'capabilityScore');
        const capacity = Reflect.get(item, 'capacityUnits');
        const source = Reflect.get(item, 'source');
        if (typeof id !== 'string' || typeof label !== 'string' || typeof monthlyMinor !== 'number') continue;
        if (typeof optionCurrency !== 'string' || typeof capability !== 'number' || typeof capacity !== 'number') continue;
        if (typeof source !== 'string' || !source) continue;
        options.push({
          id,
          label,
          monthlyMinor,
          currency: optionCurrency.toUpperCase(),
          capabilityScore: capability,
          capacityUnits: capacity,
          source
        });
      }
    }
    const choice = chooseUpgrade({
      current: { currency, capabilityScore, capacityUnits },
      options,
      events
    });
    if (choice.action === 'upgrade' && choice.option) {
      const state: SubscriptionState = {
        provider: 'navego-economy',
        plan: choice.option.id,
        currency: choice.option.currency,
        monthlyMinor: choice.option.monthlyMinor,
        capabilityScore: choice.option.capabilityScore,
        capacityUnits: choice.option.capacityUnits,
        source: choice.option.source,
        renewedAt: new Date().toISOString()
      };
      writeSubscription(dir, state);
      appendEvent(dir, {
        id: `sub-${Date.now().toString(36)}`,
        at: state.renewedAt,
        kind: 'subscription',
        amountMinor: state.monthlyMinor,
        currency: state.currency,
        decisionId: `subscription:${state.plan}`,
        source: state.source
      });
    }
    writeJson({ ...choice, current, dir });
    return 0;
  }

  process.stderr.write(`Unknown economy command: ${args.command}\n${USAGE}`);
  return 2;
}
