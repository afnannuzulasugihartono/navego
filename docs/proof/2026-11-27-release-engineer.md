# release-engineer — 2026-11-27

Lane: release-engineer
Ticket: `docs/agent-roles/queue/operator-to-release-engineer-20261127-0415.md`
Branch: `agent/release-engineer-20261127-0415/narrow-secret-scan`
Pull request: https://github.com/afnannuzulasugihartono/navego/pull/476
Config commit: `e9e6462c`

## What changed

`.gitleaks.toml` carried two broad entries for the OpenCode automation-id
shape: one for every Markdown file under `docs/`, one for every JSON file
under `docs/`. One entry replaces them, inside the `generic-api-key` rule:

- path — `docs/proof/2026-11-25-survival-run-13.md`
- pattern — the `aut_` prefix followed by twenty or more alphanumeric characters
- condition — AND

The generic API-key rule stays enabled globally under `[extend] useDefault =
true`. No rule is skipped, no global `[allowlist]` was added, and the exception
no longer covers the documents at large. Decision:
`docs/decisions.json` -> `docs-agent-roles-11`.

## The scan

Scanner: gitleaks 8.24.0 — the version the `secret-scan` job in
`.github/workflows/ci.yml` pins. The Windows archive of that release ran on
this machine and its SHA-256 matches the checksum published with the release
(`gitleaks_8.24.0_checksums.txt`). CI checks out at depth 1, so the
acceptance measurement used a depth-1 clone and the CI command shape
(`gitleaks detect --source .`).

| measurement | result |
|---|---|
| depth-1 clone of `main` (`a4f1bb00`), the config as committed | exit 0 — 1 commit scanned, `no leaks found` |
| the same clone, both automation-id entries removed | exit 1 — one finding: `generic-api-key` at `docs/proof/2026-11-25-survival-run-13.md:66` |
| the same clone, this branch's config | exit 0 — 1 commit scanned, `no leaks found` |
| throwaway repository, the same path, the identifier only | exit 0 — `no leaks found` |
| the same file plus a generated key of another shape | exit 1 — one `generic-api-key` finding at `docs/proof/2026-11-25-survival-run-13.md:108` |
| the same key shape at another path | exit 1 — reported at `docs/proof/other/somewhere-else.md:1` as well |

The first row is the baseline: the tree is clean with the broad entries too.
The second row is the whole set the exception has to cover — one line in one
file. The last three rows are the narrowness: the identifier shape at the
exact path is not reported, a key of another shape at that same path is
reported, and the same key shape at another path is reported, so the generic
rule is still on everywhere.

The synthetic value was generated for the measurement, never written into this
repository or into this proof, and the throwaway repository stayed outside the
tree.

A full-history scan of this worktree with the same scanner reports 24
pre-existing findings in deleted legacy fixtures (19 `generic-api-key`, 5
`jwt`) and no automation-id finding. Those findings live in history that CI
does not read — the CI checkout is one commit deep — and each needs its own
path-scoped entry, which is a different ticket.

## The gates on this head

| gate | result |
|---|---|
| `npm run scope:role -- release-engineer --base origin/main --head HEAD` | exit 0 — the named roles may change all 4 paths |
| `npm test` | exit 1 — the two runtime-census tests stop at the acceptance-pin line below |
| `npm run check` | exit 1 at the same line; `type-debt: 0 errors — at baseline 0` before it |
| CI run 45922069823 on head `7541dc4e` | `secret-scan`, `site`, `deno-hosted`, `browser` and SonarCloud pass; `unit` and `postgres` fail on that one acceptance-pin line and on nothing else |

The line both gates stop at names one file, and it is not this lane's path:

```
gates: the acceptance surface moved without a deliberate re-pin.

  .gitleaks.toml
    pinned 1ed5cc48be59cc0ae08a1fcec8d8e503fc688e24461d2a56831abc871d4a4bc9
    actual b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3
```

`gates.lock` carries the git-blob SHA-256 of `.gitleaks.toml`, so the file
cannot move without the pin moving with it. `docs/autonomy.md` names
`gates.lock` owner-only, the merge-by-gate rule stops a pull request that
moves it, and the scope gate refuses it for the release-engineer role, so
this lane did not re-pin it. The repository's own rule is that a gate that
must move is re-pinned in the same commit with the reason; the owner line is
therefore one line:

```
-.gitleaks.toml 1ed5cc48be59cc0ae08a1fcec8d8e503fc688e24461d2a56831abc871d4a4bc9
+.gitleaks.toml b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3
```

`npm run gates:refresh` writes that line. The precedent is commit `1b6d4364`,
which changed `.gitleaks.toml` and re-pinned `gates.lock` in one commit with
the reason in the commit message.

The same two gates were driven in a throwaway clone with that one owner line
applied and nothing else changed: `npm test` exits 0 and `npm run check`
exits 0 there, so the narrowed config itself breaks no other gate.

The browser extension harness was not run: this lane changed no extension
file. No migration, edge deploy or CRX signing ran: this lane changed no
production surface.

## The merge

Pull request #476 is open and carries the change with this proof, the lane
reply, the board line and the brief to the operator lane — five paths, every
one of them the release-engineer work scope or the shared communication
surface. No owner-only path moved in this pull request.

The merge is not done, and this lane does not claim it. `npm test` and
`npm run check` are red on the owner-only acceptance pin above, the
merge-by-gate rule needs CI green on the exact head, and the one line that
makes it green is the owner's to write. CI run 45922069823 on head
`7541dc4e` is green on every job that does not read that pin — `secret-scan`,
`site`, `deno-hosted`, `browser` and SonarCloud — and red on `unit` and
`postgres` for that one line and nothing else. The commit after that head
records this result and changes no configuration. Pull request #474, the
earlier attempt at the same edit from a base that is now behind `main`, is
closed in favour of #476.

A reviewer agent was not dispatched: this lane is the only worker on its key
and a child session multiplies the requests against the same 40 rpm limit
(`docs/decisions.json` -> `docs-agent-roles-09`). Under the owner's answer in
`docs/autonomy.md` (`docs-autonomy-05`) that gap may only carry a merge after
CI is green on the exact head, so it is recorded here and the merge waits for
the pin.

## Money

$0.00 moved. No customer payment, order or refund. This lane moved the
secret-scan rule and the evidence around it, not the ledger. The next money
step stays with the sales lane's one bounded send.
