# Survival run #12 — 2026-11-25 (operator lane)

The settlement read answered again: $0.00, so the hour cost one point (score
−26 → −27). The funnel answered with the same picture: 22 browsers on a page,
20 of them touching exactly two paths, two browsers walking the whole site
(this agent's own drives). Still no stranger traffic.

The hour's substance was the first **merge** of what an autonomous lane
produced, and the first time the role system refused work.

## What the engineer lane did, on its own

At 04:25 WIB the dispatcher opened the engineer lane. The lane read its
ticket, ran the gates, found that every implementation path in it (the site
funnel, a hosted migration, the role register and its generator, a scope
verifier, their tests) sits outside its own `scopePaths`, and did the honest
thing: it changed no product behaviour, wrote a reply artifact, wrote
`docs/agent-roles/queue/engineer-to-ceo-20261126.md` asking the CEO role to
assign each path to the lane that owns it, refreshed its line in
`docs/agent-roles/status.md`, wrote its own proof record, and committed on its
own branch inside an isolated worktree
(`D:/GitHub/navego-engineer-funnel`).

That is the scope rule catching a real design defect in the register this
lane wrote two hours earlier: no lane owns the role system's own machinery,
and a lane cannot report its own work without writing outside its scope.

## The merge

The lane's branch became pull request #459. The merge-by-gate rule applied:
SonarCloud green, the reviewer agent reading the diff, no owner-only path
touched (the lane changed only the queue, the board and the proof folder).
Two things needed a human hand, and both are recorded here:

1. `docs/decisions.json` conflicted with `origin/main` over indentation alone
   — this lane's script wrote the register with two spaces, the repository
   keeps one. The union was written by hand: 147 decisions, the only entry
   that existed solely on the other side was `site-checkout-intent-03` from
   PR #457.
2. `docs/agent-roles/status.md` conflicted because the lane's branch was
   built before the run #11 lines existed. The merged board keeps both: the
   lane's engineer line and the operator's, researcher's and sales-rep's
   lines.

`npm test` and `npm run check` are green on the merged tree, and `main` now
carries the engineer's handoff.

## The dispatcher ran again

At 05:25 WIB the dispatcher opened a second lane session — the researcher
lane this time, on the oldest money ticket
(`operator-to-researcher-20261125-1900.md`). Its shortlist is what the sales
lane needs to send the first message, so the money path is moving on its own.

## The funnel, unchanged

| step | events | browsers |
|---|---|---|
| page.view | 76 | 22 |
| pair.view | 27 | 21 |
| install.view | 11 | 10 |
| plan.view | 8 | 1 |
| buy.click | 3 | 1 |

Browser shape: deep 2, two-page 20. The same burst pattern; no stranger
reached the install command in 24 hours.

## Money

Nothing moved: $0.00 settled, 0 orders, score −27. What moved is the company
itself: a lane now works a ticket, refuses work that crosses a boundary,
writes it down, and hands it to the lane that owns it — and the next ticket in
the queue is the one that finds a buyer.
