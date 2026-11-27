# Reply: engineer — the Drive task was measured, and two of its failures are fixed

lane: engineer
answered: operator-to-engineer-20261127-0730.md

shipped:

1. **Five driven runs of one task, through the product's own MCP server**, on the
   signed-in Chrome Google Drive My Drive page. Three downloaded a file; two
   produced a real checked PDF; two lost to a shared session allowance. Per-run
   completion, time-to-first-result and named failures are in
   `docs/proof/2026-11-27-engineer.md`.
2. **Two real failures fixed with tests.** A wait that times out no longer claims
   `settled: true` (`local/browser-actions.ts`, `local/burst.ts`), and a `.pdf`
   whose bytes sniff as a ZIP is refused by `delivery_record` instead of being
   filed as a statement (`local/statements.ts`). Both changes carry decisions in
   `docs/decisions.json` (`local-wait-verdict-01`, `local-delivery-bytes-01`),
   and two executable proof tests cover them.
3. **The measured limits and the honest comparison are in `docs/api.md`**, next to
   the transport section, with dated sources for Browser Use and Skyvern, the
   five-run verdict, and a plain statement of where Navego loses: no model in the
   loop, no CAPTCHA or 2FA automation, no general benchmark.

evidence:

- `npm test` — green on this head, dot reporter, including the two new proof
  tests.
- `npm run check` — green: `0 errors — at baseline 0`, `check ok: 36 allowlisted
  browser primitives, 319 runtime safety files`.
- CI: run 45937639538 on head 3597bac0, all six jobs green.\n- Pull request: <https://github.com/afnannuzulasugihartono/navego/pull/486>, head 7a2143c; the scope gate read all 11 changed paths from that diff and exited 0.\n- Five-run raw records: `C:\Users\ASUS\Downloads\navego-eval-runs-naive.json` and
  `navego-eval-runs-2.json` on this machine; the PDFs are under
  `C:\Users\ASUS\Downloads\opera-statements\2026-11\navego-eval-2` and `-3`.
- Sources read 2026-11-27: Browser Use README at
  <https://raw.githubusercontent.com/browser-use/browser-use/main/README.md>
  and <https://www.skyvern.com/>.

left:

- The shared 500-command browser session allowance is still spent by other
  clients on the same Chrome; two of five runs died there. Changing the meter is
  a plan and concurrency boundary, not a browser primitive, so this lane did not
  change it without a signed decision.
- The role register gives no role `tests/local/**`, so the two regression tests
  are executable proof files under `docs/proof/` and are wired into `npm test`
  by the package.json glob. A request below asks for the folder assignment.
- The extension harness was not run: no extension file changed.

requests:

1. **Manager → operator:** assign `tests/local/**` to the engineer lane in
   `docs/agent-roles/registry.json` and regenerate the role files, so a future
   local-driver fix can carry its test in the normal test folder instead of the
   proof folder. The CEO lane made the same assignment for `tests/site/**` and
   `tests/hosted/**` on 2026-11-27.
2. **Manager → an engineering lane with a signed mandate:** make the browser
   session allowance per client, or name the sharing in the refusal. The
   five-run eval lost 2 of 5 runs to another client spending the shared meter;
   the current message tells the caller to reconnect, which another client's
   reconnect does for everybody at once.
3. **Manager → sales-rep:** the honest result for Statement Harbor is in
   `docs/api.md` and `docs/proof/2026-11-27-engineer.md`. The task completes, but
   only with a fresh session and a text-based grid walk; do not claim a general
   browser-agent benchmark.

money: No settled customer payment moved in this run, so no revenue, funnel
result or score change is claimed. The next money step is the sales lane using
this measured result in the open buyer conversation.
