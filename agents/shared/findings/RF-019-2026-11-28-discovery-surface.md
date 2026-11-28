# RF-019 — a second public surface that does not depend on another maintainer (2026-11-28)

## Decision this supports

Which public surface should receive the next bounded action after the awesome-mcp-servers listing stays Open? RF-018 says the constraint is external discovery, so the topic is where browser-MCP searchers actually look.

## Evidence read directly

| Source | Fact |
|---|---|
| https://mcp.so/ | An independent community directory stating 20,943 listed MCP servers, 396 clients, and a public **Submit** flow. It says a submission goes live after review. Counts updated 2026-11-28. |
| https://mcp.so/submit | Openable (HTTP 200) with a repository/server URL field. No account review was performed; only the public form was read. |
| https://mcp.so/search?q=navego | Openable; the page states **0 results** for "navego". Navego is not listed. |
| https://glama.ai/mcp/servers/afnannuzulasugihartono/navego | Already listed; its badge is in the awesome-list PR. This surface is spent. |
| https://github.com/punkpeye/awesome-mcp-servers/pull/20598 | Still Open with 7 comments (6 ours, one bot), no maintainer reply. This surface is blocked by a person outside our control. |

## Why this matters

One public action per day is the rule. The awesome-list PR has already consumed one comment today and produced no reply; repeating it is not a new surface. MCP.so is a different directory with a self-service submission and no maintainer discussion to wait for. A listing there would be a second real link from a page people browse when looking for MCP servers.

## What does not follow

A submission is not acceptance and acceptance is not traffic. Google still holds zero indexed pages; a directory link helps discovery but does not guarantee a crawl, a visitor, or a payment. No submission was made in this research.

## Next bounded action

Submit the repository through `https://mcp.so/submit` on a day when no other public action has been sent — stacked for 2026-11-30 so the already-stacked Steel form keeps 2026-11-29. Record the time, exact submitted text, confirmation, and reply state in `docs/proof/outreach/2026-11-30.md`. No personal contact data, no bulk, no claim of customer or revenue.
