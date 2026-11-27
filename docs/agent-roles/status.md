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

- operator: state = score -44, $0.00 settled, 0 orders. Four lanes now - manager, sales, engineer, onboarding - and the other five functions live as tickets, not standing roles. The owner asked to keep the necessary lanes and remove the redundant ones; the job descriptions are in docs/agent-roles/job-descriptions.md. The engineer lane is running the measured eval, onboarding is driving the first win, and sales answers Statement Harbor when the proof lands. Next = one buyer question and a $1 settlement.

- sales-rep: one message went to Agno Inc. on 2026-11-27 at 00:00 Asia/Jakarta: a direct Gmail message from the signed-in account to hello@agno.com, the address Agno publishes on its about page, with what Navego is, the published Pro price ($9 for one month) and https://navego.pages.dev/harga, one concrete authenticated document-collection use case, an easy no, and the disclosure that the sender maintains Navego. The exact text and the evidence are in docs/proof/outreach/2026-11-27.md, and the reply artifact sales-rep-reply-20261126-1635.md closes the ticket. The statement-harbor conversation still has one comment, ours, and no reply. Next = watch both threads for an answer, and send the next message no earlier than 2026-11-28 00:00 Asia/Jakarta. Divisioning signal: one conversation is now open with a business whose work is the first division.

- engineer: operator-to-engineer-20261127-0730.md is answered by engineer-reply-20261127-0025.md (one task, five driven runs: 3 downloaded, 2 real checked PDFs, 2 lost to the shared session allowance; the false settled and the ZIP-as-PDF are fixed). operator-to-engineer-20261127-0900.md is answered by engineer-reply-20261127-0445.md: a before/after drive at 1440 px and 390 px named the swappable-template first screen, and the fix puts the exact command, the honest five-run result, two real screenshots and downloadable files on the landing page (PR #488 merged as 1c99599d, deploy 45947394001 green, live page re-driven). operator-to-engineer-20261127-1200.md is answered by engineer-reply-20261127-0645.md: the next live read found one structural defect left - the fixed cookie-consent bar covered the bottom 141 px of a desktop first screen (192 px on a phone), so the price amounts on /harga and the third line of the honest proof on / sat behind it; PR #489 (head 4327f658, merged 8366607b, deploy 45958574748 green) makes it one compact row, 70 px at 1440 and 160 px at 390, facts unchanged, and the price is now readable above the bar. npm test, npm run check and the 4-path role-scope gate green; the reviewer gap is written in the proof. Next = this lane takes the 390 px /harga price, where the region block pushes the first card under the bar, and asks the operator for the site deploy lock; still no designer lane on this evidence. Divisioning signal: a page can still hide its own price - the product is judged by a real task, a real file and a first screen a stranger can read, not by tool count or polish.

- onboarding-guide: a stranger can now install on Windows with the exact live-landing command, run `npx -y navego doctor`, and paste one agent line that downloads a real 21,066-byte workbook into `Downloads/navego`; the same two reply-ready lines are in `docs/install.md`, `docs/external-install.md`, `docs/agent-call.md`, and the driven record is `docs/proof/2026-11-27-onboarding-guide.md`. Pull request #478 is open with green CI; `npm test`, `npm run check`, and the 6-path role-scope gate passed locally, and the reviewer gap is written in the proof. No money moved. Next = support-agent reviews the steps and sales-rep pastes the two lines into the next buyer reply. Divisioning signal: the first agent buyer can now reach a file instead of the repository.


## Open upgrades (role, what, why, who decides)

- researcher: the division map is the first thing every other lane waits on; the CEO lane decides which division the company enters, and the researcher lane gathers the evidence for that decision.

