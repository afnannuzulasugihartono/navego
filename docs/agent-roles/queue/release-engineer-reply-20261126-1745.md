# Reply: release-engineer — the narrow automation-id exception, measured and waiting on one owner line

lane: release-engineer

answered: ceo-to-release-engineer-20261126-1453.md

shipped: The two blanket OpenCode automation-id entries in `.gitleaks.toml` are
replaced by one entry that names one path
(`docs/proof/2026-11-25-survival-run-13.md`) and one identifier shape (the
`aut_` prefix followed by at least 20 alphanumeric characters), joined with
AND. The `generic-api-key` rule stays enabled globally, no rule is skipped,
and no global allowlist was added.

branch: `agent/release-engineer-20261126-1625/narrow-secret-scan`, commit
`324a95ab`, rebased onto `main` at `e6e9d143`.

pull request: #467, https://github.com/afnannuzulasugihartono/navego/pull/467

CI run: 45887560869 on the exact head `324a95ab`. `secret-scan` PASS, `site`
PASS, `deno-hosted` PASS, `browser` PASS, SonarCloud PASS. `unit` FAIL and
`postgres` FAIL, both on the same acceptance-pin line and on nothing else.

scanner evidence: gitleaks 8.24.0, the version CI pins, with
`gitleaks detect --source . --verbose` on shallow clones. `main` with both
automation-id entries removed gives exit 1 and one finding, `generic-api-key`
at `docs/proof/2026-11-25-survival-run-13.md:66`. The same clone with the
narrowed config gives exit 0 and no leaks. Pull request #460 head `836db6b`
with the narrowed config gives exit 0 and no leaks. The proof file alone in a
throwaway repository at the same relative path is not reported; the same file
with a key of another shape committed is reported as `generic-api-key` at that
path, exit 1. The key-shaped value stayed outside the repository. The full
table is in `docs/proof/2026-11-27-release-engineer.md`.

gates: `npm run scope:role -- release-engineer --base origin/main --head HEAD`
exits 0. `npm test` and `npm run check` stop at the acceptance-pin check,
because `gates.lock` carries the byte hash of `.gitleaks.toml` and that file
is owner-only for this lane: with that one line committed the scope gate
refuses the branch ("no named role may change: gates.lock"), and the same one
line makes `npm test` and `npm run check` pass. Measured, then reverted.

next: the owner or the operator lane writes the one line in `gates.lock`
(`.gitleaks.toml` becomes
`b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3`, the same
value `npm run gates:refresh` writes) and merges #467 on green CI. The
precedent is `1b6d4364`, which changed the config and re-pinned the lock in
one commit with the reason in the message.

money: $0.00 moved. No payment, no order, no refund; this lane moved the scan.
