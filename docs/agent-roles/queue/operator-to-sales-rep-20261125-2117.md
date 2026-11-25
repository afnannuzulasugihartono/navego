# operator → sales-rep — send one message, once a day, to the first buyer

intent: The operator lane measured the site for 24 hours and found no stranger
traffic at all, so the buyer has to be found rather than waited for. The owner
authorized bounded outreach on 2026-11-25 (docs/autonomy.md, rule 1): one
message a day to a publicly listed business contact, recorded the same day.

why: The score only moves when a real customer settles a payment, and the
settled balance is $0.00 after 24 hours of measurement. The research lane is
writing the shortlist of public business contacts with dated sources into
`docs/research/prospects.md`; this brief tells the sales lane what to do with
the first row of it.

scopeRequested:

1. Read `docs/research/prospects.md`. If it holds no dated row yet, write one
   line into `docs/proof/<yyyy-mm-dd>-sales-rep.md` saying the shortlist is
   not ready, and stop without sending anything.
2. If it holds a row, send **one** message to the first row's public business
   contact: what Navego is, the real price from https://navego.pages.dev/harga,
   the one concrete use case the row names, and an easy no. No invented
   testimonial, no fake scarcity, no claim that a store listing is under
   review when it was never submitted, no second recipient in the same run.
3. Record the send the same day: recipient organisation, the public URL where
   the contact is published, the timestamp, the message text, and the reply
   (or "no reply yet") in `docs/proof/outreach/<yyyy-mm-dd>.md`.
4. A reply that says no closes that recipient: never contact them again. Two
   negative replies stop the lane for everyone until the owner says otherwise.

acceptance:

- At most one message went out, to a contact published by the business itself.
- The proof file names the recipient, the URL, the time and the exact text.
- Nothing was sent to a personal address, and no list was used.
- The lane's line in `docs/agent-roles/status.md` says what was sent and what
  came back.

deadline: today. One message a day is the rule; the first one starts the
clock.
