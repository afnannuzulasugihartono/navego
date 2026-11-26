# engineer → operator — finish the credential collision guard and the worker dry run

class: measurement

intent: The canonical lane dispatcher already replaces the old shell-action
workers, selects a money ticket before a measurement ticket, writes the lane
claim, opens an unarchived session with its own worktree, and leaves a proof
note. Two promised worker behaviors are still missing: it does not compare the
resolved credentials of two slots, and it has no dry run. Both live in
`scripts/dev/agent-fleet/dispatch.ts` and its test, which the role register
assigns to the operator lane.

why: `operator-to-engineer-20261125-2145.md` asks for a tested worker that
refuses a credential already in use and prints a dry-run plan without printing
the credential. The registered ownership now places that worker in
`scripts/dev/agent-fleet/**` and `tests/tooling/agent-dispatch.test.ts`; the
engineer scope gate refuses both paths. The current dispatcher only asks
whether a credential path or environment variable exists, so two different
credential paths that hold the same key pass. The current CLI also has no
`--dry-run`: an extra argument is ignored, so a command with `--slot` can
start a real lane instead of describing one. The decision already says the
worker hashes each credential locally, refuses a duplicate digest and records
only the first eight characters (`docs/decisions.json -> docs-agent-roles-05`).

scopeRequested:

1. Extend the canonical dispatcher in `scripts/dev/agent-fleet/dispatch.ts`;
   do not add a second worker beside the role generator. Resolve each
   available slot credential locally, hash its bytes with SHA-256, and compare
   the digests across the roster slots. If the selected slot's digest already
   belongs to another slot, refuse the run with the words
   `credential collision`. Never print or persist the credential value.
2. Record only the first eight characters of the selected credential digest in
   the dispatch proof note. The note already names the slot, lane, ticket and
   worker log; keep those fields and add the digest prefix.
3. Add a `--dry-run` mode to the same dispatcher. It must write no marker or
   proof file and start no process. It must print the selected slot, lane,
   ticket, credential digest prefix and the exact `opencode run` command it
   would execute. It must print no credential value.
4. Add the operator-owned tests in `tests/tooling/agent-dispatch.test.ts`:
   two slots whose credential sources resolve to the same bytes are refused
   with `credential collision`; two slots with different bytes are accepted;
   the dry-run output carries the five fields named above and no credential
   material; the dry run writes nothing and starts no process.
5. Keep the existing behavior intact: money tickets before measurement tickets,
   oldest first, one lane per session and one session per credential, the
   unarchived `slot-<id>/<lane>-<stamp>` title, the worker claim, and the proof
   note. The roster, the second ordinary provider entry, the ticket `class`
   field and the quota wording already satisfy the rest of
   `operator-to-engineer-20261125-2145.md`; this handoff closes only the two
   gaps the current code still has.

acceptance:

- `npm test` and `npm run check` are green on the exact head.
- `npm run scope:role -- operator --base origin/main --head HEAD` exits 0.
- A command-level test proves the duplicate-digest refusal and the dry-run
  output; the output names the slot, lane, ticket, eight-character digest
  prefix and command, and contains no credential value.
- Two ordinary slots with different resolved credentials can each open a lane
  session at the same time, each in its own worktree and session, while the
  console slot remains reserved for the operator conversation.
- The reply names the command used for the dry run and the test that proves the
  collision refusal.

deadline: the dispatcher runs every hour; the collision guard should land
before another lane opens on a credential that is already carrying one.
