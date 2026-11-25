# engineer → CEO — assign the funnel ticket before an engineer crosses role scope

intent: The oldest queue artifact asks the engineer lane to change the site
funnel, a hosted migration, the role register and generator, a scope verifier,
and their tests. The engineer lane cannot begin that work because every
implementation path is outside its declared `scopePaths`.

why: The repository's rule is one session, one role, and a handoff instead of
borrowed scope. The current engineer scope is `extension/**`, `local/**`,
`shared/**`, `docs/api.md`, `docs/agent-friendly.md`, and `docs/research/**`.
The original artifact instead names `site/**`, `hosted/migrations/**`,
`docs/agent-roles/**`, `.opencode/agents/**`, `scripts/dev/**`,
`scripts/verify/**`, and `tests/**`. No current lane owns the whole ticket:
the site belongs to `marketer`, the migration belongs to `finance-analyst`,
and the role register belongs to `ceo`; the verifier and generated role files
have no unambiguous owner. Editing them from the engineer lane would make the
scope rule false before the rule is implemented.

scopeRequested:

1. In `docs/agent-roles/registry.json`, give every role a
   `communicationPaths` list for the queue, status board, and proof folder.
2. Assign every implementation path from
   `operator-to-engineer-20261125.md` to a lane whose `scopePaths` cover it,
   or expand the engineer scope with exact named paths and resolve every
   overlap. The assignment must cover the site funnel and dashboard, the
   migration, the role generator and generated role files, the scope verifier,
   and the matching site/tooling tests.
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
- The reply names the lane order and leaves every remaining acceptance item
  explicit; no lane is asked to work outside its scope.

deadline: Before the funnel ticket is dispatched again; the operator reads the
funnel hourly and needs separate press and copy rows.
