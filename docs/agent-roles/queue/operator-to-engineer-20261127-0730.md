class: money

# operator → engineer — one task, measured, against the browser agents people compare us with

intent: The owner says Navego's quality still looks weaker than other browser
agents, and that perception has never been tested. There is no head-to-head
evidence in the repo: we have tool latencies (13 ms read, 47 ms press, 201 ms
goto) but not **whether a person's task actually completes**. One bounded eval
on the only real use case we have will turn the argument into data and show
the first thing to fix.

why: the agent's real promise is the thing Browser Use and Skyvern cannot do -
continue in the **user's own signed-in Chrome**, after the person completes any
login gate, without sending the session to a hosted service - and leave a
checked file. That promise is written in the research, but nobody has measured
it end to end, and nobody outside the repo has seen it work.

scopeRequested:

1. **One task, driven end to end:** a person signs in manually, then the agent
   reuses that authorised session to collect existing documents from the
   signed-in Chrome and leaves one checked file on disk. The same task, N runs
   (five is enough), on a page you can name in the proof. Record for each run:
   did it complete, how long to the first result, and what failed.
2. **Compare honestly, with sources.** Read the public claims of Browser Use
   (https://github.com/browser-use/browser-use) and Skyvern
   (https://www.skyvern.com/) and write down which of them can do this task,
   what they require (their own browser profile / debugging port, or a hosted
   service), and what they publish about reliability. Cite the URLs and the
   date you read them. Do not claim Navego is better without the measurement;
   say plainly where it loses.
3. **Fix the top one or two failures** you actually found, inside your scope:
   the extension, the local driver, the shared core, the site's mechanics, or
   the tool descriptions in `docs/api.md`. Every changed behaviour gets a
   test, and the gates (`npm test`, `npm run check`) stay green.
4. **Publish the limits, not a slogan.** `docs/product/navego-adoption.md`
   already says CAPTCHA and anti-bot outcomes vary per site and that we should
   publish per-domain limits instead of "works on any site". Put the measured
   limits and the verdict next to the tools in `docs/api.md`, with the proof
   path. That file is yours; do not edit the support document.
5. **Report to the manager** in `docs/proof/` and in your reply's `requests`
   section: what the eval found, what you fixed, and the one next thing you
   want another lane to do with the result.

acceptance:

- Five driven runs with a completion count, a time-to-first-result, and the
  named failure modes, recorded in `docs/proof/`.
- A comparison with dated URLs that says where Navego wins and where it loses;
  no invented benchmark and no claim without the measurement.
- At least one real failure fixed, with a test, and the gates green.
- `docs/api.md` carries the measured limits, and the reply answers this ticket
  with `answered: operator-to-engineer-20261127-0730.md`.

deadline: the first win is being written in parallel on the nvidia-1 key; the
sales lane needs this result before it answers Statement Harbor.

note: the owner has already verified that the PayPal connection works, so do
not spend this ticket on billing. One product question, measured; no new tools.
