// decisions.json -> site-checkout-intent-01, site-checkout-feedback-02

export type CheckoutTone = 'signin' | 'pending' | 'warn' | 'info';

export type CheckoutFeedback = {
  tone: CheckoutTone;
  message: string;
} | null;

export type CheckoutFeedbackInput = {
  signedOut: boolean;
  pending: boolean;
  note: string;
  warn: boolean;
};

export type PlanFeedbackInput = Omit<CheckoutFeedbackInput, 'pending'> & {
  lastPlan: string | null;
  visiblePlanKeys: Iterable<string>;
  pendingKey: string | null;
};

export type PlanFeedback = {
  present: boolean;
  feedback: CheckoutFeedback;
};

export function checkoutFeedback({ signedOut, pending, note, warn }: CheckoutFeedbackInput): CheckoutFeedback {
  if (signedOut) return { tone: 'signin', message: 'Pembayaran memakai akun Anda.' };
  if (pending) return { tone: 'pending', message: 'Menyiapkan halaman PayPal...' };
  const message = note.trim();
  if (!message) return null;
  return { tone: warn ? 'warn' : 'info', message };
}

export function planFeedback({ lastPlan, visiblePlanKeys, pendingKey, signedOut, note, warn }: PlanFeedbackInput): PlanFeedback {
  const present = lastPlan !== null && new Set(visiblePlanKeys).has(lastPlan);
  return {
    present,
    feedback: present ? checkoutFeedback({ signedOut, pending: pendingKey === lastPlan, note, warn }) : null
  };
}
