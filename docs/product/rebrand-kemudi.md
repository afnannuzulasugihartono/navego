# @last-edited: 2026-11-15 UTC+7.
# @title: rebrand-kemudi - the product is Kemudi; the research, the decision, and the cutover.
# @state: the decision is made and shipped in the tree; the owner's acts are named at the end.
# @dependencies: docs/product/monetization.md, docs/handoff.md.

# Kemudi - the name this project was always steering toward

Opera Agent was the working title of a browser agent: drive the browser the person already uses, from the AI they already pay for, without moving the session anywhere else. It was accurate. It was not a company. It told no one the browser term, the browser, the mission; it described. A company's name is a word the market says back to it, and Opera Agent's second word was also the category word everyone else uses, while its first word belongs to somebody else's trademark family (Opera Software).

The mandate: redesign the name so it is native to the agent, keep what must stay, research the internet for who got this right and who did not, and carry it through product, website and marketing.

## What the internet says

**Successes to copy.**

- **Cursor** (Anysphere Inc., trade name Cursor) stole the noun every developer already had in their hand and refused to decorate it. ~$3B ARR by May 2026, $29.3B valuation at the SpaceX deal — the fastest-growing SaaS ever, run by ~300 people. The name is not a description; it is the thing itself. Source: https://en.wikipedia.org/wiki/Cursor_(company)
- **Manus** (Butterfly Effect) is the closest living relative to this product: a browser-extension shop (Monica) that rebranded its agent under a word nobody owned, then let the product do the talking. Latin for "hand", from MIT's motto *mens et manus* — mind and hand. Launch week: the demo got a million views in twenty hours and invitation codes traded for $7,000–13,800. ~$125M ARR by Dec 2025; Meta's offer to buy it was blocked by China's regulator, and the company is now independent again. Browser-extension DNA + a short ownable word + public scarcity = the whole story. Source: https://en.wikipedia.org/wiki/Manus_(AI_agent)
- **GoTo** (PT GoTo Gojek Tokopedia) is the Indonesian proof that a native word can carry a listed company: formed from "Go**jek**"+"Toko**pedia**" and, deliberately, from *gotong royong* — Indonesian for working together. It lists on the IDX (GOTO), ~US$4.2B market cap. Nobody says "GoJekTokopedia". They say GoTo. A two-syllable native word, a cultural reason for it, and an abbreviation baked in — that is the local playbook. Source: https://en.wikipedia.org/wiki/GoTo_(Indonesian_company)
- The quiet pattern underneath all three: **short, ownable, one meaning; the category word is an enemy.** Cursor, Manus, GoTo, Midjourney, Lovable, Replit — none of them explain; all of them own.

**Failures not to repeat.**

- **Humane Inc.** (hu.ma.ne) raised ~$230M on parts of Apple's glow of approval and a name that was a mood, not a thing. No head of marketing ever hired; 10,000 units shipped against a 100,000 target; more returns than purchases by August 2024; sold to HP for $116M and bricked. A virtue word with no object makes the market shrug. Source: https://en.wikipedia.org/wiki/Humane_Inc.
- **Inflection AI** raised $1.3B at $4B on "personal intelligence" (product: Pi, named for *personal intelligence* — the category again). Two years later the founders went to Microsoft, which acqui-hired nearly the whole company and paid $650M to license the tech. Vague + wordy + no native object = a deal, not a destiny. Source: https://en.wikipedia.org/wiki/Inflection_AI
- The shared diagnosis: both shipped a category noun wearing a costume. The name answered "what kind of AI" instead of "which thing". This product's category noun is *agent*; this product's thing is the browser's helm.

## Candidates considered (2026-11-15, this machine)

| Candidate | Meaning | Collision check | Verdict |
|---|---|---|---|
| **Kemudi** | wheel / helm; *mengemudi* = to drive | npm 404, PyPI 404; GitHub: 30 repos, none a software product at scale; kemudi.ai/.io do not resolve; kemudi.com parked; no company of note | **the name** |
| Gerak | movement; *bergerak* = to move | npm/PyPI free, but GitHub: 1,004 repos; gerak.com/.ai/.id all live | noisy; motion ≠ agency |
| Sakti | magical / powerful | common SEA suffix; *sakit* = sick (one vowel off) | failure by rhyme |
| Karya | work / creation | heavily used in local product names; generic | common noun, no ownership |
| Juru (…) | operator of … | `juru kemudi` = helmsman, two words, perfect sense as a compound | loses Cursor's one-hand test |

Kemudi wins the Cursor test — the word is already in the hand: *kemudikan browser Anda* is already the Indonesian sentence this product exists to make true.

## The decision

