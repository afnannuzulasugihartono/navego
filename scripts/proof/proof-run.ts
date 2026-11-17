// @last-edited: 2026-11-15 UTC+7.
// @title: proof-run — one real drive: a browser reads a portal, the CSV lands, and four office files come out with the bytes the site ships.
// @state: the fixture portal, a throwaway Chrome, the MCP client over stdio, the five steps, and the record the suite rechecks.
// @dependencies: node:child_process, node:crypto, node:fs, node:http, node:os, node:path, node:url, ../local/browsers.js, ../local/transport.js, ../../tests/helpers/fake-cloud.ts.

// WHY THIS FILE EXISTS.
// The product claims it drives a browser and hands back designed office files, and until this run the claim rested on separate tests: one drove a fake page, another wrote a workbook.
// A run that does both in one breath is the only thing that answers "can it actually do the job", and the hashes are what make the answer checkable instead of a story.

import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { launchArgs } from '../../local/browsers.js';
import { waitForBrowser } from '../../local/transport.js';
import { startFakeCloud } from '../../tests/helpers/fake-cloud.ts';

const NO_STORE_GET = { method: 'GET', cache: 'no-store' as const };

const bodyRecord = (body: unknown): Record<string, unknown> | null =>
  typeof body === 'object' && body !== null ? body as Record<string, unknown> : null;

// WHY THE CLOUD METER IS ANSWERED BY A LOCAL STUB IN THIS RUN.
// The bridge opens every session against the cloud meter, which knows an account and its plan; a throwaway Chrome with a throwaway profile has neither, so the meter refuses it with "Unauthorized device" and the extension is dropped before the first command.
// Measured on 2026-11-15: the proof's first open_url came back empty, then the bridge's own health answered linked:false with meterRefusal "Unauthorized device." - the drive was refused, not slow.
// So the proof points NAVEGO_CLOUD_URL at a loopback stub that grants a pilot session, exactly the way the local suite proves the bridge's own side of that conversation.
// Everything else in the run is the product: the shipped extension, the shipped bridge, the shipped MCP server, and the shipped bytes.
// The record says this out loud, because a receipt that hid the stub would be a receipt of something nobody runs.

// WHY THE SERVER ANSWERS FROM A WHITELIST.
// The portal is two files, and a server that joined the request into a folder would be a door nothing needs.

const SERVED = new Map([
  ['/portal.html', { file: 'portal.html', type: 'text/html; charset=utf-8' }],
  ['/transaksi-2026-09.csv', { file: 'transaksi-2026-09.csv', type: 'text/csv; charset=utf-8' }]
]);

