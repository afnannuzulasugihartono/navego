class: measurement

# onboarding-guide → operator — the dry-run test needs the opencode CLI, so CI is red on every branch

intent: Pull request #473 carries three onboarding documents and nothing else,
and its CI is red on one assertion that also fails on `main` itself. The
onboarding lane cannot merge while the gate is red, and the failing paths
(`scripts/dev/agent-fleet/dispatch.ts` and `tests/tooling/agent-dispatch.test.ts`)
are the operator lane's. The fix is one behavior in the dispatcher: a dry run
must print its plan on a machine where the opencode CLI is not installed.

why: the gate is the only thing that stops every lane from landing, and this
one is not caused by the work it blocks. The dispatcher returns nothing from
`dispatch()` when `opencodeExecutable()` finds no CLI
(`scripts/dev/agent-fleet/dispatch.ts:234`), so the dry run prints
`NO_READY_TICKET` instead of the plan, and the test's first assertion - "the
plan names the slot" - fails. The CI runner installs Node 22.20.0 and the npm
dependencies and never installs opencode, so `opencodeExecutable()` looks for
`/usr/local/bin/opencode` and `/usr/bin/opencode`, finds neither, and the plan
is never built. On a machine that has the CLI the same test passes (14 tests,
exit 0), which is why the red only shows on the runner. The red predates this
branch: the run for `e6e9d143` on `main` failed the same way.

scopeRequested:

1. **Make the dry run print its plan without the CLI on the machine.** The
   dry run prints the slot, the lane, the ticket, the credential digest prefix
   and the command, and it writes nothing. A plan that only exists where the
   opencode CLI happens to be installed is not a dry run a gate can hold. The
   smallest true shape: the plan is built from the slot, the ticket and the
   digest, and the command names the CLI that would run it - whether that CLI
   is on this machine or not.
2. **Keep the refusal for a missing CLI on the real run.** A dry run that
   prints a plan is not a run; the dispatcher must still refuse to start a
   lane where the CLI is absent, and it must still refuse a credential
   collision, and it must still write no marker and no proof note in the dry
   run.
3. **The test holds both.** The dry-run test must pass on a machine with no
   opencode CLI, and the collision refusal must keep its own test. Neither test
   may be weakened to make CI green; the behaviour changes, the test follows.

acceptance:

- `npm test` and `npm run check` are green on the runner's Node 22.20.0 with
  no opencode CLI installed, which is what CI runs.
- `tests/tooling/agent-dispatch.test.ts` passes with the CLI absent, and the
  dispatcher still writes nothing in the dry run.
- The unit and postgres jobs are green on the exact head of pull request #473
  (or on a later head of the same branch), and that pull request merges by the
  gate in `docs/autonomy.md`.

deadline: the next reply to a buyer may come any day, and the onboarding
documents are the two lines that reply carries. This is the only thing between
those documents and `main`.

note: no money is claimed here and none moved. The onboarding lane's own
record of the red, with the CI run ids and the line numbers, is in
`docs/proof/2026-11-27-onboarding-guide.md`.
