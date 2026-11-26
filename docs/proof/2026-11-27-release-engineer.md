# release-engineer — 2026-11-27 (lane release-engineer-20261126-2125)

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

- branch: `agent/release-engineer-20261126-1625/narrow-secret-scan` — this
  lane continued the branch the 1625 lane of this ticket opened; the repair
  commit itself is unchanged
- repair commit: `324a95ab` — the only code change, byte-identical to the
  edit the ticket carries (git blob `0c68924870b8f51d4ee87c7329690157c4a8d52c`)
- pull request: #467, https://github.com/afnannuzulasugihartono/navego/pull/467
- decision: `docs/decisions.json` -> `docs-agent-roles-11`
- ticket: `docs/agent-roles/queue/ceo-to-release-engineer-20261126-1453.md`

## The scanner measurement

Scanner: gitleaks 8.24.0, the version CI pins in the `secret-scan` job
(`.github/workflows/ci.yml`). This lane ran the Windows x64 build of that
same version; CI runs the Linux x64 build of it. Command shape: `gitleaks
detect --source <clone> --config <config> --verbose`, the shape CI runs. The
CI checkout is shallow, so every clone below was made with `--depth 1`. The
configs were copies held outside the repository, so the repository tree
carries only the one changed file.

| # | what | result |
|---|---|---|
| 1 | shallow clone of `main` (`e6e9d143`) with both automation-id entries removed | exit 1, one finding: `generic-api-key` at `docs/proof/2026-11-25-survival-run-13.md:66` |
| 2 | the same clone with the narrowed config | exit 0, `no leaks found` |
| 3 | shallow clone of pull request #460 head (`836db6b`) with the narrowed config | exit 0, `no leaks found` |
| 4a | the proof file alone, copied into a throwaway repository at the same relative path, narrowed config | exit 0, `no leaks found`; the automation id is not reported |
| 4b | the same file with a key of another shape committed, narrowed config | exit 1, `generic-api-key` at `docs/proof/2026-11-25-survival-run-13.md:107` |
| 4c | control: the same fixture scanned with `main`'s current broad config | exit 1, the same finding, so narrowing does not weaken the rule |

Measurement 1 is the whole set the exception has to cover: one file, one line.
Measurement 4b is the distinguishing one: the path exception covers the
identifier shape, not the file, so a key of another shape at that same path
is still reported. Measurement 4c says the same key is reported under the
broad config too, so the narrow entry did not take the rule's teeth out.

The commands, as run:

```
gitleaks detect --source <shallow clone> --config <config copy> --verbose
```

The key-shaped value in 4b was a 32-character hexadecimal string written as
`api_key = "..."`. It stayed in the throwaway fixture outside the repository
and is not written here: a key-shaped string committed to the tree is the
leak the scan exists to catch.

## The gates on the branch

| gate | result |
|---|---|
| `npm run scope:role -- release-engineer --base origin/main --head HEAD` | exit 0, "the named roles may change all 1 paths" |
| `npm test` | exit 1 at the acceptance-pin check |
| `npm run check` | exit 1 at the same acceptance-pin check (types pass, type-debt 0 errors, then the pin) |
| CI run 45887560869 on the repair commit `324a95ab` | `secret-scan` PASS, `site` PASS, `deno-hosted` PASS, `browser` PASS, SonarCloud PASS; `unit` FAIL, `postgres` FAIL |

The two local gates and the two red CI jobs all fail on one line, and that
line is not in this lane's scope:

```
gates: the acceptance surface moved without a deliberate re-pin.

  .gitleaks.toml
    pinned 1ed5cc48be59cc0ae08a1fcec8d8e503fc688e24461d2a56831abc871d4a4bc9
    actual b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3
```

`gates.lock` carries the git-blob SHA-256 of `.gitleaks.toml`, and the
narrowed config has a new one. Measured, then reverted, in this lane:

- with that one line re-pinned in the working tree (never committed, reverted
  with `git checkout -- gates.lock`), `npm test` exits 0 and `npm run check`
  exits 0 with "check ok: 36 allowlisted browser primitives, 319 runtime
  safety files, version 1.8.1"
- with the same one line committed, `npm run scope:role -- release-engineer
  --base origin/main --head HEAD` exits 1 with "no named role may change:
  gates.lock"

So the narrowed config itself breaks nothing, and the one line that stands
between the branch and green belongs to no lane: `docs/autonomy.md` names
`gates.lock` an owner-only path that no lane may touch, and the scope gate
agrees.

## What the owner or the operator lane has to do

One line in `gates.lock`:

```
-.gitleaks.toml 1ed5cc48be59cc0ae08a1fcec8d8e503fc688e24461d2a56831abc871d4a4bc9
+.gitleaks.toml b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3
```

`npm run gates:refresh` writes the same hash. The precedent is commit
`1b6d4364` ("Stop the secret scan from reading an automation id as a key"),
which changed `.gitleaks.toml` and re-pinned `gates.lock` in the same commit
with the reason in the commit message. Then pull request #467 merges by gate:
CI green on the exact head, the operator's own review, no owner-only path
moved.

## The reviewer gap

The reviewer agent cannot run in this lane: the owner forbids a child session
against the same 40 rpm key (`docs/decisions.json` -> `docs-agent-roles-09`).
Under `docs/decisions.json` -> `docs-autonomy-05`, the owner approves the
merge on the lane's own review plus green CI, and the gap is recorded here.
CI on the exact head is not green while the pin stands, so the merge waits on
that pin first.

## One ticket, one record

The record-only pull request #470 (the 1745 lane of this same ticket) is
closed as superseded: the proof, the reply artifact and the board line are
carried in #467 instead, so the ticket has one place to merge and one reply
for the manager to read.

## Money

$0.00 moved. No customer payment, no order, no refund. This lane moved the
secret scan, not the ledger.
