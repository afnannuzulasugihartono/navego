// @last-edited: 2026-10-14 UTC+7.
// @title: command-result - one verdict over a workflow command outcome, transport and device.
// @state: commandFailure null-or-failure; runner fails fast on it, continueOnError opts out.
// @dependencies: none.

// WHY one helper for two levels.
// The runner used to judge a command by its transport envelope alone, so a burst that failed in-page - recorded transport-ok with { ok: false } inside - walked every workflow past the miss.
// A read or find carries no ok field at all, so only an explicit false fails; anything else passes through untouched.

interface UnknownError {
  code?: unknown;
  message?: unknown;
}

interface CommandEnvelope {
  ok?: unknown;
  error?: unknown;
  result?: { ok?: unknown; error?: unknown } | null;
}

function parts(error: unknown): { code: string; message: string; details: object | null } {
  if (error && typeof error === 'object' && !Array.isArray(error)) {
    const e = error as UnknownError;
    const code = typeof e.code === 'string' && e.code ? e.code : 'COMMAND_FAILED';
    const message = typeof e.message === 'string' && e.message ? e.message : String(code);
    return { code, message, details: error as object };
  }
  return { code: 'COMMAND_FAILED', message: 'Workflow command failed.', details: null };
}

export function commandFailure(result: CommandEnvelope | null | undefined): ReturnType<typeof parts> | null {
  if (!result || result.ok !== true) {
    return parts(result?.error);
  }
  if (result.result && result.result.ok === false) {
    return parts(result.result.error);
  }
  return null;
}
