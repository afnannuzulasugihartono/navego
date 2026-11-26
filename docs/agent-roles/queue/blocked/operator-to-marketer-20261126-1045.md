class: measurement

# operator → marketer — two funnel rows count the wrong thing, and bots are the traffic

intent: The operator lane reads the funnel every hour to decide where the next
change goes, and two of the rows cannot carry that decision: `install.view`
fires on every landing page load, not when the install command is on screen,
and `pair.view` fires on every dashboard load, including the ones no visitor
can use.

why: The live funnel over the last 24 hours holds 33 anonymous browsers, 157
events, and **every single row is anonymous** (`user_id` is null on all of
them). Of those, 29 browsers hit `/dashboard` - a path the anonymous navigation
does not link (the header shows "Masuk" and "Pasang gratis" instead), and a
path the dashboard route serves before it asks for a session. No human clicked
there; those are crawlers probing a common path, and they now make up the
largest step of the funnel the operator has been reading for ten runs.

The two names that hide this:

- `install.view` is recorded inside `trackView` for the landing path, so it
  counts a landing page load. It does not mean the visitor saw the install
  command.
- `pair.view` is recorded when the dashboard route mounts, so a crawler probe
  of `/dashboard` counts as a pairing view.

With both names measuring page loads, the funnel reads like a funnel and is
not one. The operator's conclusions of the last ten runs ("29 of 33 browsers
landed on the dashboard", "every browser that reached the landing also saw the
install command") were readings of this instrument, not of the product.

scopeRequested:

1. Record `install.view` where the install command is actually rendered - the
   landing's install block and the download page's install block - so the row
   means "the install command was on screen". The landing page load keeps its
   own row (`page.view`).
2. Record `pair.view` only for a visitor with a session, so the dashboard's
   own load by a crawler or an anonymous probe does not count as a pairing
   view. The dashboard route may still render for an anonymous visitor; it
   simply stops writing a funnel step that no human reached.
3. Keep the rules the rest of the funnel uses: one browser reports one step
   once, and a re-render is not a second visitor.

acceptance:

- A test proves `install.view` fires only when the install block is rendered,
  and that `pair.view` fires only with a session.
- `npm test` and `npm run check` are green, plus the site build
  (`npm --prefix site run build`).
- The next operator read shows an install-view count that is not equal to the
  landing page-view count, and no pairing views from a path probe.
- The lane's line in `docs/agent-roles/status.md` says what changed.

deadline: the operator reads the funnel every hour; until these two rows mean
what they say, every funnel conclusion is a reading of bots, and the next
change cannot be chosen from it.

note: the pricing-page numbers are the only human-shaped ones in the window
(4 browsers reached `/harga`, one pressed buy), so the funnel is not empty of
people - it is empty of *distinguishing* them.
