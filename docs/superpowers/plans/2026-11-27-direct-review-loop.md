# Direct Review Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the four lanes a real, labelled, whitelisted message channel so a lane report wakes the operator, the operator reviews in the same worker session, and the loop ends on approval or at round four.

**Architecture:** One focused module builds the message contract (label, idempotency id, sender whitelist), resolves target sessions by title from the existing liveness evidence, and posts through the OpenCode local API with `delivery: "queue"` and `resume: true`. The dispatcher prompt tells a lane to report through this module; git artifacts stay the source of truth, messages stay notifications and pointers.

**Tech Stack:** TypeScript strict, Node `node:test`, existing `scripts/dev/agent-fleet/watch.ts` evidence helpers, OpenCode local HTTP API through the `opencode api` CLI, JSON roster in `docs/agent-roles/keys.json`.

**Spec:** `docs/superpowers/specs/2026-11-27-agent-org-architecture-design.md` (sections Orchestration pattern selection, Communication contract, Known gaps P0/P1).

## Global Constraints

- No `subagent` action in any generated role file. One session per credential slot.
- Loop cap: three revisions, then a fresh ticket; never a fourth review round.
- Every message uses `delivery: "queue"` and `resume: true` - immediate for an idle session, non-interrupting for a busy one. `steer` is forbidden.
- Closed label set: `[LANE-REPORT <lane>]`, `[LANE-REVIEW operator -> <lane>]`, `[LANE-APPROVAL operator -> <lane>]`. The label is in the visible text because metadata is not model-visible.
- Whitelist: a lane may only report to `operator`; only `operator` may send `review` or `approve`. The operator session is the newest non-terminal session whose title starts with `slot-console`.
- Git queue/reply artifacts remain authoritative. A message carries a pointer to them, never the only copy of a result.
- No acceptance gate, `gates.lock`, workflow or boundary lock is changed. No money claim.

## Review Focus

- A lane tries to report to another lane or forge an operator message: must be refused by the whitelist before any API call. Tested in Task 1.
- The same report is sent twice after a retry: must return the original message id, not post a duplicate. Tested in Task 2.
- The operator session is mid-work: must use `queue`, never `steer`, and must still set `resume: true`. Tested in Task 2.
- The target session is terminal or missing: resolver must return null so the caller can open a fresh session for the same ticket without resetting the round. Tested in Task 2.
- A lane tries to send round four: must be refused by the cap. Tested in Task 1.

---

### Task 1: Message contract - label, id, whitelist, round cap

**Files:**
- Create: the planned scripts/dev/agent-fleet/message.ts
- Create: the planned tests/tooling/agent-fleet-message.test.ts
- Modify: `docs/agent-roles/keys.json` (add `messagePairs` and `operatorSessionTitle`)

**Interfaces:**
- Consumes: `docs/agent-roles/keys.json` roster shape from `scripts/dev/agent-fleet/watch.ts`.
- Produces: `MessageKind = 'report' | 'review' | 'approve'`; `LaneId = 'operator' | 'engineer' | 'sales-rep' | 'onboarding-guide'`; `MessageInput {kind, from, to, ticket, round, text}`; `labelOf(input): string`; `messageIdOf(input): string`; `assertAllowed(input, roster): void`. Later tasks use these exact names.

- [ ] **Step 1: Write the failing tests**

In the planned tests/tooling/agent-fleet-message.test.ts, pin: `labelOf({kind:'report',from:'engineer',ticket:'t.md',round:1})` equals `[LANE-REPORT engineer] ticket=t.md round=1`; `messageIdOf` equals `t.md:1:report`; `assertAllowed` throws for engineer->sales-rep, for sales-rep->engineer, for operator->operator, and for `round >= 4`; `assertAllowed` accepts engineer->operator report and operator->engineer review.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test --test-reporter=dot tests/tooling/agent-fleet-message.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the contract in the planned scripts/dev/agent-fleet/message.ts**