export async function serveCompany(company: string = path.resolve('tests', 'fixtures', 'mock-company')) {
  const server = http.createServer((request, response) => {
    const entry = SERVED.get((request.url || '/').split('?')[0] ?? '/');
    if (!entry) {
      response.writeHead(404);
      response.end();
      return;
    }
    const body = fs.readFileSync(path.join(company, entry.file));
    response.writeHead(200, { 'content-type': entry.type, 'content-length': body.length });
    response.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('the mock company server did not bind');
  const { port } = address;
  return {
    port,
    url: `http://127.0.0.1:${port}/portal.html`,
    csvUrl: `http://127.0.0.1:${port}/transaksi-2026-09.csv`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

// WHY THE PORT IS NOT THE EVERYDAY ONE.
// A browser started on the shared port is the browser the person is using, and a proof that drives that one can destroy their session.
// The shared port is refused by name rather than left to a comment.

const SHARED_PORT = 9222;

// WHY THE PROOF HAS A PORT OF ITS OWN.
// The extension cannot be configured after install, so the copy the proof loads is the copy the proof patches, and the bridge that copy dials belongs to the proof alone.
// That means the everyday browser keeps its own bridge and the proof keeps a separate one: two extensions, two browsers, two loopback ports, and nobody drives the signed-in window by accident.

const PROOF_BRIDGE_PORT = 19451;

const EXTENSION_CANDIDATES = () => {
  const programFiles = process.env.ProgramFiles ? [process.env.ProgramFiles] : ['C:\\Program Files'];
  const local = process.env.LOCALAPPDATA ? [process.env.LOCALAPPDATA] : [];
  const found = [];
  for (const base of [...programFiles, ...local]) {
    const root = path.join(base, 'Google', 'Chrome for Testing');
    try {
      for (const version of fs.readdirSync(root)) {
        found.push(path.join(root, version, 'win64', 'chrome.exe'));
      }
    } catch {
    }
  }
  if (process.platform !== 'win32') {
    for (const name of ['chrome-for-testing', 'chromium', 'chromium-browser']) {
      found.push(name);
    }
  }
  return found;
};

function browserBinary(candidates: string[]) {
  for (const candidate of candidates) {
    if (candidate.includes(path.sep) && fs.existsSync(candidate)) return candidate;
    if (!candidate.includes(path.sep)) {
      const result = spawnSync(candidate, ['--version'], { stdio: 'ignore', timeout: 5000 });
      if (result.status === 0) return candidate;
    }
  }
  return null;
}

// WHY THE EXTENSION IS PATCHED IN A COPY.
// The proof proves the extension that would ship, so the only edit it makes is the address it dials; every line that decides what this product is remains the shipped line.

function extensionForProof(root: string, bridgePort: number) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'opera-proof-extension-'));
  fs.cpSync(path.join(root, 'extension'), target, { recursive: true });
  const linkPath = path.join(target, 'worker', 'bridge-link.js');
  const link = fs.readFileSync(linkPath, 'utf8');
  const swapped = link.replace('ws://127.0.0.1:9451', `ws://127.0.0.1:${bridgePort}`);
  if (swapped === link) throw new Error('the proof could not patch the extension copy to dial its own bridge');
  fs.writeFileSync(linkPath, swapped, 'utf8');
  return target;
}

function findExtensionBrowser() {
  if (process.env.NAVEGO_PROOF_BROWSER) return process.env.NAVEGO_PROOF_BROWSER;
  return browserBinary(EXTENSION_CANDIDATES());
}

// WHY THE PROFILE IS TEMPORARY AND ITS REMOVAL IS FORGIVING.
// The cookies and history the run makes must die with it, and a profile folder Chrome still holds for a moment is cleared by the operating system later.
// A cleanup that could throw would mask the step that actually failed.

// WHY THE PROOF WAITS FOR THE BRIDGE TO NAME THE DEVICE.
// The browser answers its debugging port long before its extension is awake: the worker starts, probes the bridge, and dials in, and a command that lands in that gap is answered by nobody.
// Measured on 2026-11-15: the first open_url of a fresh throwaway Chrome came back empty, because the call raced the worker's wake-up; the run before it, minutes earlier, had passed.
// So the proof waits for the fact it needs - the bridge naming a device - instead of racing the extension to the first command.
// WHY THE WAIT CANNOT LIVE INSIDE launchProofBrowser: the bridge socket belongs to the local server, and that server is spawned by speakMcp, after the browser is up.
// A wait placed before the server exists waits for a port nobody will ever open.

async function waitForBridgeDevice(bridgePort: number, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let last = 'the bridge never answered';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${bridgePort}/health`, NO_STORE_GET);
      if (response.ok) {
        const body = bodyRecord(await response.json());
        last = JSON.stringify(body);
        if (body && body.ok === true && Array.isArray(body.devices) && body.devices.length > 0) return true;
      }
    } catch {
      last = 'the bridge did not answer';
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`the proof extension never linked the loopback bridge on ${bridgePort}; the bridge said: ${last}`);
}

// WHY THE BRIDGE IS WAITED FOR BEFORE THE BROWSER IS LAUNCHED.
// The extension probes the bridge once when its worker wakes, and a bridge that is not there yet is a probe that fails: the worker then waits for its next wake - the alarm, half a minute away - before it looks again.
// Measured on 2026-11-15: with the browser launched first, the proof waited thirty seconds for a link that came only when the alarm woke the worker; with the bridge up first, the extension linked in its first second.
// So the local server starts first, the bridge answers, and the browser joins a bridge that is already there.

async function waitForBridge(bridgePort: number, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${bridgePort}/health`, NO_STORE_GET);
      if (response.ok) {
        const body = bodyRecord(await response.json());
        if (body && body.ok === true) return true;
      }
    } catch {
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

export async function launchProofBrowser({ port = Number(process.env.NAVEGO_PROOF_PORT || 9444), bridgePort = Number(process.env.NAVEGO_PROOF_BRIDGE_PORT || PROOF_BRIDGE_PORT), root = process.cwd(), extraArgs = [] } = {} as { port?: number; bridgePort?: number; root?: string; extraArgs?: string[] }) {
  if (port === SHARED_PORT || bridgePort === SHARED_PORT) throw new Error(`${SHARED_PORT} is the shared browser; the proof run refuses to drive it.`);
  const binary = findExtensionBrowser();
  if (!binary) throw new Error('no browser that can load the proof extension is installed; set NAVEGO_PROOF_BROWSER to one (Chrome for Testing or Chromium)');
  const extension = extensionForProof(root, bridgePort);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opera-proof-'));
  const entry = { id: 'proof', name: 'Proof Chrome', family: 'chromium', protocol: 'cdp', binary, paths: { win32: [binary], darwin: [binary], linux: [binary] } };
  const child = spawn(binary, [...launchArgs({ browser: entry, port, userDataDir, extraArgs }), `--load-extension=${extension}`, `--disable-extensions-except=${extension}`], { stdio: 'ignore' });

  const up = await waitForBrowser(port, { timeoutMs: 15000 }).then(() => true, () => false);
  if (!up) {
    child.kill();
    fs.rmSync(userDataDir, { recursive: true, force: true });
    fs.rmSync(extension, { recursive: true, force: true });
    throw new Error(`the proof browser did not answer port ${port}; nothing was driven.`);
  }

  return {
    port,
    bridgePort,
    name: 'Proof Chrome',
    close() {
      child.kill();
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        fs.rmSync(extension, { recursive: true, force: true });
      } catch {

      }
    }
  };
}

