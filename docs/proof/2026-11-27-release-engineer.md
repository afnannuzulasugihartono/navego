# release-engineer — 2026-11-27

## What shipped

The OpenCode automation-id exception in `.gitleaks.toml` is narrowed to one
path and one identifier shape. The two blanket entries that covered every
Markdown file and every JSON file under `docs/` are gone. What is left is one
allowlist entry inside the `generic-api-key` rule:

- path: `docs/proof/2026-11-25-survival-run-13.md`
- shape: the `aut_` prefix followed by at least 20 alphanumeric characters
- condition: AND, so the path and the shape must both match

The `generic-api-key` rule stays enabled globally under `[extend] useDefault =
true`, no rule is skipped, and no global `[allowlist]` was added.

- branch: `agent/release-engineer-20261126-1625/narrow-secret-scan`
- commit: `324a95ab`, rebased onto `main` at `e6e9d143`
- pull request: #467, https://github.com/afnannuzulasugihartono/navego/pull/467
- decision: `docs/decisions.json` -> `docs-agent-roles-11`
- ticket: `docs/agent-roles/queue/ceo-to-release-engineer-20261126-1453.md`

## The scanner measurement

Scanner: gitleaks 8.24.0, the version CI pins in the `secret-scan` job
(`.github/workflows/ci.yml`). Command shape: `gitleaks detect --source .
--verbose`, the same shape CI runs. The CI checkout is shallow, so every clone
below was made with `git clone --depth 1`. The configs were copies held outside
the repository, so the repository tree carries only the one changed file.

| # | what | result |
|---|---|---|
| 1 | shallow clone of `main` (`e6e9d143`) with both automation-id entries removed | exit 1, one finding: `generic-api-key` at `docs/proof/2026-11-25-survival-run-13.md:66` |
| 2 | the same clone with the narrowed config | exit 0, `no leaks found` |
| 3 | shallow clone of pull request #460 head (`836db6b`) with the narrowed config | exit 0, `no leaks found` |
| 4a | the proof file alone, copied into a throwaway repository at the same relative path, narrowed config | exit 0, `no leaks found`; the automation id is not reported |
| 4b | the same file with a key of another shape committed, narrowed config | exit 1, `generic-api-key` at `docs/proof/2026-11-25-survival-run-13.md:4` |
| 4c | control: the same fixture scanned with `main`'s current broad config | exit 1, the same finding, so narrowing the exception does not weaken the rule |

Measurement 1 is the whole set the exception has to cover: one file, one line.
Measurement 4b is the distinguishing one: the path exception covers the
identifier shape, not the file, so a key of another shape in that same file is
still reported.

The value used in 4b is deliberately not written here, and the fixture stayed
outside the repository in the session scratch directory: a key-shaped string
committed to the tree is the leak the scan exists to catch.

## The gates on the branch

| gate | result |
|---|---|
| `npm run scope:role -- release-engineer --base origin/main --head HEAD` | exit 0, "the named roles may change all 1 paths" |
| `npm run check` | exit 1 at the acceptance-pin check |
| `npm test` | exit 1 at the same acceptance-pin check |
| CI run 45887560869 | `secret-scan` PASS, `site` PASS, `deno-hosted` PASS, `browser` PASS, SonarCloud PASS, `unit` FAIL, `postgres` FAIL |

The two local gates and the two red CI jobs all fail on one line, and that
line is not in this lane's scope:

```
gates: the acceptance surface moved without a deliberate re-pin.

  .gitleaks.toml
    pinned 1ed5cc48be59cc0ae08a1fcec8d8e503fc688e24461d2a56831abc871d4a4bc9
    actual b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3
```

`gates.lock` carries the byte hash of `.gitleaks.toml`. The repository's own
rule (AGENTS.md) says a gate that must move is re-pinned in the same commit
with the reason written in it, and the commit message of `324a95ab` carries
that reason. `docs/autonomy.md` names `gates.lock` an owner-only path that no
lane may touch, and the scope gate agrees with that reading.

Measured, not assumed. On a throwaway commit on this branch, reverted before
the push:

- with the one line committed, `npm run scope:role -- release-engineer --base
  origin/main --head HEAD` exits 1 with "no named role may change: gates.lock"
- with the same one line committed, `npm run check` exits 0 and `npm test`
  exits 0

So the narrowed config itself breaks nothing. The branch is red on one
owner-only line, and this lane may not write it.

## What the owner or the operator lane has to do

One line in `gates.lock`:

```
-.gitleaks.toml 1ed5cc48be59cc0ae08a1fcec8d8e503fc688e24461d2a56831abc871d4a4bc9
+.gitleaks.toml b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3
```

`npm run gates:refresh` writes the same hash. The precedent is commit
`1b6d4364` ("Stop the secret scan from reading an automation id as a key"),
which changed `.gitleaks.toml` and re-pinned `gates.lock` in the same commit
with the reason in the commit message.

## The reviewer gap

The reviewer agent cannot run in this lane: the owner forbids a child session
against the same 40 rpm key (`docs/decisions.json` -> `docs-agent-roles-09`).
Under `docs/decisions.json` -> `docs-autonomy-05`, the owner approves the
merge on the lane's own review plus green CI, and the gap is written here.
CI on the exact head is not green while the pin stands, so the merge waits on
that pin first.

## Money

$0.00 moved. No customer payment, no order, no refund. This lane moved the
secret scan, not the ledger.
