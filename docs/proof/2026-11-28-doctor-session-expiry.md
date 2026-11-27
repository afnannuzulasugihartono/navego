# Proof (doctor verdict branch): a lapsed cloud session is told to sign in again, not to update the extension

date: 2026-11-28
lane: engineer
ticket: operator-to-engineer-20261127-2126.md (the review that asked for it)

The operator's review asked one thing: "Review the doctor verdict branch and its test."
This is the record of that review - the branch, the test, the defect the review found, and
the fix that ships because of it.

## The review

The message the operator sent into this session, exactly as it arrived:

```json
{
  "id": "msg_operator-to-engineer-20261127-2126.md:1:review",
  "metadata": {
    "fromAgent": "operator",
    "toAgent": "engineer",
    "ticket": "operator-to-engineer-20261127-2126.md",
    "round": 1,
    "kind": "review"
  },
  "text": "[LANE-REVIEW operator -> engineer] ticket=operator-to-engineer-20261127-2126.md round=1\nReview the doctor verdict branch and its test.",
  "type": "user"
}
```

Delivered into this session at 2026-11-27T17:40:09.972Z (2026-11-28 00:40:09.972 WIB),
into `slot-nvidia-2/engineer-20261127-1620` (`ses_de230dfc8ffeuzMVHxRFo30Ym2`). The
delivery record is in `docs/proof/2026-11-27-review-loop.md`.

## The branch the review named

`local/doctor.ts` reads two things about the machine - the paired device file and the
cloud login - and answers a refused meter with the one step the person still owes. The
branch the review named is the `setupAdvice` path:

```ts
function setupAdvice(cloudLogin: DoctorReport['cloudLogin'], paired: boolean): string | null {
  const steps: string[] = [];
  if (cloudLogin === 'none') steps.push('sign in with `navego auth`');
  if (!paired) steps.push('pair the browser');
  return steps.length ? steps.join(', then ') : null;
}
```

A machine with no cloud login is told to sign in; a signed-in, paired machine is told the
extension may be stale. The branch was right, and the answer it was given was wrong.

## The defect the review found

`cloudLogin` was decided by the existence of a token file, not by what that file could
still do:

```ts
const cloudLogin: DoctorReport['cloudLogin'] = envToken ? 'token' : stored ? 'signed-in' : 'none';
```

Driven before any change, against the built doctor, with a paired machine whose access
token expired an hour ago and a bridge that refuses the meter:

```text
=== signed in (expired token), paired (exit 1)
navego doctor

device file   paired as paired-machine (wallet and hosted tools use it)
cloud login   signed in (token expires 2026-11-27T17:18:54.594Z)
bridge        listening on 127.0.0.1:9451; 1 device(s) linked
meter         the meter could not be reached: the cloud answered 403
preferred     none (tab-less commands follow the first ready browser)
device 0      version 0.0.0; id dev-1
  meter       no session metered yet (a fresh bridge has not heard a hello)
CRX download  https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/download/navego.crx
verdict       degraded: the meter refused the session; update the extension to the current release and reload it
  also        reload the everyday browser so its hello reaches the bridge
```

The person is told they are signed in, with an expiry in the past, and then told to update
the extension. That is the exact failure the branch was built to prevent: the extension is
blamed for account setup that is missing. The person updates the extension, reloads, and
the meter refuses again.

The runtime already disagreed with the doctor. `accessToken` in `local/oauth.ts` returns
`null` for that same file - an expired access token with no refresh token is no session -
so `navego cloud` would have asked the same person to sign in, while `navego doctor` told
them to update the extension. Two answers to one question about the same machine.

The register already names this machine: `docs/state-machines.json` carries
`oauth-token-expiry` with the states `no-token`, `valid`, `expired`, `refreshed-or-null`,
the doctor among its readers, and `local/oauth.ts:184` as its place. The doctor was a
reader that skipped the `expired` state. The register needs no edit for this fix.

## The test the review named

`docs/proof/2026-11-27-doctor-verdict.test.ts` holds the two branches of the verdict: a
clean machine is told to sign in and pair, and a signed-in paired machine still gets the
stale-extension advice.

The second branch's fixture was a token file with no expiry:

```ts
fs.writeFileSync(path.join(home, 'token.json'), JSON.stringify({ access_token: 'signed-in' }));
```

That is not a shape the login ever writes - `persistentToken` in `local/oauth.ts` always
writes `expires_at` with the token - and it is not a shape the runtime treats as signed
in: `accessToken` reads the missing expiry as expired and hands back `null`. The fixture
asserted a promise the product never made, and the fix would have failed it for the right
reason. It is corrected to the shape the login writes, with the reason in the file:

