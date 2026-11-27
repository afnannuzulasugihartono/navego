# Prospects (Growth: Prospecting & outreach)

The dated research shortlist behind the `sales-rep` lane's `docs/prospects.md`
pipeline. A row is dated research evidence, not a promise of a customer and not
a record of outreach.

- Pipeline state on 2026-11-26: four published business addresses and one
  sales form prepared; no outreach sent by the researcher lane.
- The one public listing already in flight is the MCP registry listing pull
  request https://github.com/punkpeye/awesome-mcp-servers/pull/20598; it is
  with the maintainer, and its state is read from that pull request, not from
  memory.
- Under `docs/autonomy.md` rule 1, the `sales-rep` lane may send one bounded
  message per day to a public business contact. Two negative replies stop the
  lane for that recipient, and a third refusal of the same kind stops the lane
  for everyone until the owner says otherwise.

## First division: AI-agent operators

The first division is AI-agent operators: teams that build agents which must
act in a real browser or business system. The MCP reference-servers repository
shows that agents already reach tools and data through a standard local or
HTTP boundary, while the open Navego listing describes a local MCP server plus
an MV3 extension. The public Statement Harbor issue gives the concrete missing
case: a person signs in manually, the agent reuses that authorised session,
and only then collects existing documents without crossing MFA, CAPTCHA, or
account-change controls. Browser Use and Skyvern show the two strongest
browser-agent shapes and their limits: Browser Use can drive a local Chrome
but opens its own unauthenticated debugging port and manages its own browser
profile, while Skyvern can run as a managed cloud service or a self-hosted
deployment on AWS, GCP, or Azure and publishes an E2E Encrypted Vault. The gap
Navego fills in this division is therefore a local MCP server with 40 tools
over 36 browser primitives: an operator can call Navego's MCP server, continue
in the user's signed-in Chrome after the person completes any authentication
gate, and receive a checked local file without sending the browser session or
credentials to a hosted agent service.
This is a narrower first claim than serving regulated enterprises, and the
current published Navego plans do not state enterprise seat, SLA, or compliance
terms, so large-company buyers are not the first division until those terms
are true.

Sources checked on 2026-11-26:

- Navego's open MCP listing pull request:
  https://github.com/punkpeye/awesome-mcp-servers/pull/20598
- MCP reference servers and their local/HTTP transport boundary:
  https://github.com/modelcontextprotocol/servers
- Statement Harbor's manual-sign-in and document-collection boundary:
  https://github.com/DavidN0809/statement-harbor/issues/11
- Browser Use's browser-agent implementation and local-browser limits:
  https://github.com/browser-use/browser-use
- Skyvern's product page, self-hosted deployment, and E2E Encrypted Vault:
  https://www.skyvern.com/
- Navego's local driver, 40 MCP tools over 36 browser primitives, and artifact
  output: https://navego.pages.dev/docs
- Navego's repository tool surface and browser primitive protocol:
  https://github.com/afnannuzulasugihartono/navego

## Shortlist

Prices come from Navego's published Europe/US price band, checked on
2026-11-26: https://navego.pages.dev/harga. The Starter, Pro, Business, and
Enterprise plans do not renew automatically.

