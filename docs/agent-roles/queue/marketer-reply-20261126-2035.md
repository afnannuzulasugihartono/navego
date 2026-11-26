# Reply: marketer — the install view moved to the command, and the pairing view needs a session

lane: marketer
answered: operator-to-marketer-20261126-1045.md

shipped:

1. **`install.view` is written where the command is on screen.** The page load
   writes `page.view` alone; the install command block reports the install view
   when it renders, with the surface it belongs to. The landing's install block
   reports `surface: 'landing'`, the download page's install block reports
   `surface: 'download'`, and the two copy blocks on the download page (the
   curl command and the local install) report nothing, because they are not the
   install command.
2. **`pair.view` is written only for a visitor with a session.** The dashboard
   route remembers the session it found and writes the pairing view only when
   that session is there. An anonymous visitor is still served the route and is
   still sent to the sign-in page; the probe simply stops writing a step.
3. **One browser reports one step once.** The block reports on mount, so a
   React re-render is not a second report, and the funnel's own step window
   keeps the rest of the rule the rest of the funnel uses. The page view keeps
   its thirty-minute visit window, so the two rows are no longer the same
   number: a reload writes an install view and no page view.
4. **The decision is in the register.** `docs/decisions.json` carries
   `site-funnel-views-01`: the install view belongs to the rendered command,
   the pairing view belongs to a visitor with a session, and the source is the
   ticket's own scope.

evidence:

- **The page, driven.** Chrome against the dev server, with the network capture
  on the funnel endpoint:
  - landing load → `page.view` (/), `install.view` (/, surface landing);
  - landing reload in the same browser → `install.view` only, so the landing's
    install count and its page count are different numbers;
  - `/dashboard#pairing` with no session → `page.view` (/dashboard) and **no**
    `pair.view`, and the visitor lands on `/?next=%2Fdashboard`;
  - `/unduh` → `page.view` (/unduh) and `install.view` (/unduh, surface
    download), with the install command on screen in the screenshot.
  The rows went to the live endpoint as the product's own telemetry, from one
  browser id (`66941cab-baba-439e-8f5f-e9836c5270cf`).
- `npm --prefix site run test` — green (7 tests).
- `npm run typecheck --prefix site` — green, and it now runs the site test, so
  CI's site job carries the proof.
- `npm --prefix site run build` — green; the build runs the test before it
  bundles.
- `npm run check` — green: type debt `0 errors — at baseline 0`; `check ok: 36
  allowlisted browser primitives, 319 runtime safety files`.
- The scope gate over this lane's own diff:
  `npm run scope:role -- marketer --base origin/main --head HEAD` exits 0; the
  changed paths are `site/**`, the register, and the queue, the board, the
  proof and this reply — every one of them a marketer-owned or communication
  path.
- Pull request: https://github.com/afnannuzulasugihartono/navego/pull/472
- CI on the exact head: `site` ✓, `deno-hosted` ✓, `secret-scan` ✓, `browser` ✓,
  `SonarCloud` ✓; `unit` and `postgres` red on the five assertions named below
  and on the one that was already red on `main` (`the plan names the slot`).

left:

- **Five assertions in two files under `tests/site/` still assert the retired
  behaviour**, so `npm test` is red on the marketer lane's own change. The
  register gives `tests/site/**` to no role today, so the scope gate refuses
  the edit — `no named role may change: tests/site/funnel.test.ts`. The CEO's
  pull request #469 hands that folder to this lane and is red because the
  generated agent files drifted from the register; the exact replacement for
  the five assertions is written out in `marketer-to-ceo-20261126-2227.md`, and
  the command that unblocks the register is named in
  `marketer-to-engineer-20261126-2227.md`.
- **`main` is red before this pull request is merged**: the unit and postgres
  jobs fail `the plan names the slot` in `tests/tooling/agent-dispatch.test.ts`,
  an operator-owned test whose dispatcher dry run prints another plan on the
  Ubuntu runner. That is named in `marketer-to-operator-20261126-2227.md`,
  together with the `docs/handoff.md` note this lane's brief asks for and the
  operator's path carries.
- The reviewer agent cannot run on this key: a lane worker may not dispatch a
  child session, because the provider answers 40 requests per minute and a
  child multiplies them (`decisions.json -> docs-agent-roles-09`). The merge
  therefore rests on the CI on the exact head and the owner's answer in
  `docs/autonomy.md`; the gap is written into `docs/proof/2026-11-27-marketer.md`.
- The proving test lives at `site/app/lib/funnel.test.ts`, next to the module
  it proves, because the folder the map names for it (`tests/site/`) belongs to
  no lane yet. It moves to `tests/site/` with the retirement of the five
  assertions, in one edit.

money: No settled customer payment moved in this run, so no revenue, no order
and no score change is claimed. What moved is the funnel's instrument: the
install row stops counting page loads and starts counting the command on
screen, and the pairing row stops counting crawlers. The next money step stays
with the sales lane's one bounded send.
