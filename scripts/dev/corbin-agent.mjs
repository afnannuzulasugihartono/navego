#!/usr/bin/env node

// @last-edited: 2026-11-16 UTC+7.
// @title: corbin-agent — the thin harness I drive Corbin through from an agent with a shell.
// @state: one process owns one driver lease, explicit tabId on every write, list/tabs/open/read/shot/batch commands.
// @dependencies: node:fs, node:path, node:url, ../proof/proof-run.mjs (speakMcp).
// Every write needs an explicit tabId; a separate process per call would collide on the tab claim.
// Usage: node scripts/dev/corbin-agent.mjs list | tabs | open <url> | read <tabId> | shot <tabId> [file] | call <tool> '<json>' | batch <file.json>

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { speakMcp } from '../proof/proof-run.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [command, ...rest] = process.argv.slice(2);
const mcp = speakMcp({ cwd: root, bridgePort: Number(process.env.OPERA_BRIDGE_PORT || 9451) });
await mcp.initialize();

const needsTab = new Set([
  'browser_read_page', 'browser_find_text', 'browser_find_element', 'browser_click',
  'browser_hover', 'browser_press_key', 'browser_type_text', 'browser_scroll',
  'browser_run_steps', 'browser_wait_until', 'browser_upload_file', 'browser_drop_file',
  'browser_intercept_picker', 'browser_download_file', 'browser_list_menu', 'browser_walk_menu',
  'browser_screenshot', 'browser_check_gate', 'browser_login', 'browser_solve_captcha',
  'browser_focus_tab', 'browser_close_tab'
]);

const show = (call) => {
  process.stdout.write(`${call.text || JSON.stringify(call.answer ?? null)}\n`);
  if (call.ms !== null) process.stdout.write(`elapsedMs ${call.ms}\n`);
};

const tabOf = (text) => {
  const parsed = JSON.parse(String(text).split('\n')[0]);
  return parsed?.action?.id ?? parsed?.id ?? null;
};

async function execute(cmd, args) {
  if (cmd === 'list') {
    const result = await mcp.call('tools/list', {});
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
    const target = resolve(args[1] ?? '.taste-skill/corbin-shot.jpg');
    if (!call.image) throw new Error(`screenshot answered no image: ${call.text}`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(call.image, 'base64'));
    process.stdout.write(`${target}\nelapsedMs ${call.ms}\n`);
  } else if (cmd === 'call') {
    const name = args[0];
    if (!name) throw new Error('call needs a tool name');
    const callArgs = args[1] ? JSON.parse(args[1]) : {};
    if (needsTab.has(name) && callArgs.tabId === undefined && !callArgs.role && !callArgs.text) {
      throw new Error(`${name} needs an explicit tabId — run "tabs" first. No default tab in this harness.`);
    }
    show(await mcp.tool(name, callArgs));
  } else if (cmd === 'open-and-read') {
    if (!args[0]) throw new Error('open-and-read needs a url');
    const opened = await mcp.tool('browser_open_url', { url: args[0] });
    const tabId = tabOf(opened.text);
    if (!tabId) throw new Error(`open answered no tab id: ${opened.text}`);
    process.stdout.write(`tabId ${tabId}\n`);
    const waited = await mcp.tool('browser_wait_until', { tabId, until: 'text', text: args[1] ?? 'Corbin', timeoutMs: 15000 });
    show(waited);
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
    throw new Error('commands: list | tabs | open <url> | read <tabId> | shot <tabId> [file] | call <tool> <json> | open-and-read <url> [text] [file]');
  }
}

try {
  if (command === 'batch') {
    const steps = JSON.parse(readFileSync(rest[0], 'utf8'));
    for (const step of steps) {
      process.stdout.write(`\n> ${step.join(' ')}\n`);
      await execute(step[0], step.slice(1));
    }
  } else {
    await execute(command, rest);
  }
} finally {
  await mcp.close();
}
