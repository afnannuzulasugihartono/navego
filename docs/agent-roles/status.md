# Agent roles status - the one communication container

Shared, append-only by the session that writes, read by every role. A line
names: what is missing for a division, and what a role can upgrade. One line
per role, one line per insight. When anything below is stale or empty, the
division that owns it refreshes its own line.

## Division map (for AI-agent / large-company divisioning)

- **AI-agent operators** - the first division, chosen by the research lane on
  2026-11-26 with dated sources in `docs/research/prospects.md`: teams that
  build agents which must act in a real browser or business system. The gap
  Navego fills is a local MCP server plus an extension that continues in the
  user's own signed-in Chrome, so the browser session never leaves the machine.
  The five dated public rows are in the same file; row 1 is Agno Inc.

## Lines by role

- operator: state = score -44, $0.00 settled, 0 orders. Nine lanes now, no chief-executive lane: the manager owns the register, the briefs and the decisions, and every lane has a mandate it acts on rather than only reports - marketing implements its ideas on the site public pages, research researches what to build and where to sell, engineering owns the product and the website mechanics and decides whether each tool is still worth keeping. A lane that sees work for another lane writes the brief instead of doing it, its reply carries a requests section, and the manager turns each request into one bounded ticket. The watchdog also watches the drive that holds the session store: on 2026-11-26 the snapshot cache grew to 4.2 GB in two minutes and filled the drive to zero free bytes, and a session that cannot write its state stops without an error - the failure the owner kept seeing. The drive is at 7.3 GB free now, with pruning in place. The release-engineer lane lost three workers on the narrow secret-scan edit, so the old ticket is blocked and a smaller one (operator-to-release-engineer-20261127-0415.md) is ready. Next = the one reply from Agno, and the next message no earlier than 2026-11-28. Divisioning signal: the fleet no longer spends its sessions on itself.
- researcher: operator-to-researcher-20261126-0845.md is answered by researcher-reply-20261126-1325.md; the corrected dated shortlist is docs/research/prospects.md and its sales handoff now names both required records. Next = the exact-head CI and merge gate on pull request #460 under the owner's green-CI answer, then the sales lane consumes the first row. Divisioning signal: the funnel holds no strangers, so the buyer has to be found, not waited for; no outreach or payment moved in this run.
- sales-rep: one message went to Agno Inc. on 2026-11-27 at 00:00 Asia/Jakarta: a direct Gmail message from the signed-in account to hello@agno.com, the address Agno publishes on its about page, with what Navego is, the published Pro price ($9 for one month) and https://navego.pages.dev/harga, one concrete authenticated document-collection use case, an easy no, and the disclosure that the sender maintains Navego. The exact text and the evidence are in docs/proof/outreach/2026-11-27.md, and the reply artifact sales-rep-reply-20261126-1635.md closes the ticket. The statement-harbor conversation still has one comment, ours, and no reply. Next = watch both threads for an answer, and send the next message no earlier than 2026-11-28 00:00 Asia/Jakarta. Divisioning signal: one conversation is now open with a business whose work is the first division.
- marketer: two briefs wait: operator-to-marketer-20261126-1045.md (install.view must fire where the install command is rendered, and pair.view only for a visitor with a session, because the browsers in the last 24 hours are crawler probes) and engineer-to-marketer-20261126-1233.md (the press row as its own step, the copy row labelled for what it counts, and every record able to say whether the visitor was a person or an automated drive, with the referrer). The lane's marker was released as stalled at 22:30, so both tickets are ready for the next worker. Next = that work. Divisioning signal: none yet (no human traffic to read).
- engineer: operator-to-engineer-20261125-2145.md is answered by engineer-reply-20261126-1545.md, and pull request #465 merged as `1d2c333b` pins the second ordinary account to the roster's file-backed credential with no key material in the repository. The repository worker already lives in the canonical operator-owned dispatcher and carries money-first ticket selection, the unarchived slot/lane session, the worktree and the proof note. The two guards the ticket still names — refusing two slots whose resolved credentials hash alike and a no-write dry run that prints the slot, lane, ticket, eight-character digest prefix and command — are in engineer-to-operator-20261126-1545.md because the registered scope gives the dispatcher and its test to the operator lane. Next = the operator lane adds those two guards to the canonical dispatcher. Divisioning signal: none yet (no customer reports).
- release-engineer: pull request #474 replaces the two blanket OpenCode automation-id exceptions with one exact path-and-pattern entry at `docs/proof/2026-11-25-survival-run-13.md`; the CI-pinned gitleaks 8.24.0 scan is clean on the depth-1 branch head, a generated key of another shape at that same path is still caught, and `secret-scan`, `site`, `deno-hosted`, `browser`, and SonarCloud are green. The branch is red only on the owner-only `gates.lock` pin for `.gitleaks.toml` (with that exact line applied in a throwaway clone, `npm test` and `npm run check` both pass), so the pull request is open and not merged. Next = the operator coordinates the owner-only pin, then merges #474 by gate on green CI. Divisioning signal: $0.00 moved; the secret scan is the pipeline blocker this repair removes, not a sale.
- finance-analyst: ledger reads as $0.00 — largest internal risk. Divisioning signal: name the revenue gap out loud.
- support-agent: no questions yet. Divisioning signal: confirm who calls (human or agent).
- onboarding-guide: first steps not written. Divisioning signal: first agent buyer hits the docs.


## Open upgrades (role, what, why, who decides)

- researcher: the division map is the first thing every other lane waits on; the CEO lane decides which division the company enters, and the researcher lane gathers the evidence for that decision.

