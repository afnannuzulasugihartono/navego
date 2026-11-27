// @last-edited: 2026-11-27 UTC+7.
// @title: engineer-regression - the file-kind failure the five-run Drive eval found, now proved absent.
// @state: a .pdf-named ZIP is refused as a delivery and a real PDF is still recorded.
// @dependencies: node:test, strict, node:fs, node:os, node:path, ../../local/statements.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { statementCard, statementDelivered } from '../../local/statements.js';

const job = (root) => ({ client: 'Navego Eval', portal: 'Google Drive', period: '2026-11', root, url: 'https://drive.google.com/drive/my-drive' });

test('a .pdf-named archive is refused, and a real PDF is still recorded', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'navego-eval-regression-'));
  const cardRoot = path.join(root, 'cards');
  const card = statementCard(job(cardRoot));
  assert.ok(card.saveAs.endsWith('.pdf'), 'the card names the expected extension');

  const dir = path.join(cardRoot, '2026-11', 'navego-eval');
  fs.mkdirSync(dir, { recursive: true });
  const wrong = path.join(dir, 'wrong.pdf');
  fs.writeFileSync(wrong, Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x08, 0x08]));
  assert.throws(() => statementDelivered({ ...job(cardRoot), path: wrong }), /bytes sniff as zip/);
  assert.equal(fs.existsSync(path.join(dir, 'manifest.json')), false, 'a refused file writes no manifest line');

  const right = path.join(dir, 'right.pdf');
  fs.writeFileSync(right, Buffer.from('%PDF-1.4\n1 0 obj<</Type /Page>>endobj\n%%EOF\n'));
  const out = statementDelivered({ ...job(cardRoot), path: right });
  assert.equal(out.record.kind, 'pdf');
  assert.equal(out.record.pages, 1);
  fs.rmSync(root, { recursive: true, force: true });
});
