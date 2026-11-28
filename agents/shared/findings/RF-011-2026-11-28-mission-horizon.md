# RF-011 — why the mission was never reached, and what fixes it (2026-11-28)

Decision supported: the operator's mission ladder and the state-driven selector in `scripts/dev/agent-fleet/goal.ts`.

## The question the owner asked

Why can the AI build a good website but not autonomously reach the goal, where Navego helps people work with AI and the output funds a living?

## What the research says

| Source | Finding |
|---|---|
| METR, Measuring AI Ability to Complete Long Software Tasks — https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/ | Success tracks human task length: near 100% on tasks under 4 minutes, under 10% around 4 hours. Agents struggle to string long action sequences, not to lack single-step skill. |
| Anthropic, Demystifying evals for AI agents — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Mistakes propagate and compound across turns; outcome (final state) matters more than transcript; 20-50 tasks from real failures are enough to start; graders should be deterministic where possible; read transcripts to tell a broken task from a broken agent. |
| OpenAI, A practical guide to building agents — https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf | Agents are for complex decisions and brittle rules; every run needs exit conditions; human intervention is triggered by failure thresholds and high-risk actions; rate tools by reversibility and financial impact. |
| Anthropic, Building effective agents — https://www.anthropic.com/engineering/building-effective-agents | Ground truth from the environment at each step, checkpoints, iteration limits, orchestrator-workers. |
| Anthropic, Writing effective tools for agents — https://www.anthropic.com/engineering/writing-tools-for-agents | A few well-defined tools beat many overlapping ones; return high-signal context; evaluate on real tasks. |
| Google SRE, Eliminating Toil — https://sre.google/sre-book/eliminating-toil/ | Work that needs a human during normal operation is a bug to remove. |
| DORA — https://dora.dev/guides/dora-metrics-four-keys/ | Metrics are diagnostics; Goodhart's law. |
| NIST AI RMF — https://www.nist.gov/itl/ai-risk-management-framework | GOVERN, MAP, MEASURE, MANAGE. |

## Diagnosis

1. **The mission is a months-long task handed to a minutes-long horizon.** Every run ended with "done what you asked" because each run was scoped by an instruction, not by a mission whose next step was derived from state.
2. **No ladder from mission to measurable outcome.** "Fund a living" had no intermediate rung a run could finish, so no run could prove it moved.
3. **The instrument was activity, not outcome.** Pages, proofs and PRs rose; L1 stayed at $0.00, so the loop optimised the wrong thing.
4. **Quality drifted because proof was optional.** Twice this week a "sent" receipt was fiction; outcomes were trusted over transcripts.

## What was built

- `agents/operator/mission.md`: the ladder L0 to L4 with how each rung is checked, the fixed selection order, and the owner-only boundaries.
- `scripts/dev/agent-fleet/goal.ts`: reads live state (settled revenue, days since settlement, buyer replies waiting, open tickets, blocked lanes, claim drift), picks exactly one action, and prints the signal, reason and exit condition. Seven tests pin the order; the queue counter ignores answered and blocked tickets.
- `agents/operator/runbook.md`: the operator starts from state, names the selected action in one line, and works it to its exit condition.

This is the mechanical part of autonomy: the choice of the next step is a function of live state, not of an instruction. The ladder is the part that keeps a months-long mission inside a one-run horizon: each run finishes one rung, and only a settled stranger payment moves L1.
