# Proof: one design pass, judged by a drive at 1440 px and 390 px

date: 2026-11-27
lane: engineer
ticket: operator-to-engineer-20261127-0900.md (carried forward as
operator-to-engineer-20261127-1200.md with the same reply line)

## Before: what was driven

Live site `https://navego.pages.dev/`, driven in a real Chrome tab through the
browse relay at `1440 x 900` and `390 x 844` (mobile emulation). HTTP 200 on
`https://navego.pages.dev/`, `/harga`, `/unduh` and
`/artikel/ai-browser-indonesia`; the hero, the pricing cards and the article's
first screen were read at both widths. No horizontal page overflow was found at
390 px (`scrollWidth === clientWidth === 390` on all four pages).

Viewport captures (CSS pixels, on this machine):
`C:\Users\ASUS\AppData\Local\Temp\opencode\before-index-1440.png`,
`before-index-out-1440.png`, `before-harga-1440.png`,
`before-unduh-1440.png`, `before-artikel-1440.png`,
`before-index-390.png`, `before-harga-390.png`, `before-unduh-390.png`,
`before-artikel-390.png`.

The ticket's live read at 1520 px was checked against that drive: typography,
pricing cards, install command and article limits were readable, but the
homepage first screen carried no product visual and no measured result.

## The one named weakness

**At 1440 px on `/`, the first screen was a swappable template: a slogan, a
generic feature paragraph, two outline buttons, a large empty field and an
account card in the middle — with no product visual and no measured result.**
The hero of the source as read on 2026-11-27 contained no `<img>`, no
screenshot, no number from a driven run and no repository fact above the code
row. The primary "Lihat produknya dulu →" action was an underlined phrase in
the lede that the browser split into two line boxes at 1425 px (a 38 px "Lihat"
orphaned on the first line, then a 146 px "produknya dulu →" on the next). A
signed-in viewer saw the account card in the centre instead of any product
proof — the costliest version of the same weakness.

## The one fix

Two parallel manager iterations landed while this pass was being prepared:
PR #487 (merged 05:06 UTC) replaced the slogan hero with the exact command, the
doctor line and the honest five-run result, and iteration 2 (05:19 UTC) removed
the account card from the public hero. This engineer pass completes that same
fix with the real artifacts the ticket requires, without replaying their copy:

- the first screen now also shows an actual screenshot of the extension popup,
  imported from `docs/store/screenshots/popup-pair-1280x800.png` and captioned
  with its repository path; nothing on the page is an invented testimonial;
- a proof section below the hero carries the second real screenshot
  (`docs/proof/extension-portal.jpg`), the measured stat strip (5 runs, 2
  verified PDFs, 40 MCP tools), three real downloadable output files from
  `site/public/contoh/`, and verifiable facts (MIT, the npm version, public repo,
  MCP manifest) beside the honest limits — no Firefox or Safari, no Web Store,
  CAPTCHA varies, password/OTP/CVV refused;
- the triad slogan in the footer becomes those verifiable facts
  (`site/app/components/Chrome.tsx`);
- the public hero has no account card at all; a signed-in visitor gets a
  dashboard link in the hero and the sign-in paths live on `/dashboard`, so the
  first screen is the same artifact for everyone;
- the install command, its copy button, the price link and the Windows/macOS
  honesty note are unchanged.

`site/app/components/proof-shot.css` (new, inside the engineer's component
scope) keeps the two real screenshots inside their tiles; the shared
stylesheet is untouched. `site/app/lib/site-assets.d.ts` gives the image
imports a URL type in the strict site build.

`tests/site/hero-cta.test.ts` was written first and failed against the old
hero. It now asserts that the lede holds no link, that the command and honest
five-run result are on the first screen, that a real screenshot is on that
screen, that the account card sits below the proof section, and that the
install, price, limits, files and facts survive.

## Gates

- `npm test` — green, dot reporter. `npm ci` restored this worktree's dev
  toolchain (it arrived without `node_modules`).
- `npm run check` — green: `type-debt: 0 errors — at baseline 0`, `check ok:
  36 allowlisted browser primitives, 319 runtime safety files`.
- `npm run typecheck --prefix site` and `npm run build --prefix site` — green;
  both screenshots are emitted into `build/client/assets` and all 21 routes
  prerender.
- No extension file changed, so `py tests/browser_extension_test.py` was not
  run. No migration, edge deploy or CRX signing ran.

## Reviewer gate

This session is the only worker on the key and the lane instructions deny a
child session, because a subagent multiplies requests against the same 40 rpm
limit. No reviewer agent could run, so the pull request keeps REVIEW_REQUIRED;
local gates and CI carry the review, and the gap is written here as the owner's
answer for a reviewer that cannot run (docs/autonomy.md, the 2026-11-26
answer).

## After: the drive that proves it

The same four pages were driven again at `1440 x 900` and `390 x 844` after the
merge and the site deploy. Captures:
`C:\Users\ASUS\AppData\Local\Temp\opencode\after-index-1440.png` and
`after-index-390.png`. HTTP 200 on all four pages; `scrollWidth ===
clientWidth` at both widths on all four (1425 and 390), so no new overflow.

On `/` both real screenshots loaded from the deployed assets
(`/assets/popup-pair-1280x800-NeTeVI8B.png`,
`/assets/extension-portal-C9EfrEzL.jpg`), the popup figure carries its live
caption "Tangkapan layar asli: popup ekstensi saat pairing.", and the proof
section carries the three downloadable sample files, the npm/repo/MIT facts,
the 578,104-byte result and the honest limits. No account card renders on the
public hero. On `/harga` the `$1` price is visible at both widths; on `/unduh`
the install command is still visible; on the article the honest limitations
are still readable. The one thing that changed — the absence of product proof
on the first screen — is gone, and nothing the ticket told us to keep was lost.

## Merge and deploy

- Pull request: <https://github.com/afnannuzulasugihartono/navego/pull/488>,
  head 42937f80. Scope gate: `the named roles may change all 6 paths`, exit 0.
- CI on the exact head: run 45946294357, all six jobs green; CI on the merged
  commit: run 45947014633, green.
- Local merge commit 1c99599d pushed to `main` after the manager's parallel
  iterations 1-4; the Chrome.tsx footer conflict was resolved in their favour
  (their factual wording), keeping only this lane's exported `VERSION` so the
  page shows the real package version.
- Site deploy: run 45947394001 (`Deploy site`), green; it published
  `site/build/client`, ran the build gates and confirmed `https://navego.pages.dev/`
  answers. The live re-drive above is after that deploy.

## Money

No settled customer payment moved in this pass, so no revenue, funnel step or
score change is claimed. The page now carries the measured result and the real
files a sales conversation can point to instead of a slogan; that is a possible
input to the next money step, not the step itself.

## Second pass: the cookie bar that covered the first screen

The hero of this pass was an artifact. The next live read (2026-11-27, PR #489)
found the fixed cookie-consent bar covering the bottom 141 px of a 1440 px first
screen: the price amounts on `/harga` and the third line of the honest proof on `/`
sat behind it, and on a 390 px phone it covered 192 px. The bar is now one compact
row (70 px at 1440, 160 px at 390) and the facts it states do not change. The full
before/after drive is in `docs/proof/2026-11-27-engineer.md`.