// WHY THE CLIENT IS THIS SMALL.
// MCP over stdio is one JSON object per line, and the server answers every request with the id it was given.
// A client that framed anything else would be testing its own idea of the protocol instead of the one the product ships.

const CALL_TIMEOUT_MS = 60000;

const parseAnswer = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export function speakMcp({ port, cwd = process.cwd(), env = process.env, bridgePort = null }: { port: number; cwd?: string; env?: NodeJS.ProcessEnv; bridgePort?: number | null }) {
  const child = spawn(process.execPath, [path.join(cwd, 'local', 'bin', 'opera-local.js')], {
    cwd,
    env: { ...env, NAVEGO_BRIDGE_PORT: String(bridgePort ?? port ?? env.NAVEGO_BRIDGE_PORT ?? 9451) },
    stdio: ['pipe', 'pipe', 'inherit']
  });

  const waiting = new Map<number, { method: string; resolve: (value: unknown) => void; reject: (error: unknown) => void }>();
  let buffer = '';
  let nextId = 1;

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const text = line.trim();
      if (!text) continue;
      let message: { id?: unknown; error?: { message?: string }; result?: unknown };
      try {
        message = JSON.parse(text);
      } catch {
        continue;
      }
      const pending = waiting.get(Number(message.id));
      if (!pending) continue;
      waiting.delete(Number(message.id));
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result);
    }
  });

  const call = (method: string, params: Record<string, unknown>) => new Promise<unknown>((resolve, reject) => {
    const id = nextId;
    nextId += 1;
    const timer = setTimeout(() => {
      waiting.delete(id);
      reject(new Error(`${method} did not answer within ${CALL_TIMEOUT_MS} ms`));
    }, CALL_TIMEOUT_MS);
    waiting.set(id, {
      method,
      resolve: (result: unknown) => {
        clearTimeout(timer);
        resolve(result);
      },
      reject: (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  });

  // WHY THE ANSWER IS ONE DOCUMENT: the server puts the cost inside the answer, under elapsedMs, and never in a block of its own.
  // Measured on 2026-11-15: this reader still expected a second text block reading "123ms", so every body it parsed was empty and open_url looked like it had returned nothing at all.
  const tool = async (name: string, args: Record<string, unknown> = {}) => {
    const result = await call('tools/call', { name, arguments: args }) as { content?: Array<Record<string, unknown>> } | undefined;
    const blocks = Array.isArray(result?.content) ? result.content : [];
    const texts = blocks.filter((block) => block.type === 'text').map((block) => String(block.text ?? ''));
    const body = texts.join('\n');
    const answer = parseAnswer(body);
    const elapsed = Number(answer?.elapsedMs);
    return {
      name,
      ms: Number.isFinite(elapsed) ? elapsed : null,
      answer,
      text: body,
      image: (blocks.find((block) => block.type === 'image')?.data as string | undefined) ?? null
    };
  };

  return {
    call,
    tool,
    initialize: () => call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'proof-run', version: '1' } }),
    listTools: async () => {
      const answer = await call('tools/list', {}) as { tools?: Array<{ name?: string }> } | undefined;
      return (answer?.tools ?? []).map((entry) => entry.name);
    },
    close: async () => {
      child.stdin.end();
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          child.kill();
          resolve();
        }, 5000);
        child.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
  };
}

