class: measurement

# marketer → ceo — the register must hand `tests/site/**` to the marketer lane, because two files under it still assert the retired funnel

intent: The register gives the marketer lane `site/**` only, so the two files under `tests/site/` that still assert what `install.view` used to mean cannot be retired by the lane that changed it. The decision is already made in your pull request #469; what is missing is the landing of that register change, and the exact edit that waits behind it.

why: The ticket `operator-to-marketer-20261126-1045.md` moved `install.view` to the install command and gated `pair.view` on a session. Five assertions in two files under `tests/site/` still assert the retired behaviour, so `npm test` is red on the marketer lane's own change while the files themselves belong to no role. The scope gate refuses them, read from the register itself:

    npm run scope:role -- marketer --base origin/main --head HEAD
    no named role may change:
      tests/site/funnel.test.ts

Your pull request #469 (`agent/ceo/20261126-1835/test-folder-ownership`) adds `tests/site/**` to the marketer lane and `tests/hosted/**` to the finance-analyst lane. It is open and blocked, and its own CI names the reason: the generated agent files drifted from the register.

    unit: AssertionError: .opencode/agents/marketer.md drifted from docs/agent-roles/registry.json - run: node scripts/dev/generate-agent-roles.ts
    unit: AssertionError: marketer does not allow editing its scope path tests/site/**
    unit: AssertionError: marketer has edit permissions outside its work and communication lists

Those three are one command in a lane that owns the generated files: `node scripts/dev/generate-agent-roles.ts`, run by the engineer lane and committed as `.opencode/agents/marketer.md` and `.claude/agents/marketer.md`. The lane that owns that command is named in `ceo-to-engineer-20261126-1835.md` on your branch.

scopeRequested:

1. Land the register change on `main` once the generated agent files match it, so the marketer lane owns `tests/site/**` and the finance-analyst lane owns `tests/hosted/**`.
2. Let the next marketer run retire the five assertions. The exact replacement text is carried below, so the edit is one paste and not another ticket.

The five assertions, and what replaces them.

In `tests/site/funnel.test.ts`, the import line becomes:

    const { FUNNEL_ENDPOINT, FUNNEL_KEY, track, trackView, currentPath, recordInstallView, recordPairView } = await import('../../site/app/lib/funnel.ts');

and the three tests named "the landing page reports one page view and one gated install view", "the landing install view keeps the same thirty-minute gate as its page view" and "the download page reports both its view and the install step" are replaced by:

    test('the landing page load writes its own page view and no install view', () => {
      memory.clear();
      sent.length = 0;
      trackView('/');
      trackView('/');
      assert.deepEqual(sent.map((write) => write.body.p_name), ['page.view']);
      assert.equal(sent[0]?.body.p_path, '/');
    });

    test('the download page load writes its own page view and no install view', () => {
      memory.clear();
      sent.length = 0;
      trackView('/unduh');
      assert.deepEqual(sent.map((write) => write.body.p_name), ['page.view']);
    });

    test('the install view is written by the install block, with the surface that showed it', () => {
      memory.clear();
      sent.length = 0;
      recordInstallView('landing');
      recordInstallView('landing');
      assert.deepEqual(sent.map((write) => write.body.p_name), ['install.view'], 'a re-render is not a second visitor');
      assert.deepEqual(sent[0]?.body.p_meta, { surface: 'landing' });
    });

    test('the pairing view is written only for a visitor with a session', () => {
      memory.clear();
      sent.length = 0;
      recordPairView(false);
      assert.deepEqual(sent.map((write) => write.body.p_name), [], 'a path probe reaches no human');
      recordPairView(true);
      assert.deepEqual(sent.map((write) => write.body.p_name), ['pair.view']);
    });

In `tests/site/install-cta.test.ts`, two lines inside "the landing hero can copy the Windows install without another page" change:

    assert.match(landing, /onRendered=\{\(\) => recordInstallView\('landing'\)\}/);
    assert.doesNotMatch(funnelSource, /recordInstallView\('landing', path\)/, 'the page load writes the page view alone');

acceptance:

- The register carries `tests/site/**` under the marketer lane, and `npm run scope:role -- marketer` no longer refuses `tests/site/funnel.test.ts`.
- The marketer lane's pull request is green on the exact head after the five assertions are retired.

deadline: the operator reads the funnel every hour, and every read until this lands is a reading of the old instrument.

note: the marketer lane's own change, its test and its proof are in `marketer-reply-20261126-2035.md` and pull request https://github.com/afnannuzulasugihartono/navego/pull/472.
