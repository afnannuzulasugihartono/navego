// @last-edited: 2026-11-25 UTC+7.
// @title: copy-command.test - a copy result is visible, retryable, and recorded only after the clipboard resolves.
// @state: resolve reports success, reject persists failure, identical retries differ, and disposal clears feedback cleanup.
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

type Feedback = { message: string; failed: boolean } | null;
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

test('identical retries remain different announcements and disposal clears pending cleanup', async () => {
  const { createCopyCommand } = await controllerModule();
  const messages: string[] = [];
  const cancelled: number[] = [];
  const controller = createCopyCommand({
    text: 'command',
    successMessage: 'Disalin.',
    failureMessage: 'Gagal menyalin.',
    clipboard: { writeText: async () => undefined },
    onFeedback: (feedback: Feedback) => { if (feedback) messages.push(feedback.message); },
    schedule: () => 9,
    cancel: (handle: number) => { cancelled.push(handle); }
  });

  await controller.copy();
  await controller.copy();
  assert.notEqual(messages[0], messages[1]);
  assert.match(messages[1]!, /\u00a0$/);
  controller.dispose();
  assert.deepEqual(cancelled, [9, 9], 'the retry replaces the first timer and disposal clears the last');
});

test('the copy button never disables itself or moves focus', () => {
  assert.doesNotMatch(routeSource, /\.focus\(/);
  assert.doesNotMatch(routeSource, /<button[^>]*disabled/);
});
