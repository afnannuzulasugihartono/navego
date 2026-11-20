#!/usr/bin/env node

// @last-edited: 2026-11-17 UTC+7.
// @title: opera-agent — the thin harness I drive Opera through from an agent with a shell.
// @state: one process owns one driver lease; `serve` keeps it alive on loopback for interactive drives; explicit tabId on every write.
// @dependencies: node:fs, node:http, node:path, node:url, ../proof/proof-run.ts (speakMcp).
// Every write needs an explicit tabId; a separate process per call would collide on the tab claim.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { speakMcp } from '../proof/proof-run.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [command, ...rest] = process.argv.slice(2);
const mcp = speakMcp({ port: Number(process.env.OPERA_BRIDGE_PORT || 9451), cwd: root, bridgePort: Number(process.env.OPERA_BRIDGE_PORT || 9451) });
await mcp.initialize();

const needsTab = new Set([
  'browser_read_page', 'browser_find_element', 'browser_click',
  'browser_hover', 'browser_press_key', 'browser_type_text', 'browser_scroll',
  'browser_run_steps', 'browser_wait_until', 'browser_upload_file', 'browser_drop_file',
  'browser_intercept_picker', 'browser_download_file', 'browser_list_menu', 'browser_walk_menu',
  'browser_screenshot', 'browser_check_gate', 'browser_login', 'browser_solve_captcha',
  'browser_focus_tab', 'browser_close_tab'
]);

const show = (call: { text?: string; ms?: number | null; answer?: unknown; image?: unknown }) => {
  process.stdout.write(`${call.text || JSON.stringify(call.answer ?? null)}\n`);
  if (call.ms !== null) process.stdout.write(`elapsedMs ${call.ms}\n`);
};

const tabOf = (text: string) => {
  const parsed = JSON.parse(String(text).split('\n')[0] ?? '');
  return parsed?.action?.id ?? parsed?.id ?? null;
};

async function execute(cmd: string, args: string[]) {
  if (cmd === 'list') {
    const result = await mcp.call('tools/list', {}) as { tools?: Array<{ name: string; description?: string }> } | undefined;
    for (const tool of result?.tools ?? []) process.stdout.write(`${tool.name}\t${String(tool.description).split('.')[0]}\n`);
  } else if (cmd === 'tabs') {
    show(await mcp.tool('browser_list_tabs'));
  } else if (cmd === 'open') {
    if (!args[0]) throw new Error('open needs a url');
    show(await mcp.tool('browser_open_url', { url: args[0] }));
  } else if (cmd === 'read') {
    if (!args[0]) throw new Error('read needs tabId');
    show(await mcp.tool('browser_read_page', { tabId: args[0] }));
  } else if (cmd === 'shot') {
    if (!args[0]) throw new Error('shot needs tabId');
    const call = await mcp.tool('browser_screenshot', { tabId: args[0] });
    const target = resolve(args[1] ?? '.taste-skill/opera-shot.jpg');
    if (!call.image) throw new Error(`screenshot answered no image: ${call.text}`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(call.image, 'base64'));
    process.stdout.write(`${target}\nelapsedMs ${call.ms}\n`);
  } else if (cmd === 'call') {
    const name = args[0];
    if (!name) throw new Error('call needs a tool name');
    const callArgs = args[1] ? JSON.parse(args[1]) : {};
    const denied = needsTab.has(name) && callArgs.tabId === undefined && !callArgs.role && !callArgs.text;
    if (denied) throw new Error(`${name} needs an explicit tabId — run "tabs" first. No default tab in this harness.`);
    show(await mcp.tool(name, callArgs));
  } else if (cmd === 'open-and-read') {
    if (!args[0]) throw new Error('open-and-read needs a url');
    const opened = await mcp.tool('browser_open_url', { url: args[0] });
    const tabId = tabOf(opened.text);
    if (!tabId) throw new Error(`open answered no tab id: ${opened.text}`);
    process.stdout.write(`tabId ${tabId}\n`);
    show(await mcp.tool('browser_wait_until', { tabId, until: 'text', text: args[1] ?? 'Opera', timeoutMs: 15000 }));
    show(await mcp.tool('browser_read_page', { tabId }));
    if (args[2]) {
      const shot = await mcp.tool('browser_screenshot', { tabId });
      if (!shot.image) throw new Error(`screenshot answered no image: ${shot.text}`);
      const target = resolve(args[2]);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, Buffer.from(shot.image, 'base64'));
      process.stdout.write(`${target}\n`);
    }
  } else {
    throw new Error('commands: list | tabs | open <url> | read <tabId> | shot <tabId> [file] | call <tool> <json> | open-and-read <url> [text] [file] | serve');
  }
}

// `serve` holds one lease across independent shell calls: POST /call {"name","args"} -> answer.

if (command === 'serve') {
  const port = Number(rest[0] || 9478);
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      res.setHeader('content-type', 'application/json');
      try {
        if (req.method === 'GET' && req.url === '/health') {
          res.end(JSON.stringify({ ok: true, port }));
          return;
        }
        const payload = JSON.parse(body || '{}');
        const name: string = payload.name;
        const args: Record<string, unknown> = payload.args ?? {};
        if (needsTab.has(name) && args.tabId === undefined && !args.role && !args.text) {
          throw new Error(`${name} needs an explicit tabId — no default tab.`);
        }
        const call = await mcp.tool(name, args);
        res.end(JSON.stringify({ ok: true, text: call.text, image: call.image, ms: call.ms }));
      } catch (error) {
        res.end(JSON.stringify({ ok: false, error: String((error as Error | undefined)?.message ?? error) }));
      }
    });
  });
  server.listen(port, '127.0.0.1', () => process.stdout.write(`opera-agent listening on ${port}\n`));
} else {
  try {
    if (command === 'batch') {
      const steps = JSON.parse(readFileSync(String(rest[0] ?? ''), 'utf8'));
      for (const step of steps) {
        process.stdout.write(`\n> ${step.join(' ')}\n`);
        await execute(step[0], step.slice(1));
      }
    } else {
      await execute(command ?? '', rest);
    }
  } finally {
    await mcp.close();
  }
}
