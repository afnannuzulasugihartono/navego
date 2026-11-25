// @last-edited: 2026-11-25 UTC+7.
// @title: checkout-feedback.test - a plan click answers where the buyer is looking.
// @state: sign-in, pending, warning and quiet states each produce one message for the clicked plan.
// @dependencies: node:test, strict, ../../site/app/lib/checkout-feedback.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const modulePath = pathToFileURL(path.join(root, 'site', 'app', 'lib', 'checkout-feedback.ts')).href;

type Feedback = { tone: 'signin' | 'pending' | 'warn' | 'info'; message: string } | null;
type PlanFeedback = { present: boolean; feedback: Feedback };

type FeedbackModule = {
  checkoutFeedback: (input: Record<string, unknown>) => Feedback;
  planFeedback: (input: Record<string, unknown>) => PlanFeedback;
};

async function feedbackModule(): Promise<FeedbackModule> {
  try {
    return await import(modulePath) as FeedbackModule;
  } catch {
    assert.fail('site/app/lib/checkout-feedback.ts must expose the tested checkout feedback rule');
  }
}

test('a signed-out buyer is told to sign in before a payment is attempted', async () => {
  const { checkoutFeedback } = await feedbackModule();
  assert.deepEqual(
    checkoutFeedback({ signedOut: true, pending: false, note: '', warn: false }),
    { tone: 'signin', message: 'Pembayaran memakai akun Anda.' }
  );
});

test('a pending order keeps one preparing message even when the note changes', async () => {
  const { checkoutFeedback } = await feedbackModule();
  assert.deepEqual(
    checkoutFeedback({ signedOut: false, pending: true, note: 'Halaman PayPal terbuka di tab baru.', warn: false }),
    { tone: 'pending', message: 'Menyiapkan halaman PayPal...' }
  );
});

test('a warning keeps its tone and a quiet plan has no message', async () => {
  const { checkoutFeedback } = await feedbackModule();
  assert.deepEqual(
    checkoutFeedback({ signedOut: false, pending: false, note: '  PayPal tidak bisa dibuka: jaringan.  ', warn: true }),
    { tone: 'warn', message: 'PayPal tidak bisa dibuka: jaringan.' }
  );
  assert.equal(checkoutFeedback({ signedOut: false, pending: false, note: '   ', warn: false }), null);
});

test('plan feedback is keyed to the clicked card and falls back when that card is gone', async () => {
  const { planFeedback } = await feedbackModule();
  const visible = ['asia:plan.usd-1', 'europe:plan.usd-1'];
  const otherPending = planFeedback({
    lastPlan: 'asia:plan.usd-1',
    visiblePlanKeys: visible,
    pendingKey: 'europe:plan.usd-1',
    signedOut: false,
    note: 'Halaman PayPal terbuka di tab baru.',
    warn: false
  });
  assert.equal(otherPending.present, true);
  assert.deepEqual(otherPending.feedback, { tone: 'info', message: 'Halaman PayPal terbuka di tab baru.' });

  const clickedPending = planFeedback({
    lastPlan: 'asia:plan.usd-1',
    visiblePlanKeys: visible,
    pendingKey: 'asia:plan.usd-1',
    signedOut: false,
    note: 'Halaman PayPal terbuka di tab baru.',
    warn: false
  });
  assert.deepEqual(clickedPending.feedback, { tone: 'pending', message: 'Menyiapkan halaman PayPal...' });

  assert.deepEqual(
    planFeedback({ lastPlan: 'asia:plan.usd-1', visiblePlanKeys: ['europe:plan.usd-1'], pendingKey: null, signedOut: true, note: '', warn: false }),
    { present: false, feedback: null }
  );
});
