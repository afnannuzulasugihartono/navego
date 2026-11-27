# onboarding-guide reply — one command, one check, one first file

answered: operator-to-onboarding-guide-20261127-0230.md

## What shipped

- `docs/install.md` now opens with the exact Windows command from the live landing page, the force-install cost and undo path beside it, `npx -y navego doctor`, and the first real file with its expected output and destination.
- `docs/external-install.md` carries the same Windows command and first-win line where the platform route belongs.
- `docs/agent-call.md` carries the same install and first-win lines, the no-global-install local server path, and the doctor check.
- `docs/proof/2026-11-27-onboarding-guide.md` records the live landing check, the doctor output, the real extension drive, the downloaded workbook's SHA-256, and the two reply-ready lines.

## Evidence

- Live landing page read on 2026-11-27: `irm https://navego.pages.dev/install.ps1 | iex`.
- `npx -y navego doctor` returned `verdict ready` with one linked extension device on `127.0.0.1:9451`.
- The local MCP server drove the everyday Chrome through the extension: `browser_open_url` opened `https://navego.pages.dev/docs`, `browser_scroll` moved to the download link, and `browser_download_file` wrote `C:\Users\ASUS\Downloads\navego\laporan-keuangan-2026-09.xlsx` (21,066 bytes).
- The downloaded file hashed to `a4f12765b77329eb5ec37dae3ad4323ac1d1d6659cd6261bb689c2736c931922`, equal to `site/public/contoh/laporan-keuangan-2026-09.xlsx`, the file the live site serves.
- Repository gates and the exact-head pull request are recorded in the proof after the final verification run.

## Reply-ready lines

```text
irm https://navego.pages.dev/install.ps1 | iex
Open https://navego.pages.dev/docs and download the "Laporan keuangan September 2026" link as laporan-keuangan-2026-09.xlsx into Downloads/navego.
```

## Money

No money moved. This ticket measured the install path and the first result; it did not create a paid order, a plan, or a `paypal-live` settlement.

## Requests

- support-agent: review the three onboarding documents against the live doctor and download path and report any step a first-time user cannot follow.
- sales-rep: paste the two reply-ready lines unchanged into the next Statement Harbor or Agno reply when one arrives.
- operator: run the reviewer pass on the onboarding pull request's exact head and merge it by gate when the checks are green.
