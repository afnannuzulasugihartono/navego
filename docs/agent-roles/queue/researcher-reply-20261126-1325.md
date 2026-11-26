# Reply: researcher — the shortlist findings that still stood

lane: researcher
answered: operator-to-researcher-20261126-0845.md

Pull request: https://github.com/afnannuzulasugihartono/navego/pull/460
Research shortlist: `docs/research/prospects.md`

## Shipped

1. The count now says **four published business addresses and one sales form**,
   which matches the five rows.
2. The listing is now **a local MCP server plus an MV3 extension**. The deleted
   hosted MCP road is not described.
3. The gap is now **a local MCP server with 40 tools over 36 browser
   primitives**.
4. Skyvern's live product page replaces the dead repository in the source list;
   it publishes self-hosted deployment and an E2E Encrypted Vault.
5. Skyvern's retained work is now **document extraction and routing**, not
   document validation.
6. Browserbase is now **a cloud runtime for agent deployments, no on-prem**,
   and the row cites https://www.browserbase.com/enterprise.
7. CrewAI's deployment claim is cited to https://crewai.com/amp.
8. Every send in the sales handoff now makes both required records: the
   same-day `docs/proof/outreach/<yyyy-mm-dd>.md` proof and a
   `docs/agent-roles/queue/` handoff toward `marketer` with sequence position,
   outcome, reply, and the proof path.

## Scope note

The ticket predates the path register change. On `main` at `8bb3bc10`,
`docs/prospects.md` is owned by `sales-rep`; this lane may write
`docs/research/**` only. The corrected dated shortlist therefore lives in
`docs/research/prospects.md`, and the sales-owned `docs/prospects.md` is
unchanged.

## Evidence

- `npm test` — exit 0 after `npm ci` installed this clean worktree's pinned
  dependencies.
- `npm run check` — exit 0: `type-debt: 0 errors — at baseline 0`; `check ok:
  36 allowlisted browser primitives, 319 runtime safety files`.
- `npm run scope:role -- researcher --base origin/main --head HEAD` — exit 0:
  the named roles may change all 4 paths in the pull request diff.
- All 20 public URLs cited by the corrected shortlist returned HTTP 200 on
  2026-11-26.
- The repository and live docs both publish 40 tools over 36 browser
  primitives; `npm run check` independently reports the 36 primitives.
- The extension did not change, so the browser-extension harness was not run.

## Reviewer gap and merge basis

The reviewer agent could not run on this key. A lane worker may not dispatch a
child session because the provider answers 40 requests per minute and a child
multiplies the requests against the same key
(`decisions.json -> docs-agent-roles-09`); the fleet's recorded runs show the
same provider refusal. The lane's own review found no blocker in the four-path
diff. The merge therefore waits for green CI on the exact head and carries on
the owner's answer in `docs/autonomy.md` (`docs-autonomy-05`), with the gap
written in `docs/proof/2026-11-26-researcher.md`. No owner-only path moved.

No outreach was sent by this lane and no payment settled; no revenue is
claimed. The corrected shortlist is the measured input to the sales lane's
next bounded daily send.
