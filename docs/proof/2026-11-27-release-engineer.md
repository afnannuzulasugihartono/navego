# release-engineer — 2026-11-27

## What changed

Pull request #474 replaces the two blanket OpenCode automation-id exceptions in
`.gitleaks.toml` with one path-and-pattern entry inside the `generic-api-key`
rule:

- path: `docs/proof/2026-11-25-survival-run-13.md`
- pattern: `aut_` followed by at least 20 alphanumeric characters
- condition: AND

The generic API-key rule stays enabled globally under `[extend] useDefault =
true`. No rule is skipped, no global `[allowlist]` was added, and the exception
does not cover every Markdown or JSON file under `docs/`.

- branch: `agent/release-engineer-20261126-2325/narrow-secret-scan`
- config commit: `483116c4`
- pull request: #474, https://github.com/afnannuzulasugihartono/navego/pull/474
- ticket: `docs/agent-roles/queue/operator-to-release-engineer-20261127-0415.md`

## The secret scan

Scanner: gitleaks 8.24.0, the version CI pins in the `secret-scan` job. The
Windows archive was checked against the checksum published with that release.
CI uses `actions/checkout` at its default depth, so the acceptance measurement
used a depth-1 clone of the branch commit and the exact CI command shape.

| measurement | result |
|---|---|
| depth-1 clone of `483116c4`, `gitleaks detect --source . --verbose` | exit 0; 1 commit scanned; `no leaks found` |
| throwaway repository, same config and target path, identifier only | exit 0; `no leaks found` |
| the same throwaway file plus a generated key of another shape | exit 1; one `generic-api-key` finding at `docs/proof/2026-11-25-survival-run-13.md:108` |

The second measurement used a randomly generated key-shaped value. The value
was not written into this repository or this proof, and the throwaway
repository and its reports were deleted after the redacted result was read.
The path exception therefore covers the OpenCode identifier shape, not the
file: another key shape at the same path is still caught.

A full-history scan with the same scanner reports 24 pre-existing findings in
deleted legacy fixtures and no automation-id finding. Those findings need
separate path-scoped entries and are outside this one-entry ticket. The clean
result above is the depth-1 surface CI actually scans.

## The gates

| gate | result |
|---|---|
| `npm run scope:role -- release-engineer --base origin/main --head HEAD` | exit 0, `the named roles may change all 5 paths` |
| `npm test` | exit 1; two runtime-census tests stop at the same acceptance-pin check |
| `npm run check` | exit 1 at the same acceptance-pin check |
| `npm test` in a throwaway clone with the owner-only pin applied | exit 0 |
| `npm run check` in that throwaway clone | exit 0 |

The local failures and CI failures name one changed line, which is not in this
lane's scope:

```
gates: the acceptance surface moved without a deliberate re-pin.

  .gitleaks.toml
    pinned 1ed5cc48be59cc0ae08a1fcec8d8e503fc688e24461d2a56831abc871d4a4bc9
    actual b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3
```

`gates.lock` carries the git-blob SHA-256 of `.gitleaks.toml`. The repository
rule says a moved criterion is deliberately re-pinned in the same commit, but
`docs/autonomy.md` names `gates.lock` owner-only and this ticket repeats that
boundary. The throwaway-clone measurement applied the exact owner-only line
without committing it: both local gates passed, so the narrowed config itself
breaks nothing else.

CI run 45912582135 on the config commit `483116c4` reports:

- `secret-scan`: PASS
- `site`: PASS
- `deno-hosted`: PASS
- `browser`: PASS
- SonarCloud Code Analysis: PASS
- `unit`: FAIL on the acceptance-pin line above
- `postgres`: FAIL on the same acceptance-pin line above

## The owner-only line

```diff
-.gitleaks.toml 1ed5cc48be59cc0ae08a1fcec8d8e503fc688e24461d2a56831abc871d4a4bc9
+.gitleaks.toml b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3
```

`npm run gates:refresh` writes the same hash. The precedent is commit
`1b6d4364`, which changed `.gitleaks.toml` and re-pinned `gates.lock` in one
commit with the reason in the commit message.

## Merge state

The pull request is open and mergeable, but it is not green and has not been
merged. A reviewer agent was not dispatched because this lane is the only
worker on its key. Under the owner's answer in `docs/autonomy.md`, that gap is
allowed only after CI is green on the exact head; the owner-only pin comes
first, then the green-CI merge.

## Money

$0.00 moved. No customer payment, order, or refund. This lane moved the
secret-scan rule and the pipeline evidence, not the ledger.
