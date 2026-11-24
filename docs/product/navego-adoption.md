# Navego adoption audit — 2026-11-24

## Diagnosis

Navego does not lose because $1 is expensive. It loses because a visitor could not confidently finish one real job and trust the result. Free local browser-control tools already cover the basic proposition: Playwright MCP and Chrome DevTools MCP are free, and Browser MCP/agent-browser offer signed-in Chrome control. The sale therefore has to be **verified completion, safe recovery and a credible activation path**, not more primitives.

The audit found a hard blocker first: live Starter checkout returned `502 paypal credentials are not set`. It also found that a visitor could install and pair without ever reaching the advertised natural-language result, that the pricing copy contradicted itself, that the no-global quickstart fell back to a binary that was not installed, and that privacy copy was too absolute.

## Evidence used

- [AgentAtlas MCP comparison](https://agentatlas.dev/guides/browser-automation-mcp-servers-compared/) — free local Playwright MCP and Chrome DevTools MCP are the baseline.
- [G2 Browser Use reviews](https://www.g2.com/products/browser-use/reviews) — quick setup is valued; reliability, retry behavior and evaluation limits are the frustration.
- [Anchor on verified completion and cost](https://anchorbrowser.io/blog/best-browser-agent-platforms-reliable-low-cost-automation-2026) — success is a verified business outcome, and cost includes retries, not just the headline price.
- [Browser Use pricing](https://browser-use.com/llms-full.txt) — free credit, no subscription and transparent usage pricing are the expectation.
- [Anthropic computer-use security](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool) — prompt injection, least privilege and human confirmation matter for signed-in sessions.
- Navego's own live Chrome/RPC evidence: PayPal 502, duplicate pairing-code hash, `connect-src 'none'` blocking session proof, and a chevron panel taller than a phone viewport.

No failure-rate statistic is invented here. These are product and market facts plus measured failures in this repository and the live site.

## Barriers and what is now done

| # | Barrier | Evidence | Action and status |
|---|---|---|---|
| 1 | **Checkout cannot run in production** | Live `paypal-buy` returned 502 because credentials were absent. | A Live REST app (`Navego Billing`) and a payment webhook now exist, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID` and `PAYPAL_ENV=live` are set on project `nenmkmtvjremqphfqnfw`, and live `paypal-buy` answers 200 with an approval URL. A real paid capture and webhook activation remain unproven. |
| 2 | **Payment does not reliably activate a plan** | The old code had no capture and ignored activation failure. | Capture and activation now fail loudly. The webhook also returns activation errors instead of `ok:true`. The live capture path still needs one real paid order to be proven. |
| 3 | **The first real task is missing from the normal UI** | Dashboard accepts only a primitive name, not a natural-language goal or artifact. | Not solved. Next milestone: one natural-language task runner with the model configured, a result and a downloadable artifact. Do not ship a fake prompt field. |
| 4 | **Install requires trust in a sideloaded extension** | Store is still in review; Load unpacked and force policy remain the path. | Not solved. Highest install priority: store listing or a conventional signed installer, with clean-install and complete-uninstall proof. |
| 5 | **No-global quickstart could not run as written** | Snippets called `navego` although no global binary was installed, and doctor ran before the driver. | Every harness now uses `npx -y navego local`, then `npx -y navego doctor` in a second terminal, with Node.js 22 or newer. |
| 6 | **Pricing copy was contradictory** | “Sekali bayar. Setahun penuh” sat next to monthly plans; plan names and periods were unclear. | Hero now says “Harga yang bisa Anda hitung”: one month for Starter/Basic/Plus/Pro/Advanced, six months for Business, one year for Enterprise, no auto-renewal and no token/proxy markup. |
| 7 | **Device-first regional detection was blocked by its own policy** | `Permissions-Policy: geolocation=()` refused the location the page requested. | Only `/harga` and `/harga.html` now allow `geolocation=(self)`; all other routes remain blocked. |
| 8 | **Visitors cannot evaluate enough before buying** | One job and scripted previews do not prove site-specific reliability. Free competitors offer more evaluation. | Real xlsx/docx/pptx examples are downloadable now. A meaningful no-card multi-task evaluation is still a product decision, not something to fabricate. |
| 9 | **Latency alone does not prove completion** | Fast primitives can still produce the wrong business result. | `continueOnError` returns successful steps plus exact failures instead of retrying. Next: task-level postconditions and published failed/unverified runs. |
| 10 | **Retry loops and compounding errors waste tokens** | A failed step can invalidate the rest of a long flow. | The burst stops at the first failure by default and never retries. `continueOnError` preserves partial work instead of repeating a step. |
| 11 | **OTP/CAPTCHA/login needs a person, not another retry** | Agents often keep clicking until context and money are gone. | Such failures return `needsHuman` with the gate, reason and a resume instruction, even when `continueOnError` is enabled. |
| 12 | **The agent can steal the user's window and session** | Background automation can disrupt work or force a fresh login. | `browser_open_url` now opens in the background by default on extension and bridge roads, using the existing profile and cookies. |
| 13 | **Page instructions are a prompt-injection risk** | Signed-in pages can contain hostile instructions. | Every `browser_read_page` response carries `untrustedContent: true` and a note that text is data, never an instruction. |
| 14 | **Privacy copy was absolute and wrong** | “Data goes nowhere” conflicted with Supabase history, model calls and third-party region lookup. | Public copy and policy now name Supabase, the chosen model, BigDataCloud for optional regional detection, and all three cookies including `oa_device_id`. |
| 15 | **Checkout lost purchase intent** | Signed-out buyers landed in the dashboard, popups were ignored and there was no return status. | `/harga` preserves the return path, disables creation while pending, handles blocked popups, stores the order and finishes capture on return. |
| 16 | **Free Starter and paid entitlement are hard to distinguish** | “Tidak ada plan gratis” sits beside a free Starter entitlement in the plan reader. | Not solved. Decide whether free Starter is an intentional evaluation tier, a legacy grant, or should be removed, then make the public offer and entitlement agree. |
| 17 | **Commands/day are hard to translate into ROI** | A command is not a completed job, and model/provider spend is separate. | The page now says there is no Navego token/proxy markup. Next: publish cost and success per completed workflow, including model cost and human minutes saved. |
| 18 | **Unattended production is a different segment** | Managed cloud providers offer concurrent browsers and recordings, while Navego is local-first. | Do not pretend to be that product. Position Navego around interactive signed-in local work; scheduling/concurrency/remote devices are later decisions. |
| 19 | **Bot detection and account risk are not solved by a slogan** | CAPTCHA and anti-bot outcomes vary by site and vendor benchmark. | Login/CAPTCHA handoff is explicit now. Publish per-domain limitations and rate-limit/authorized-use guidance instead of “works on any site”. |
| 20 | **English conversion stopped at the landing page** | Developers outside Indonesia could not evaluate installation, pricing or docs in English. | `/en` is live with real proof and pricing links. Full English onboarding/docs parity remains open. |
| 21 | **Social proof is thin** | No externally verifiable customer case studies or review history were found. | Do not invent testimonials. Next: one or two design partners with a real workflow, artifact and independently checked outcome. |
| 22 | **Cloud dependency is unclear for an MIT local tool** | Metering, plans and usage reporting still contact hosted infrastructure. | Not solved. Document degradation precisely and consider offline grace/exportable usage state. |
| 23 | **Dashboard can mislead about quota and expiry** | A failed plan read can render as unlimited and `expiresAt` is not shown. | Not solved. Show “quota unavailable” on failure and display plan expiry/renewal explicitly. |
| 24 | **Support/procurement assurance is thin** | There is no published refund policy, business identity or SLA. | Not solved. Publish a plain refund/support policy before paid acquisition, without promising what cannot be staffed. |

## Remaining decisions that cannot be made by code alone

1. Run one real purchase → capture → activation test. The four PayPal secrets are set and live order creation answers 200, but no real payment has been made yet.
2. Approve the store listing or signed installer and prove uninstall leaves no forced policy.
3. Choose the free evaluation shape: real Starter, a limited trial, or no trial; align the plan reader and the public offer.
4. Build the actual natural-language first task with model configuration and a downloadable result.
5. Publish one real case study with raw evidence, and publish failed runs as well as successful ones.

## Verification in this change

- `tests/site/conversion.test.ts` covers plan periods, real artifacts, npx onboarding, English routing and the pricing-origin geolocation permission.
- `tests/local/adoption-features.test.ts` covers `continueOnError`, OTP handoff, background opening and untrusted page content.
- `tests/billing/paypal.test.ts` covers POST capture and reading `custom_id`; `tests/billing/paypal-wiring.test.ts` covers owner verification and activation failure.
- Full `npm test` and `npm run check` are green, including 42 site tests and type-debt zero.
