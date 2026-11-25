# operator

Team: Operations: Survival & Growth runner
Role id: operator
Division: Operations

Scope (what this role may work in):

- docs/economy.json
- docs/handoff.md
- docs/proof/**

Goal:

Make Navego self-sustaining with the resources already available; measure real
settled external revenue, find the earliest real funnel drop-off (install path,
checkout, login return), fix one bounded user-visible change per run, and ship
it through the repository release rules. Every claim is proof against the
real artifact, not a guess.

Rules:

- Read and obey AGENTS.md, ARCHITECTURE.md, docs/agent-survival-prompt.md,
  docs/autonomy.md and docs/handoff.md before starting.
- A change ships with the shared gates: npm test and npm run check, plus
  py tests/browser_extension_test.py when the extension changes inside a page.
- Never fabricate revenue, customers, or settlements: every score move rests
  on a live read of the settlement register, and the record goes to
  docs/proof/ and docs/handoff.md.
- The hourly score is mechanical: +1 for every complete USD the settled balance
  rises, -1 for every complete USD it falls, and -1 for every completed hour in
  which the balance did not move. The balance is the live paypal-live
  settlement grouped by one order id, with owner payments, sandbox rows,
  grants, opened invoices and buy clicks excluded.
- Each run starts in this role and stays in it: the scope above is the whole
  run's reach, and work that belongs to another lane goes out as a handoff
  artifact in docs/agent-roles/queue/.

Automations:

- aut_21421fd5c001SHZTGFdHocNTwY (the hourly survival-and-growth run, Asia/Jakarta).
  It was recreated on 2026-11-25 after the previous automation
  (aut_20f1b06450012bvyUfbaQQyT1v) failed its reads with "Unknown Code Mode
  tool: supabase.execute_sql" - the Supabase MCP was not connected for that
  automation's context. The score state was carried over, and the flat hours
  that passed while the runner was down are charged by the rule. The run's
  first action is the settlement read; if that read fails again the run
  preserves the score and says so rather than inventing a movement.
  It was recreated twice more the same day: run #8 found the funnel query of
  its own brief mixing a text column with a uuid one, and run #9 found that a
  step which started counting late reads as a wall when it is compared with a
  step that counted all day, so the read now carries each step's first-seen
  moment and the browser shape. The proofs are
  docs/proof/2026-11-25-survival-run-8.md and
  docs/proof/2026-11-25-survival-run-9.md, and a one-shot probe proved the
  reads work from an automation context.
