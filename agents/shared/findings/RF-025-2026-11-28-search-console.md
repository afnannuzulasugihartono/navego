# RF-025 — can Google Search Console explain zero indexed pages? (2026-11-28)

## Question

The owner showed Google returning "did not match any documents" for `site:navego.pages.dev` and asked whether Search Console could help.

## Sources

| Source | What was taken |
|---|---|
| Google Search Console Help, Verify your site ownership — https://support.google.com/webmasters/answer/9008080?hl=en | Ownership verification proves to Google that a real owner controls the site. A **Domain property** requires DNS verification; that is not possible for `navego.pages.dev`, because Cloudflare owns `pages.dev`. A **URL-prefix property** such as `https://navego.pages.dev` can be verified by an HTML file at a specific root URL, an HTML `<meta>` tag in the homepage head, Google Analytics, or Google Tag Manager. The file or tag is unique to the owner's Google account and must be used exactly as given. Data starts collecting when the property is added, but takes a few days to accrue. |
| Google Search Central, How Search Works — https://developers.google.com/search/docs/fundamentals/how-search-works | Google finds most pages by following links from already-crawled pages; a sitemap helps discovery but does not guarantee crawling or indexing. |
| RF-004 in this repo | Our technical access already passes: 200 HTML, robots allows `/`, sitemap valid, no `noindex`, canonical fixed. The missing pieces are inbound links and answer-shaped content. |

## What Search Console can and cannot do

It **can** show whether a URL is on Google, why it is not (for example "Discovered – currently not indexed"), whether the sitemap was read, and whether there are manual actions or crawl errors. It lets the owner request indexing for a specific URL.

It **cannot** create an inbound link, guarantee crawl, guarantee index, or produce ranking. Requesting indexing usually fails while the underlying discovery or quality problem remains. So it is a diagnosis tool, not the missing backlink.

## Owner-only boundary

Creating the property and clicking **Verify** happens in the owner's Google account. The verification token is unique to that account; the agent must not invent it. Once the owner pastes the exact file name and content (or meta tag), the agent can add it to `site/public/` or the homepage head, deploy through the normal release rules, and confirm the URL is publicly readable. The owner then clicks Verify.

## Recommended path

1. Add a **URL prefix** property `https://navego.pages.dev` — not a Domain property.
2. Choose HTML file upload or HTML tag; copy the exact token to the operator.
3. Agent adds the file/tag, ships a PR, deploys, reads back the public URL.
4. Owner clicks Verify, then submits `https://navego.pages.dev/sitemap.xml` and uses URL Inspection on `/` and `/panduan-mcp-chrome-login`.
5. If the verdict is "Discovered – currently not indexed", continue with inbound links (listing PR, mcp.so), not with more technical tweaks.

## Money

Settled external revenue remains $0.00, 0 orders. Search Console does not create a buyer.
