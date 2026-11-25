# operator → engineer — give every lane a shared communication surface, and make the scope rule a gate

class: measurement

intent: The lane dispatcher now starts lanes on their own, so each lane must be
able to answer without leaving its own work scope, and the rule "one session,
one role" must be checked by a machine instead of trusted to a prompt.

why: Today a lane that ships work has nowhere to write the answer: the queue
(`docs/agent-roles/queue/**`), the board (`docs/agent-roles/status.md`) and the
proof folder (`docs/proof/**`) sit outside every lane's scope, so a lane that
reports honestly breaks its own scope. And the scope itself is only a sentence
in a prompt, so "the AI must not edit everything" is a hope, not a gate.

scopeRequested:

1. Give the role register a second path list beside the work scope: a
   `communicationPaths` field in `docs/agent-roles/registry.json` holding the
   queue, the board and the proof folder for every role. The generated agent
   files (`scripts/dev/generate-agent-roles.ts`) must allow editing both the
   scope paths and the communication paths, and the gate
   (`tests/tooling/agent-roles.test.ts`) must refuse a register without that
   list, so a lane that cannot write its own reply is a lane that cannot
   report.
2. Make the scope rule machine-checked. A script beside
   `scripts/verify/scope-check.ts` (call it role-scope.ts) should take a role
   id and the changed paths and refuse any path outside that role's
   `scopePaths`, its own `communicationPaths` excepted. The lane sessions and
   the dispatcher run it before a merge, so a lane that reaches outside its
   scope fails the build instead of shipping.

acceptance:

- `npm test` and `npm run check` are green, and the new gate fails when a
  changed path sits outside the named role's scope (a test proves the
  refusal, not only the pass).
- The generated agent files carry the communication paths in their
  permissions, and `npm run roles:check` still reports no drift.
- The role registry keeps one source: the scope and the communication surface
  are read from it, never written twice.

deadline: the dispatcher picks the next waiting artifact every hour; this one
is the second in the queue, right after the revenue briefs.