- **Product name: Kemudi.** "Kemudi" (kuh-MOO-dee) — Indonesian for the helm of a vessel. Tagline (ID): **AI yang mengemudikan browser Anda.** (EN): **The AI that drives your browser.**
- **Company line:** the legal entity is the owner's act to file; suggested PT name **PT Kemudi Anak Bangsa** (the national pattern, same honesty as gotong royong in GoTo) or keep any existing entity and rebrand the trade name only. The repo, store listing, package and site all carry Kemudi from here.
- **Mark:** unchanged. The cursor-in-O (filled disc, evenodd cursor knocked out, pointing NE, #c3c4ff on #232344) is a silhouette without letters; it was accepted for exactly this property. Rewriting a mark the owner just adopted for its name independence would be brand theatre, not rebrand.
- **Why not English:** a native word is the differentiator, not the liability. Global precedent above (all three cases); local precedent (GoTo). The market being entered buys in rupiah via Midtrans.

## What moved, and what deliberately did not

**Moved (the face):** extension manifest name + action title; every popup/page brand row; popup.title/update.title; the web shim names on first run; the npm package `opera-agent-mcp` → **`kemudi`** (the legacy name keeps a working alias: `bin/kemudi.js` is also `opera-agent-mcp`, so every installed machine and script keeps working); root and local package names; the uninstall path removes both names (one spawn, both specs); the store-manifest; the landing site — 23 surfaces, og:site_name, wordmark, terminal examples (`npm i -g kemudi`, `npx -y kemudi local`); the docs; the examples; the gateway's public OpenAPI title; `check.mjs`'s manifest-name pin (re-pinned); `gates.lock` (4 pins re-pinned with the commit); `boundary-locks.mjs` (manifest.json + background.ts re-pinned with an explanatory WHY); the owner-visible action in `browser.ping` (`product: "Kemudi"`).

**Not moved (the bones), each with its reason:**
- the extension key and extension ID (`ofgemipoobcnbjkfanmofjbdonjapmgl`) — the signing identity updates ship against; moving it strands every paired browser.
- Supabase function names (`opera-agent-update`, `opera-agent-bridge`, `opera-agent-billing`, …), artifact URLs and filenames (`opera-agent.zip`, `opera-agent.crx`), the update endpoint path — every paired install speaks these; a coordinated redeploy would be a repo rename with no functional gain.
- `.opera-agent/` device config and `%LOCALAPPDATA%\OperaAgent\` — installed state; the uninstall command removes the folder and would strand pairing files on reinstall.
- wire identifiers: `x-opera-provider` default `opera-agent-mcp`, the OAuth account dir, the `OPERA_*` env vars, `X-Opera-Agent-Token` — machines, not humans.
- the repo URL and the `opera-agent.pages.dev` domain — remote redirects and Cloudflare make both lossless to rename later; they are named as cutover steps below, not rushed in this change.
- every historical page: `docs/releases/*`, `docs/superpowers/*`, `docs/handoff.md`'s dated bullets, SQL migrations, `tests/fixtures/*` — receipts of what shipped, not things to re-sign.
- fixtures are evidence; the SERP capture that literally shows "Opera Agent" in a Bing result is a measurement of the past, not a lie about the present.

## The one load-bearing line

`extension/lib/self-update.ts` verifies the downloaded build's `manifest.name` before writing it over the installed folder. The builds installed before the rebrand check for `'Opera Agent'` — immutable on those machines. Had this flip shipped without the both-names acceptance, every folder-apply would refuse the rebranded zip forever. The check now accepts **both** spellings, with the reasoning at the line. The browser CRX update path never read this name; auto-update into Kemudi is unaffected.

## The cutover the owner finishes

1. Merge the PR (gates green) — the tree then reads Kemudi everywhere.
2. When 1.6.60 publishes (next bump, same ritual): `npm deprecate opera-agent-mcp@'<1.6.60' "renamed to kemudi — npm i -g kemudi"`.
3. `kemudi.pages.dev` — rename (or create) the Pages project and point the same deploy at it; buy the domain (`kemudi.id` currently 301s to `www.kemudi.id`, probe it at purchase; `kemudi.com` is parked; `kemudi.ai`/`.io` do not resolve today). Keep the old domain 301'ing forever; Deals pages-internal links are relative already.
4. Supabase dashboard → Authentication → Sign In / Up → the OAuth client's display name "Opera Agent" → "Kemudi" (it is what every consent screen shows). One field; no protocol moves.
5. Store listing → Kemudi (store-manifest already says so; the listing text lives in the Store console).
6. Rename the repository (Settings → General) — GitHub redirects every old link and workflow reference travels with it; update the repo description, topics, and the social cards.
7. Midtrans: the statement descriptor on the paired storefront — customers should read KEMUDI on their bank line, not the old title. Ties into the plans/tiers rail already on this machine.
8. Trademark clearance in ID and US before paid acquisition; nothing legal was verified here — registry-level only (npm/PyPI/GitHub/DNS).
9. Social handles and the press-kit mark (same evenodd geometry) as the channels open.

## What this cost

95 files re-worded for the brand, 0 wires cut. The next release carries it. A stranger in December 2026 downloads **Kemudi** and never learns its first name — which is the entire point.
