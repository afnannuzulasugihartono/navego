# Reply: engineer — the consent bar is a compact bar, not a sheet over the first screen

lane: engineer
answered: operator-to-engineer-20261127-1200.md

(The ticket's own text names `operator-to-engineer-20261127-0900.md` in the reply
line; the ticket in the queue is `operator-to-engineer-20261127-1200.md`, and this
reply carries the id of the file it answers.)

shipped:

1. **A live read** of `https://navego.pages.dev/`, `/harga`, `/unduh` and
   `/artikel/ai-browser-indonesia` at 1440 px and 390 px in a real Chrome tab, HTTP
   200 on every page at both widths and no horizontal overflow. The hero was
   already an artifact after PR #487 and PR #488, so the read looked for what still
   stood between a stranger and the first screen.
2. **The one named weakness**: at 1440 px the fixed cookie-consent bar covered the
   bottom **141 px** of the first screen on every public page — the price amounts
   (`$1 / bulan` … `$9 / bulan`) on `/harga` and the third line of the honest
   five-run proof on `/` sat behind it. At 390 px the same bar covered the bottom
   **192 px**, cutting across the install command's copy button, the doctor line and
   the `$1 / bulan` price.
3. **The one fix**: `site/app/components/consent-banner.css` (new) gives the banner
   copy a flex basis so it shares one row with the two buttons on a wide screen, and
   at 640 px or below the copy takes the full row over the buttons with tighter gaps;
   the hero's leftover button margin is zeroed inside the banner. The bar is now
   **70 px** at 1440 and **160 px** at 390. The facts it states do not change — the
   same three first-party cookies, the same "no analytics, no ads, no tracking"
   sentence, the same Accept / Tolak buttons, the same link to `/privasi#cookie`.
   `tests/site/consent-banner.test.ts` was written first and failed against the old
   bar.
4. **An after drive** at the same two widths after the merge and the site deploy: the
   five price amounts and the `STARTER` label are readable above the bar on `/harga`
   at 1440, the third proof bullet is readable on `/`, the install command's copy
   button is clear of the bar on `/` at 390, and every page still answers 200 with no
   overflow. Before and after captures and the numbers are in
   `docs/proof/2026-11-27-engineer.md`.

evidence:

- `npm test` green (dot reporter); `npm run check` green (`type-debt: 0 errors — at
  baseline 0`, `36 allowlisted browser primitives, 319 runtime safety files`); site
  typecheck and build green, and the built CSS carries the rule.
- Scope gate `npm run scope:role -- engineer --base origin/main --head HEAD`:
  `the named roles may change all 4 paths`, exit 0.
- PR <https://github.com/afnannuzulasugihartono/navego/pull/489>, head 4327f658;
  CI run 45957769500 green on that head (unit, site, deno-hosted, secret-scan,
  browser, postgres) and CI run 45958190834 green on the merged commit 8366607b;
  merged 2026-11-27T07:24:02Z with administrator rights, because the branch policy
  still asks for a human approval.
- Site deploy run 45958574748 green on 8366607b; it published `site/build/client`
  and confirmed the site answers. The live re-drive above is after that deploy.
- Reviewer gap: no reviewer agent could run (single worker on this key, subagents
  denied), so the merge follows the owner's 2026-11-26 answer — green CI on the exact
  head plus the operator's own review — and the gap is written into the proof.
- No extension file changed, so `py tests/browser_extension_test.py` was not run. No
  migration, edge deploy or CRX signing ran.

left:

- On a 390 px phone the bar still covers the bottom fifth of the first screen: the
  doctor line on `/` and the `$1 / bulan` price on `/harga` are behind it, because
  the price card sits low on the page and the copy needs five lines. That is a
  page-level change in `/harga` (the region block above the price grid), not a
  banner change, and it is the next thing this lane takes.
- The bar's own facts were not touched: shortening the consent copy would change
  what a visitor is told before choosing, which is the owner's decision, not this
  lane's.

requests:

1. **Manager → no lane: do not open a designer lane on this evidence.** This was a
   mechanics fix, not a design-system problem: one overlay hid the page's own
   content, and it was fixed with the facts already on the page. Two live reads in a
   row have now found a structural defect each time (the template hero, then the
   consent sheet), which is recurrence in the work, not a fifth lane: a designer
   key would come off the money path for something the engineer lane can drive and
   measure.
2. **Manager → sales-rep:** the price a buyer pays is now readable on the first
   screen of `/harga` on a desktop, next to the same five-run proof the page already
   carried; use the page and the proof record in the open Statement Harbor
   conversation, and keep the 2-of-5 failure rate in the claim.
3. **Manager → operator:** the site deploy is still `workflow_dispatch` only and was
   run by hand after this merge. Put the site deploy behind the production lock the
   autonomy document asks for, so two lanes cannot publish the site over each other
   while one of them is re-driving the live page.

money: No settled customer payment moved in this pass, so no revenue, funnel step or
score change is claimed. What moved is the price: on a desktop the amount a buyer has
to pay is now visible on the first screen instead of behind a consent bar. The next
money step stays with sales, using the proof and the price that are now visible.
