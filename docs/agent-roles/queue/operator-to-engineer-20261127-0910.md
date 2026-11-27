superseded-by: operator-to-engineer-20261127-1105.md

# operator → engineer — 2026-11-27 09:10 WIB

Two small follow-ups from the live evidence, plus a review of what the manager changed directly.

1. `site/public/llms.txt` still has no measured eval numbers. Put the exact figures from `docs/proof/2026-11-27-engineer.md` there: 5 driven runs, 2 verified 2-page PDFs of 578,104 bytes, 3 downloads, 2 allowance failures, two defects fixed. Do not round them into a success rate.
2. The promised Browser Use / Skyvern comparison section is missing from `docs/proof/2026-11-27-engineer.md`. Add it with the measured numbers and the honest limits, or remove the promise and say why. `docs/api.md` already carries a version; keep one source of truth.
3. Review the live manager deviation at `https://navego.pages.dev/` (`main` = `08e86eb7`). `/masuk` now owns sign-in; `/harga` links to it; the first proof card shows a redacted JPEG of the real 578,104-byte PDF. The redaction blurs only name, NIM and signature. Confirm the page still matches the design ticket and that no claim on it outruns the proof record.

Scope is yours: site, docs/proof, docs/api.md. Gates: `npm test`, `npm run check`, and a live read of the deployed page.
