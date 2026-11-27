# Reply: engineer — the fresh-machine doctor now names sign-in and pairing

lane: engineer
answered: operator-to-engineer-20261127-1105.md

shipped:

1. **The doctor no longer blames a current extension for missing setup.**
   `local/doctor.ts` reads the cloud-login and device-file state it already had; a
   meter refusal on a machine without either now says `sign in with \`navego auth\`,
   then pair the browser`. A signed-in, paired machine still gets the existing
   stale-extension advice. The rule is recorded as
   `docs/decisions.json -> local-doctor-verdict-01`.
2. **Both verdict branches have an executable regression test.**
   `docs/proof/2026-11-27-doctor-verdict.test.ts` drove the unauthenticated/unpaired
   and authenticated/paired branches. It failed before the fix because the fresh
   machine was told to update the extension; it passes now and keeps the stale advice
   for the genuinely stale branch. It lives under `docs/proof/` because this role
   still has no ownership of `tests/local/**`.
3. **The landing page now states the condition it can prove.**
   `site/app/routes/index.tsx` says that after signing in and pairing, doctor reports
   the plan and allowance, while a fresh machine is degraded until then. The install
   command and the five-run proof stay. `tests/site/hero-cta.test.ts` pins the new
   wording and refuses the old unconditional `ready` claim.

evidence:

- The changed package was packed and installed into an empty directory with an empty
  login/device state. `npx -y navego doctor` returned exit code 1 and the new verdict
  `degraded: sign in with \`navego auth\`, then pair the browser`; the full output is
  in `docs/proof/2026-11-27-engineer.md`.
- `npm test` - green (dot reporter).
- `npm run check` - green: `type-debt: 0 errors - at baseline 0`, `check ok: 36
  allowlisted browser primitives, 319 runtime safety files`.
- Site typecheck and build green (`react-router build`, 22 routes flattened).
- No extension file changed, so `py tests/browser_extension_test.py` was not run. No
  migration, edge deploy or CRX signing ran.

left:

- The pull request, exact-head CI, merge, site deploy and the deployed-page read at
  390 px and 1440 px are recorded in the proof after those operations complete.
- The npm registry still serves the current release, whose doctor has the old
  verdict. The changed package is proved locally; the next release must publish it
  before a registry-only `npx -y navego doctor` run can show the same line.
- Reviewer gap: this session is the only worker on the key and a child session is
  denied, so no reviewer agent could run. The pull request keeps REVIEW_REQUIRED and
  the gap is written in the proof under the owner's 2026-11-26 answer.

requests:

1. **Manager → release-engineer:** after this fix merges, bump and publish the next
   npm version so `npx -y navego doctor` from the registry carries the auth-and-pair
   verdict; the registry's current release still carries the old stale-extension
   advice.
2. **Manager → operator:** assign `tests/local/**` to the engineer lane in
   `docs/agent-roles/registry.json` and regenerate the role files, so this doctor
   regression can live in the canonical test folder instead of `docs/proof/`.

money: No settled customer payment moved in this run, so no revenue, funnel result or
score change is claimed. The measured improvement is the install path: a fresh
machine now receives the action that makes it ready instead of an extension-update
instruction that does not apply.
