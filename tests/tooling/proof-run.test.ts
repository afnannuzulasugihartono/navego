// @last-edited: 2026-11-06 UTC+7.
// @title: proof-run — a real browser drive that has to leave the same four files the site ships.
// @state: the fixture portal over loopback, a throwaway browser, the MCP client, the four artifacts, and the record the suite rechecks.
// @dependencies: node:test, strict, node:fs, node:os, node:path, ../local/driver.js, ../scripts/proof/proof-run.ts.

// THIS FILE EXISTS.
// The product claims it drives a browser and hands back designed office files, and until this run the claim rested on separate tests: one drove a fake page, another wrote a workbook.
// A run that does both in one breath is the only thing that answers "can it actually do the job", and the hashes are what make the answer checkable instead of a story.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { launchProofBrowser, runProof, serveCompany, sha256, speakMcp } from '../../scripts/proof/proof-run.ts';

const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const company = path.join(root, 'tests', 'fixtures', 'mock-company');

const noExtensionBrowser = process.env.NAVEGO_PROOF_BROWSER
  ? false
  : 'this run has no extension-capable browser; set NAVEGO_PROOF_BROWSER to one (Chrome for Testing or Chromium)';

test('the fixture portal answers with the page and the CSV a drive needs', async () => {
  const portal = await serveCompany(company);
  try {
    const page = await fetch(portal.url);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Portal Mitra/);
    assert.match(html, /Unduh CSV/);

    const csv = await fetch(portal.csvUrl);
    assert.equal(csv.status, 200);
    assert.equal(csv.headers.get('content-type'), 'text/csv; charset=utf-8');
    const bytes = Buffer.from(await csv.arrayBuffer());
    assert.deepEqual(bytes, fs.readFileSync(path.join(company, 'transaksi-2026-09.csv')));
  } finally {
    await portal.close();
  }
});

test('the proof browser answers its own port and is gone when the run ends', { skip: noExtensionBrowser }, async () => {
  const browser = await launchProofBrowser();
  const { port } = browser;
  try {
    const version = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()) as { Browser?: unknown };
    assert.match(String(version.Browser ?? ''), /Chrome|Chromium/);
  } finally {
    browser.close();
  }

  const deadline = Date.now() + 5000;
  let alive = true;
  while (alive && Date.now() < deadline) {
    alive = await fetch(`http://127.0.0.1:${port}/json/version`).then(() => true, () => false);
    if (alive) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(alive, false, 'the browser the run started must close with it');
});

test('the server opens the portal tab and reads the page', { skip: noExtensionBrowser }, async () => {
  const portal = await serveCompany(company);
  const browser = await launchProofBrowser();
  const mcp = speakMcp({ port: browser.port, cwd: root });
  try {
    const ready = (await mcp.initialize()) as { serverInfo?: { name?: string } } | undefined;
    assert.equal(ready?.serverInfo?.name, 'navego');
    const names = await mcp.listTools();
    for (const wanted of ['browser_open_url', 'browser_read_page', 'browser_download_file', 'artifact_build', 'browser_screenshot', 'browser_close_tab']) {
      assert.ok(names.includes(wanted), `the server offers ${wanted}`);
    }

    const opened = await mcp.tool('browser_open_url', { url: portal.url });
    const tabId = opened.answer?.action?.id;
    assert.ok(tabId, 'goto names the tab it opened');

    const read = await mcp.tool('browser_read_page', { tabId });
    assert.match(String(read.answer?.text ?? ''), /Portal Mitra/);
    assert.match(String(read.answer?.text ?? ''), /Unduh CSV/);

    await mcp.tool('browser_close_tab', { tabId });
  } finally {
    await mcp.close();
    browser.close();
    await portal.close();
  }
});

test('one drive downloads the CSV and leaves the four files the site ships', { skip: noExtensionBrowser }, async () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'opera-proof-test-'));
  try {
    const result = await runProof({
      root,
      out: path.join(work, 'out'),
      downloads: path.join(work, 'downloads')
    });

    assert.equal(result.slides, 5, 'the deck holds a cover and four content slides');
    assert.equal(result.hashes.length, 4, 'four artifacts were compared');

    for (const row of result.hashes) {
      assert.ok(row.file, 'each hash row names the file it compared');
      const name = path.basename(row.file);
      assert.equal(row.sha256, sha256(path.join(root, 'site', 'public', 'contoh', name)), `${name} is not the file the site ships`);
      assert.equal(row.bytes, fs.statSync(path.join(work, 'out', name)).size, `${name} is the file the run made`);
    }

    const downloaded = result.steps.find((step) => step.tool === 'browser_download_file');
    assert.ok(downloaded, 'the run took the CSV download step');
    assert.equal(downloaded.ok, true);
    assert.equal(downloaded.sha256, sha256(path.join(company, 'transaksi-2026-09.csv')), 'the CSV came off the portal unchanged');
    assert.ok(result.jpeg && result.jpeg.length > 1000, 'the run captured the portal it read');
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
});

test('the recorded run still leaves the files the site ships', () => {
  const record = path.join(root, 'docs', 'proof', 'run.jsonl');
  assert.ok(fs.existsSync(record), 'the proof record exists; run node scripts/proof/proof-run.ts');
  const rows = fs.readFileSync(record, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));

  assert.ok(rows.every((row) => row.ok === true), 'every recorded step said ok');
  const artifacts = rows.filter((row) => row.sha256 && row.matches);
  assert.equal(artifacts.length, 4, 'the record carries four artifacts');

  for (const row of artifacts) {
    const name = path.basename(row.file);
    assert.ok(row.matches === `landing/contoh/${name}` || row.matches === `site/public/contoh/${name}`, `${name} names where it was compared with (historical landing/contoh or current site/public/contoh)`);
    assert.equal(sha256(path.join(root, 'site', 'public', 'contoh', name)), row.sha256, `${name} on the site moved away from the record`);
    assert.ok(!path.isAbsolute(row.file), 'the record carries a repository path, not a machine path');
  }

  // The record is as recorded: at the time this record was taken the deck tool was named `deck_build`.
  const deck = rows.find((row) => row.tool === 'deck_build');
  assert.ok(deck, 'the record carries the deck step');
  const written = fs.readFileSync(path.join(root, 'docs', 'proof', 'run.md'), 'utf8');
  assert.match(written, /Deck slides: 5/, 'the record states the slide count the file holds');
  assert.ok(written.includes(deck.sha256), 'the readable record carries the deck hash');
});
