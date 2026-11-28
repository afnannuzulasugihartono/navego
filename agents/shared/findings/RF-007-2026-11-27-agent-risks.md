# RF-007 — agent risk and guardrail research (2026-11-27)

Decision supported: the risk register and the shape of the review loop's guardrails.

| Source | What was taken |
|---|---|
| OWASP GenAI Top 10 — https://genai.owasp.org/llm-top-10/ | Prompt injection, sensitive disclosure, supply chain, data/model poisoning, improper output handling, excessive agency, system prompt leakage, vector weaknesses, misinformation, unbounded consumption. |
| NIST AI RMF — https://www.nist.gov/itl/ai-risk-management-framework | Voluntary framework for trustworthiness; GOVERN/MAP/MEASURE/MANAGE. |
| Google SRE, Postmortem Culture — https://sre.google/sre-book/postmortem-culture/ | Postmortems after significant undesirable events; blameless; action items; no unreviewed postmortem. |
| Google SRE, Eliminating Toil — https://sre.google/sre-book/eliminating-toil/ | Manual, repetitive, automatable work with no enduring value is a bug. |
| FinOps Foundation — https://www.finops.org/introduction/what-is-finops/ | Cost accountability is cross-functional, not a finance-only ledger. |
| Google Engineering Practices — https://google.github.io/eng-practices/review/developer/small-cls.html | Small self-contained changes with tests are easier to reason about and roll back. |

Applied in agents/shared/risk-register.md: each risk has likelihood, impact, owner, mitigation and status. Closed guards include one session per key, one public action per day, zero fabricated revenue, redacted artifacts, and a labelled sender whitelist. Open: guest checkout and a real settled stranger payment.
