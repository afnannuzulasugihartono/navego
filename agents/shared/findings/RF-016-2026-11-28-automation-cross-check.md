# RF-016 — cross-check before removing the human from the loop (2026-11-28)

## Question

The owner asked for one more research pass, then implementation toward a fully automated fleet with no human intervention. This finding is the cross-check; the code change that follows implements only what the sources allow.

## Cross-check sources

| Source | Confirmation or limit |
|---|---|
| OWASP GenAI, Top 10 for LLMs — https://genai.owasp.org/llm-top-10/ | LLM06 **Excessive Agency** is a top risk: a system given too much authority acts beyond its intent. Full automation is not a goal in itself; scope is. |
| OpenAI, A practical guide to building agents — https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf | Agents need explicit exit conditions; human intervention is triggered by failure thresholds and high-risk actions such as payments. |
| NIST AI RMF — https://www.nist.gov/itl/ai-risk-management-framework | GOVERN, MAP, MEASURE, MANAGE. Governance is a standing function, not a step to delete. |
| Microsoft, Guidelines for Human-AI Interaction — https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/ | The interface must make system state and limits legible. With one owner, the proof files are that interface. |
| Anthropic, Demystifying evals for AI agents — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Grade outcomes with deterministic graders; keep real failures as regression tasks. |
| Microsoft, AI Agent Orchestration Patterns — https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns | Deterministic routing when the next step is identifiable; maker-checker needs a cap and a fallback. |
| Google SRE, Eliminating Toil — https://sre.google/sre-book/eliminating-toil/ | Manual repetitive work with no enduring value is a bug. |
| Qian et al., ChatDev — https://arxiv.org/abs/2307.07924 and Hong et al., MetaGPT — https://arxiv.org/abs/2308.00352 | Role specialisation helps only when communication and intermediate verification are designed. |

## Verdict on "tanpa human intervention"

**Partially possible, never total.** The sources agree on the boundary: repeatedly decidable, reversible, machine-verifiable work should need no person; payments, account reviews, marketplace merge decisions and anything that can spend money or identity must stay with the owner. Removing those checks would not be autonomy — it would be LLM06 excessive agency.

## What was implemented after the cross-check

- `executor.ts` already closes a ticket only when a reply names it, and defers every action needing judgment, money or an external message.
- New: each deferred action is **routed automatically** to the lane that owns it (`answer-buyer` → sales-rep, revenue path and code work → engineer, lane unblock → operator, claim drift → engineer). The ticket is idempotent per action per day, carries the signal, reason, `scopeRequested` and `stop`, and explicitly excludes secrets, cash and owner-only paths. The dispatcher can open the lane session without a person choosing it.
- `dispatch.ts` already refuses research tickets whose gate verdict is not `run`.

Two new failing tests were written first and watched fail; all six executor tests pass. No gate weakened, no money path touched.

## What remains deliberately human

A settled customer payment, an account or store review, and a maintainer's merge decision in another person's repository. The fleet may prepare and record those, but it cannot hold them. Calling that "fully automated" would be a claim that outruns the evidence.

## Money

Settled external revenue remains $0.00, 0 orders. Routing removes a human decision; it does not create a buyer.
