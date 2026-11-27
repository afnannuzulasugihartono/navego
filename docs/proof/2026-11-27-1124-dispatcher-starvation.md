# Dispatcher starvation found and fixed — 2026-11-27 11:24 UTC

## Ground truth

- Ticket `operator-to-engineer-20261127-1105.md` (the product fix for `doctor`) had no started marker and no reply since 11:05 WIB.
- `dispatch.ts --slot nvidia-1 --dry-run` said `SLOT_BUSY`; nvidia-2 and nvidia-3 kept selecting the sales ticket `operator-to-sales-rep-20261127-0910.md`.
- That sales send is forbidden until 2026-11-28 00:00 WIB by the one-public-action-per-day rule, so the oldest sales ticket was taking a slot every hour without being able to act.
- The process table still contained the detached launcher for `lane-engineer-20261127-0925`, although its session had `outcome: succeeded` at 17:34. `liveSessionFor` treated `succeeded` as still live, so the engineer lane was held indefinitely.

## What changed

1. `watch.ts` parses two optional ticket headers: `not-before:` (epoch ms) and `superseded-by:` (ticket file name).
2. `dispatch.ts` skips a ticket before its `not-before` and skips a superseded ticket.
3. `dispatch.ts` treats **any** terminal session outcome as finished, and ignores a stale launcher process when its session has finished.
4. `dispatch.ts` orders eligible tickets `money → product → others`, so the engineer mandate is reflected in scheduling.
5. Sales tickets 0910, 0924 and 1024 carry `not-before: 2026-11-28T00:00:00+07:00`; engineer tickets 0910 and 0924 carry `superseded-by: operator-to-engineer-20261127-1105.md`; ticket 1105 carries `class: product`.

No acceptance gate was weakened: four new unit tests pin the future-date skip, the superseded skip, the zombie-launcher case, and product precedence.

## Verified

- `npm test` exit 0, `npm run check` exit 0 (`type-debt: 0 errors`).
- `dispatch.ts --slot nvidia-3 --dry-run` now plans `lane: engineer`, `ticket: operator-to-engineer-20261127-1105.md`. nvidia-1 is still held by a live slot process, which is correct.
- Settled external revenue remains $0.00, 0 orders. This is a scheduling fix, not a sale.
