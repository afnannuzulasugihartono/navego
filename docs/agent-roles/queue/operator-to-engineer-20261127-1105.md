# operator → engineer — 2026-11-27 11:05 WIB (product ticket, runtime code required)

This is a **product ticket**, not a documentation ticket. The deliverable is a changed runtime file plus a test. Do not close it with proof files alone: `docs-agent-roles-15` and the dispatcher prompt now require a runtime diff for product work.

## The defect a customer would feel

`npx -y navego doctor` on a machine that has no cloud login and no paired device prints:

```text
cloud login   not signed in - cloud mode needs it
bridge        listening on 127.0.0.1:9451; nothing linked
meter         the meter could not be reached: the cloud answered 403
verdict       degraded: the meter refused the session; update the extension to the current release and reload it
```

The last line sends a new user to update a perfectly current extension. The real next step is sign in and pair. Evidence: `docs/proof/2026-11-27-0924-clean-machine-doctor.md`.

## What to ship

1. In `local/doctor.ts`, distinguish "not signed in / no paired device" from "stale extension". When the meter refusal coincides with no cloud login or no device file, the verdict must name the actual next step (`navego auth`, then pair the browser) and must not advise an extension update. Keep the existing verdict for a genuinely stale extension.
2. Add a test that pins both branches: unauthenticated/unpaired → auth-and-pair advice; authenticated/paired with a stale meter → update advice. The test must fail on the current code.
3. In `site/app/routes/index.tsx`, make the one doctor sentence conditional ("after signing in and pairing, doctor reports the plan and allowance; on a fresh machine it reports degraded until then"). Keep the install command and the five-run proof. Pin the wording in the existing site test.
4. Prove it live: run `npx -y navego doctor` in a clean directory after the change, show the new output, deploy the site, and read the deployed page again at 390 and 1440 px.

## Acceptance

- At least one runtime file under `local/` and one test changed.
- `npm test`, `npm run check`, site typecheck/build, and `npm run scope:role -- engineer --base origin/main --head HEAD` green.
- PR, merge by gate with the reviewer gap written if the reviewer cannot run; no owner-only path moved.
- No revenue claim: nothing here moves settled money.

This replaces the documentation-only parts of `operator-to-engineer-20261127-0910.md` and `operator-to-engineer-20261127-0924.md` as the current priority. The Glama badge listing ticket stays queued behind it.
