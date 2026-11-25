# operator → engineer — one credential, one worker: run three lanes at once and add accounts later

class: measurement

intent: The owner runs three NVIDIA routes: the personal/console one and two
ordinary NVIDIA accounts (`nvidia` and `nvidia2`). One session currently
handles several roles, so the work must be splittable: three routes must be
able to run three lanes at the same time, and a fourth account must need
nothing but one more provider entry and one more dispatcher.

why: The dispatcher built on 2026-11-25 opens one child session per hour, and
that child inherits the model of the session that created the automation
(`console-nvidia/minimaxai/minimax-m3.1-flash`), so every lane currently runs
on the same route and the lanes cannot overlap. The owner wants capacity split
by credential, and the split point is the model a lane's session runs on.
OpenCode documents exactly that: a provider is keyed by id and reads its
credential from `env` or from a file with `{file:path}`, an agent may pin a
`model`, and `opencode run` takes `--model provider/model`, `--agent <name>`
and `--worktree <name>`.

scopeRequested:

1. Replace the operator's shell-action worker with a tested script. The
   operator already put a working worker in place as a shell action (two
   automations, one per ordinary account, at :25 and :35); it reads
   `docs/agent-roles/keys.json`, picks the ticket (money before measurement,
   oldest first, skipping a ticket that already carries a lane started marker
   or a lane reply), writes the marker, and starts the lane as a separate
   process: `opencode run --model <slot model> --agent <lane> --worktree
   <name> --title "<slot session>" --archived --auto "<the lane brief>"`. The
   script beside `scripts/dev/generate-agent-roles.ts` (call it
   `run-lane-worker.ts`) must do the same, with the logic under test.
2. Keep the request budget bounded. A worker must never run inside the
   operator conversation: that route spends the conversation's own budget,
   and NVIDIA answers at 40 requests per minute. The generated role files
   already carry a step limit; the worker keeps one lane per session and one
   session per credential, so a key's minute is never spent in a burst.
3. Refuse a credential that is already in use. Before starting, the worker
   hashes each available credential locally (SHA-256 over the key file's
   contents or the environment variable's value) and compares the digests
   across the slots it can see. If a slot's digest already belongs to another
   slot, that slot is refused and the run says "credential collision" without
   naming the credential. Only the first eight characters of a digest may be
   written to the run's record, so the proof shows that two accounts really
   used two different credentials without ever holding one.
4. Keep the slot roster as the one source: `docs/agent-roles/keys.json` names
   the provider, the model, where the credential lives, the session that slot
   owns, whether the slot runs lane workers, and which lanes the slot serves,
   and it never holds a secret. The gate
   (`tests/tooling/agent-roles.test.ts`) refuses a roster row without those
   fields, and refuses two rows that name the same credential source or the
   same session.
5. Keep the second ordinary account in the repository's `opencode.json`:
   `nvidia2`, `canonical: "nvidia"`, with
   `settings.apiKey = "{file:~/.config/opencode/nvidia-api-key-2}"` and the
   model `nvidia2/minimaxai/minimax-m3.1-flash`. The first account stays where
   it is (`env:NVIDIA_API_KEY` on the `nvidia` provider) and the personal
   route stays the signed-in `console-nvidia` provider, reserved for the
   operator conversation. The owner places the key file; no agent reads it.
6. Keep the ticket class in the ticket itself: each ticket carries
   `class: money` or `class: measurement`, so the worker can take a money
   ticket first without guessing from the file name.
7. Say plainly in `docs/agent-roles.md` and the roster that two ordinary
   accounts are not two credits: each account's own quota and the provider's
   terms apply, so a slot stays inside its credential's documented limit, and
   no slot is used to sidestep another one's limit.

acceptance:

- `npm test` and `npm run check` are green, plus the site build when the
  generated-role change touches the site.
- A test proves the roster shape: every slot names a provider, a model, a
  credential source, a session, whether it runs lane workers and its lanes;
  no two slots share a credential source; no two slots share a session.
- A test proves the ticket class is read from the ticket, and that the worker
  takes a money ticket before a measurement one.
- A test proves the second ordinary account in `opencode.json` reads its
  credential from the file path the roster names, with no key material in the
  repository.
- A dry run of the worker script prints the slot, the lane, the ticket, the
  credential digest's first eight characters and the command it would run, and
  prints no credential value.
- Two slots whose credentials resolve to the same digest are refused: a test
  proves the refusal, not only the pass.
- Two lanes can be open at once, one per ordinary account, each in its own
  worktree and its own session, while the operator conversation keeps the
  console route for itself.

deadline: the dispatcher runs every hour; the sooner three slots exist, the
sooner the research and sales lanes can overlap instead of queue behind each
other.
