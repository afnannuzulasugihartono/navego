// @last-edited: 2026-11-25 UTC+7.
// @title: copy-command - one clipboard promise owns one visible result and one cleanup timer.
// @state: idle, copied, or failed; success expires, failure waits for the next attempt, and each identical announcement differs.
// @dependencies: none.
// decisions.json -> site-install-cta-01

export type CopyFeedback = {
  message: string;
  failed: boolean;
};

type ClipboardWriter = {
  writeText: (text: string) => Promise<void>;
};

type CopyCommandOptions = {
  text: string;
  successMessage: string;
  failureMessage: string;
  clipboard?: ClipboardWriter;
  onFeedback: (feedback: CopyFeedback | null) => void;
  onCopied?: () => void;
  schedule?: (run: () => void, delay: number) => number;
  cancel?: (handle: number) => void;
};

export function createCopyCommand(options: CopyCommandOptions) {
  let timer: number | null = null;
  let lastSpoken = '';

  const schedule = options.schedule ?? ((run: () => void, delay: number) => window.setTimeout(run, delay));
  const cancel = options.cancel ?? ((handle: number) => window.clearTimeout(handle));

  const announce = (message: string, failed: boolean) => {
    const spoken = message === lastSpoken ? `${message}\u00a0` : message;
    lastSpoken = spoken;
    options.onFeedback({ message: spoken, failed });
    if (timer !== null) {
      cancel(timer);
      timer = null;
    }
    if (!failed) timer = schedule(() => options.onFeedback(null), 2000);
  };

  return {
    async copy() {
      const clipboard = options.clipboard ?? (globalThis.navigator as Navigator | undefined)?.clipboard;
      if (!clipboard) {
        announce(options.failureMessage, true);
        return;
      }
      try {
        await clipboard.writeText(options.text);
      } catch {
        announce(options.failureMessage, true);
        return;
      }
      announce(options.successMessage, false);
      options.onCopied?.();
    },
    dispose() {
      if (timer !== null) {
        cancel(timer);
        timer = null;
      }
    }
  };
}
