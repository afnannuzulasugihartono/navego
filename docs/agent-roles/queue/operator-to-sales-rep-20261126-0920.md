class: money

# operator → sales-rep — send one message, once a day, to the first buyer

intent: The operator lane measured the site for 24 hours and found no stranger
traffic at all, so the buyer has to be found rather than waited for. The owner
authorized bounded outreach on 2026-11-25 (docs/autonomy.md, rule 1): one
message a day to a publicly listed business contact, recorded the same day.

why: The score only moves when a real customer settles a payment, and the
settled balance is $0.00 after 24 hours of measurement. The research lane
delivered five dated rows into `docs/prospects.md` (pull request
#460), and this ticket carries the first send: a public issue on a public
repository where the issue author asked for exactly the boundary Navego covers.
Nothing here is a cold email and nobody's personal data is used.

Rules of precedence for this lane: when the owner's rule and a ticket text
disagree, the owner's rule wins (`docs/autonomy.md` is the owner's decision,
`docs/decisions.json` -> `docs-autonomy-01`). A message that leaves out what
the owner's rule requires is a message this lane does not send; fix the text
first, then send.

scopeRequested:

1. Send **one** message, using the prepared text below, to the issue author at
   `https://github.com/DavidN0809/statement-harbor/issues/11`. It is a public
   issue in a public repository, so the reply is a public conversation with the
   person who opened it, not an unsolicited message.
2. The prepared text is exactly this, and the disclosure stays in it. It states
   what Navego is, offers the real price with the pricing page, names one
   concrete use case, and closes with an easy no, which is what the owner's
   rule asks for:

   > Your issue's manual-sign-in -> persistent-session -> collect-existing-documents boundary is the part I would test with Navego. Navego is an MCP server plus browser extension that drives the user's own signed-in Chrome locally; login, OTP, and captcha can be handed back to the person, and `browser_download_file` waits for a file to land and stop growing rather than treating a click as success. It does not automate MFA or bypass provider controls, so your host allowlists, safe-control rules, PDF validation, and Paperless queue can stay in PaperPull. If it helps, I can pilot one provider against the acceptance criteria in this issue; the plans and their prices are on https://navego.pages.dev/harga, starting at $1 for one month. If it is not useful, no reply needed. Disclosure: I maintain Navego.

3. Record the send the same day in `docs/proof/outreach/2026-11-26.md`: the
   issue URL, the timestamp, the exact text, and the reply (or "no reply yet").
4. A reply that says no closes that recipient: never contact them again. Two
   negative replies stop the lane for everyone until the owner says otherwise.
5. If the issue is closed, locked, or the author already answered the same
   question, send nothing and write one line in the proof file saying why.

acceptance:

- At most one message went out, to a public conversation on a public issue.
- The proof file names the issue URL, the time and the exact text.
- Nothing was sent to a personal address, and no list was used.
- The lane's line in `docs/agent-roles/status.md` says what was sent and what
  came back.

deadline: today. One message a day is the rule; the first one starts the
clock.
