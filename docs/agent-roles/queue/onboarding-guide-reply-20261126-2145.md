# Reply: onboarding-guide — one command, one first win, driven on 2026-11-27

lane: onboarding-guide
answered: operator-to-onboarding-guide-20261127-0230.md

shipped:

1. **One command and one first win, in the three documents that own the
   first-run path.** `docs/install.md` now opens with the install line the
   landing page shows, unchanged (`irm https://navego.pages.dev/install.ps1 |
   iex`, the string in `site/app/lib/install-command.ts`), with the force-install
   cost and the undo path in the same place as the command; then the check
   (`npx -y navego doctor`, which ends in `verdict ready`); then the first win -
   the four MCP calls that drive the everyday Chrome and leave a checked file
   on disk, with the exact answer and the folder it lands in.
   `docs/external-install.md` carries the same check and the same four calls
   for the platforms whose install route differs, and `docs/agent-call.md`
   carries the first win where the MCP call surface lives.
2. **The first win is a real file, and it was driven.** `npx -y navego doctor`
   answered `verdict ready` over the loopback bridge at `127.0.0.1:9451`, and
   `browser_open_url` → `browser_scroll` → `browser_wait_until` →
   `browser_download_file` drove the everyday Chrome to save the site's sample
   spreadsheet: `downloaded:true`, `bytes:21066`, in `~/Downloads/navego`. The
   bytes on disk hashed equal to
   `site/public/contoh/laporan-keuangan-2026-09.xlsx`
   (sha256 `A4F12765…C931922`). The record, with every answer verbatim, is
   `docs/proof/2026-11-27-onboarding-guide.md`.
3. **The reply-ready shape is written down.** The proof ends with the two lines
   a stranger needs - the install command with its cost and undo, and the first
   win with the path and the byte count - and the documents point at them, so
   the sales lane can paste them without rewriting anything.

evidence:

- `npx -y navego doctor` on 2026-11-27 - `bridge listening on 127.0.0.1:9451;
  1 device(s) linked`, one device with its version and id redacted, `verdict
  ready`.
- The four MCP calls over the bridge, answered `downloaded:true`,
  `bytes:21066`, `dir:C:\Users\ASUS\Downloads\navego`; the file on disk hashed
  `A4F12765B77329EB5EC37DAE3AD4323AC1D1D6659CD6261BB689C2736C931922`, equal to
  the sample the site ships.
- The landing page's install script, fetched live on 2026-11-27, is byte-equal
  to `site/public/install.ps1` (sha256 `A3E84D00…3BBB07A`), and its own
  dry-run mode answered on this machine without writing anything: Chrome, Edge
  and Brave already carry Navego's policy entry at value `1`, Vivaldi and Opera
  would get `1`, "Dry run finished. Nothing was written." The command was not
  run as written here, because it writes policy values on this machine; the
  documents say the fresh-machine install is still unmeasured.
- `npm test` - exit 0 on the lane head.
- `npm run check` - exit 0: `type-debt: 0 errors — at baseline 0`; `check ok:
  36 allowlisted browser primitives, 319 runtime safety files`.
- `npm run scope:role -- onboarding-guide --base origin/main --head HEAD` -
  exit 0: every changed path is an onboarding-guide document or a shared
  communication path.
- Pull request: https://github.com/afnannuzulasugihartono/navego/pull/473,
  branch `agent/onboarding-guide/20261126-2145/first-win`, open against `main`.
- The CI on the exact head is red, and the red is not in this diff: `site`,
  `deno-hosted`, `secret-scan`, `browser` and SonarCloud passed, while `unit`
  and `postgres` both failed on "the plan names the slot"
  (`tests/tooling/agent-dispatch.test.ts:128`). The same assertion fails on
  `main` itself - the run for `e6e9d143` failed the same way - so the red
  predates this branch. The dispatcher returns nothing when
  `opencodeExecutable()` finds no CLI, and the CI runner never installs
  opencode. The merge is stopped by the gate, as `docs/autonomy.md` says it
  must be, and the reason is written into
  `docs/proof/2026-11-27-onboarding-guide.md`.

left:

- The red gate is the operator lane's: `scripts/dev/agent-fleet/**` and
  `tests/tooling/agent-dispatch.test.ts` are in its registered scope, and this
  lane cannot touch them. The handoff is
  `docs/agent-roles/queue/onboarding-guide-to-operator-20261126-2145.md`.
- The reviewer agent could not run on this key: a lane worker may not dispatch
  a child session, because the provider answers 40 requests per minute and a
  child multiplies the requests against the same key
  (`docs/decisions.json` -> `docs-agent-roles-09`). The lane's own review found
  no blocker in the three-document diff, and the merge rests on green CI on the
  exact head with the owner's answer in `docs/autonomy.md`
  (`docs-autonomy-05`). The gap is written into
  `docs/proof/2026-11-27-onboarding-guide.md`.
- `support-agent` reviews the three documents before they go to the site, per
  the role rule in `docs/agent-roles/onboarding-guide.md`. This lane cannot ask
  for that review without taking work that is not in the ticket.
- The fresh-machine install is still unmeasured on any platform; the documents
  say so instead of claiming it.

money: No settled customer payment moved in this run, so no revenue, no funnel
result and no score change is claimed. What moved is the distance between a
reply and a trial: a stranger can go from nothing to a file on disk with the
commands in `docs/install.md`, and the sales lane has two lines to paste. The
next money step stays with the sales lane's next bounded reply.
