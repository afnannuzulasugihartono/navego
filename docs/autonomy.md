# Autonomy rules (the owner's decisions, 2026-11-25)

The owner answered four questions on 2026-11-25 so an agent can work the
repository without a human in the loop. These rules bind every role and every
automation. The decision register carries each one with its source
(`docs/decisions.json` -> `docs-autonomy-01` … `docs-autonomy-04`), and the
hourly `operator` run reads this file before it acts.

## 1. Bounded outreach (Sales lane)

The `sales-rep` role may send one message per day, on its own, under these
limits:

- The recipient is a business contact listed publicly by that business
  (company site, public listing, public repository). No scraped personal
  addresses, no bought lists, no bulk.
- The message states what Navego is, offers the real price on
  https://navego.pages.dev/harga, names one concrete use case, and closes with
  an easy no.
- No invented testimonial, no fake scarcity, no claim that a store listing is
  under review when it was never submitted.
- Two negative replies stop the lane for that recipient, and a third refusal
  of the same kind stops the lane for everyone until the owner says otherwise.
- Every send is recorded the same day in `docs/proof/outreach/<date>.md`: who,
  when, which artifact, which reply.
- Consent and anti-spam law still outrank this rule; a contact who asked not
  to be contacted is never contacted again.

## 2. Merge by gate (Engineering lanes)

A PR merges on its own when three things hold, checked by the gate, not by a
person's mood:

- CI is green on the exact head.
- The reviewer agent reports no finding on the diff (a reviewer agent that
  cannot run counts as a finding, not as a pass).
- No owner-only path moved: `gates.lock`, `tests/helpers/boundary-locks.ts`,
  `.github/CODEOWNERS`, and the workflow files under `.github/workflows/`.

When those hold, the merge, the tag, the release, the signed CRX, the npm
publish, the edge function deploy and the site deploy happen without waiting
for a human. A failing gate, a reviewer finding, or an owner-only path stops
the lane and writes the reason into `docs/proof/` for the next run.

## 3. One production operation at a time (queue and lock)

Migrations, edge function deploys and CRX signing stay one at a time, from the
main checkout, as `docs/concurrent-agents.md` requires. The difference now is
that the queue is automatic: an operation claims the production lock, runs,
writes its evidence to `docs/proof/`, and releases the lock. A waiting lane
polls the lock instead of asking a human which one goes first.

## 4. The support channel is the site feedback form (Customer Support lane)

The feedback form on the live site (`hosted/functions/feedback`) is the
support inbox. The `support-agent` lane reads it, answers the person, and
records the answer's fact in `docs/product/support.md` with the decision id
that backs it. GitHub issues stay a public record, not the inbox.

## What still needs a person

These are the edges no agent may cross, stated so nobody waits for a request
that will not come:

- A new payment method, an account review, a bank or PayPal hold: the owner
  acts, and the agent names the exact action needed.
- Tax, legal and registration filings.
- A chargeback or a refund dispute.
- A new secret: none is missing today (`gh secret list` on 2026-11-25 shows
  `CRX_SIGNING_KEY`, `CRX_SIGNING_PUBLIC_KEY`, `NPM_TOKEN`,
  `SUPABASE_ACCESS_TOKEN`, `CF_TOKEN`, `CF_ACCOUNT_ID`, `SONAR_TOKEN`).
- A change to price, consent or refund policy: that is a decision, and the
  owner makes it once, in the register.

## The build order from here

1. The hourly `operator` run reads this file, reads the settlement and the
   funnel, scores the hour, and starts each run inside its role. Its tool
   calls are authorized when the automation is created, so the settlement read
   names the Supabase tool in the form the runtime accepts.
2. The acquisition loop: `researcher` maps a division with dated sources,
   `sales-rep` prepares and sends within the bounds above, the checkout takes
   the money, `finance-analyst` reads the settlement and writes the ledger.
3. The merge-by-gate rule becomes a command the operator run may use.
4. The production lock becomes a file an operator claims, so two runs cannot
   touch production at once.
5. The support lane drains the feedback form and answers people.
