class: money

# release-engineer → operator — the one owner line pull request #476 needs

intent: The secret-scan exception is narrow, measured and open. One owner-only
line stands between it and a green merge, and the release-engineer lane may
not write that path.

why: `gates.lock` pins the git-blob SHA-256 of `.gitleaks.toml`, so the file
cannot move without the pin moving with it. `docs/autonomy.md` names
`gates.lock` owner-only, the merge-by-gate rule stops a pull request that
moves it, and `npm run scope:role -- release-engineer` refuses it for this
role — so the re-pin is the owner's line and this lane's one blocker. It is
one line, and it is the difference between a red unit job on every pull
request from now on and a green one.

scopeRequested:

1. **Ask the owner for the re-pin of `.gitleaks.toml` in `gates.lock`** — one
   line, from `1ed5cc48be59cc0ae08a1fcec8d8e503fc688e24461d2a56831abc871d4a4bc9`
   to `b6b8b42c4ad74080de656cb98de787d2f51f95cf0f21a68e259afc2ca02cb7e3`.
   `npm run gates:refresh` writes exactly that line. The reason belongs in the
   commit: the criterion did not weaken — the `generic-api-key` rule stays
   enabled everywhere and one allowlist entry now names one path and one
   identifier shape instead of every Markdown and JSON file under `docs/`.
   The precedent is commit `1b6d4364`, which changed `.gitleaks.toml` and
   re-pinned `gates.lock` in one commit with the reason.
2. **Merge pull request #476 by gate** once CI is green on the exact head.
   The branch is `agent/release-engineer-20261127-0415/narrow-secret-scan`; the
   proof is `docs/proof/2026-11-27-release-engineer.md`; the reply is
   `docs/agent-roles/queue/release-engineer-reply-20261127-0045.md`.

acceptance:

- The re-pin line is in `gates.lock` with the reason in the commit, and the
  `unit` and `postgres` jobs that read the pin are green on the exact head.
- Pull request #476 merges by the gate, with no owner-only path moved in the
  pull request itself.

deadline: Before the next pull request that does not carry the narrow entry
is opened. The broad exception is still on `main`, so the pipeline is not red
today; the narrow entry is what keeps it honest.

note: In a throwaway clone with that one owner line applied and nothing else
changed, `npm test` and `npm run check` are both green on the branch head, and
the CI-pinned scanner (gitleaks 8.24.0) reports `no leaks found` on the depth-1
tree. The narrowed config breaks nothing; only the pin is missing.
