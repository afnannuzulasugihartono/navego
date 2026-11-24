#!/usr/bin/env node

// @last-edited: 2026-11-08 UTC+7.
// @title: navego - the installed entry point: one command, two modes.
// @state: the mode comes from the first argument; each mode starts the server it names.
// @dependencies: ./navego-local.js for the local mode.

// THE MODE IS AN ARGUMENT AND NOT A FLAG.
// A caller that has to remember a flag has two ways to get it wrong; a caller that names the mode cannot.
// The modes share every tool name and every answer shape, so the choice is only about who drives the browser.

const USAGE = `navego <mode>

  local      drive the everyday browser on this machine, over the loopback bridge
  cloud      drive it through the hosted Navego server
  auth       sign in with a browser and keep the token beside this install
  doctor     print what is connected, the plan, and what the plan allows (--json for scripts)
  failures   print what broke on this machine: counts by tool and code, plus the agent's feedback notes (--tool=name, --limit=N, --json)
  feedback   record what the agent saw while driving, e.g. navego feedback browser_read_page "canvas editors block every docs drive"
  economy    read the money ledger, score decisions, keep the knowledge library, and ask whether a spend keeps the reserve
  install    detect this machine's browsers, register the extension, keep a verified CRX backup
  uninstall  remove the extension's policy entries, the Navego folder, and this package; prints what it cannot remove

  --help     print this
`;

const requested = process.argv[2] || 'local';
const mode = requested.startsWith('--mode=') ? requested.slice('--mode='.length) : requested;

if (mode === 'help' || process.argv.includes('--help')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

// Each mode loads its own module on demand: a static import for every mode would pull the browser stack into `navego doctor` and `navego economy`, and the modes do not share one runtime.

if (mode === 'doctor') {
  const { doctor } = await import('../doctor.js');
  const args = process.argv.slice(2).filter(a => a.startsWith('--'));
  process.exitCode = await doctor({ args });
} else if (mode === 'local') {
  await import('./navego-local.js');
} else if (mode === 'cloud') {
  const { serveCloud } = await import('../cloud.js');
  process.exitCode = await serveCloud();
} else if (mode === 'auth') {
  const { login } = await import('../oauth.js');
  try {
    const answer = await login();
    process.stdout.write('Signed in. The token is stored in ' + answer.file + '\n');
  } catch (error: unknown) {
    process.stderr.write('Sign-in did not finish: ' + String((error as Error)?.message || error) + '\n');
    process.exitCode = 4;
  }
} else if (mode === 'failures') {
  const { failures: runFailures } = await import('../failures.js');
  process.exitCode = await runFailures({ args: process.argv.slice(2).filter((a) => a.startsWith('--')) });
} else if (mode === 'feedback') {
  const { feedback: runFeedback } = await import('../failures.js');
  process.exitCode = await runFeedback({ args: process.argv.slice(3) });
} else if (mode === 'economy') {
  const { economy: runEconomy } = await import('../economy-cli.js');
  process.exitCode = await runEconomy({ args: process.argv.slice(3) });
} else if (mode === 'install') {
  const { installFromCli } = await import('../install.js');
  process.exitCode = await installFromCli();
} else if (mode === 'uninstall') {
  const { uninstallFromCli } = await import('../install.js');
  process.exitCode = await uninstallFromCli();
} else {
  process.stderr.write(`Unknown mode: ${mode}\n${USAGE}`);
  process.exit(2);
}
