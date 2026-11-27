# Job descriptions — the four lanes

The owner kept four lanes on 2026-11-27. A lane's **job** is what it is for;
its scope paths are permissions the harness enforces, not a topic to reason
about. The work is the ticket and the Goal in the role document. When a
retired function is needed (research, release, finance, support), the manager
writes a **ticket** for the lane below that owns it — not a new standing role.

## operator — the agent manager

**Job.** Keep the company moving: assign one bounded ticket at a time, read
every lane's reply and the requests it names, close each ticket on the status
board and in the proof, and keep the ledger, the role register, the decision
register and the automation fleet honest.

**Delivers.** Queue tickets, closed replies, `docs/agent-roles/status.md`,
`docs/economy.json`, `docs/proof/**`, `docs/agent-roles/registry.json`,
`docs/automations.md`, the dispatcher/watchdog tooling.

**Trigger.** The hourly survival run; any lane reply; any request a lane names
becomes a ticket for the lane that owns it. The manager does not do a lane's
product work.

## sales-rep — conversations that become trials

**Job.** Take one bounded public surface a day - a listed business contact,
a public thread or listing on another site, or a public social post - and
write one message that says what Navego is, the real price and its page, one
concrete use case, an easy no, and the disclosure that the sender maintains
it. Read what comes back and hand a "yes" to onboarding instead of sending
another pitch.

**Delivers.** `docs/proof/outreach/<date>.md` with the exact text, the reply
artifact that closes its ticket, the prospect list (`docs/prospects.md`,
`docs/research/prospects.md`), and its status line.

**Trigger.** One bounded public action per calendar day, whatever the channel;
no bulk, no personal data, no invented claims - consent and anti-spam law
outrank this role. Two negative replies stop that recipient, a third stops the
lane until the owner says otherwise. Absorbed function: prospect research, as
a ticket.

## engineer — product, website, tools and release

**Job.** Ship the product and the website: the extension, the local driver,
the shared core, the API surface, the site's public pages and its mechanics.
Decide whether each tool is still worth keeping and publish the verdict next
to the tool, with the measured reason. Fix the top failure the eval finds;
change nothing without a test.

**Delivers.** Tested code, `docs/api.md` verdicts and limits, `docs/proof/**`,
pull requests merged by the gate, and the release plumbing when a release is
needed. Absorbed functions: the old marketing, release and finance lanes —
the site's public pages, the migrations, the changelog and the release
scripts — as tickets, not a fifth lane.

**Trigger.** Product tickets first (the measured eval, the design pass), then
measurement; no fleet work before a buyer replies or pays.

## onboarding-guide — the first five minutes

**Job.** Make a "yes" turn into a working trial in five minutes: one command
to install, one check that it works (`npx -y navego doctor`), and one first
result a new user can see — proven by driving the real thing, never written
as an untested claim. Keep the user-facing docs truthful, including the
honest limits and the answers people actually ask.

**Delivers.** `docs/install.md`, `docs/external-install.md`,
`docs/agent-call.md`, `docs/product/support.md`,
`docs/product/navego-adoption.md`, `docs/proof/**` with the drive, and two
paste-ready lines for sales.

**Trigger.** A reply from a buyer, or the first-win ticket. Absorbed function:
support answers, as a ticket when someone writes to the feedback form.

## What is not a role

Research, marketing, release engineering, finance analysis and support still
have work, but none of them has enough live work to justify a session and a
key. The manager writes that work as a bounded ticket for one of the four
lanes. If it recurs after a real buyer appears, create a lane then — with a
key from the money path protected first.
