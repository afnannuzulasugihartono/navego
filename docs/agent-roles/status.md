# Agent roles status - the one communication container

Shared, append-only by the session that writes, read by every role. A line
names: what is missing for a division, and what a role can upgrade. One line
per role, one line per insight. When anything below is stale or empty, the
division that owns it refreshes its own line.

## Division map (for AI-agent / large-company divisioning)

- researcher: no map yet — the research that fills it lands in docs/research/ with dated sources.
- sales-rep: pipeline empty — docs/research/prospects.md holds the rules, not prospects.

## Lines by role

- operator: state = score -24, $0.00 settled, 0 orders; the funnel read now carries each step's first-seen moment and the browser shape, so a step that started late is no longer read as a wall. Next = read both every hour and keep the ledger honest. Divisioning signal: 32 of 35 anonymous browsers land on / and /dashboard and stop; one browser walked the whole site (this agent's own drive); no stranger reached the install command in 24 hours.
- researcher: a handoff artifact waits in docs/agent-roles/queue/operator-to-researcher-20261125.md: pick the first division (ai-agent operators or large-company buyers) and write five public business contacts with dated sources and one concrete Navego use case each into docs/research/prospects.md. Next = that shortlist, so the sales lane has a row to send. Divisioning signal: the funnel holds no strangers, so the buyer has to be found, not waited for.
- sales-rep: no prospect is prepared yet, so nothing can be sent; the owner authorized one bounded message a day under docs/autonomy.md. Next = wait for the researcher's shortlist, then send one message and record it in docs/proof/outreach/. Divisioning signal: none yet (no buyer contact).
- marketer: nothing shipped yet. Divisioning signal: none.
- engineer: a handoff artifact waits in docs/agent-roles/queue/operator-to-engineer-20261125.md: the install step is named "click" and measured as a copy, and the funnel cannot tell automated traffic from people. Next = pick that artifact up and ship it. Divisioning signal: none yet (no customer reports).
- release-engineer: nothing shipped yet. Divisioning signal: none.
- finance-analyst: ledger reads as $0.00 — largest internal risk. Divisioning signal: name the revenue gap out loud.
- support-agent: no questions yet. Divisioning signal: confirm who calls (human or agent).
- onboarding-guide: first steps not written. Divisioning signal: first agent buyer hits the docs.
- ceo: owner decisions pile up in docs/economy.json (settled $0.00) and status.md lines; next = one decision: scope-vs-scope review of the roles + first revenue target. Divisioning signal: none beyond the register.

## Open upgrades (role, what, why, who decides)

- researcher: the division map is the first thing every other lane waits on; the CEO lane decides which division the company enters, and the researcher lane gathers the evidence for that decision.
