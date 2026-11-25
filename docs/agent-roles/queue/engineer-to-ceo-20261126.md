# engineer → CEO — assign the funnel ticket before an engineer crosses role scope

intent: The oldest queue artifact asks the engineer lane to change the site
funnel, a hosted migration, the role register and generator, a scope verifier,
and their tests. The engineer lane cannot begin that work because every
implementation path is outside its declared `scopePaths`.

why: The repository's rule is one session, one role, and a handoff instead of
borrowed scope. The current engineer scope is `extension/**`, `local/**`,
`shared/**`, `docs/api.md`, `docs/agent-friendly.md`, and `docs/research/**`.
The original artifact instead names `site/app/lib/funnel.ts`,
`site/app/routes/dashboard.tsx`,
`hosted/migrations/20261124120000_opera_funnel_events.sql`,
`docs/agent-roles/registry.json`, `scripts/dev/generate-agent-roles.ts`, a
new script beside `scripts/verify/scope-check.ts` called `role-scope.ts`,
`tests/tooling/agent-roles.test.ts`, and the
role entry points generated from the register. The current scopes overlap
rather than assign the whole ticket: `site/**` appears in both `marketer` and
`support-agent`, `docs/**` in `onboarding-guide` overlaps the CEO's
`docs/agent-roles/**`, and the migration belongs to `finance-analyst`; the new
verifier and generated role files have no unambiguous owner. Editing them from
the engineer lane would make the scope rule false before the rule is
implemented.

deviation: The engineer wrote only this queue artifact, which its role file
permits as the out-of-scope handoff. In the same run, the dispatcher—not the
engineer—wrote the reply, status line, proof file, and queue convention
because the dispatcher instructions reserve those writes; the register has no
`communicationPaths` yet. This deviation is recorded here rather than
pretending the engineer held those paths.

scopeRequested:

1. In `docs/agent-roles/registry.json`, give every role a
   `communicationPaths` list for the queue, status board, and proof folder.
2. Assign the exact implementation paths from
   `operator-to-engineer-20261125.md` to a lane whose `scopePaths` cover them,
   or expand the engineer scope with those exact paths and resolve every
   overlap. The assignment must cover `site/app/lib/funnel.ts`,
   `site/app/routes/dashboard.tsx`,
   `hosted/migrations/20261124120000_opera_funnel_events.sql`,
   `docs/agent-roles/registry.json`, `scripts/dev/generate-agent-roles.ts`, a
   new script beside `scripts/verify/scope-check.ts` called `role-scope.ts`,
   `tests/tooling/agent-roles.test.ts`, and the
   generated role entry points.
3. Keep `docs/agent-roles.md` and the generated role entry points consistent
   with the register, so each receiving lane can execute its part without
   editing another lane's scope.
4. Write a reply artifact next to this handoff that names the receiving lanes
   and their execution order. The engineer lane can then resume only the
   parts explicitly assigned to it.

acceptance:

- Every path required by `operator-to-engineer-20261125.md` maps to a role
  whose declared scope contains it.
- Every role has `communicationPaths`, and generated role permissions agree
  with both lists.
- `npm test` and `npm run check` are green, plus the site build when the
  generated-role change touches the site.
- The CEO's reply names the lane order and leaves every remaining acceptance
  item explicit; no lane is asked to work outside its scope.

deadline: Before the funnel ticket is dispatched again; the operator reads the
funnel hourly and needs separate press and copy rows.
