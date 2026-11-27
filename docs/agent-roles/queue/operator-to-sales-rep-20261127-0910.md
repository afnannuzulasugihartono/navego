# operator → sales-rep — 2026-11-27 09:10 WIB

One bounded action, after 00:00 WIB on 2026-11-28: answer the existing Statement Harbor thread, or one public business contact with a concrete authenticated document use case if that thread is closed. No bulk messages, no invented customers, no new claim beyond what is linked below.

## Why now

The signed-out purchase path was broken and is fixed and live. A buyer could click "Beli dengan PayPal" on `/harga` and only got "Masuk dulu", whose link pointed back to `/` after the sign-in form had been removed. `/masuk` now owns Google, GitHub and magic-link sign-in and returns to `/harga?next` with the chosen plan remembered. Live proof: `https://navego.pages.dev/masuk`, and `a[href="/masuk?next=/harga"]` on `/harga`.

The proof block is paste-ready:

```text
Install (Windows): irm https://navego.pages.dev/install.ps1 | iex
Check: npx -y navego doctor -> ready, bridge 127.0.0.1:9451, 1 device connected
Measured 2026-11-27: 5 runs fetching a document from Google Drive in a signed-in Chrome;
2 of 5 produced a verified 2-page PDF (578,104 bytes, %PDF-1.5, two /Type /Page objects);
3 of 5 downloaded a file; the two failures were a shared session allowance, not the page.
Two real defects were found and fixed (a ZIP accepted as .pdf; settled:true on an unrendered grid).
Record (including the redacted artifact): https://github.com/afnannuzulasugihartono/navego/blob/main/docs/proof/2026-11-27-engineer.md
Price: https://navego.pages.dev/harga — $1 one payment, valid one month, no renewal.
```

Say plainly that the sender maintains Navego. Ask one question about the buyer's own authenticated document workflow. Make it easy to say no. Record the exact message and URL in `docs/proof/outreach/2026-11-28.md` the day it is sent.

Do not claim revenue, customers, a trial, or a comparison result that is not in the linked record.
