// @last-edited: 2026-11-25 UTC+7.
// @title: copy-command - one clipboard promise owns one visible result and one cleanup timer.
// @state: idle, copied, or failed; success expires, failure waits for the next attempt, and each identical announcement differs.
// @dependencies: none.
// decisions.json -> site-install-cta-01

export type CopyFeedback = {
  message: string;
  failed: boolean;
  attempt: number;
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
  let attempt = 0;
  let lifecycle = 0;
  let disposed = false;
  let succeeded = false;

  const schedule = options.schedule ?? ((run: () => void, delay: number) => window.setTimeout(run, delay));
  const cancel = options.cancel ?? ((handle: number) => window.clearTimeout(handle));

  const announce = (message: string, failed: boolean) => {
    if (disposed || (failed && succeeded)) return;
    if (!failed) succeeded = true;
    attempt += 1;
    options.onFeedback({ message, failed, attempt });
    if (timer !== null) {
      cancel(timer);
      timer = null;
    }
    if (!failed) timer = schedule(() => options.onFeedback(null), 2000);
  };

  return {
    async copy() {
      disposed = false;
      const currentLifecycle = lifecycle;
      const clipboard = options.clipboard ?? (globalThis.navigator as Navigator | undefined)?.clipboard;
      if (!clipboard) {
        announce(options.failureMessage, true);
        return;
      }
      try {
        await clipboard.writeText(options.text);
      } catch {
        if (disposed || currentLifecycle !== lifecycle) return;
        announce(options.failureMessage, true);
        return;
      }
      if (disposed || currentLifecycle !== lifecycle) return;
      announce(options.successMessage, false);
      options.onCopied?.();
    },
    dispose() {
      disposed = true;
      lifecycle += 1;
      if (timer !== null) {
        cancel(timer);
        timer = null;
      }
    }
  };
}
