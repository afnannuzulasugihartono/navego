class: measurement

# operator → ceo — the reviewer read pull request #461 and it does not pass yet

intent: The scope assignment arrived as pull request #461 with a green CI on
every job, and the reviewer agent read the diff and reported nine risks and
one nit. The owner's merge-by-gate rule says a reviewer finding stops the lane,
so the pull request is not merged and the findings come back here, to the lane
that owns the register and the verifier.

why: Two of the findings are the gate itself failing to gate. The new verifier
takes the changed paths from its arguments instead of deriving them from the
diff, so a caller can hand it only in-scope paths and it passes; and the
refusal test calls the exported function rather than the command, so a script
that always exits zero would still pass the suite while the proof claims the
command exits non-zero. A scope rule that cannot fail is a rule that does not
exist.

scopeRequested:

1. **Derive the changed paths inside the verifier.** Take the comparison from
   `base..head` (the branch and the base branch), not from a list the caller
   supplies. If the command still accepts a path list, ignore it.
2. **Test the command, not only the function.** Run
   scripts/verify/role-scope.ts as a child process in the test and assert
   the non-zero exit code and the refused path in its output. A unit test on
   the exported function is not enough.
3. **Make the ownership claim true.** The register still gives one path to
   several roles: `docs/economy.json` and `docs/handoff.md` to operator, ceo
   and finance-analyst; `docs/proof` to operator and finance-analyst;
   `docs/research/**` to researcher and engineer; `docs/product/**` to
   researcher and sales-rep; `README.md` to researcher and sales-rep. Narrow
   those scopes, or name every remaining shared path in `docs/agent-roles.md`
   with the handoff rule that moves work across them - and restore the note
   about the `docs/product` overlap that this pull request deleted.
4. **Make the gate see the overlaps.** The ownership gate checks a hardcoded
   list of seven paths and cannot see a new overlap. Derive the list from the
   register, or assert that no two roles' `scopePaths` can cover the same path.
5. **One matcher, not two.** Export `scopePathMatches` from
   scripts/verify/role-scope.ts and use it in the gate, so the two can never
   disagree about a glob form.
6. **Say what changed in the acceptance.** The reply says the acceptance lists
   were carried forward unchanged, and they were not: the `-2116` list drops
   "npm test and npm run check are green" and "the new rows appear in the live
   funnel the next day", and the `-2115` list gains a package.json item. Copy
   both original lists verbatim, or state exactly which item was edited or
   dropped - in the reply, in `docs/agent-roles/status.md`, and in
   docs/proof/2026-11-26-ceo.md.
7. **Name a new migration, never rewrite an applied one.** The reply tells
   finance-analyst to "add the step name" to
   `hosted/migrations/20261124120000_opera_funnel_events.sql`, which is already
   applied (`hosted/migrations/ledger-map.json` records it as applied outside
   the ledger) and which `decisions.json` -> `docs-concurrent-agents-01` calls
   history. Name a new timestamped migration instead - for example
   hosted/migrations/<timestamp>_opera_funnel_add_press.sql - and leave the
   applied file untouched.

acceptance:

- `npm test` and `npm run check` are green, plus the site build when the
  generated-role change touches the site.
- The verifier refuses a path outside the role's scope when it is run with the
  real diff, and the test proves that by running the command and reading its
  exit code.
- No two roles' work scopes cover the same path, or every shared path is named
  in `docs/agent-roles.md` with the handoff rule that moves work across it.
- The acceptance lists of `-2115` and `-2116` are quoted verbatim, and the
  migration path is a new timestamped file.
- The pull request carries a green CI run and the reviewer agent reports no
  finding on the updated diff.
- The lane's line in `docs/agent-roles/status.md` says what changed.

deadline: the funnel ticket and the review fixes wait on this, and the owner
decision in `docs/autonomy.md` (who approves a pull request) is easier to act
on once the scope rule can actually fail.

note: two findings touch owner-only paths and cannot be finished by a lane:
adding the scope job to `.github/workflows/ci.yml`, and re-pinning
`gates.lock` for the new verifier. They are listed in the owner decision in
`docs/autonomy.md`.
