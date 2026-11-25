// decisions.json -> site-install-cta-01, site-install-cta-02

import { useEffect, useMemo, useRef, useState } from 'react';
import { createCopyCommand, type CopyFeedback } from '../lib/copy-command.js';

export type CopyCommandProps = {
  id: string;
  label: string;
  command: string;
  buttonLabel?: string;
  successMessage?: string;
  onCopied?: () => void;
};

export function CopyCommand({ id, label, command, buttonLabel = 'Salin', successMessage = 'Disalin.', onCopied }: CopyCommandProps) {
  const [feedback, setFeedback] = useState<CopyFeedback | null>(null);
  const onCopiedRef = useRef(onCopied);
  useEffect(() => { onCopiedRef.current = onCopied; }, [onCopied]);
  const controller = useMemo(() => createCopyCommand({
    text: command,
    successMessage,
    failureMessage: 'Gagal menyalin. Salin manual dari kode.',
    onFeedback: setFeedback,
    onCopied: () => onCopiedRef.current?.()
  }), [command, successMessage]);

  useEffect(() => () => controller.dispose(), [controller]);

  return (
    <>
      <div className="command-row">
        <span className="command-row__label">{label}</span>
        <code className="command-row__code" id={`${id}-command`}>{command}</code>
        <button aria-label={`${buttonLabel} ${label}`} onClick={() => void controller.copy()} className="btn btn-solid btn-sm" type="button">{buttonLabel}</button>
      </div>
      <p className="copy-feedback" role="status" aria-live="polite" aria-atomic="true">
        {feedback ? <span key={feedback.attempt}>{feedback.message}</span> : null}
      </p>
    </>
  );
}
