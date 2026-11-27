# @last-edited: 2026-11-27 UTC+7.
# @title: agent orchestration pattern selection - supervisor with maker-checker and handoff, not group chat or concurrency.
# @state: pattern decision for `2026-11-27-agent-org-architecture-design.md`. No implementation approved.
# @dependencies: `2026-11-27-agent-org-architecture-design.md`, `docs/agent-roles/registry.json`.

# QUESTION

Which multi-agent orchestration pattern should the four-lane fleet actually use? The earlier spec named roles and folders but did not choose a coordination pattern from the published catalogues.

# SOURCES OPENED FOR THIS DECISION

1. Microsoft Azure Architecture Center, *AI Agent Orchestration Patterns* (updated 2026-09-21) - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns
   - Start with the right level of complexity; single agent with tools is often the default. Multiagent is justified only by distinct security boundaries, specialization, or cross-domain work.
   - Patterns: sequential/pipeline, concurrent/fan-out-fan-in, group chat, **handoff/routing**, and magentic.
   - **Maker-checker** is a group-chat variant: maker produces, checker evaluates against clear criteria, sends feedback back, repeats until approval or an iteration cap. It requires explicit acceptance criteria, a cap, and a fallback when the cap is reached.
   - Group chat should be limited to three or fewer agents; avoid it when deterministic handoff is enough. Concurrent is inappropriate when model quota is constrained or shared-state coordination is hard.
2. Amazon Web Services, *Use multi-agent collaboration with Amazon Bedrock Agents* - https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent-collaboration.html
   - Hierarchical **supervisor + collaborator** model. The supervisor plans, routes and interacts; collaborators are specialists. AWS explicitly requires clearly designated, minimally overlapping roles and responsibilities.
3. Anthropic, *Building effective agents* - https://www.anthropic.com/engineering/building-effective-agents
   - Orchestrator-workers and evaluator-optimizer; ground truth at each step; stopping conditions; deliberate agent-computer interface.

# PATTERN SELECTION

| Candidate | Verdict | Reason from the sources |
|---|---|---|
| Direct model call / single agent with tools | rejected | Four disjoint permission scopes and separate credentials are real security and capacity boundaries; one agent cannot hold them. |
| Sequential pipeline | partial | Fits ticket -> engineer -> reply -> board, but cannot express the review bounce-back; Azure says avoid sequential when iteration/backtracking is needed. |
| Concurrent / fan-out | rejected | One session per credential and a 40 rpm key budget; Azure says avoid when quota is constrained or shared state is hard to coordinate. |
| Group chat / roundtable | rejected | No shared thread, three-agent limit, and read-only assumption do not match agents that edit code and send public messages. |
| **Handoff / routing** | **selected for sales -> onboarding** | A positive buyer reply is exactly a dynamic transfer to a specialist; full control moves with a proof block, not shared state. |
| **Maker-checker (evaluator-optimizer)** | **selected for operator <-> engineer** | Clear acceptance criteria (runtime diff + failing-before test), three-round cap, and explicit approval/fallback already exist. |
| **Supervisor + collaborators** | **selected as the steady-state topology** | AWS's hierarchical model matches one operator with three specialists whose scopes barely overlap. |

# RESULTING ARCHITECTURE

```text
operator (supervisor / enabling)
  |-- product work ------> engineer  --(report)--> operator --(review)--> engineer ... APPROVED
  |-- buyer conversation -> sales-rep --("yes" + proof block, handoff)--> onboarding-guide
  `-- evidence needed ---> research as a TICKET, never a collaborator agent
```

- The supervisor never executes a collaborator's scope; this is the source's "minimally overlapping responsibilities" rule, enforced here by harness permissions.
- The maker-checker loop has explicit criteria and a cap: approve, or three revisions, then a fresh ticket. This matches Azure's required fallback.
- Handoff is a queue artifact plus proof block, not a shared chat: `sales-rep` emits `answered:` and a handoff request; `onboarding-guide` receives a ticket with the exact proof the buyer saw.
- No concurrent lane work on the same key; the dispatcher is the only router.

# CONSEQUENCES

Positive: flow is visible, scopes are disjoint, audit lives in git, and capacity stays inside the rpm and one-session rules.

Negative: handoff adds latency (a lane boundary), and the supervisor is a bottleneck if it stops checking. Mitigations already in the repo: the hourly operator automation, the ten-minute watchdog, and the dispatcher's ticket ordering.

# TEST OF THE PATTERN

The pattern is proven only when one full cycle is observed: operator ticket -> engineer runtime diff and failing-before test -> operator review and approval -> sales one bounded public message -> onboarding first win -> a settled stranger payment. No step may be substituted by a report that lacks a live artifact.
