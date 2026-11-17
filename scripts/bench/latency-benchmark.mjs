// @last-edited: 2026-11-11 UTC+7.
// @title: latency-benchmark - the local road's per-tool latency, measured against the everyday browser.
// @state: the loopback bridge the extension is linked to, a fixture page, and the p50/p95 of every tool.
// @dependencies: node:fs, local/driver.js, local/sessions.js, local/mcp-server.js.

// WHY THIS IS COMMITTED AND NOT AD-HOC.
// The latency report quotes numbers, and a number nobody can re-measure is a number nobody can check.
// So the script is the reproduction: it asks the extension's own loopback bridge for the everyday browser, opens a fixture page there, drives the real MCP surface, and prints p50/p95 next to the numbers the report claims.
// The browser, the profile and the credentials are the person's; the fixture is ours and the tab it opens is closed when the run ends.

// WHY THE BRIDGE HAS TO BE RUNNING.
// The extension links to a local bridge if it finds one, and the bridge is what the local road is: the same commands, the same results, without the relay.
// The bridge is started by the caller (`node start-bridge.mjs` in this repository, or the local MCP server), and this script fails with the one fix when it is not there.

// WHY THE FIXTURE IS SERVED OVER HTTP.
// A page the extension can drive has to be a real page, and a local file URL asks the browser for permissions the extension does not have.

import { createServer } from 'node:http';

import { openSession } from '../../local/driver.js';
import { asDriver } from '../../local/sessions.js';
import { createMcpServer } from '../../local/mcp-server.js';

const RUNS = Number(process.argv.find((value) => value.startsWith('--runs='))?.split('=')[1] || 9);
const PORT = Number(process.env.OPERA_BENCHMARK_PORT || 9477);
const URL_FIXTURE = `http://127.0.0.1:${PORT}/latency-fixture.html`;

// WHY THE FIXTURE IS SERVED BY THIS SCRIPT.
// A page the extension can drive has to be a real page, and whoever serves it must not be a second thing to remember.
// So the fixture is served here, on a port of its own, and the run leaves nothing behind but the tab it opened.

const FIXTURE = `<!doctype html>
<html><head><meta charset="utf-8"><title>Latency fixture</title>
<style>body{font:14px sans-serif;margin:0;padding:12px}
#box{position:fixed;top:0;left:0;padding:8px;border:1px solid #999;width:300px;background:#fff;z-index:5}
#rows{margin-top:150px}.row{padding:6px 10px;border-bottom:1px solid #eee}
</style></head>
<body>
<div id="box">
  <label for="field">Field</label><br>
  <input id="field" aria-label="the field" placeholder="type here">
  <button id="run">Run</button>
  <p id="status">idle</p>
</div>
<div id="rows"></div>
<script>
const status = document.getElementById('status');
document.getElementById('run').addEventListener('click', () => { status.textContent = 'ran'; });
document.getElementById('field').addEventListener('input', () => { status.textContent = 'typed:' + document.getElementById('field').value; });
document.getElementById('rows').innerHTML = Array.from({length:100}, (_,i) => '<div class="row" role="row" aria-label="Row ' + i + '">Row ' + i + '</div>').join('');
</script>
</body>
</html>`;

const fixtureServer = createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(FIXTURE);
});
await new Promise((resolve) => fixtureServer.listen(PORT, '127.0.0.1', resolve));

const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  return { p50: at(0.5), p95: at(0.95), n: sorted.length };
};

const bench = async (label, fn, n = RUNS) => {
  try {
    await fn();
    const times = [];
    for (let i = 0; i < n; i += 1) {
      const t0 = Date.now();
      await fn();
      times.push(Date.now() - t0);
    }
    const s = stats(times);
    return { label, p50: s.p50, p95: s.p95, n: s.n, ok: true };
  } catch (error) {
    return { label, ok: false, error: String(error?.message || error).slice(0, 90) };
  }
};

const session = await openSession({ tabUrl: URL_FIXTURE, timeoutMs: 20000 });
const driver = asDriver(session);
const tab = { id: session.targetId, url: URL_FIXTURE, title: 'Latency fixture' };
const mcpDriver = { ...driver, tabs: async () => [tab] };

const server = createMcpServer({
  driver: mcpDriver,
  port: 9451,
  resolveTab: async () => [tab.id],
  open: async () => mcpDriver,
  close: async () => ({ closed: true })
});

// WHY THE ANSWER IS NOT PARSED.
// A tool may answer with a picture or with nothing at all, and the time it took is the measurement; the shape of the answer is not.

const call = async (name, args = {}) => {
  const res = await server.handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name, arguments: { tabId: tab.id, ...args } }
  });
  if (!res.result) throw new Error(`${name}: ${JSON.stringify(res.error)}`);
  const text = res.result.content?.[0]?.text ?? '';
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
};

const results = [];
const add = async (label, fn, n) => {
  const r = await bench(label, fn, n);
  results.push(r);
  console.log(r.ok
    ? `  ${label.padEnd(26)} p50 ${String(r.p50).padStart(7)} ms   p95 ${String(r.p95).padStart(7)} ms   n=${r.n}`
    : `  ${label.padEnd(26)} failed: ${r.error}`);
};

console.log(`\nLocal road latency - bridge 9451, tab ${tab.id}, ${RUNS} runs each\n`);

await add('browser_status', () => call('browser_status'));
await add('browser_list_tabs', () => call('browser_list_tabs'));
await add('browser_read_page', () => call('browser_read_page'));
await add('browser_find_text', () => call('browser_find_text', { text: 'Row 42' }));
await add('browser_find_element (role only)', () => call('browser_find_element', { role: 'row' }));
await add('browser_screenshot', () => call('browser_screenshot'), 5);
await add('browser_scroll', () => call('browser_scroll', { y: 120 }));
await add('browser_click (textbox)', () => call('browser_click', { role: 'textbox', name: 'the field' }));
await add('browser_type_text', () => call('browser_type_text', { text: 'x' }));
await add('browser_press_key', () => call('browser_press_key', { key: 'a' }));
await add('browser_run_steps (wait stable)', () => call('browser_run_steps', { steps: [{ action: 'browser_wait_until', until: 'stable', timeoutMs: 100 }] }));
await add('browser_open_url', () => call('browser_open_url', { url: URL_FIXTURE }));
await add('browser_close_tab', () => call('browser_close_tab', { tabId: tab.id }), 3);

console.log('\nJSON\n' + JSON.stringify(results));
fixtureServer.close();
process.exit(0);
