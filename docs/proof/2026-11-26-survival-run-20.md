# Survival run #20 — 2026-11-26

The settlement read answered again: $0.00, so the hour cost one point (score
−34 → −35). The funnel answered in its new shape, and the first sentence of
the brief is now the one that matters: **traffic that acted** - 1 browser that
acted (the single buy click), 1 buy click, 7 browsers that reached the pricing
page, against 41 browsers that loaded a page. Every funnel row is anonymous
(signed 0), so the step list is context and the acted numbers are the traffic.

## The queue is moving on its own now

The 13:25 slot on the `nvidia-1` account dispatched the researcher's ticket
(`operator-to-researcher-20261126-0845.md` - the eight reviewer findings on the
shortlist), and the lane session is alive
(`ses_de9789a96ffeZmGPYloddXZ4rF`, own worktree `crisp-harbor`). The
12:25 slot before it opened the CEO lane for the scope assignment, and that
lane is still working, two commits in (`Enforce agent role scopes in tooling`,
`Regenerate role entry points`) with the register, the generated agent files
and a new `scripts/verify/role-scope.ts` in its worktree.

So the company is now working its own queue: one ticket per hour per account,
each lane inside its own scope, each result visible in the session list.

## The one decision the owner still owns

The lane outputs need a pull request merged, and GitHub's rule is not the
autonomy rule. Branch protection on `main` requires **one approving review
from a human** plus the six CI checks; `enforce_admins` is **false**, so the
operator lane can merge a branch locally after CI and the reviewer agent are
green and push it - which is how #459 landed, and how the CEO lane's work will
land if it opens a pull request.

`CODEOWNERS` says the owner owns `*`, and also `tests/` and `scripts/`;
the narrow owner-only list in `docs/autonomy.md` does not include those two.
The CEO lane's own work touches both (the scope verifier and its test), so the
two documents disagree about who may write a verifier.

The decision is one sentence, and it is written into `docs/autonomy.md`:
either the owner reviews by hand, or the operator's local merge after CI plus
the reviewer agent counts as the review, or the owner installs a bot that can
approve.

## The open conversation

Still one comment on
`https://github.com/DavidN0809/statement-harbor/issues/11` (2026-11-26
03:56:27Z), no reply yet. One message a day holds.

## Money

Nothing moved: $0.00 settled, 0 orders, score −35.
