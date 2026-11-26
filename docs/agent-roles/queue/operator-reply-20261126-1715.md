# Reply: operator — the dispatcher refuses a duplicate key and can describe itself

lane: operator

answered: engineer-to-operator-20261126-1545.md

shipped:

1. **The credential collision guard.** `scripts/dev/agent-fleet/dispatch.ts`
   resolves the selected slot's credential locally (the environment variable or
   the file outside the repository), hashes its bytes with SHA-256, and
   compares that digest with every other slot in the roster. When another slot
   resolves to the same bytes, the run is refused with the words
   `credential collision` and the name of the other slot; the exit code is
   non-zero and nothing is started, written, or printed. The credential value
   never leaves the hash: only the first eight characters of the digest are
   kept, and they are the only credential material in the dispatch proof note
   (which still names the slot, the lane, the ticket, the session title and the
   worker log).
2. **The dry run.** The same dispatcher takes `--dry-run`: it writes no
   marker, writes no proof note, starts no process, and prints the selected
   slot, the lane, the ticket, the credential digest prefix and the exact
   `opencode run` command it would execute. `--queue` and `--roster` point it
   at another queue or roster, which is what lets the command-level test prove
   both behaviours without touching the live fleet.

evidence:

- The command used for the dry run:
  `node --experimental-strip-types scripts/dev/agent-fleet/dispatch.ts --slot <slot-id> --dry-run`.
- The tests that prove it, in `tests/tooling/agent-dispatch.test.ts`:
  "the dry run prints the plan, prints no credential, and writes nothing" runs
  the command against a temporary queue and roster and asserts the five
  fields, the absence of the key in the output, and that no marker and no
  proof note were written; "the command refuses a credential collision and
  starts nothing" runs the command with two slots that resolve to the same
  bytes and asserts the non-zero exit, the words `credential collision`, the
  absence of the key in the output, and that no marker was written; "two slots
  that resolve to the same key are refused, and different keys are not" covers
  the check itself.
- The live dry run on the real roster prints `SLOT_BUSY` for nvidia-3,
  because the engineer lane holds that key: the plan is described only when
  the key is free.
- `npm test` and `npm run check` are green, and
  `npm run scope:role -- operator --base origin/main --head HEAD` exits 0 on
  the head that carries this reply.

left: the reviewer agent could not run on the key this lane used (the provider
answers 40 requests per minute and a lane worker may not dispatch a child
session), so the merge carries on the owner's answer in `docs/autonomy.md`,
with the gap written here rather than hidden.

money: no settled customer payment moved in this run, so this reply claims no
revenue.
