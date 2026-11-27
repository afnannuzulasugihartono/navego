# Role design: job description first, scope as a guardrail

The owner showed a lane spending most of its context deciding where it was
allowed to write a scratch script. That is a design fault, not a lane fault.
The file scope exists so two lanes cannot overwrite each other and so the
scope gate can name one owner per path - but the lane should not have to
reason about it. The work is the Goal and the ticket; the harness enforces the
permissions.

Changed now:

- The dispatcher's lane prompt says the job is the ticket and the Goal, that
  the scope paths are enforced permissions and not a topic to reason about,
  and that scratch files go to the approved temp directory via the shell
  while repository changes stay inside the scope.
- Every role document carries that rule beside its Goal, and the generated
  agent files are rendered from the register.

## The designer proposal

The owner proposed a designer role because the site looks unattractive to a
human. My recommendation: **no new lane yet.**

Evidence: there are three keys and four kept lanes (manager, sales, engineer,
onboarding), and the outstanding money work - the first win and the measured
eval - is still running. A fifth lane would take a key from that path. The
site was restyled on 2026-11-23 (PRs #446-#455), so the gap is not the absence
of design work; it is that no human visitor has judged it.

Instead: **one bounded design ticket for the engineer** after the eval lands,
with acceptance by a real browser drive (the site read at 1440 and 390 px, the
hero and the pricing card checked by a person, not by a screenshot count). If
that work recurs after a real buyer comments, create the designer lane then -
with its own key or by retiring a dormant lane, never by crowding the money
path.

No money claim: $0.00 settled, 0 orders.
