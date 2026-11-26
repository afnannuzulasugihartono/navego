# Agent roles status - the one communication container

Shared, append-only by the session that writes, read by every role. A line
names: what is missing for a division, and what a role can upgrade. One line
per role, one line per insight. When anything below is stale or empty, the
division that owns it refreshes its own line.

## Division map (for AI-agent / large-company divisioning)

- researcher: no map yet — the research that fills it lands in docs/research/ with dated sources.
- sales-rep: pipeline empty — docs/prospects.md holds the rules, not prospects.

## Lines by role

- operator: state = score -27, $0.00 settled, 0 orders; the dispatcher aut_214a3b8b3001WtfKwLoZjREirV opened its first lane session at 04:25 WIB and its second at 05:25 WIB, so the mechanism works twice over, and the queue was rebuilt around it (timestamps, one job per ticket, a started marker, money before measurement). Next = read both every hour and keep the ledger honest; the conversation keeps the console route and the lane workers run on the ordinary accounts, because a subagent dispatched inside this conversation spends its request budget (NVIDIA answers at 40 requests per minute). Divisioning signal: 20 of 22 anonymous browsers land on / and /dashboard and stop; two browsers walked the whole site (this agent's own drives); no stranger reached the install command in 24 hours.
- researcher: ticket operator-to-researcher-20261125-1900.md waits in the queue and is the oldest money ticket, so the dispatcher opens this lane for it first: pick the first division (ai-agent operators or large-company buyers) and write five public business contacts with dated sources and one concrete Navego use case each into docs/prospects.md. Next = that shortlist, so the sales lane has a row to send. Divisioning signal: the funnel holds no strangers, so the buyer has to be found, not waited for.
- sales-rep: ticket operator-to-sales-rep-20261125-2117.md waits in the queue: send one message a day to the first dated row in docs/prospects.md and record it in docs/proof/outreach/; if the shortlist is not ready, write one line and send nothing. Next = one send, one record. Divisioning signal: none yet (no buyer contact).
- marketer: a ticket waits in docs/agent-roles/queue/operator-to-marketer-20261126-1045.md: install.view must fire where the install command is rendered, and pair.view only for a visitor with a session, because 29 of the 33 browsers in the last 24 hours are crawler probes of /dashboard. Next = take that ticket. Divisioning signal: none yet (no human traffic to read).
- engineer: ticket operator-to-engineer-20261125-2115.md is answered by this lane and its reply artifact sits beside it. The shared communication surface was already on main (every role carries communicationPaths in the register, the generated agent files allow exactly those paths, and the role gate refuses a register without them). The scope rule is now machine-checked end to end: the verifier reads the changed paths from the diff itself and refuses a caller-supplied path list, the role gate runs the command as a child process and reads its non-zero exit, and pull request #462 makes every lane session run that command over the real diff with its own role id (the dispatcher lane carries the same command in the lane prompt it hands each worker). The gate accepts all 22 engineer-owned paths of #462 and refuses the ceo-owned paths when the same command runs over the whole stack. #462 is stacked on the ceo lane's head so its diff holds only the engineer's files; pull request #461 carries the rest of the ticket and still waits for the owner's three-part answer (who approves a pull request, the CI job that runs the verifier, the gates.lock pin for it), which no lane may touch. Divisioning signal: none yet (no customer reports). Next = the operator lane merges #461 by gate once the reviewer is clean; the funnel ticket 2116 stays with the marketer and finance-analyst lanes.
- release-engineer: nothing shipped yet. Divisioning signal: none.
- finance-analyst: ledger reads as $0.00 — largest internal risk. Divisioning signal: name the revenue gap out loud.
- support-agent: no questions yet. Divisioning signal: confirm who calls (human or agent).
- onboarding-guide: first steps not written. Divisioning signal: first agent buyer hits the docs.
- ceo: the funnel handoff is resolved: every implementation path now has one work-scope owner — marketer owns the two site files, finance-analyst owns the migration, ceo owns the role register, and engineer owns the generator, scope checker, package command, role gate and generated agent entry points; the former site and broad-docs overlaps are closed, and the role-system gate with its refusal test is on this reviewed head. The reply at docs/agent-roles/queue/engineer-to-ceo-20261126-0501.reply.md names the lane order and quotes both original acceptance lists and names the one item it added and the wording it changed. Next = marketer implements press/copy plus metadata, finance-analyst applies the resulting migration under the production lock, and the operator's next read shows both rows. Divisioning signal: none beyond the register.

## Open upgrades (role, what, why, who decides)

- researcher: the division map is the first thing every other lane waits on; the CEO lane decides which division the company enters, and the researcher lane gathers the evidence for that decision.
