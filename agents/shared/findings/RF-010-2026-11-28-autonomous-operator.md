# RF-010 — making an operator genuinely autonomous (2026-11-28)

Decision supported: the operator should choose its own next work from outcomes and live evidence, not wait for one instruction at a time.

| Source | What was read |
|---|---|
| OpenAI, A practical guide to building agents (https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) | Agents perform workflows independently. Start incrementally, not with a fully autonomous complex architecture. Every run is a loop with explicit exit conditions: final output, no more tool calls, error, or maximum turns. Plan human intervention for exceeding failure thresholds and for high-risk actions such as payments. Rate tools by read/write access, reversibility, permissions and financial impact; add guardrails from real failures. |
| Anthropic, Building effective agents (https://www.anthropic.com/engineering/building-effective-agents) | Agents begin with a command or discussion, then plan and operate independently; get ground truth from the environment each step; pause at checkpoints or blockers; use iteration limits. |
| Anthropic, Writing effective tools for agents (https://www.anthropic.com/engineering/writing-tools-for-agents) | A few well-defined high-impact tools beat many overlapping ones; return high-signal context; prompt-engineer tool descriptions; evaluate on real tasks. |
| Microsoft Azure, AI Agent Orchestration Patterns (https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) | Choose the least complex pattern that works; an orchestrator is justified when subtasks are not predictable. |
| Team Topologies (https://teamtopologies.com/key-concepts) | Stream-aligned ownership and flow over structure. |
| Google SRE, Eliminating Toil (https://sre.google/sre-book/eliminating-toil/) | If a human must touch the system during normal operation, that is a bug to remove. |
| DORA (https://dora.dev/guides/dora-metrics-four-keys/) | Metrics are diagnostics; making them targets invites gaming. |
| NIST AI RMF (https://www.nist.gov/itl/ai-risk-management-framework) | GOVERN, MAP, MEASURE, MANAGE are the functions that make autonomy safe. |

## Diagnosis of the current problem

The owner still directs every task because the operator has no single, authoritative decision rule that converts live state into the next action. The automations already wake the operator hourly, the watchdog and dispatcher already run, and the queue already records work — but the operator still asks "what next?" instead of deciding.

## Protocol that removes the need for step-by-step direction

1. The owner sets **outcomes and constraints once** (survival, honest revenue, one public action/day, owner-only paths). Those live in docs/agent-survival-prompt.md and docs/autonomy.md.
2. Each run starts from state, not from a request: loop board → queue → live page → acted traffic → settled revenue → lane replies → public threads.
3. Select exactly one action by priority: **settled money > customer-visible defect > lane unblock > quality judgment**. Document the selection in one line.
4. Research by asking why first, using three evidence classes (live artifact, primary source, counter-evidence), then write one RF finding with a source and an index row.
5. Convert the finding into one bounded ticket with acceptance criteria and a stop condition. No "research more" tickets.
6. Gas costs and reversibility before acting: read-only/reversible work is automatic; payments, deploys, account access and external messages stay behind explicit owner rules or the one-action/day limit.
7. Stop conditions: one quality judgment + one ticket per run; three review rounds; no fourth round; reviewer gap written; no secret or cash request.

## What autonomy is not

Autonomy is not freedom from evidence. It is the ability to choose the next correct action from live state and documented constraints, while stopping at the boundaries a person actually owns. The operator should not ask for permission to do the next obvious thing; it should ask only for what an agent genuinely cannot hold — an account review, a payment, or a marketplace merge decision.