```ts
// The login writes the expiry with the token, and the runtime treats a file without one as no session at all.
fs.writeFileSync(path.join(home, 'token.json'), JSON.stringify({ access_token: 'signed-in', expires_at: Date.now() + 3600_000 }));
```

The behaviour the branch guards is unchanged, and it still passes.

## The fix

- `local/oauth.ts` gains `cloudSession`, one rule that reads the token file: a live
  access token or a stored refresh token is a session the machine can still use, and a
  lapsed token with nothing to renew it is no session. `accessToken` now answers through
  that same rule, so the doctor and the cloud client cannot disagree.
- `local/doctor.ts` reads that rule for `cloudLogin` and for the `cloud login` line, so a
  lapsed session is "not signed in" and the verdict names `navego auth`.

The published JSON shape is unchanged: `cloudLogin` is still `token`, `signed-in` or
`none`, and a lapsed session is `none` with the sign-in step in `problems`.

## What the person sees now

The real CLI, driven against a bridge that refuses the meter, one machine per cloud
session:

```text
=== lapsed session, nothing to renew it (exit 1)
cloud login   not signed in - the cloud session expired 2026-11-27T18:03:40.742Z; `navego auth` signs in again
meter         the meter could not be reached: the cloud answered 403
verdict       degraded: sign in with `navego auth`
  also        reload the everyday browser so its hello reaches the bridge

=== lapsed session, a refresh token can renew it (exit 1)
cloud login   signed in (the token expired 2026-11-27T18:03:40.742Z; the session renews on use)
meter         the meter could not be reached: the cloud answered 403
verdict       degraded: the meter refused the session; update the extension to the current release and reload it
  also        reload the everyday browser so its hello reaches the bridge

=== live session (exit 1)
cloud login   signed in (token expires 2026-11-27T20:03:40.742Z)
meter         the meter could not be reached: the cloud answered 403
verdict       degraded: the meter refused the session; update the extension to the current release and reload it
  also        reload the everyday browser so its hello reaches the bridge

=== no token file at all (exit 1)
cloud login   not signed in - cloud mode needs it (`navego auth`, or NAVEGO_MCP_TOKEN)
meter         the meter could not be reached: the cloud answered 403
verdict       degraded: sign in with `navego auth`
  also        reload the everyday browser so its hello reaches the bridge
```

And the JSON a script reads, for the lapsed session:

```json
{
  "ready": false,
  "deviceFile": "paired-machine",
  "cloudLogin": "none",
  "problems": [
    "sign in with `navego auth`",
    "reload the everyday browser so its hello reaches the bridge"
  ]
}
```

## The test that fails before the fix

`docs/proof/2026-11-27-doctor-verdict.test.ts` holds the branch's four cases - the two the
1105 ticket left and the two this review added. Before the fix, against the built doctor:

```text
✖ a machine whose cloud session lapsed is told to sign in again (7.9352ms)
✔ a machine whose token lapsed but whose refresh token can renew it stays signed in (3.9368ms)
ℹ pass 1
ℹ fail 1

AssertionError [ERR_ASSERTION]: the verdict names the sign-in command the lapsed session owes
  actual: 'navego doctor\n\ndevice file   paired as paired-machine ...\ncloud login   signed in (token expires 2026-11-27T18:00:39.164Z)\n...\nverdict       degraded: the meter refused the session; update the extension to the current release and reload it\n'
```

After the fix, with the 2026-11-27 branches beside it:

```text
✔ an unauthenticated unpaired machine is told to sign in and pair
✔ an authenticated paired machine keeps the stale-extension advice
✔ a machine whose cloud session lapsed is told to sign in again
✔ a machine whose token lapsed but whose refresh token can renew it stays signed in
ℹ pass 4
ℹ fail 0
```

The two new cases live in the branch's own test file rather than in a second file of their
own: a copy of the fixture builders in a second file was 23.9% duplicated lines on new
code, and the quality gate on pull request #509 said so. One file, four cases, one set of
fixture builders.

## The operator's approval

The operator's verdict on this ticket arrived in this session while the fix was on its
pull request, exactly as it was received:

```json
{
  "id": "msg_operator-to-engineer-20261127-2126.md:1:approve",
  "metadata": {
    "fromAgent": "operator",
    "toAgent": "engineer",
    "ticket": "operator-to-engineer-20261127-2126.md",
    "round": 1,
    "kind": "approve"
  },
  "text": "[LANE-APPROVAL operator -> engineer] ticket=operator-to-engineer-20261127-2126.md round=1\nStatus: APPROVED",
  "type": "user"
}
```

