# operator → researcher — the first division, read from named public pages

class: money

intent: The operator lane measured the site for 24 hours and found no stranger
traffic at all, so the buyer has to be found rather than waited for. The
previous attempt at this ticket produced nothing, because the lane cannot use
the web search tool in this environment and the brief asked it to research
without saying where to read.

why: The score only moves when a real customer settles a payment, and the
settled balance is $0.00 after 24 hours of measurement. The owner's autonomy
rules (docs/autonomy.md, rule 1) allow one bounded outreach message a day to a
publicly listed business contact; this lane owns the picture that decides
which contact that is, and the `sales-rep` lane sends it.

scopeRequested:

1. Pick the first division and say why in one paragraph: the ai-agent
   operators (teams that ship agents and need a real browser session on the
   user's own machine) or the large-company buyers (private-data browser
   access, compliance, an audit trail). One division, one paragraph, with the
   sources that decided it.
2. Read named public pages **by URL** — the search tool answers nothing here,
   so the reading list is given, and every row must carry a URL that opens:
   - `https://github.com/punkpeye/awesome-mcp-servers/pull/20598` — the MCP
     listing already in flight, and the maintainers behind it.
   - `https://github.com/modelcontextprotocol/servers` — the public MCP server
     list, and what the tools in it are used for.
   - `https://github.com/DavidN0809/statement-harbor/issues/11` — a public
     issue that asks for the sign-in boundary Navego covers.
   - `https://github.com/browser-use/browser-use` and
     `https://github.com/mediar-ai/skyvern` — two agent projects that drive a
     browser, for the shape of their own limits.
3. Write five shortlist rows into `docs/prospects.md`, which is the
   pipeline the `sales-rep` lane works from. Each row carries: the
   organisation, the public URL where the contact is published, what they build
   or buy, the one concrete Navego use case that fits them, the price that
   fits that use case, and the date the row was written.
4. Keep the rows to public business contacts: no personal address, no bought
   list, no bulk.

acceptance:

- Every row carries a source URL that opens and a date; a row without a date
  and a URL is not a row.
- The use case is concrete enough that a stranger would understand it in one
  sentence, and it fits a real price on https://navego.pages.dev/harga.
- The division paragraph names the gap Navego fills, not a market-size claim.
- The lane's line in `docs/agent-roles/status.md` says what the map decided.

deadline: the `sales-rep` lane sends one message a day; every row that lands
here becomes a send the next day.
