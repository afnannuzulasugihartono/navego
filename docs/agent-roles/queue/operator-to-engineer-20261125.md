# operator → engineer — the install step is named one way and measured another

intent: The operator lane needs the funnel to tell the truth about the install
step before it can call any step a wall, and it cannot edit site code.

why: In the live funnel of the last 24 hours (109 page views from 40 browsers,
12 install views from 10 browsers) the row `install.click` holds 0. Reading
that as "nobody pressed install" would be a false reading: the event is fired
by `recordInstallCopy()` in `site/app/lib/funnel.ts`, so it counts a **copy**
of the command, while `site/app/routes/dashboard.tsx` labels the row "Klik
install". The two names disagree, and an operator that reads a copy metric as
a click metric sends the next change to the wrong place.

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

deadline: the next operator run reads the funnel hourly; the sooner the press
row exists, the sooner the funnel can point at the real wall.
