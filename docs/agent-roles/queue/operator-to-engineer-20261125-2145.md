# operator → engineer — one key, one worker: run two lanes at once and add keys later

intent: The owner has two NVIDIA keys today and expects to add more later. One
session currently handles several roles, so the work must be splittable: two
keys must be able to run two lanes at the same time, and a third key must need
nothing but one more provider entry and one more dispatcher.

why: The dispatcher built on 2026-11-25 opens one child session per hour, and
that child inherits the model of the session that created the automation
(`console-nvidia/minimaxai/minimax-m3.1-flash`), so every lane currently runs
on the same credential and the lanes cannot overlap. The owner wants the
capacity split by key, and the split point is the model a lane's session runs
on. OpenCode documents exactly that: a provider is keyed by id and reads its
credential from `env` or from a file with `{file:path}`, an agent may pin a
`model`, and `opencode run` takes `--model provider/model`, `--agent <name>`
and `--worktree <name>`.

scopeRequested:

1. Turn the dispatcher into a roster-driven worker. A script beside
   `scripts/dev/generate-agent-roles.ts` (call it `run-lane-worker.ts`) reads
   `docs/agent-roles/keys.json`, picks the slot whose credential is present,
   reads the queue, chooses the ticket (money before measurement, oldest
   first, skipping a ticket that already carries a started marker), and starts
   the lane as a separate process: `opencode run --model <slot model> --agent
   <lane> --worktree <name> "<the lane brief>"`. The script never reads or
   prints a key; it only checks that the credential file or environment
   variable exists.
2. Keep the slot roster as the one source: `docs/agent-roles/keys.json` names
   the provider, the model, where the credential lives and which lanes the
   slot serves, and it never holds a secret. The gate
   (`tests/tooling/agent-roles.test.ts`) refuses a roster row without those
   four fields.
3. Ship the second provider in the repository's `opencode.json`:
   `nvidia-b`, `canonical: "nvidia"`, with
   `settings.apiKey = "{file:~/.config/opencode/nvidia-api-key-b}"` and the
   model `nvidia-b/minimaxai/minimax-m3.1-flash`. The first key stays where it
   is (`env:NVIDIA_API_KEY` on the `nvidia` provider). The owner places the key
   file; no agent reads it.
4. Run the dispatcher once per slot, on different minutes so two lanes can
   overlap: slot `key-a` at :25 and slot `key-b` at :35, each starting the
   worker with its own model. One more key is then one more provider entry,
   one more roster row, and one more dispatcher.
5. Say plainly in `docs/agent-roles.md` and the roster that two keys from one
   NVIDIA account are not two accounts: each key's own quota and the
   provider's terms apply, so a slot stays inside its key's documented limit,
   and a key is never used to sidestep another key's limit.

acceptance:

- `npm test` and `npm run check` are green, plus the site build when the
  generated-role change touches the site.
- A test proves the roster shape and that the second provider in
  `opencode.json` reads its credential from the file path the roster names,
  with no key material in the repository.
- A dry run of the worker script prints the slot, the lane, the ticket and the
  command it would run, and prints no credential value.
- Two lanes can be open at once: one worker on key A and one on key B, each in
  its own worktree.

deadline: the dispatcher runs every hour; the sooner two slots exist, the
sooner the research and sales lanes can overlap instead of queue behind each
other.
