# RF-017 — is hunting for weaknesses effective at raising product quality? (2026-11-28)

## Question

The owner asked whether deliberately looking for weaknesses actually improves product quality.

## Sources

| Source | What was found |
|---|---|
| Principles of Chaos Engineering — https://principlesofchaos.org/ | The discipline explicitly aims to identify weaknesses before they manifest in production. Define a measurable steady state, hypothesize it will hold, introduce real-world variables, try to disprove the hypothesis. Automate experiments and run them continuously; minimize blast radius. A discovered weakness is a target for improvement, not an end in itself. |
| Google SRE, Postmortem Culture — https://sre.google/sre-book/postmortem-culture/ | "The cost of failure is education." A postmortem records impact, mitigation, root causes and preventive follow-up actions. Triggers must be defined in advance. "An unreviewed postmortem might as well never have existed." Weakness-finding without an action item and review does not count as learning. |
| Google OSS-Fuzz — https://google.github.io/oss-fuzz/ | Guided in-process fuzzing found thousands of security vulnerabilities and stability bugs in Chrome; by August 2023 OSS-Fuzz had helped identify and fix over 10,000 vulnerabilities and 36,000 bugs across 1,000 projects. This is the strongest evidence that systematic weakness-hunting works for correctness and security. |
| Anthropic, Demystifying evals for AI agents — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Start with 20–50 tasks drawn from real failures; prefer deterministic graders; grade the outcome, not the transcript; regression evals should stay near 100%. Real failures become a durable suite, not one-time anecdotes. |
| DORA, Four keys — https://dora.dev/guides/dora-metrics-four-keys/ | Throughput and stability are diagnostics. Making a metric a target invites gaming. A finding matters only if it changes a system or a user outcome. |
| Google SRE, Eliminating Toil — https://sre.google/sre-book/eliminating-toil/ | Manual, repetitive reporting with no enduring value is toil; a human touching normal operations is a bug to be designed out. |

## Verdict

**Yes for technical quality, no for product quality as customer value.** The distinction matters.

Hunting weaknesses is effective when the weakness is in correctness, reliability or security: Chaos Engineering, fuzzing and postmortems all show that continuous, automated, evidence-backed searching finds defects before customers do. It is **not** effective at making a product wanted. Nothing in those sources claims that finding bugs creates demand; DORA explicitly warns against treating the metric as the goal.

## Our own measured case

Since run #46 this repo found and fixed real weaknesses: an invalid canonical tag, a half-shipped guest edge, a false buyer-reply signal from a README, a claim that could not be resumed, and FAQ answers contradicting live checkout. RF-001 through RF-017 exist, every fix has a failing test first, CI is green on each merge.

At the same time: GitHub shows 0 stars, 0 forks, Google still holds zero indexed pages, listing PR #20598 is still Open after 7 comments (6 ours), and settled external revenue is **$0.00, 0 orders**. The score has fallen each hour. So weakness-hunting has raised **correctness** and kept the system honest, but has not raised **customer value**. Every finding so far was found by us, not reported by a buyer.

## How to keep the practice effective

1. Define the steady state in measurable terms — settled payment, first customer result, return visit — not "more proofs".
2. Only count a weakness if it has a preventive action and an owner (SRE: no unreviewed postmortem).
3. Convert real failures into a small deterministic regression suite (Anthropic: 20–50 tasks).
4. Automate the search and minimize blast radius; never test a money path by capturing a real payment.
5. Stop hunting when the evidence says the behaviour is already right; that is toil, not quality work.
6. Treat internal findings as leading indicators. The outcome is what a stranger does without being asked.

## Money

Settled external revenue remains $0.00, 0 orders. Research does not raise the score.
