# Statement Harbor follow-up — paste-ready draft, 2026-11-27

Public surface: https://github.com/DavidN0809/statement-harbor/issues/11 — "Implement Voya automatic document collection after manual sign-in", opened 2026-11-15, still Open. Our first comment is already on that thread (2026-11-26). This draft is a **follow-up that adds proof**, not a repeat of the first pitch.

Read live on 2026-11-27T10:24Z. The acceptance block asks for: manual sign-in with MFA/challenges completed by the person; no browser closure treated as proof of login; AUTH_REQUIRED/CHALLENGE_REQUIRED on expiry; validated PDFs with SHA-256; atomic writes and duplicate skip; no credential/profile content in logs; no MFA/CAPTCHA/bot-protection automation; no embedded LLM or model-service dependency.

## Draft text

```text
Following up with the measured artefact, since the acceptance criteria here are specific.

Navego is a local MCP server (40 browser tools over 36 generic primitives) plus an MV3 extension that drives the user's own signed-in Chrome. It does not automate MFA, CAPTCHA, account changes, or bot-protection gates, and it does not need an embedded model service: the person signs in manually, hands the authenticated step back, and the agent continues in that same browser.

Measured on 27 November 2026, five driven runs against a real authenticated Google Drive document:
- 2 of 5 produced a two-page PDF that was checked on disk: 578,104 bytes, %PDF-1.5, two /Type /Page objects.
- 3 of 5 downloaded a file. The two failures were a shared session allowance, not the page.
- browser_download_file waits for the file to land and stop growing; a ZIP saved as .pdf is refused instead of filed as a statement. Both defects were found and fixed in that run.
- A redacted image of the actual downloaded page and the full five-run record are linked below.

Your PaperPull engine can keep host allowlists, safe-control guards, PDF validation, SHA-256 identity, atomic writes, duplicate skip, and the Paperless queue. Navego only supplies the local authenticated-browser step and the checked file.

Real output from a fresh machine, so the claim is not inflated: npx -y navego doctor reports the bridge on 127.0.0.1:9451 and says "degraded" until the browser is paired and signed in; after pairing it reports the plan and allowance. https://github.com/afnannuzulasugihartono/navego/blob/main/docs/proof/2026-11-27-0924-clean-machine-doctor.md

Five-run record: https://github.com/afnannuzulasugihartono/navego/blob/main/docs/proof/2026-11-27-engineer.md
Price: https://navego.pages.dev/harga — $1 for one month, one payment, no renewal.

If Navego does not fit PaperPull's architecture, no reply needed and I will not follow up again.

Disclosure: I maintain Navego.
```

## Send rule

- The 2026-11-27 send allowance was used for Agno. This one is for **2026-11-28 00:00 Asia/Jakarta or later**, one message on that day, as a reply on the thread above.
- Record the exact text, time, and reply (or "no reply yet") in `docs/proof/outreach/2026-11-28.md` the day it is sent.
- Do not add a new claim beyond the linked records. Do not claim a customer, a pilot, revenue, or a store listing under review.
