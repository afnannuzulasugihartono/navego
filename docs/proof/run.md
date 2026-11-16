# Proof run: one browser, four files

The local MCP server drove a throwaway Chrome over stdio: it opened the fixture portal, read the page, downloaded the CSV, and built the four files the site offers. Each file was hashed and compared with the same-named file in `site/public/contoh/`.

One part of the run is answered locally: the cloud meter that opens a session knows an account and its plan, and a throwaway browser has neither, so the meter was pointed at a loopback stub granting a pilot session. The drive, the extension, the bridge and the files are the shipped ones; only the plan check is stood in for.

Browser: Proof Chrome. Deck slides: 5.

| # | call | ms | what it left |
| --- | --- | --- | --- |
| 1 | `initialize` | - | server opera-local |
| 2 | `tools/list` | - | 56 tools |
| 3 | `open_url` | 203 | tab 10951192067 · http://127.0.0.1:63522/portal.html |
| 4 | `read_page` | 15 | 423 characters read |
| 5 | `download` | 951 | 1109 bytes landed |
| 6 | `stage` | - | 3 paper sources copied beside the CSV |
| 7 | `spreadsheet_build` | 24 | 3 sheets, 7 figures checked |
| 8 | `deck_build` | 4 | 4 content slides and a cover |
| 9 | `document_write` | 7 | 13 blocks, Dampak Promosi terhadap Kinerja Kanal Sinar Jaya |
| 10 | `document_write` | 4 | 13 blocks, Rencana Pemasaran 2027 - Sinar Jaya |
| 11 | `capture_page` | 36 | 47544 picture bytes |
| 12 | `close_tab` | 31 | tab 951192067 closed |

| file | bytes | sha256 | equals |
| --- | --- | --- | --- |
| `docs/proof/downloads/transaksi-2026-09.csv` | 1109 | `8e0f64810fd70e91101051afb85a814df12a87b1eafde048272049ed6a3667a2` | `tests/fixtures/mock-company/transaksi-2026-09.csv` |
| `docs/proof/out/laporan-keuangan-2026-09.xlsx` | 21066 | `a4f12765b77329eb5ec37dae3ad4323ac1d1d6659cd6261bb689c2736c931922` | `site/public/contoh/laporan-keuangan-2026-09.xlsx` |
| `docs/proof/out/rencana-strategis-2027.pptx` | 32866 | `90711468da9fe6319dea39aaeb86c49e37206410de88a18f176cf924b58294cb` | `site/public/contoh/rencana-strategis-2027.pptx` |
| `docs/proof/out/riset-promo.docx` | 23485 | `1758824cd0cf0b15a6f9531cd13ff5d42de277776b8a0cd87b8d927184ba38e1` | `site/public/contoh/riset-promo.docx` |
| `docs/proof/out/rencana-pemasaran-2027.docx` | 18509 | `104e43eac8e80e1860e1bc52c61414e81dcac43a1bea2f424537e4754517b8b6` | `site/public/contoh/rencana-pemasaran-2027.docx` |

The hashes in `run.jsonl` are rechecked against `site/public/contoh/` by `tests/tooling/proof-run.test.mjs`, so this record cannot drift away from what the code makes.
