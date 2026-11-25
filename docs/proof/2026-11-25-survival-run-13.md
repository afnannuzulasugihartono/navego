# Survival run #13 — 2026-11-25 (operator lane)

The settlement read answered again: $0.00, so the hour cost one point (score
−27 → −28). The funnel answered with the same picture: 22 browsers on a page,
20 of them touching exactly two paths, two browsers walking the whole site
(this agent's own drives). Still no stranger traffic.

The hour's substance was a stalled lane and the money path that waits behind
it.

## What happened to the researcher lane

The dispatcher opened it at 05:25 WIB on the oldest money ticket
(`operator-to-researcher-20261125-1900.md`). The lane created its worktree
(`D:/GitHub/navego-researcher-20261125-1900`) at 05:31 and then produced
nothing for fifty minutes: no commit, no change in `docs/research/prospects.md`,
no reply artifact, and no file in the worktree that the checkout did not
already hold. The brief asked it to research the market; the web search tool
answers nothing in this environment, and the brief never said where to read
instead, so the lane had no way forward.

Two things followed from that, and both are in the tree:

1. **The ticket was marked as taken.** The dispatcher's own rule says a ticket
   with a started marker and no reply is still in progress, so the next
   dispatch skips it instead of taking the same ticket twice. The dispatcher
   did not write that marker, so the operator lane wrote it:
   `docs/agent-roles/queue/researcher-started-20261126-0525.md`, with the
   honest record of the fifty silent minutes.
2. **The brief was tightened and re-issued** as
   `operator-to-researcher-20261125-0616.md`: the same work, but with the
   public pages to read named by URL (the MCP listing pull request, the public
   MCP servers list, the statement-harbor issue, two agent projects that drive
   a browser), because a lane that cannot search must be told where to read.

## The money path, unblocked

With the researcher ticket marked, the next dispatcher took the sales lane
instead. `operator-to-sales-rep-20261125-2117.md` now carries one prepared,
already-dated contact rather than waiting for a shortlist that does not exist
yet: a public issue on a public repository
(`https://github.com/DavidN0809/statement-harbor/issues/11`) whose author
asked for exactly the boundary Navego covers — a person signs in manually, the
session stays isolated and authorized, and the collection stops safely at a
challenge. The prepared reply is in the ticket verbatim, including the
disclosure that the sender maintains Navego. One message, one public
conversation, recorded the same day in `docs/proof/outreach/2026-11-26.md`.

This is the first message under the owner's bounded authorization, and it
reaches a person who asked the question rather than a cold list.

## The request budget, and what it changed

The owner pointed at the real cost: a subagent dispatched **inside this
conversation** spends this conversation's request budget, and NVIDIA answers at
40 requests per minute. The dispatcher built at 04:25 WIB did exactly that —
it opened a child session inside the operator session — so every lane it
started competed with the operator's own work for one key.

Two changes follow, both in place:

1. **The conversation keeps the console route; the workers take the ordinary
   accounts.** The dispatcher that dispatched inside the conversation
   (`aut_214a3b8b3001WtfKwLoZjREirV`) is deleted. In its place, two lane
   workers run as shell automations that start a **separate process** with the
   account's own model and the account's own key: `aut_215148c04001SmoQO7rthLK6dt`
   on `nvidia-1` at :25 and `aut_215148c0e001re3h6HLz23R9v0` on `nvidia-2` at
   :35. Each worker runs `opencode run --model <slot model> --agent <lane>
   --worktree <name> --title <slot session> --archived --auto`, so no lane
   session shares a session, a worktree, or a key with the operator
   conversation.
2. **Each worker has a bounded request budget.** The generated role files
   carry `steps: 60`, so one lane run cannot spend a key's minute in a burst,
   and the roster says so in words: the console slot runs no lane workers.

## Capacity split by credential

The owner has three NVIDIA routes: the personal/console one and two ordinary
accounts (`nvidia`, `nvidia2`). `docs/agent-roles/keys.json` now names all
three as slots, each with its provider, model, credential location, the
session it owns and the lanes it serves, and never a key. One credential
serves one worker process and one session, so three routes run three lanes at
once; no two slots may run on the same credential, and the worker proves that
by hashing each credential locally and refusing a slot whose digest already
belongs to another. The second ordinary account is defined in the repository's
`opencode.json` (`nvidia2`, reading its key from a file outside the
repository); the owner places the key file, no agent reads it.

## The funnel, unchanged

| step | events | browsers |
|---|---|---|
| page.view | 76 | 22 |
| pair.view | 30 | 21 |
| install.view | 17 | 16 |
| plan.view | 8 | 1 |
| buy.click | 3 | 1 |

Browser shape: deep 2, two-page 20. The same burst pattern; no stranger
reached the install command in 24 hours.

## Money

Nothing moved yet: $0.00 settled, 0 orders, score −28. The first message is
now queued for a lane that will send it on its own; a reply that turns into a
trial, and a trial that settles a $1 plan, is what moves the score.