export const sha256 = (file: string) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const relative = (root: string, file: string) => path.relative(root, file).split(path.sep).join('/');

// WHY THE SLIDE COUNT IS READ FROM THE FILE.
// The builder says how many slides it was given, and the cover is added without a word in that answer.
// The count that matters is what PowerPoint will show, so it is read from the archive's own directory.

function slideCount(bytes: Uint8Array | Buffer) {
  const buffer = Buffer.from(bytes);
  let end = -1;
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      end = index;
      break;
    }
  }
  if (end < 0) throw new Error('the presentation carries no end of central directory, so it is not an archive');
  const entries = buffer.readUInt16LE(end + 10);
  let cursor = buffer.readUInt32LE(end + 16);
  let slides = 0;
  for (let index = 0; index < entries; index += 1) {
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    if (/^ppt\/slides\/slide\d+\.xml$/.test(name)) slides += 1;
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return slides;
}

// WHY EVERY STEP THROWS INSTEAD OF COLLECTING.
// A proof that carries on after a failed download writes a record of something that did not happen.
// The first wrong answer ends the run, and the message names the call and what it left behind.

const MARKS = ['Portal Mitra', 'Unduh CSV'];

// WHY THE PAPERS ARE READ FROM A COPY.
// The deck builder writes its provenance beside its source, so pointing it at the fixture would rewrite a tracked file on every run.
// The copy costs three kilobytes and keeps the run from touching the tree it is proving.

const PAPERS = ['strategi.json', 'riset-promo.json', 'pemasaran.json'];