Define the types and three functions above. `messagePairs` in the roster holds allowed `{from, to, kinds}` triples. `operatorSessionTitle` is `slot-console`. Round validation accepts 1..3 only; a fourth round throws with `ROUND_LIMIT_REACHED`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test --test-reporter=dot tests/tooling/agent-fleet-message.test.ts`
Expected: PASS with all assertions.

- [ ] **Step 5: Commit**

`git add scripts/dev/agent-fleet/message.ts tests/tooling/agent-fleet-message.test.ts docs/agent-roles/keys.json && git commit -m "Add labelled, whitelisted message contract for the review loop"`

---

### Task 2: Session resolution and idempotent send

**Files:**
- Modify: the planned scripts/dev/agent-fleet/message.ts
- Modify: the planned tests/tooling/agent-fleet-message.test.ts
- Modify: `scripts/dev/agent-fleet/watch.ts` only if a new exported session-title helper is needed (prefer no change)

**Interfaces:**
- Consumes: `readEvidence()` from `watch.ts`; `SessionInfo` shape `{id,title,agent,parentId,outcome,updatedMs}`; `labelOf`, `messageIdOf`, `assertAllowed` from Task 1.
- Produces: `resolveSessionId(titlePrefix: string, sessions: SessionInfo[]): string | null`; `sendMessage(input: MessageInput, deps: {cli: string; run: (args: string[]) => Promise<string>; sessions: SessionInfo[]}): Promise<{id:string; sessionId:string; alreadyDelivered:boolean}>`.

- [ ] **Step 1: Write the failing tests**

Pin: `resolveSessionId('slot-console', sessions)` picks the newest session with no `outcome` and returns null when every candidate has an outcome. `sendMessage` calls the injected runner with a JSON body containing `delivery:"queue"`, `resume:true`, `metadata.fromAgent`, and visible text whose first line is `labelOf(input)`. A second call with the same id returns `alreadyDelivered:true` without a second runner call.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test --test-reporter=dot tests/tooling/agent-fleet-message.test.ts`
Expected: FAIL on missing exports.

- [ ] **Step 3: Implement resolver and send**

Use `opencode api post /api/session/{id}/synthetic` for reports and `/api/session/{id}/prompt` for reviews/approvals, passing the idempotency `id` from Task 1. Refuse a target session with any truthy outcome. Do not invent a fallback: return null and let the caller create a fresh ticket.

- [ ] **Step 4: Run the tests and the full gates**

Run: `node --test --test-reporter=dot tests/tooling/agent-fleet-message.test.ts && npm test && npm run check`
Expected: all PASS; `type-debt: 0 errors`.

- [ ] **Step 5: Commit**

`git add scripts/dev/agent-fleet/message.ts tests/tooling/agent-fleet-message.test.ts && git commit -m "Resolve review targets and send idempotent queue-delivered messages"`

---

### Task 3: CLI wiring and dispatcher prompt

**Files:**
- Modify: the planned scripts/dev/agent-fleet/message.ts (add `parseArgs` and a `main` guard like `dispatch.ts`)
- Modify: `scripts/dev/agent-fleet/dispatch.ts:143-154` (append one prompt line)
- Modify: `tests/tooling/agent-dispatch.test.ts` (pin the new prompt line)
- Create: `docs/agent-roles/queue/operator-to-engineer-20261127-1105.md` already exists; no new ticket

**Interfaces:**
- Consumes: `sendMessage` from Task 2; `buildPrompt` from `dispatch.ts`.
- Produces: CLI flags `--kind <report|review|approve> --from <lane> --to <lane> --ticket <file> --round <n> --text <string>`. Prompt line names that command form.

- [ ] **Step 1: Write the failing prompt test**

Assert `buildPrompt(ticket, stamp)` contains `A review message is sent through scripts/dev/agent-fleet/message.ts with --kind`, and that it still forbids subagents.

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test --test-reporter=dot tests/tooling/agent-dispatch.test.ts`
Expected: FAIL on the new assertion.

- [ ] **Step 3: Implement CLI and prompt line**

Add a `main` guard to `message.ts` that parses the five flags, calls `assertAllowed` then `sendMessage`, prints the message id and `alreadyDelivered`, and exits non-zero with the reason on refusal. Add the single prompt line to `dispatch.ts` after the product-ticket requirement.

- [ ] **Step 4: Run the gates**

Run: `npm test && npm run check && npm run roles:check`
Expected: all PASS.

- [ ] **Step 5: Commit**

`git add scripts/dev/agent-fleet/message.ts scripts/dev/agent-fleet/dispatch.ts tests/tooling/agent-dispatch.test.ts && git commit -m "Wire the labelled message CLI into the lane dispatcher prompt"`

---

### Task 4: Prove one real round

**Files:**
- Create: `docs/proof/<date>-review-loop.md`
- Modify: `docs/agent-roles/status.md`

**Interfaces:**
- Consumes: the CLI from Task 3 and a live worker session on one NVIDIA slot.

- [ ] **Step 1: Run the real sequence**

With the engineer ticket already queued, call `message.ts report --kind report --from engineer --to operator --ticket <ticket> --round 1 --text '<pointer to reply artifact>'`, read the operator inbox, post one review with `--kind review --from operator --to engineer`, and confirm the same worker session receives it. Do not post an approval until the artifact is read.

- [ ] **Step 2: Record the evidence**

Write the session titles, message ids, labels, `delivery`, `resume`, and the exact command outputs to the proof file. Update only the operator line of `docs/agent-roles/status.md`.

- [ ] **Step 3: Commit and ship**

Run `npm test && npm run check`, commit the proof and status, then ship through the normal pull request and merge-by-gate path. Record the reviewer gap if the reviewer agent cannot run.

- [ ] **Step 4: Stop condition**

If the worker session is terminal, do not retry the loop: create a fresh ticket for the same scope with the round preserved, and write the failure into the proof.
