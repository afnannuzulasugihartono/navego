// @last-edited: 2026-10-22 UTC+7.
// @title: burst — dependent steps on one tab, with one page look at the end.
// @state: the action vocabulary, a checked step list, and a stop-on-failure runner.
// @dependencies: ./gates.js.

// THIS FILE EXISTS

// The local surface sends one action per call, and every call pays the same fixed cost: the protocol turn, the settle, and the page read that rides back with the answer.
// A menu walk is three or four dependent moves, so the cost is paid three or four times for a page that has not been looked at since the first move.
// The cloud burst already proved the shape on the other side of the wire; this is the same shape without the wire.

// IT IS NOT THE CLOUD BURST.
// The cloud burst can switch tabs and carry a reference to a row created by an earlier action.
// This one stays on the tab the tool was given, because a local drive that silently moves to another tab is how a batch lands in the wrong document.
// It still carries a handle from an earlier find step, which is the part that removes the stale-coordinate problem.

import { detectGate } from './gates.js';

export const BURST_MAX_STEPS = 8;
export const BURST_MAX_TIMEOUT_MS = 12000;
export const BURST_ACTIONS = Object.freeze([
  'browser_click',
  'browser_find_element',
  'browser_hover',
  'browser_press_key',
  'browser_type_text',
  'browser_scroll',
  'stream',
  'browser_wait_until'
]);

// A read-only burst must not bring a window forward.
// The person may be reading something else, and a wait has no reason to take the machine's attention.

export const BURST_INPUT_ACTIONS = Object.freeze([
  'browser_click',
  'browser_hover',
  'browser_press_key',
  'browser_type_text',
  'browser_scroll',
  'stream'
]);

const STEP_KEYS: Record<string, readonly string[]> = Object.freeze({
  'browser_click': ['action', 'x', 'y', 'handle', 'role', 'name', 'refFromStep'],
  'browser_find_element': ['action', 'role', 'name'],
  'browser_hover': ['action', 'x', 'y', 'refFromStep'],
  'browser_press_key': ['action', 'key', 'modifiers'],
  'browser_type_text': ['action', 'text', 'atEnd'],
  'browser_scroll': ['action', 'y', 'end', 'text', 'selector'],
  'stream': ['action', 'events'],
  'browser_wait_until': ['action', 'until', 'text', 'role', 'name', 'absent', 'timeoutMs', 'intervalMs', 'quietMs']
});

const MODIFIERS = new Set(['Control', 'Alt', 'Shift', 'Meta']);

import type { JsonRecord } from './types.js';

// A burst step as the normalizer leaves it: one action verb plus the keys that verb owns.

export interface BurstStep {
  action: string;
  [key: string]: unknown;
}

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[] | undefined, where: string) {
  for (const key of Object.keys(value)) {
    if (!allowed) return;
    if (!allowed.includes(key)) throw new Error(`${where} has unknown key "${key}"`);
  }
}

