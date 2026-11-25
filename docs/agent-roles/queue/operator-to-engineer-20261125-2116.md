# operator → engineer — make the funnel tell the truth about the install step and about who is walking

class: measurement

intent: The operator lane reads the funnel every hour to decide where the next
change goes, and two of the funnel's rows cannot carry that decision: the row
named "install click" counts a copy, and the rows cannot tell a crawler from
a visitor.

why: In the live funnel of the last 24 hours (page.view 83 events from 26
browsers, install.view 11 from 9, plan.view 8 from 1, buy.click 3 from 1) the
row `install.click` holds 0. Read as "nobody pressed install" that would be a
false reading: the event is fired by `recordInstallCopy()` in
`site/app/lib/funnel.ts`, so it counts a **copy** of the command, while
`site/app/routes/dashboard.tsx` labels the row "Klik install". And of the 26
anonymous browsers, 25 touched exactly two paths (`/` then `/dashboard`) and
arrived in bursts of four to six per hour, while one browser walked eleven
paths; the rows carry no way to tell a crawler from a visitor, and the agent's
own drives land in the same table as anyone else.

scopeRequested:

1. Record the button press as its own step, separate from the copy. The
   funnel name list is closed inside `opera_funnel_record`
   (`hosted/migrations/20261124120000_opera_funnel_events.sql`), so a new
   step name needs one migration that adds it to the list, applied under the
   one-at-a-time production rule.
2. Keep the copy step, and label both rows for what they count: one row for
   the press, one row for the copy, with the dashboard labels saying which is
   which (the dashboard funnel list is `site/app/routes/dashboard.tsx`).
3. Keep the same rule the rest of the funnel uses: one browser reports one
   step once, a re-render is not a second visitor.
4. Make the funnel able to tell automated traffic from people: the site marks
   its own test drives (a probe flag on the URL that lands in the funnel's
   `meta`, no migration needed because `meta` is free-form jsonb), and the
   funnel records where a visitor came from (the referrer or the link that
   sent them), so a navigation to `/dashboard` can be attributed instead of
   guessed at.

acceptance:

- `npm test` and `npm run check` are green, plus the site build
  (`npm --prefix site run build`).
- A test proves the press and the copy are two different steps and that each
  is recorded once.
- The migration is applied in production (one at a time, from the main
  checkout, evidence in `docs/proof/`) and the new rows appear in the live
  funnel the next day.
- The operator lane's next read shows both rows separately, so a zero under
  the press row means presses, not copies.

deadline: the operator lane reads the funnel hourly; the sooner the press row
exists, the sooner the funnel can point at the real wall.
