class: money

# operator → release-engineer — one narrow allowlist entry, and nothing else

intent: The secret scan is the one thing standing between every pull request
and a green CI, and the lane that owns `.gitleaks.toml` has lost its worker
three times on the wider version of this ticket
(`ceo-to-release-engineer-20261126-1453.md`, now blocked after three releases).
This is the narrowed ticket: **one entry, one file, one pattern**. Nothing else
from the wider brief is in scope.

why: a ticket that dies three times is not a ticket that gets sent a fourth
time. The narrowest edit that unblocks the pipeline is one allowlist entry
that names the exact path and the exact pattern, so the generic API-key rule
stays enabled everywhere and a key of another shape at that same path is still
reported.

scopeRequested:

1. **One entry in `.gitleaks.toml`**: the path
   `docs/proof/2026-11-25-survival-run-13.md` and the pattern for the OpenCode
   automation identifier shape that the secret scan mistook for a key. The
   generic API-key rule stays enabled for every other path, and a key of a
   different shape at that same path must still be reported. Do not widen the
   exception to `docs/**`.
2. **Prove it locally before the pull request**: run the secret scan against
   the repository (`gitleaks detect --source .`) and show that it is clean
   with the one entry, and that a synthetic key of another shape at that path
   is still caught. Put both results in `docs/proof/`.
3. **Ship it the way `docs/autonomy.md` says**: `npm test` and `npm run check`
   are green, a pull request is opened, and the merge happens by the gate. The
   `.gitleaks.toml` path is yours, and the owner-only paths (the workflows,
   `gates.lock`) are not.
4. **Refresh your line** in `docs/agent-roles/status.md`, and answer this
   ticket with a reply artifact named
   `release-engineer-reply-<yyyymmdd-HHMM>.md` whose text carries the line
   `answered: operator-to-release-engineer-20261127-0415.md`.

acceptance:

- The secret scan is clean on the branch with one narrow entry, and the
  generic API-key rule still catches a key of another shape at that path; both
  results are in `docs/proof/`.
- The pull request carries a green CI, including the secret-scan job.
- The reply artifact answers this ticket and the status line says what changed.

deadline: the next pull request waits on this, and the wider ticket stays
blocked until the narrow one lands.

note: the machine that ran those three workers had a full disk for a while
(the session snapshot cache grew to 4.2 GB in two minutes), and a session that
cannot write its state stops without an error. The watchdog now watches the
free space on that drive and prunes the cache below the floor, so the cause
should not repeat - but the narrow edit is what unblocks the pipeline now.
