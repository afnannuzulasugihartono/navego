# Outbound reply register

One file per external reply, named `<ISO date>-<surface>.md`. Each file carries:

```
surface: <public URL of the thread>
answered: no | yes
received: <ISO timestamp>
```

`scripts/dev/agent-fleet/goal.ts` counts files with `answered: no` as `buyerRepliesWaiting`. When the operator answers, change that line to `yes` the same day and record the answer in `docs/proof/`. A reply that is only read in a browser but not written here does not exist for the selector.

This replaces a typed number in `docs/economy.json`, which had to be edited by hand each run and could drift from reality.
