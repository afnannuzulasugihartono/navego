// @last-edited: 2026-11-25 UTC+7.
// @title: copy-command.test - a copy result is visible, retryable, and recorded only after the clipboard resolves.
// @state: one clipboard result, one announcement, and one cleanup timer per command.
// @dependencies: node:test, strict, node:fs, node:url.

// The copy button owns a promise and a timer, so the behavior that matters is not its markup.
// This controller test drives resolve, reject, repeated feedback, and cleanup without a browser or a new test dependency.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const modulePath = pathToFileURL(path.join(root, 'site', 'app', 'lib', 'copy-command.ts')).href;
const routeSource = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'unduh.tsx'), 'utf8');

type Feedback = { message: string; failed: boolean; attempt: number } | null;
type CopyController = {
  copy: () => Promise<void>;
  dispose: () => void;
};

async function controllerModule(): Promise<{ createCopyCommand: (options: Record<string, unknown>) => CopyController }> {
  try {
    return await import(modulePath) as { createCopyCommand: (options: Record<string, unknown>) => CopyController };
  } catch {
    assert.fail('site/app/lib/copy-command.ts must expose the tested copy controller');
  }
}

test('a resolved clipboard reports success and records install intent after the write', async () => {
  const { createCopyCommand } = await controllerModule();
  const events: string[] = [];
  let scheduled: (() => void) | null = null;
  const controller = createCopyCommand({
    text: 'command',
    successMessage: 'Disalin.',
    failureMessage: 'Gagal menyalin.',
    clipboard: { writeText: async () => { events.push('write'); } },
    onFeedback: (feedback: Feedback) => { events.push(`feedback:${feedback?.message}:${feedback?.failed}`); },
    onCopied: () => { events.push('copied'); },
    schedule: (fn: () => void) => { scheduled = fn; return 7; },
    cancel: () => { scheduled = null; }
  });

  await controller.copy();
  assert.deepEqual(events, ['write', 'feedback:Disalin.:false', 'copied']);
  assert.equal(typeof scheduled, 'function', 'success clears its message later');
  controller.dispose();
});

test('a rejected clipboard keeps the failure visible and never records install intent', async () => {
  const { createCopyCommand } = await controllerModule();
  const feedback: Feedback[] = [];
  let copied = false;
  let scheduled: (() => void) | null = null;
  const controller = createCopyCommand({
    text: 'command',
    successMessage: 'Disalin.',
    failureMessage: 'Gagal menyalin.',
    clipboard: { writeText: async () => { throw new Error('denied'); } },
    onFeedback: (value: Feedback) => { feedback.push(value); },
    onCopied: () => { copied = true; },
    schedule: (fn: () => void) => { scheduled = fn; return 7; },
    cancel: () => { scheduled = null; }
  });

  await controller.copy();
  assert.equal(feedback.length, 1);
  assert.equal(feedback[0]?.failed, true);
  assert.equal(copied, false);
  assert.equal(scheduled, null, 'failure stays until the next attempt');
  controller.dispose();
});

test('an overlapping success is recorded even when a later attempt fails', async () => {
  const { createCopyCommand } = await controllerModule();
  let releaseFirst!: () => void;
  const firstWrite = new Promise<void>((resolve) => { releaseFirst = resolve; });
  const feedback: Feedback[] = [];
  let copied = false;
  let writes = 0;
  const controller = createCopyCommand({
    text: 'command',
    successMessage: 'Disalin.',
    failureMessage: 'Gagal menyalin.',
    clipboard: { writeText: async () => {
      writes += 1;
      if (writes === 1) await firstWrite;
      else throw new Error('denied');
    } },
    onFeedback: (value: Feedback) => { feedback.push(value); },
    onCopied: () => { copied = true; },
    schedule: () => 11,
    cancel: () => undefined
  });

  const first = controller.copy();
  await controller.copy();
  assert.equal(feedback[0]?.failed, true);
  releaseFirst();
  await first;
  assert.equal(feedback[1]?.failed, false, 'the earlier successful write is not hidden by the later failure');
  assert.equal(copied, true, 'every successful write records install intent');
});

test('identical retries replace the live-region content and disposal clears pending cleanup', async () => {
  const { createCopyCommand } = await controllerModule();
  const attempts: number[] = [];
  const cancelled: number[] = [];
  const controller = createCopyCommand({
    text: 'command',
    successMessage: 'Disalin.',
    failureMessage: 'Gagal menyalin.',
    clipboard: { writeText: async () => undefined },
    onFeedback: (feedback: Feedback) => { if (feedback) attempts.push(feedback.attempt); },
    schedule: () => 9,
    cancel: (handle: number) => { cancelled.push(handle); }
  });

  await controller.copy();
  await controller.copy();
  assert.notEqual(attempts[0], attempts[1], 'every retry changes the DOM key of the live region');
  assert.match(routeSource, /key=\{feedback\.attempt\}/);
  controller.dispose();
  assert.deepEqual(cancelled, [9, 9], 'the retry replaces the first timer and disposal clears the last');
});

test('disposal invalidates a clipboard promise that resolves later', async () => {
  const { createCopyCommand } = await controllerModule();
  let resolveWrite!: () => void;
  const feedback: Feedback[] = [];
  let scheduled = false;
  const controller = createCopyCommand({
    text: 'command',
    successMessage: 'Disalin.',
    failureMessage: 'Gagal menyalin.',
    clipboard: { writeText: async () => { await new Promise<void>((resolve) => { resolveWrite = resolve; }); } },
    onFeedback: (value: Feedback) => { feedback.push(value); },
    schedule: () => { scheduled = true; return 3; },
    cancel: () => { scheduled = false; }
  });

  const copying = controller.copy();
  controller.dispose();
  resolveWrite();
  await copying;
  assert.deepEqual(feedback, [], 'a disposed component receives no late feedback');
  assert.equal(scheduled, false, 'a disposed component schedules no late cleanup');
});

test('a later attempt can replace a disposed development effect', async () => {
  const { createCopyCommand } = await controllerModule();
  const feedback: Feedback[] = [];
  const controller = createCopyCommand({
    text: 'command',
    successMessage: 'Disalin.',
    failureMessage: 'Gagal menyalin.',
    clipboard: { writeText: async () => undefined },
    onFeedback: (value: Feedback) => { feedback.push(value); },
    schedule: () => 5,
    cancel: () => undefined
  });

  controller.dispose();
  await controller.copy();
  assert.equal(feedback.length, 1, 'React development cleanup does not leave the next user attempt dead');
});

test('the copy button never disables itself or moves focus', () => {
  assert.doesNotMatch(routeSource, /\.focus\(/);
  assert.doesNotMatch(routeSource, /<button[^>]*disabled/);
});
