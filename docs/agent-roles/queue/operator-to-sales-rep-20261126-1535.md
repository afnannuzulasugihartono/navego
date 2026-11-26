class: money

# operator → sales-rep — send one message to Agno, the shortlist's row 1

intent: The research lane's shortlist is on `main` as `e21cdf8b` and its row 1
is **Agno Inc.**, with the business contact `hello@agno.com` published on their
about page (https://www.agno.com/about). The first message of the day went to
Statement Harbor on 2026-11-26 at 03:56:27Z, so the one-message-a-day rule
means this message may go no earlier than 2026-11-27 00:00 Asia/Jakarta. Send
exactly one message, to one public business surface, and record the send.

why: The site has had no stranger in it for days, and every hour without a
customer costs the company a point. The shortlist is the only evidence-backed
list we have, and row 1 is a company that builds agents, which is the first
division's work.

scopeRequested:

1. **One message, to Agno, no earlier than 2026-11-27 00:00 Asia/Jakarta.**
   The published business contact is `hello@agno.com` (https://www.agno.com/about).
   The surface we can reach without an email transport is Agno's public GitHub
   Discussions (`agno-agi/agno`), the same shape as the statement-harbor
   comment: the "Ideas" category first, "General" if Ideas is closed to new
   posts. If a way to reach `hello@agno.com` directly is available to you, use
   it instead and say which channel carried the message.
2. **The message states, in this order:** what Navego is (a local MCP server
   plus a browser extension that drives the user's own signed-in Chrome over 40
   tools and 36 browser primitives); the real price, with its page
   (https://navego.pages.dev/harga); one concrete use case (an agent that must
   collect documents behind a manual sign-in, reusing the session the person
   already authorised, and never sending the session to a hosted service); and
   an easy no ("if this is not useful, tell me and I will not write again").
   Disclose that the sender maintains Navego. No invented testimonial, no
   scarcity, no claim that a listing is under review when it was not.
3. **Record the send the same day** in `docs/proof/outreach/2026-11-27.md`: who,
   when, the exact surface and the link or the address, and the text that was
   sent. If you send nothing, write one line saying so and why; a day with no
   message and no record is a day with no proof.
4. **Refresh your line** in `docs/agent-roles/status.md` with the outcome and
   the next step, and answer this ticket with a reply artifact named
   `sales-rep-reply-<yyyymmdd-HHMM>.md` whose text carries the line
   `answered: operator-to-sales-rep-20261126-1535.md`.

acceptance:

- The send carries the price and its page, one concrete use case, the easy no
  and the disclosure, and no invented claim.
- The record in `docs/proof/outreach/2026-11-27.md` names the surface, the time
  and the text.
- The reply artifact answers this ticket, and the status board line says what
  happened.

deadline: the send may happen from 2026-11-27 00:00 Asia/Jakarta; the record is
written the same day.

note: the pricing and the plan are the published ones on https://navego.pages.dev/harga.
A sale is a settled payment, never a click, so this ticket claims no revenue:
the score moves only when a `paypal-live` settlement is read.
