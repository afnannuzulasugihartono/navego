# RF-018 — should every turn produce new research, and how is the topic chosen? (2026-11-28)

## Question

The owner proposed a cadence: at least one new research topic from varied subjects every turn, leaving only the choice of topic. Is that effective, and how should the topic be chosen?

## Sources

| Source | What was taken |
|---|---|
| The Lean Startup, Methodology — https://theleanstartup.com/principles | The question is not "Can this product be built?" but "Should this product be built?" and "Can we build a sustainable business around it?" Progress is **validated learning**, with actionable metrics; innovation accounting exists to set milestones and prioritize work. |
| Value of information — https://en.wikipedia.org/wiki/Value_of_information (Howard, Information Value Theory, 1966) | VoI is what a decision maker would pay for information before making a decision. It is never negative, and information about two unknowns is not additive — you incorporate one before valuing the next. Research with no decision to change has no value. |
| Theory of constraints — https://en.wikipedia.org/wiki/Theory_of_constraints (Goldratt, The Goal) | A system is limited by very few constraints. Identify it, exploit it, subordinate everything else, elevate it, then repeat. When the system can produce more than the market will bear, the constraint is **external** and the work is to create demand. |
| Google SRE, Eliminating Toil — https://sre.google/sre-book/eliminating-toil/ | Repetitive work with no enduring value is toil; a human touching normal operations is a bug to design out. A research cadence without a decision is exactly that. |
| Anthropic, Demystifying evals for AI agents — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Start with 20–50 tasks drawn from real failures; robust tasks are those two experts would judge the same way. A task that fails at pass@100 is usually a broken task, not a weak agent. |
| DORA, Four keys — https://dora.dev/guides/dora-metrics-four-keys/ | Metrics are diagnostics; making them targets invites gaming. |
| Google SRE, Postmortem Culture — https://sre.google/sre-book/postmortem-culture/ | Findings need preventive action items and review; an unreviewed postmortem might as well not exist. |

## Verdict

**No — not as a rule.** "One new topic every turn" optimizes the *shape* of the work, not the outcome. VoI says information is worth what it changes in a decision; TOC says work on the constraint; Lean Startup says progress is validated learning, not activity. If no decision is waiting on evidence, a fresh topic is toil with a bibliography.

Variety has value **only** when the current decision's evidence is exhausted and the next constraint is different. Rotating topics to feel productive is the same error as treating PR count as progress.

## How the topic should be chosen

1. **Name the decision first.** Write "if this is true, I will change X". If nothing changes, stop — do not research.
2. **Check the register.** `agents/shared/findings/index.md` (RF-001…RF-017) must not already answer it; if it does, update or correct that finding instead.
3. **Find the constraint.** Is the limit internal (code, reliability) or external (nobody comes or pays)? Navego's measured limit is external: 0 stars, 0 settled dollars, Google 0 indexed pages, listing PR still Open.
4. **Value the information.** Ask what the answer would change. "Another framework comparison" changes nothing; "which public list can actually put a link in front of browser-MCP searchers" changes one action.
5. **Rank by the mission order** already in `agents/operator/mission.md`: settled money, customer-visible defect, lane unblock, quality judgment.
6. **Bound the ticket** using `research-gate.ts`: one decision, one openable source, one dated fact, one RF destination, no outreach.
7. **Stop** at one finding with counter-evidence and one index row. If evidence cannot be obtained without an owner-only account, write the gap and stop.

## What this means for Navego now

Eighteen findings exist. The internal constraint has mostly been addressed; the external one has not. So the next research topics should be about **discovery and demand** — which public surfaces are actually indexed and read by the people searching for signed-in browser MCP, what a first-time buyer searches before paying, and why the single submitted list has not landed. Topics about internal tooling are lower value until that changes. This is a priority, not a quota: if a real customer reply arrives, answering it outranks any research topic.

## Money

Settled external revenue remains $0.00, 0 orders. More research does not raise the score.