| Priority | Organisation | Public business contact | What they build or buy | One concrete Navego use case | Navego price that fits | Sources and consent state |
|---|---|---|---|---|---|---|
| 1 | **Agno Inc.** | `hello@agno.com` — published on the [Agno about page](https://www.agno.com/about) | An agent SDK, AgentOS runtime, and control plane for customer-facing and internal agents that run in the customer's cloud and connect over MCP. | An Agno agent delegates the final logged-in browser step to Navego's local MCP server, completes the task in the customer's own Chrome, and returns the local artefact while Agno keeps the run trace and approvals. | **Pro — $9 for one month**, 9,000 commands per day; enough for one MCP integration proof. | [Product](https://www.agno.com/), [control plane](https://www.agno.com/products/control-plane), and [published contact](https://www.agno.com/about), written and checked 2026-11-26. Public general business address; one message, no personal address. |
| 2 | **Skyvern (Ikonomos Inc.)** | `sales@skyvern.com` — published in the [Skyvern terms](https://www.skyvern.com/terms) | An AI browser-agent platform with a workflow builder, Python and TypeScript SDKs, MCP support, and a managed cloud or self-hosted deployment for portal work and document collection. | A Skyvern workflow sends a customer-owned portal's authenticated document step to Navego's local MCP server after the person signs in manually, while Skyvern keeps its workflow logic and document extraction and routing. | **Business — $17 for six months**, 17,000 commands per day and all features; enough for one portal-document pilot. | [Product](https://www.skyvern.com/), [current repository](https://github.com/Skyvern-AI/skyvern), and [published contact](https://www.skyvern.com/terms), written and checked 2026-11-26. Public business address; one message, no personal address. |
| 3 | **Browser Use, Inc.** | `sales@browser-use.com` — published on the [Browser Use enterprise page](https://browser-use.com/enterprise) | An open-source Python browser agent plus a hosted agent API, stealth browsers, enterprise browser infrastructure, and MCP integration. | A Browser Use task calls Navego's local MCP server when it must continue in a user-owned signed-in Chrome and return a checked local file, while Browser Use Cloud continues to handle hosted runs. | **Enterprise — $33 for one year**, unlimited commands and all features; use only as a published-price technical evaluation, not as a compliance promise. | [Repository](https://github.com/browser-use/browser-use) and [enterprise product and contact](https://browser-use.com/enterprise), written and checked 2026-11-26. Public business address; one message, no personal address. |
| 4 | **Browserbase, Inc.** | `sales@browserbase.com` — published in the [Browserbase billing documentation](https://docs.browserbase.com/account/billing/plan-management) | Browser infrastructure and managed browser agents for AI companies, including a cloud runtime for agent deployments, no on-prem deployment, agent identity, and session replay. | A Browserbase customer routes a task that must use the customer's own authenticated Chrome to Navego's local MCP server, while Browserbase continues to provide managed sessions for hosted browser work. | **Starter — $1 for one month**, 1,000 commands per day; enough for one local-browser integration proof. | [AI-agent product](https://www.browserbase.com/industry/ai), [enterprise deployment](https://www.browserbase.com/enterprise), and [published contact](https://docs.browserbase.com/account/billing/plan-management), written and checked 2026-11-26. Public business address; one message, no personal address. |
| 5 | **CrewAI Inc.** | [Meet with CrewAI sales form](https://crewai.com/meet-with-us) | An enterprise agent build and runtime platform with a no-code editor, tracing, [deployment](https://crewai.com/amp), and role-based access control for multi-agent work. | A CrewAI browser task delegates the authenticated final step to Navego's local MCP server, so the crew can act in the user's own Chrome while CrewAI keeps planning, tracing, and access control in its runtime. | **Pro — $9 for one month**, 9,000 commands per day; enough for one crew integration proof. | [Product](https://crewai.com/), [platform page with deployment](https://crewai.com/amp), and [sales contact](https://crewai.com/meet-with-us), written and checked 2026-11-26. Public business form; one message, no personal address. |

## Sales handoff

The `sales-rep` lane starts with priority 1, Agno. A send must name Navego, the
real price from https://navego.pages.dev/harga, the use case in that row, and
an easy no. Every send makes two records on the day it happens:

1. `docs/proof/outreach/<yyyy-mm-dd>.md` records the recipient, public source
   URL, time, exact message, and reply (or "no reply yet").
2. A handoff artifact in `docs/agent-roles/queue/` toward `marketer` records
   the sequence position, recipient, public source URL, time, outcome, reply
   (or "no reply yet"), and the path to the day's outreach proof.

For a form-only row such as CrewAI, one bounded message means one form
submission. The proof record names the form URL, submission time, first name,
last name, work email, job title, organisation, and message. Use only truthful
sender identity values; if the sender has no truthful values for a required
field, submit nothing and record that exact blocker.

## Dated additions — 2026-11-27

These are research rows only. No outreach was sent to either organisation on
this date; the 2026-11-27 allowance was used for Agno and the next public send
is Statement Harbor at 2026-11-28 00:00 WIB.

| Priority | Organisation | Public business surface | Need validated by their own words | One Navego use case | Consent state |
|---|---|---|---|---|---|
| 1 | **Steel (Nen Labs)** | Public enterprise contact form at https://steel.dev/enterprise ; public support address support@steel.dev in https://steel.dev/docs/support.md | Their homepage https://steel.dev/ says a task must stay signed in from one run to the next, with profiles, session context or stored credentials; the docs offer profiles and persistent auth in a cloud runtime. | An agent using Steel for hosted browser work routes the final step that must happen in the person's own signed-in Chrome to Navego's local MCP server; the file returns to the user's machine and the session never becomes a cloud profile. | Public contact form only; no personal address, no bulk, no prior refusal. Partnership/integration framing, not a claim of a customer. |
| 2 | **Browserless** | Published support address support@browserless.io on https://browserless.io/ ; MCP server docs at https://docs.browserless.io/mcp/browserless-mcp-server | Their public docs describe an MCP server with scrape, download, export and crawl over managed browsers, and AI integrations for agent frameworks. | A browserless MCP workflow hands an authenticated document-collection step to Navego when the document lives behind a person's own Chrome session instead of a hosted profile. | Public business address; no prior contact, no refusal. Treat as an integration partner, not a buyer claim. |

Both sit in the first division already chosen by the owner: teams that build agents which must act in a real browser or business system. Neither is a large regulated enterprise; the current plans do not promise seats, SLA or compliance terms.

Public listing check before posting: PR https://github.com/punkpeye/awesome-mcp-servers/pull/20598 is still Open with labels has-emoji, valid-name and has-glama. Nothing was posted to that PR on this date.

