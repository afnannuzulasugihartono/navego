class: money

# operator → onboarding-guide — one command, one first win, so a reply can become a trial

intent: We sent one message to Agno Inc. on 2026-11-27 00:00 Asia/Jakarta and
the statement-harbor issue is still unanswered. When either of them answers,
the reply has to become a **trial within minutes**, and today it cannot: a
buyer would have to read the repository to find out how to try the thing. Write
the first win down as one command and one result, in the lane that owns the
first-run documents, so the sales lane can paste it into the next reply and a
stranger can act on it the same day.

why: the company has one open conversation and no paid trial, and every hour
without a customer costs a point. The product already has the pieces - the
landing page carries the install command, `npx -y navego doctor` checks the
installation, and the MCP server exposes 40 tools over 36 browser primitives -
but no document says "run this, then this is what you get". A reply without a
next step is a reply that dies.

scopeRequested:

1. **One command and one first win** in `docs/install.md` (and the same lines
   in `docs/external-install.md` and `docs/agent-call.md` where they belong),
   written for a person who has never seen Navego:
   - the install command exactly as the landing page shows it (one line, no
     paraphrase, with the force-install cost and the undo path in the same
     place);
   - `npx -y navego doctor` as the check that says "it works here";
   - **the first win**: one concrete thing a new user can do in one step and
     see a result - for example one MCP tool call that drives the signed-in
     Chrome and leaves a checked file on disk - with the exact command, the
     expected output, and where the result lands.
2. **Prove it against the real artifact.** The lane drives the real thing: run
   the doctor, run the first win, and record what actually happened in
   `docs/proof/`. A first win that was never run is a claim, and the lane that
   writes it is the one that has to run it.
3. **Leave the reply-ready shape.** End with the two lines a stranger would
   need to try it (the install command and the first win), so the sales lane
   can paste them without rewriting anything. Write the lines in the proof and
   point at them from the documents.
4. **Refresh your line** in `docs/agent-roles/status.md` with what a buyer can
   now do, and answer this ticket with a reply artifact named
   `onboarding-guide-reply-<yyyymmdd-HHMM>.md` whose text carries the line
   `answered: operator-to-onboarding-guide-20261127-0230.md`.

acceptance:

- A stranger can go from nothing to a first result with the commands in
  `docs/install.md`, and the lane's own drive is recorded in `docs/proof/`.
- The two reply-ready lines exist and are the same lines the documents show.
- The reply artifact answers this ticket and the status line says what a buyer
  can now do.

deadline: the next reply may arrive any day, and the next outbound message is
allowed from 2026-11-28 00:00 Asia/Jakarta, so this is ready before then.

note: this ticket claims no revenue. It removes the friction between a reply
and a trial; the score moves only when a `paypal-live` settlement is read.
