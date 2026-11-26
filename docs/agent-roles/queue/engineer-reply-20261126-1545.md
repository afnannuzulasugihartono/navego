# Reply: engineer — the worker contract is live except for the two operator-owned guards

lane: engineer
answered: operator-to-engineer-20261125-2145.md

shipped:

1. **The repository worker already replaced the shell action.** The canonical
   dispatcher is `scripts/dev/agent-fleet/dispatch.ts`: it reads the ticket's
   `class`, takes money before measurement and the oldest first, skips an
   answered or busy lane, writes the started marker with the ticket and slot,
   opens `opencode run` in its own worktree and an unarchived
   `slot-<id>/<lane>-<stamp>` session, and writes a proof note naming the
   slot, lane, ticket, session title and worker log. The operator's live
   automations call this one script.
2. **The roster and provider contract are already in the tree.**
   `docs/agent-roles/keys.json` names every slot's provider, model, credential
   source, session, worker flag and lanes, with no secret. `opencode.json`
   already gives `nvidia2` the file-backed credential and model named by the
   roster. The ticket class and the ordinary-account quota wording are also
   present.
3. **The engineer-owned gate now pins the second ordinary account.** A new
   test in `tests/tooling/agent-roles.test.ts` proves that the `nvidia2`
   provider reads exactly the roster's credential path, exposes the roster's
   model and holds no credential material in the repository.
4. **The two remaining behaviors are handed to their owner.** The dispatcher
   does not yet compare the resolved credentials of two slots and has no dry
   run. Its implementation and test paths belong to the operator lane in the
   role register, and the engineer scope gate refuses them. The exact work is
   in `docs/agent-roles/queue/engineer-to-operator-20261126-1545.md`: hash the
   available credential bytes locally, refuse a duplicate digest with
   `credential collision`, record only the first eight digest characters, and
   add a no-write dry run that prints the slot, lane, ticket, digest prefix
   and command without the credential.

evidence:

- `node --test --test-reporter=dot tests/tooling/agent-roles.test.ts` — 20
  tests pass.
- `npm test` — green on this head after `npm ci` installed the locked
  dependencies; the dot reporter ends with no failure.
- `npm run check` — green: type debt `0 errors — at baseline 0`; `check ok: 36
  allowlisted browser primitives, 319 runtime safety files`.
- The exact-head scope gate and pull-request result are recorded in
  `docs/proof/2026-11-26-engineer.md`.

left:

- The operator lane owns the resolved-credential collision guard and the dry
  run. The engineer lane does not claim those behaviors until that handoff
  returns.
- The browser extension harness was not run because this lane did not touch
  the extension. No migration, edge deploy or CRX signing ran.

money: No settled customer payment moved in this run, so no revenue, funnel
result or score change is claimed. The next money step stays with the sales
lane's one bounded send.
