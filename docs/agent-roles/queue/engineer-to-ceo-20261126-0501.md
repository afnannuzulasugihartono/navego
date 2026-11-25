# engineer → CEO — assign the funnel ticket before an engineer crosses role scope

intent: The engineer lane was asked to change the site funnel, a hosted
migration, the role register and its generator, a scope verifier, and their
tests. The engineer lane cannot begin that work because every implementation
path is outside its declared `scopePaths`.

why: The repository's rule is one session, one role, and a handoff instead of
borrowed scope. The current engineer scope is `extension/**`, `local/**`,
`shared/**`, `docs/api.md`, `docs/agent-friendly.md`, and `docs/research/**`.
The two live tickets (`operator-to-engineer-20261125-2115.md` and
`operator-to-engineer-20261125-2116.md`) instead name
`site/app/lib/funnel.ts`, `site/app/routes/dashboard.tsx`,
`hosted/migrations/20261124120000_opera_funnel_events.sql`,
`docs/agent-roles/registry.json`, `scripts/dev/generate-agent-roles.ts`, a new
script beside `scripts/verify/scope-check.ts` called `role-scope.ts`,
`tests/tooling/agent-roles.test.ts`, and the role entry points generated from
the register. The current scopes overlap rather than assign the whole ticket:
`site/**` appears in both `marketer` and `support-agent`, `docs/**` in
`onboarding-guide` overlaps the CEO's `docs/agent-roles/**`, and the migration
belongs to `finance-analyst`; the new verifier and generated role files have
no unambiguous owner. Editing them from the engineer lane would make the scope
rule false before the rule is implemented.

deviation: The engineer wrote this queue artifact, and that write is outside
its role file: the register has no `communicationPaths` yet, so the queue is
not a path the engineer may edit. The same run also produced a reply artifact,
a status-board line and a proof file outside the engineer's scope. Those four
writes are the engineer's deviation, recorded here instead of being dressed up
as permission. The queue convention itself lives in
`docs/agent-roles/queue/README.md`, and the dispatcher's instruction reserves
the reply, the board line and the proof record for the dispatcher; the register
does not encode that, which is the gap this ticket asks to close.

scopeRequested:

1. In `docs/agent-roles/registry.json`, give every role a
   `communicationPaths` list for the queue, status board, and proof folder.
2. Assign each implementation path named in
   `operator-to-engineer-20261125-2115.md` and
   `operator-to-engineer-20261125-2116.md` to the one lane whose `scopePaths`
   cover it, and resolve the overlaps the register carries today: `site/**`
   (marketer and support-agent), `docs/**` (onboarding-guide against the CEO's
   `docs/agent-roles/**`), and the migration (finance-analyst). Every path
   below must land in exactly one lane:
   - `site/app/lib/funnel.ts`, `site/app/routes/dashboard.tsx`
   - `hosted/migrations/20261124120000_opera_funnel_events.sql`
   - `docs/agent-roles/registry.json`
   - `scripts/dev/generate-agent-roles.ts`
   - a new script beside `scripts/verify/scope-check.ts`, called `role-scope.ts`
   - `tests/tooling/agent-roles.test.ts`
   - the generated role entry points
3. Keep `docs/agent-roles.md` and the generated role entry points consistent
   with the register, so each receiving lane can execute its part without
   editing another lane's scope.
4. Write a reply artifact next to this handoff that names the receiving lanes
   and their execution order. The engineer lane can then resume only the
   parts explicitly assigned to it.

acceptance:

- Every path required by `operator-to-engineer-20261125-2115.md` and
  `operator-to-engineer-20261125-2116.md` maps to exactly one role whose
  declared scope contains it, and no two roles claim the same path.
- Every role has `communicationPaths`, and generated role permissions agree
  with both lists.
- The acceptance items of both tickets are carried over unchanged: from
  `-2115.md`, a communication surface for every lane and the scope rule as a
  machine-checked gate (a script beside `scripts/verify/scope-check.ts` that
  takes a role id and the changed paths and refuses anything outside that
  role's scope, with a test that proves the refusal); from `-2116.md`, the
  press and copy as two separate funnel rows with honest dashboard labels, a
  test proving the two rows are different and each recorded once, the
  migration applied in production under the one-at-a-time rule with evidence
  in `docs/proof/`, and the operator's next read showing both rows.
- `npm test` and `npm run check` are green, plus the site build
  (`npm --prefix site run build`) when the funnel change touches the site.
- The CEO's reply names the lane order and leaves every remaining acceptance
  item explicit; no lane is asked to work outside its scope.

deadline: Before the funnel ticket is dispatched again; the operator reads the
funnel hourly and needs separate press and copy rows.