export async function runProof({
  root = process.cwd(),
  out = path.join(root, 'docs', 'proof', 'out'),
  downloads = path.join(root, 'docs', 'proof', 'downloads'),
  env = process.env
} = {}) {
  const company = path.join(root, 'tests', 'fixtures', 'mock-company');
  const portal = await serveCompany(company);
  const cloud = await startFakeCloud();
  const port = Number(process.env.NAVEGO_PROOF_PORT || 9444);
  const bridgePort = Number(process.env.NAVEGO_PROOF_BRIDGE_PORT || PROOF_BRIDGE_PORT);
  const mcp = speakMcp({ port, bridgePort, cwd: root, env: { ...env, NAVEGO_CLOUD_URL: cloud.url } });
  if (!(await waitForBridge(bridgePort))) {
    await mcp.close().catch(() => null);
    await portal.close();
    await cloud.close();
    throw new Error(`the local server never answered the bridge on ${bridgePort}; the browser had nothing to join.`);
  }
  const browser = await launchProofBrowser({ port, bridgePort, root });
  const steps: Array<{ n?: number; tool?: string; ms?: number | null; note?: string; ok?: boolean; sha256?: string; operation?: string; bytes?: number; sameAs?: string; file?: string; matches?: string }> = [];

  const note = (step: typeof steps[number]) => {
    steps.push({ n: steps.length + 1, ...step });
    return step;
  };

  const compared = (name: string, file: string, extra: Record<string, unknown> = {}) => {
    const hash = sha256(file);
    const shipped = sha256(path.join(root, 'site', 'public', 'contoh', name));
    if (hash !== shipped) throw new Error(`${name} came out as ${hash}, and the site ships ${shipped}`);
    return note({
      ...extra,
      ok: true,
      file: relative(root, file),
      bytes: fs.statSync(file).size,
      sha256: hash,
      matches: `site/public/contoh/${name}`
    });
  };

  try {
    // WHY THE BRIDGE IS THE READINESS GATE: the local server owns the bridge socket, so the device appears there only when the extension's worker is awake and linked; nothing else in the run can answer a page action.
    try {
      await waitForBridgeDevice(browser.bridgePort);
    } catch (error) {
      throw new Error(`${String((error as Error | undefined)?.message ?? error)}; the stubbed meter was asked: ${JSON.stringify(cloud.requests)}`);
    }

    const ready = await mcp.initialize() as { serverInfo?: { name?: string } } | undefined;
    note({ tool: 'initialize', ok: true, note: `server ${ready?.serverInfo?.name ?? 'unknown'}` });

    const names = await mcp.listTools();
    for (const wanted of ['browser_open_url', 'browser_read_page', 'browser_download_file', 'artifact_build_workbook', 'artifact_build_slides', 'artifact_build_document', 'browser_screenshot', 'browser_close_tab']) {
      if (!names.includes(wanted)) throw new Error(`the server no longer offers ${wanted}`);
    }
    note({ tool: 'tools/list', ok: true, note: `${names.length} tools` });

    const opened = await mcp.tool('browser_open_url', { url: portal.url });
    const tabId = opened.answer?.action?.id;
    if (!tabId) throw new Error(`browser_open_url returned no tab id; the answer was ${JSON.stringify(opened.answer)}`);
    note({ tool: 'browser_open_url', ms: opened.ms, ok: true, note: `tab ${tabId} · ${portal.url}` });

    const read = await mcp.tool('browser_read_page', { tabId });
    const pageText = String(read.answer?.text ?? '');
    for (const mark of MARKS) {
      if (!pageText.includes(mark)) throw new Error(`read did not show ${mark}`);
    }
    note({ tool: 'browser_read_page', ms: read.ms, ok: true, note: `${pageText.length} characters read` });

    fs.mkdirSync(downloads, { recursive: true });
    const grabbed = await mcp.tool('browser_download_file', {
      tabId,
      role: 'link',
      name: 'Unduh CSV',
      dir: downloads,
      saveAs: 'transaksi-2026-09.csv',
      timeoutMs: 30000
    });
    if (grabbed.answer?.downloaded !== true) throw new Error(`download failed: ${grabbed.answer?.why ?? 'no reason given'}`);
    const csv = grabbed.answer.path;
    const csvHash = sha256(csv);
    const fixtureHash = sha256(path.join(company, 'transaksi-2026-09.csv'));
    if (csvHash !== fixtureHash) throw new Error(`the downloaded CSV is not the fixture: ${csvHash} versus ${fixtureHash}`);
    note({
      tool: 'browser_download_file',
      ms: grabbed.ms,
      ok: true,
      note: `${grabbed.answer.bytes} bytes landed`,
      file: relative(root, csv),
      bytes: grabbed.answer.bytes,
      sha256: csvHash,
      sameAs: 'tests/fixtures/mock-company/transaksi-2026-09.csv'
    });

    const papers: Record<string, string> = {};
    for (const name of PAPERS) {
      papers[name] = path.join(downloads, name);
      fs.copyFileSync(path.join(company, name), papers[name]);
    }
    note({ tool: 'stage', ok: true, note: `${PAPERS.length} paper sources copied beside the CSV` });

    fs.mkdirSync(out, { recursive: true });

    const workbook = await mcp.tool('artifact_build_workbook', {
      source: csv,
      client: 'Sinar Jaya',
      title: 'Laporan Keuangan September 2026',
      period: '2026-09',
      periodColumn: 'Tanggal',
      groupBy: 'Akun',
      valueColumn: 'Jumlah',
      out: path.join(out, 'laporan-keuangan-2026-09.xlsx')
    });
    const workbookFile = workbook.answer?.out;
    if (!workbookFile) throw new Error('sheet returned no file');
    compared('laporan-keuangan-2026-09.xlsx', workbookFile, {
      tool: 'artifact_build_workbook',
      ms: workbook.ms,
      note: `${workbook.answer.sheets?.length ?? 0} sheets, ${workbook.answer.verified?.checked ?? 0} figures checked`
    });

    const deck = await mcp.tool('artifact_build_slides', {
      source: papers['strategi.json'],
      report: workbook.answer.plan,
      out: path.join(out, 'rencana-strategis-2027.pptx')
    });
    const deckFile = deck.answer?.out;
    if (!deckFile) throw new Error('deck returned no file');
    compared('rencana-strategis-2027.pptx', deckFile, {
      tool: 'artifact_build_slides',
      ms: deck.ms,
      note: `${deck.answer.slides ?? 0} content slides and a cover`
    });

    for (const [source, name] of [['riset-promo.json', 'riset-promo.docx'], ['pemasaran.json', 'rencana-pemasaran-2027.docx']] as Array<[string, string]>) {
      const paper = await mcp.tool('artifact_build_document', {
        source: papers[source],
        out: path.join(out, name)
      });
      if (!paper.answer?.out) throw new Error(`doc returned no file for ${source}`);
      compared(name, paper.answer.out, {
        tool: 'artifact_build_document',
        ms: paper.ms,
        note: `${paper.answer.blocks ?? 0} blocks, ${paper.answer.title ?? ''}`
      });
    }

    const shot = await mcp.tool('browser_screenshot', { tabId });
    const jpegData = shot.image;
    if (!jpegData) throw new Error('shot returned no picture');
    note({ tool: 'browser_screenshot', ms: shot.ms, ok: true, note: `${Math.round((jpegData.length * 3) / 4)} picture bytes` });

    const closed = await mcp.tool('browser_close_tab', { tabId });
    note({ tool: 'browser_close_tab', ms: closed.ms, ok: true, note: `tab ${closed.answer?.id ?? tabId} closed` });

    return {
      steps,
      hashes: steps.filter((step) => step.sha256 && step.matches),
      slides: slideCount(fs.readFileSync(deckFile)),
      browser: browser.name,
      jpeg: jpegData
    };
  } finally {
    await mcp.close().catch(() => null);
    browser.close();
    await portal.close();
    await cloud.close();
  }
}

