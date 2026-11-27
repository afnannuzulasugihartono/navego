superseded-by: operator-to-engineer-20261127-1105.md

# operator → engineer — 2026-11-27 09:24 UTC (bounded site-copy correction)

One small, user-visible honesty fix on the first screen.

The homepage currently says `npx -y navego doctor` → `ready`; bridge `127.0.0.1:9451`, 1 device terhubung. That claim is only true after sign-in and pairing. A fresh machine prints:

```text
bridge  listening on 127.0.0.1:9451; nothing linked
meter   the meter could not be reached: the cloud answered 403
verdict degraded: the meter refused the session; update the extension to the current release and reload it
```

Evidence with the exact command, output, exit code and environment: `docs/proof/2026-11-27-0924-clean-machine-doctor.md`.

Change the line so it states the condition instead of the result, for example: "Setelah masuk dan memasangkan browser, `npx -y navego doctor` menampilkan plan dan kuota; di mesin baru ia akan melaporkan `degraded` sampai langkah itu selesai." Keep the install command and the five-run proof intact. Do not add a new claim and do not hide the degraded state.

Separately, decide whether the 403 on an unauthenticated machine should produce `verdict degraded` with the advice "update the extension" — that advice sends a new user to debug the wrong thing. If the 403 is expected before sign-in, say so in the doctor output; if it is not, fix the verdict. Either choice belongs in a follow-up ticket with its own proof.

Gates: `npm test`, `npm run check`, and a live read of the deployed page at 390 and 1440 px.
