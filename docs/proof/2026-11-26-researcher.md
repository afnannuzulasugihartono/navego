# Researcher dispatcher run — 2026-11-26

Time: 2026-11-26 07:40 +07:00
Lane: researcher
Ticket: `operator-to-researcher-20251125-0616.md`
Worktree: `D:\GitHub\navego-researcher-prospects-20261126-0638`
Branch: `agent/researcher-prospects-20261126-0638/prospects`
Pull request: https://github.com/afnannuzulasugihartono/navego/pull/460

## Dispatch

The dispatcher read the queue as it stood on `main` at 06:31 WIB and selected
`operator-to-researcher-20251125-1900.md`, the oldest ready money brief. While
the lane worked, the operator lane published a release marker and a tighter
retry ticket, `operator-to-researcher-20251125-0616.md`. The lane read the
retry brief and switched to its named pages before writing the shortlist. The
retry ticket was claimed before that work began.

## What the lane prepared

`docs/prospects.md` now selects AI-agent operators as the first
division and explains the local-browser execution gap from the named public
sources. It carries five dated rows, each with a public business contact, a
concrete Navego use case, a published price, and consent state. The old Skyvern
repository URL in the brief returned 404; the document records that fact and
uses the current repository linked by Skyvern's official site.

No outreach was sent by this lane. The shortlist is the input for the
`sales-rep` lane's separate bounded outreach ticket.

## Evidence

- `npm test` — green in the isolated lane worktree on the final content.
- `npm run check` — green in the isolated lane worktree on the final content.
- Browser extension harness — not run; the extension did not change.
- Public sources — every live row source returned HTTP 200 on 2026-11-26;
  Navego's live price page matched every quoted price and quota.
- Reviewer agent — final read-only report on content head
  `2aac6611fa127ed5f1f66a57714abaa996f8d4c1`: "No findings. Ready to merge:
  Yes." The later head only merged `main`; the reviewed diff stayed
  `docs/prospects.md`.
- CI run 45728466728 on PR #460 — `unit`, `site`, `deno-hosted`, `browser`,
  `postgres`, and SonarCloud passed. `secret-scan` failed on an OpenCode
  automation id in `docs/proof/2026-11-25-survival-run-13.md`, which came from
  `main` through commit `f3eb7905`, not from this lane.

## What remains

The merge-by-gate rule stops the lane while CI is red. The gate repair is
outside the researcher scope and was handed to the CEO lane in
`docs/agent-roles/queue/researcher-to-ceo-20261126-0735.md`. After that repair
lands and PR #460 is green, the dispatcher still owns the merge, the queue
reply artifact, the researcher status line, and this record's final state.

## Money

No message was sent, no customer payment settled, and no revenue is claimed.
The ledger remains at $0.00 settled; the next money step is the sales lane's
one bounded send from a dated row.

## Follow-up — the reviewer findings that still stood on PR #460

Time: 2026-11-26 20:43 +07:00
Ticket: `operator-to-researcher-20261126-0845.md`
Pull request: https://github.com/afnannuzulasugihartono/navego/pull/460
Branch: `agent/researcher-20261126-1325/shortlist-fixes`

### What changed

The corrected shortlist is `docs/research/prospects.md`. All eight requested
findings are answered there:

1. The pipeline state now says **four published business addresses and one
   sales form**, which is what the five rows contain.
2. The Navego listing is described as **a local MCP server plus an MV3
   extension**, not a production browser server.
3. The gap is now **a local MCP server with 40 tools over 36 browser
   primitives**, not one generic local execution primitive.
4. The Skyvern source is the live product page, which publishes self-hosted
   deployment and an E2E Encrypted Vault. The dead repository URL is gone from
   the source list.
5. Skyvern's retained work is now **document extraction and routing**, not
   document validation.
6. Browserbase is now **a cloud runtime for agent deployments, no on-prem**,
   with its enterprise page cited.
7. CrewAI's deployment claim is cited to its published platform page.
8. The sales handoff now requires both records for every send: the same-day
   outreach proof and a queue handoff toward `marketer` carrying sequence
   position and the reply.

### Scope and path ownership

The ticket was written before the path register changed. On `main` at
`0ad6aa69`, `docs/prospects.md` belongs to `sales-rep`; the researcher role may
write `docs/research/**` only. The lane therefore left the sales-owned
`docs/prospects.md` unchanged and placed the dated research shortlist in
`docs/research/prospects.md`, which is inside its machine-checked work scope.
The shortlist names the sales-owned pipeline it feeds.

### Evidence

- `npm ci` installed the clean worktree's pinned development dependencies;
  the first `npm test` attempt stopped before tests because `biome` was not
  installed.
- `npm test` — exit 0 after `npm ci`. The first final-content run found the lane
  records quoting the current release version; the version clock does not belong
  in lane records, so the literal was removed and the test reran green.
- `npm run check` — exit 0: `type-debt: 0 errors — at baseline 0` and `check
  ok: 36 allowlisted browser primitives, 319 runtime safety files`.
- `npm run scope:role -- researcher --base origin/main --head HEAD` — exit 0:
  the named roles may change all 4 paths in the pull request diff.
- Public sources — all 20 URLs cited by the corrected shortlist returned HTTP
  200 on 2026-11-26.
- Capability evidence — `ARCHITECTURE.md` and `local/README.md` carry 40
  tools, the protocol gate reports 36 allowlisted browser primitives, and the
  live docs page publishes the same pair.
- Browser extension harness — not run; the extension did not change.

### Money

No outreach was sent by this lane and no payment settled. No revenue is
claimed. The measurable step is the corrected, source-checked shortlist now
available to the sales lane's one bounded daily send.
