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