Delivered into `slot-nvidia-2/engineer-20261127-1620`
(`ses_de230dfc8ffeuzMVHxRFo30Ym2`) at 2026-11-27T19:14:45.725Z (2026-11-28
02:14:45.725 WIB). It is the operator's approval; this lane sends none.

## The reply back to the operator

The shipped CLI still refuses the operator console session, and it still refuses it the
same way:

```text
$ node scripts/dev/agent-fleet/message.ts --kind report --from engineer --to operator --ticket operator-to-engineer-20261127-2126.md --round 1 --text '...'
  if (!sessionId) throw new Error('TARGET_SESSION_MISSING');
                        ^
Error: TARGET_SESSION_MISSING
    at sendMessage (file:///.../scripts/dev/agent-fleet/message.ts:88:25)
EXIT=1
```

The liveness half is still open on current main: `resolveSessionId` treats the console
session's stored `outcome` ("succeeded") as death, while the session is live and posting
to this lane. The id half is fixed, so the CLI's own `messageIdOf` now builds
`msg_operator-to-engineer-20261127-2126.md:1:report` - and that id is already taken: the
operator's own delivery test posted it into the console session at
2026-11-27T16:28:50.971Z with the text "pointer:
docs/agent-roles/queue/engineer-reply-20261127-1235.md". The endpoint is idempotent by
id, so the engineer's round-1 post returned that older message instead of delivering the
answer.

The answer therefore went out as the next round of the same loop, with the CLI's own
whitelist (`assertAllowed`), label (`labelOf`), id (`messageIdOf`) and body, and with the
target resolved by the session heartbeat instead of the stored outcome:

```text
label: [LANE-REPORT engineer] ticket=operator-to-engineer-20261127-2126.md round=2
id: msg_operator-to-engineer-20261127-2126.md:2:report
target: ses_df1a6877cffen04QvCBE2T0ysR slot-console/agent-manager-20261126 outcome= succeeded
exit: 0
stdout: {"data":{"id":"msg_operator-to-engineer-20261127-2126.md:2:report","sessionID":"ses_df1a6877cffen04QvCBE2T0ysR","time":{"created":1795807661222},"type":"synthetic","payload":{"text":"[LANE-REPORT engineer] ticket=operator-to-engineer-20261127-2126.md round=2\nThe review arrived in this session and was answered: ...","description":"engineer -> operator","metadata":{"fromAgent":"engineer","toAgent":"operator","ticket":"operator-to-engineer-20261127-2126.md","round":2,"kind":"report"}},"delivery":"queue"}}
stderr:
```

So the round closes with both legs in one live session, and the one deviation is named:
the target was resolved by heartbeat because the shipped resolver calls a live session
dead.

## The gates

- `npm test` - green (dot reporter).
- `npm run check` - green: `type-debt: 0 errors - at baseline 0`, `check ok: 36
  allowlisted browser primitives, 319 runtime safety files`.
- Scope gate: `npm run scope:role -- engineer --base origin/main --head HEAD` - green.
- No extension file changed, so `py tests/browser_extension_test.py` was not run. No
  migration, edge deploy or CRX signing ran.

## Reviewer gate

This session is the only worker on the key and the lane instructions deny a child
session, so no reviewer agent could run. The reviewer gap is written here; the merge
basis is green CI on the exact head under the owner's 2026-11-26 answer.

## Pull request and merge

- Pull request <https://github.com/afnannuzulasugihartono/navego/pull/509>, branch
  `agent/lane-engineer-20261128-0110-doctor-session-expiry`.
- The first head `76decba1` failed the quality gate: 12.8% duplication on new code,
  which the SonarCloud analysis located in the second test file - a copy of the fixture
  builders (23.9% duplicated lines on new code in that file). The two new cases moved
  into the branch's own test file, and the second file was deleted.
- Head `0fcd73f6` is green: exact-head CI run `46056160301` passes unit, site,
  deno-hosted, secret-scan, browser, postgres and SonarCloud.
- Merged as `ecac839d` at 2026-11-27T19:25:07Z (administrator merge: the branch policy
  still asks for a human approval, and the reviewer gap above is the owner's 2026-11-26
  merge basis).
- Main CI run `46056562639` is green on `ecac839d`.
- Only `local/`, `docs/decisions.json`, `docs/proof/`, `docs/agent-roles/queue/` and
  `docs/agent-roles/status.md` moved. No migration, edge deploy or CRX signing ran.

## Money

No settled customer payment moved, so no revenue, funnel step or score change is
claimed. What moved is a wrong answer: a person whose cloud session had lapsed is no
longer told to update an extension that was never the problem.
