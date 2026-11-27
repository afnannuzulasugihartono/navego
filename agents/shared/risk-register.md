# AI risk register

This is an index of risks, not a second decision register. The binding decisions and their sources are in docs/decisions.json. Risk categories follow OWASP GenAI Top 10 (https://genai.owasp.org/llm-top-10/) and the GOVERN/MAP/MEASURE/MANAGE functions of NIST AI RMF (https://www.nist.gov/itl/ai-risk-management-framework).

| Risk | Likelihood | Impact | Owner | Mitigation | Status |
|---|---|---|---|---|---|
| Prompt injection through page content or a lane report | medium | high | operator | untrustedContent marker on page reads; labelled messages; synthetic sender whitelist; messages are pointers only | partially closed: whitelist and labels shipped; no full-loop proof yet |
| Excessive agency: a lane sends a public message or changes code outside scope | low | high | all lanes | one public action per day, easy no, disclosure; harness-enforced scope paths; no subagent | closed by policy, not yet proven by a buyer reply |
| Unbounded consumption: repeated lane retries spend the 40 rpm key budget | medium | medium | operator | one session per key, dispatcher slot guards, round cap of three | closed |
| Sensitive data exposure in proof files | low | high | operator | redacted proof artifact; no secrets in repo; keys in files outside repo | closed for the published artifact; not a full audit |
| Stale claim outruns evidence (doctor, price, comparison) | medium | medium | engineer | decisions.json sources; proof links; site tests pin copy | partially closed: doctor fix shipped, other claims still tracked in spec Known gaps |
| Durable automation input stored in scratch space | medium | high | operator | send body moved to repo; automation points at repo path | closed |
| Duplicate public automations | low | high | operator | automation.list before creation; three paused, one active | closed |
| Reviewer unavailable blocks merge | high | medium | owner | standing answer in docs/autonomy.md, gap written into proof | closed by owner decision |
| Revenue stagnation with rising architectural work | high | high | operator | economy.json states the only score move; buyer proof drafted and queued | open: $0.00 settled |

Review cadence: read this table in the operator run, and change a row only when the underlying evidence changes. A risk with no owner is a bug.
