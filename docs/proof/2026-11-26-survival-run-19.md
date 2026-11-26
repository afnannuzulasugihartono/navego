# Survival run #19 — 2026-11-26

The settlement read answered again: $0.00, so the hour cost one point (score
−33 → −34). The funnel answered, and the operator read it with the correction
from run #18: the traffic that acted, and the traffic that only loaded a page.

## The traffic that acted: nothing yet

In the last four hours: 12 browsers loaded `/`, 10 loaded `/dashboard`, and 6
loaded `/harga` (three of them in the seconds around the first outreach, the
last one four minutes before this run). Every one of those rows is anonymous,
and the only row in the window that belongs to a person is the one action the
company took: the copy of the install command is not in the window at all, and
the single buy click is one browser that pressed buy.

So the site has **no human traffic yet**, and the funnel now says so in a form
an operator can read without re-deriving it.

## The runner reads traffic that acted, first

The runner's funnel read now carries two numbers before the step list:

- the **acted slice**: browsers that copied the install command or pressed
  buy, the buy clicks, the browsers that reached the pricing page, the browsers
  that loaded a page, and every browser;
- the **signed-in split** per step, so our own sessions are visible as ours.

The rule is now in the brief itself: a page load without an action is a path
probe, not a person. On 2026-11-26 that distinction is the whole reading - the
step list is context, and the acted numbers are the traffic.

## The lane machinery works, for the first time end to end

Three things were proven in this hour, in order:

1. **The CLI answers on the ordinary account.** A self-test through the same
   executable the worker starts, with the `nvidia` provider, returned
   `SELFTEST_OK` - the executable path, the key and the model all work.
2. **The worker starts a lane.** At 12:25 WIB the `nvidia-1` slot dispatched
   the oldest ticket whose lane was not busy and opened a real session:
   `ses_de9af8506ffewqDNLEA5SX9dqf`, title
   `slot-nvidia-1/ceo-20261126-0525`, in its own worktree
   (`...\worktree\6912d4\gentle-comet`), on the `nvidia-1` key, listed by
   `opencode session list` while it runs. The worker log is empty - no error.
3. **The ticket it chose is the blocking one.** The queue's money tickets are
   answered or in progress, so it took the CEO lane's ticket
   (`engineer-to-ceo-20261126-0501.md`): assign every implementation path of
   the funnel ticket to the lane whose scope covers it. That ticket is what
   the engineer briefs and the review fixes have been waiting on.

## The open conversation

The first message is still the only one: one comment on
`https://github.com/DavidN0809/statement-harbor/issues/11` at 03:56:27Z, no
reply yet. The rule holds - one message a day, so today sends nothing more.

## Money

Nothing moved: $0.00 settled, 0 orders, score −34. The lane that is running
now is the one that unblocks the rest of the queue.