// WHY THE RECORD IS MARKDOWN AND JSONL BOTH.
// The JSONL is what the suite reads, one call per line, and the Markdown is what a person reads, one table.
// Neither is generated from the other, so a change to one cannot quietly erase the other.

interface ProofStep {
  n?: number;
  tool?: string;
  ms?: number | null;
  bytes?: number;
  sha256?: string;
  matches?: string;
  sameAs?: string;
  file?: string;
  note?: string;
  ok?: boolean;
  operation?: string;
}
export function recordMarkdown({ steps, browser, slides }: { steps: ProofStep[]; browser: string; slides: number }) {
  const calls = steps.map((step) => `| ${step.n} | \`${step.tool}\` | ${step.ms ?? '-'} | ${step.note ?? 'ok'} |`);
  const files = steps
    .filter((step) => step.sha256)
    .map((step) => `| \`${step.file}\` | ${step.bytes} | \`${step.sha256}\` | \`${step.matches ?? step.sameAs}\` |`);
  return [
    '# Proof run: one browser, four files',
    '',
    'The local MCP server drove a throwaway Chrome over stdio: it opened the fixture portal, read the page, downloaded the CSV, and built the four files the site offers. Each file was hashed and compared with the same-named file in `site/public/contoh/`.',
    '',
    'One part of the run is answered locally: the cloud meter that opens a session knows an account and its plan, and a throwaway browser has neither, so the meter was pointed at a loopback stub granting a pilot session. The drive, the extension, the bridge and the files are the shipped ones; only the plan check is stood in for.',
    '',
    `Browser: ${browser}. Deck slides: ${slides}.`,
    '',
    '| # | call | ms | what it left |',
    '| --- | --- | --- | --- |',
    ...calls,
    '',
    '| file | bytes | sha256 | equals |',
    '| --- | --- | --- | --- |',
    ...files,
    '',
    'The hashes in `run.jsonl` are rechecked against `site/public/contoh/` by `tests/tooling/proof-run.test.ts`, so this record cannot drift away from what the code makes.',
    ''
  ].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runProof();
  const dir = path.join(process.cwd(), 'docs', 'proof');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'portal.jpg'), Buffer.from(result.jpeg, 'base64'));
  fs.writeFileSync(path.join(dir, 'run.jsonl'), `${result.steps.map((step) => JSON.stringify(step)).join('\n')}\n`);
  fs.writeFileSync(path.join(dir, 'run.md'), recordMarkdown(result));
  console.log(`proof run: ${result.steps.length} calls, ${result.hashes.length} files match, ${result.slides} slides`);
}
