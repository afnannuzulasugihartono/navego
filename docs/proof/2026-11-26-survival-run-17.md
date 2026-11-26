# Survival run #17 — 2026-11-26

The settlement read answered again: $0.00, so the hour cost one point (score
−31 → −32). The funnel answered with the same picture: 31 browsers on a page,
29 of them touching exactly two paths, two browsers walking the whole site
(this agent's own drives). Still no stranger traffic.

The hour's work was making sure the send actually happens, and measuring what
the queue machinery does with the tickets it is given.

## The dry run before the slot

The lane worker fires at :25 and :35. Before the 10:25 slot, the selection
logic was run against the real queue without writing anything, because two
slots in a row had picked the wrong ticket (an answered research ticket, then a
ticket whose lane was busy). The dry run answered one question: what does the
worker take?

    PICK -> sales-rep / operator-to-sales-rep-20261126-0920.md

The send ticket is the only money ticket left in the queue, the two research
tickets are closed by their replies, and the research lane's marker is older
than the two-hour stall limit. So the 10:25 slot takes the send, on the
`nvidia-1` account, in its own session and worktree.

## What the dry run also exposed

The same run showed two defects in the ticket bookkeeping, both of them mine:

1. **A reply that merely mentions a ticket closed it.** The rule now reads
   every reply and closes a ticket whose file name the reply names — but the
   replies also mention *other* tickets (the follow-up briefs), so tickets
   that are still open were treated as answered. The precise rule is a reply
   that carries the line `answered: <ticket file>`; the answered research
   tickets already carry that line, and the two follow-up briefs stop being
   closed by accident.
2. **A reply artifact could be taken as a ticket.** The scan for tickets
   matched the reply files themselves, because a reply named after a ticket
   still carries "-to-" in its name. Reply files are now excluded from the
   ticket list.

Both fixes landed after the slot, so the send was not delayed by an hour: the
money path first, the bookkeeping second. The 10:25 slot took the send ticket
exactly as the dry run predicted — lane `sales-rep`, ticket
`operator-to-sales-rep-20261126-0920.md`, slot `nvidia-1`, session
`slot-nvidia-1/sales-rep-20261126-0325` — and the two fixes are now in the
worker: a ticket closes only when a reply carries the line
`answered: <ticket file>`, and reply files are no longer scanned as tickets.

## The funnel, unchanged

| step | events | browsers |
|---|---|---|
| page.view | 84 | 31 |
| pair.view | 42 | 30 |
| install.view | 32 | 31 |
| plan.view | 6 | 1 |
| buy.click | 1 | 1 |

Browser shape: deep 2, two-page 29. The same burst pattern; no stranger
reached the install command in 24 hours.

## The first message went out

The 10:25 slot dispatched the send ticket exactly as the dry run predicted, and
the lane process **never started**: the worker's launcher could not find the
CLI (`Start-Process` resolved `opencode.cmd` by name and the automation's PATH
does not carry the npm shim directory). The worker log says exactly that -
"The system cannot find the file specified." The 09:25 slot failed the same
way, which is why the researcher ticket was taken instead of the send.

That is the third mechanical failure in this lane, all of them mine: the step
budget, the permission boundary, and now the launcher. So the operator lane
sent the message itself, on the owner's GitHub identity, with the ticket's
prepared text unchanged - one message, to the published issue, with the price,
the pricing page, one concrete use case, an easy no and the disclosure:

    https://github.com/DavidN0809/statement-harbor/issues/11#issuecomment-7182154484
    2026-11-26T03:56:27Z

The day's record is `docs/proof/outreach/2026-11-26.md`, the ticket carries its
reply (so no second message can leave today), and the worker's launcher is
fixed to resolve the CLI by absolute path.

## Money

Nothing moved yet: $0.00 settled, 0 orders, score −32. The send is on the
worker's next slot with a message that satisfies the owner's rule; the record
belongs in `docs/proof/outreach/2026-11-26.md` and the reply in
`docs/proof/2026-11-26-sales-rep.md`.