function textOf(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} must be a non-empty string`);
  return value;
}

function modifiersOf(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('modifiers must be an array');
  for (const modifier of value) {
    if (!MODIFIERS.has(modifier)) throw new Error(`unknown modifier "${modifier}"`);
  }
  return value;
}

function pointOf(step: Record<string, unknown>, where: string) {
  if (step.x === undefined && step.y === undefined) return null;
  if (step.x === undefined || step.y === undefined) throw new Error(`${where} needs both x and y`);
  const x = Number(step.x);
  const y = Number(step.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`${where} needs finite x and y`);
  return { x, y };
}

function refOf(step: Record<string, unknown>, index: number, where: string): number | null {
  if (step.refFromStep === undefined) return null;
  const ref = Number(step.refFromStep);
  if (!Number.isInteger(ref) || ref < 0 || ref >= index) {
    throw new Error(`${where}: refFromStep must point at an earlier step`);
  }
  return ref;
}

function targetOf(step: Record<string, unknown>, index: number, where: string, { handle = false }: { handle?: boolean } = {}) {
  const point = pointOf(step, where);
  const ref = refOf(step, index, where);
  const named = step.handle === undefined ? null : textOf(step.handle, `${where} handle`);
  const modes = Number(point !== null) + Number(ref !== null) + Number(named !== null);
  if (modes !== 1) {
    throw new Error(`${where} needs exactly one of ${handle ? 'x/y, handle, or refFromStep' : 'x/y or refFromStep'}`);
  }
  if (named !== null && !handle) throw new Error(`${where} does not take a handle`);
  return { point, ref, handle: named };
}

function streamEvents(events: unknown, where: string): Array<Record<string, unknown>> {
  if (!Array.isArray(events) || events.length < 1 || events.length > 100) {
    throw new Error(`${where} needs 1-100 events`);
  }
  return events.map((value, index) => {
    const event = value as Record<string, unknown>;
    const at = `${where} event ${index}`;
    if (!isObject(event)) throw new Error(`${at} must be an object`);
    onlyKeys(event, ['key', 'modifiers', 'text', 'gapMs'], at);
    if (event.key === undefined && event.text === undefined) throw new Error(`${at} needs key or text`);
    if (event.key !== undefined && event.text !== undefined) throw new Error(`${at} has both key and text`);
    if (event.key !== undefined) textOf(event.key, `${at} key`);
    if (event.text !== undefined && typeof event.text !== 'string') throw new Error(`${at} text must be a string`);
    if (event.modifiers !== undefined) modifiersOf(event.modifiers);
    if (event.gapMs !== undefined && !Number.isFinite(Number(event.gapMs))) throw new Error(`${at} gapMs must be finite`);
    return { ...event };
  });
}

function waitStep(step: Record<string, unknown>, where: string): BurstStep {
  const until = typeof step.until === 'string' ? step.until : (step.text !== undefined ? 'text' : undefined);
  if (!until) throw new Error(`${where} needs until — text, row, url or stable`);
  const out: BurstStep = { action: 'browser_wait_until', until };

  if (until === 'text') {
    out.text = textOf(step.text, `${where} text`);
    if (step.absent !== undefined) {
      if (typeof step.absent !== 'boolean') throw new Error(`${where} absent must be true or false`);
      out.absent = step.absent;
    }
  } else if (until === 'row') {
    out.role = textOf(step.role, `${where} role`);
    out.name = textOf(step.name, `${where} name`);
    if (step.absent !== undefined) {
      if (typeof step.absent !== 'boolean') throw new Error(`${where} absent must be true or false`);
      out.absent = step.absent;
    }
  } else if (until === 'url') {
    if (step.text === undefined && step.contains === undefined && step.matches === undefined) {
      throw new Error(`${where} until=url needs text (substring the url must contain), or contains, or matches (regex)`);
    }
    if (step.text !== undefined) out.text = textOf(step.text, `${where} text`);
    if (step.contains !== undefined) out.contains = textOf(step.contains, `${where} contains`);
    if (step.matches !== undefined) out.matches = textOf(step.matches, `${where} matches`);
  } else if (until === 'stable') {
    if (step.quiet !== undefined) {
      const value = Number(step.quiet);
      if (!Number.isFinite(value) || value < 0) throw new Error(`${where} quiet must be a finite number`);
      out.quiet = value;
    }
  } else {
    throw new Error(`${where} until must be text, row, url or stable — got: ${until}`);
  }
  for (const name of ['timeoutMs', 'intervalMs', 'quietMs'] as const) {
    if (step[name] === undefined) continue;
    const value = Number(step[name]);
    if (!Number.isFinite(value) || value < 0) throw new Error(`${where} ${name} must be a finite number`);
    out[name] = value;
  }
  return out;
}

function normalizeStep(value: unknown, index: number): BurstStep {
  const step = value as Record<string, unknown>;
  const where = `step ${index}`;
  if (!isObject(step)) throw new Error(`${where} must be an object`);
  const action = String(step.action ?? '');
  if (!BURST_ACTIONS.includes(action)) {
    throw new Error(`${where} action "${action}" is not one of ${BURST_ACTIONS.join(', ')}`);
  }
  onlyKeys(step, STEP_KEYS[action], where);

  if (action === 'browser_click' || action === 'browser_hover') {
    if (action === 'browser_click' && (step.role !== undefined || step.name !== undefined)) {
      if (typeof step.role !== 'string' || typeof step.name !== 'string') throw new Error(`${where} role and name must be strings when given`);
      return { action, role: step.role, name: step.name };
    }
    const target = targetOf(step, index, where, { handle: action === 'browser_click' });
    return {
      action,
      ...(target.point ? { x: target.point.x, y: target.point.y } : {}),
      ...(target.handle ? { handle: target.handle } : {}),
      ...(target.ref !== null ? { refFromStep: target.ref } : {})
    };
  }
  if (action === 'browser_find_element') {
    return { action, role: textOf(step.role, `${where} role`), name: textOf(step.name, `${where} name`) };
  }
  if (action === 'browser_press_key') {
    return { action, key: textOf(step.key, `${where} key`), modifiers: modifiersOf(step.modifiers) };
  }
  if (action === 'browser_type_text') {
    if (typeof step.text !== 'string') throw new Error(`${where} text must be a string`);
    return { action, text: step.text, ...(step.atEnd === true ? { atEnd: true } : {}) };
  }
  if (action === 'stream') {
    return { action, events: streamEvents(step.events, where) };
  }
  if (action === 'browser_wait_until') return waitStep(step, where);

  const out: BurstStep = { action };
  if (step.y !== undefined) {
    const y = Number(step.y);
    if (!Number.isFinite(y)) throw new Error(`${where} y must be finite`);
    out.y = y;
  }
  if (step.end !== undefined) {
    if (typeof step.end !== 'boolean') throw new Error(`${where} end must be true or false`);
    out.end = step.end;
  }
  if (step.text !== undefined) out.text = textOf(step.text, `${where} text`);
  if (step.selector !== undefined) out.selector = textOf(step.selector, `${where} selector`);
  if (out.y === undefined && out.end === undefined && out.text === undefined && out.selector === undefined) {
    throw new Error(`${where} scroll needs y, end, text, or selector`);
  }
  return out;
}

export function normalizeBurst(args: unknown): { steps: BurstStep[]; timeoutMs: number } {
  const bag = (typeof args === 'object' && args !== null ? args : {}) as { steps?: unknown; timeoutMs?: unknown };
  if (!Array.isArray(bag.steps) || bag.steps.length < 1 || bag.steps.length > BURST_MAX_STEPS) {
    throw new Error(`run needs 1-${BURST_MAX_STEPS} steps`);
  }
  const asked = Number(bag.timeoutMs ?? BURST_MAX_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(asked)
    ? Math.min(BURST_MAX_TIMEOUT_MS, Math.max(500, Math.round(asked)))
    : BURST_MAX_TIMEOUT_MS;
  return { steps: bag.steps.map((step, index) => normalizeStep(step, index)), timeoutMs };
}

type BurstResult = Record<string, unknown> & { action: string };

function refAt(step: BurstStep, results: BurstResult[]): BurstResult | null {
  if (step.refFromStep === undefined) return null;
  const found = results.find((entry) => entry.index === Number(step.refFromStep));
  if (!found) throw new Error(`refFromStep ${step.refFromStep} has no completed step behind it`);
  return found;
}

async function runStep(driver: JsonRecord, step: BurstStep, results: BurstResult[], remaining: number): Promise<unknown> {
  if (step.action === 'browser_find_element') return driver.resolve(step.role, step.name);
  if (step.action === 'browser_click') {
    const ref = refAt(step, results);
    if (step.role !== undefined) return driver.clickRow(step.role, step.name);
    if (!ref) return driver.click(step.x, step.y, step.handle ?? null);
    if (!ref.handle) throw new Error('refFromStep did not hand back a handle; browser_find_element the row first');
    return driver.click(null, null, ref.handle);
  }
  if (step.action === 'browser_hover') {
    const ref = refAt(step, results);
    if (!ref) return driver.hover(step.x, step.y);
    const row = (ref.row ?? ref) as Record<string, unknown>;
    const x = Number(row?.x);
    const y = Number(row?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('refFromStep did not hand back a point to hover');
    return driver.hover(x, y);
  }
  if (step.action === 'browser_press_key') return driver.key(step.key, step.modifiers ?? []);
  if (step.action === 'browser_type_text') return step.atEnd === true ? driver.append(step.text) : driver.type(step.text);
  if (step.action === 'stream') return driver.keys(step.events);
  if (step.action === 'browser_scroll') {
    const options: Record<string, unknown> = {};
    if (step.y !== undefined) options.y = step.y;
    if (step.end !== undefined) options.end = step.end;
    if (step.text !== undefined) options.text = step.text;
    if (step.selector !== undefined) options.selector = step.selector;
    return driver.scroll(options);
  }

  if (step.action === 'browser_wait_until') {
    const options = {
      timeoutMs: Math.max(0, remaining),
      ...(step.intervalMs === undefined ? {} : { intervalMs: step.intervalMs })
    };
    if (step.until === 'text' || (step.until === undefined && step.text !== undefined)) {
      const absent = step.absent === true;
      if (typeof driver.waitForText !== 'function') throw new Error('this driver cannot wait for text');
      const state = await driver.waitForText(step.text, { ...options, absent });
      const present = String(state?.text ?? '').includes(String(step.text));
      if (present === absent) {
        throw new Error(`wait for "${step.text}" to ${absent ? 'leave' : 'appear'} timed out`);
      }
      return {
        found: true,
        present,
        absent,
        url: state?.url ?? null,
        title: state?.title ?? null,
        textChars: String(state?.text ?? '').length
      };
    }
    if (step.until === 'row') {
      return waitForRowStep(driver, step, step.absent === true, options);
    }
    if (step.until === 'url') {
      if (typeof driver.waitForUrl !== 'function') throw new Error('this driver cannot wait for a url');
      const text = step.text ?? step.contains;
      const out = await driver.waitForUrl({
        contains: typeof text === 'string' ? text : null,
        matches: typeof step.matches === 'string' ? step.matches : null,
        timeoutMs: options.timeoutMs
      });
      const hit = isObject(out) && typeof out.found === 'boolean' ? out.found : false;
      if (!hit) throw new Error(`wait for url ${String(text ?? step.matches ?? '(regex)')} timed out`);
      return out;
    }
    if (step.until === 'stable') {
      if (typeof driver.waitForStill !== 'function') throw new Error('this driver cannot wait for a still page');
      const quietMs = step.quietMs === undefined ? 120 : Math.max(0, Number(step.quietMs) || 120);
      const out = await driver.waitForStill({ timeoutMs: options.timeoutMs, quietMs });
      const still = isObject(out) && out.still === true;
      if (!still) throw new Error('wait for the page to stop changing timed out');
      return out;
    }
    throw new Error(`browser_wait_until until must be text, row, url or stable — got: ${String(step.until)}`);
  }

  throw new Error(`${step.action} is not a step this burst can run`);
}

function waitForRowStep(driver: JsonRecord, step: BurstStep, absent: boolean, options: Record<string, unknown> & { timeoutMs: number }) {
  if (typeof driver.waitForRow !== 'function') throw new Error('this driver cannot wait for a row');
  return driver.waitForRow({
    role: step.role,
    name: step.name,
    absent,
    ...options
  }).then((waited: unknown) => {
    const answer = waited as Record<string, unknown> | null | undefined;
    if (answer?.found !== true) {
      throw new Error(`wait for ${step.role} "${step.name}" to ${absent ? 'leave' : 'appear'} timed out`);
    }
    return answer;
  });
}

export interface BurstOutcome {
  ok: boolean;
  partial?: boolean;
  timedOut?: boolean;
  completedSteps: number;
  failedAt?: number;
  failedAction?: string;
  error?: { message: string };
  errors?: Array<{ index: number; action: string; message: string }>;
  results: BurstResult[];
  timingMs: number;
  settled?: boolean;
  needsHuman?: { gate: string; why: string; url: string; title: string; resume: string };
}

export async function runLocalBurst({ driver, steps, timeoutMs = BURST_MAX_TIMEOUT_MS, now = Date.now, continueOnError = false }: { driver: JsonRecord; steps: BurstStep[]; timeoutMs?: number; now?: () => number; continueOnError?: boolean }): Promise<BurstOutcome> {
  const clock = typeof now === 'function' ? now : Date.now;
  const started = clock();
  const deadline = started + timeoutMs;
  const results: BurstResult[] = [];

  const failure = (index: number, step: BurstStep, error: unknown, timedOut = false) => ({
    ok: false,
    timedOut,
    completedSteps: results.length,
    failedAt: index,
    failedAction: step.action,
    error: { message: error instanceof Error ? error.message : String(error) },
    results,
    timingMs: Math.max(0, clock() - started)
  });

  const errors: Array<{ index: number; action: string; message: string }> = [];
  let timedOut = false;

  const needsHuman = async (step: BurstStep, index: number, error: unknown) => {
    try {
      const gate = await detectGate({
        evaluate: (expression: string) => driver.evaluate(expression),
        click: (x: number, y: number) => driver.click(x, y),
        type: (text: string) => driver.type(text)
      });
      if (gate.gate === 'none') return null;
      return {
        ...failure(index, step, error),
        needsHuman: {
          gate: gate.gate,
          why: gate.why,
          url: gate.url,
          title: gate.title,
          resume: 'Finish the gate in your own browser, then run the remaining steps again; the agent never answers an OTP or a captcha for you.'
        }
      };
    } catch {
      return null;
    }
  };

  // A failed step is recorded once, never retried in a loop: the caller gets the work that did finish and the exact step that failed.

  for (let index = 0; index < steps.length; index += 1) {
    // THE CAST IS SAFE HERE.
    // the array is a local snapshot; nothing in this loop resizes it.
    const step = steps[index] as BurstStep;
    const remaining = deadline - clock();
    if (remaining < 50) {
      const failureOut = failure(index, step, new Error(`run ran out of its ${timeoutMs} ms budget before step ${index}`), true);
      if (!continueOnError) return failureOut;
      timedOut = true;
      errors.push({ index, action: step.action, message: failureOut.error.message });
      break;
    }
    const stepStarted = clock();
    // THE STEP'S OWN ANSWER IS NOT BOXED IN ANOTHER BOX.
    // The step already says what it did - the row it found, the key it sent - and a `result` wrapper only makes the reader open one more door to find it.
    try {
      const result = await runStep(driver, step, results, remaining);
      results.push({ ...(result && typeof result === 'object' ? result : { value: result }), index, action: step.action, ok: true, timingMs: Math.max(0, clock() - stepStarted) });
    } catch (error: unknown) {
      const handoff = await needsHuman(step, index, error);
      if (handoff) return handoff;
      if (!continueOnError) return failure(index, step, error);
      errors.push({ index, action: step.action, message: error instanceof Error ? error.message : String(error) });
    }
  }

  // A BURST THAT SETTLED TELLS THE LOOK.
  // A wait step ends on a settled page, and a chord-only stream returns a verdict that it watched the page go quiet.
  // The look after the burst would settle the same page again, which is one round trip billed twice, so the burst passes the verdict it already has.
  const settledStep = results.some((entry) => entry.action === 'browser_wait_until' || (entry.action === 'stream' && entry.settled === true));

  if (errors.length) {
    const first = errors[0];
    if (!first) throw new Error('unreachable: an error was recorded without a step');
    return {
      ok: false,
      partial: results.length > 0,
      completedSteps: results.length,
      failedAt: first.index,
      failedAction: first.action,
      error: { message: first.message },
      ...(timedOut ? { timedOut: true } : {}),
      errors,
      results,
      timingMs: Math.max(0, clock() - started),
      ...(settledStep ? { settled: true } : {})
    };
  }

  return { ok: true, completedSteps: results.length, results, timingMs: Math.max(0, clock() - started), ...(settledStep ? { settled: true } : {}) };
}
