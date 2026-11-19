// @last-edited: 2026-11-19 UTC+7.
// @title: tool-failures - the append-only failure log: roundtrip, rotation, skip-corrupt, summarize.
// @state: a corrupt line never breaks a read; an unwritable home never breaks a caller; the cap keeps the newest lines.
// @dependencies: node:test, strict, node:fs, node:path, node:os, ../../local/tool-failures.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readRecords, recordFailure, recordFeedback, summarize } from '../../local/tool-failures.js';

const tempHome = () => fs.mkdtempSync(path.join(os.tmpdir(), 'navego-tool-failures-'));

test('a failure appended then read back carries the tool, the code and the message', () => {
  const home = tempHome();
  recordFailure({ tool: 'browser_read_page', code: 'timeout', message: 'the tab never settled' }, { home });
  const records = readRecords({ home });
  assert.equal(records.length, 1);
  const record = records[0];
  assert.ok(record, 'one record expected');
  assert.equal(record.kind, 'failure');
  assert.equal(record.tool, 'browser_read_page');
  assert.equal(record.code, 'timeout');
  assert.equal(record.message, 'the tab never settled');
});

test('an unwritable home swallows the error instead of throwing into the caller', () => {
  const home = tempHome();
  const blocker = path.join(home, 'blocker');
  fs.writeFileSync(blocker, 'not a directory');
  assert.doesNotThrow(() => {
    recordFailure({ tool: 'browser_click', code: 'EXECUTION_ERROR', message: 'boom' }, { home: path.join(blocker, 'child') });
  });
  assert.doesNotThrow(() => recordFeedback({ tool: 'browser_click', note: 'x' }, { home: path.join(blocker, 'child') }));
});

test('a corrupt line in the middle of the log is skipped, the rest reads', () => {
  const home = tempHome();
  recordFailure({ tool: 'a', code: 'c1', message: 'first' }, { home });
  fs.appendFileSync(path.join(home, 'tool-failures.jsonl'), 'this line is not json\n');
  recordFailure({ tool: 'b', code: 'c2', message: 'third' }, { home });
  const records = readRecords({ home });
  assert.deepEqual(records.map((r) => r.tool), ['a', 'b']);
});

test('the rotation keeps the newest lines once the cap is exceeded', () => {
  const home = tempHome();
  for (let index = 0; index < 20; index += 1) {
    recordFailure({ tool: `t${index}`, code: 'EXECUTION_ERROR', message: 'x'.repeat(120) }, { home, capBytes: 400 });
  }
  const records = readRecords({ home });
  assert.ok(records.length >= 1 && records.length <= 1000, 'the rotation kept a bounded tail');
  const last = records[records.length - 1];
  assert.ok(last, 'one record expected');
  assert.equal(last.tool, 't19', 'the newest line survived the rotation');
});

test('feedback notes are recorded and surface in the report', () => {
  const home = tempHome();
  recordFailure({ tool: 'browser_read_page', code: 'timeout', message: 'never settled' }, { home });
  recordFeedback({ tool: 'browser_read_page', note: 'canvas editors block every docs drive' }, { home });
  const report = summarize(readRecords({ home }));
  assert.equal(report.failures, 1);
  assert.equal(report.feedback, 1);
  const row = report.byTool[0];
  assert.ok(row, 'one tool row expected');
  assert.equal(row.tool, 'browser_read_page');
  assert.equal(report.notes[0]?.note, 'canvas editors block every docs drive');
  assert.equal(row.codes.timeout, 1);
});

test('the envelope fields are forced to the right types, hostile lines are dropped', () => {
  const home = tempHome();
  const file = path.join(home, 'tool-failures.jsonl');
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ at: 'not-a-number', kind: 'failure', tool: 'x' }) + '\n'
    + JSON.stringify({ at: Date.now(), kind: 'failure', tool: 'good', code: 'INPUT_ERROR' }) + '\n', 'utf8');
  const records = readRecords({ home });
  assert.deepEqual(records.map((r) => r.tool), ['good']);
});

test('secrets in a failure message are redacted before they reach the file', () => {
  const home = tempHome();
  const message = 'POST refused Authorization: Bearer abc123def456ghi; password=hunter2; url https://budi:rahasia@example.com/x?token=qwerty123; key sk-live-1234567890; jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijklmnop';
  recordFailure({ tool: 'browser_click', code: 'HTTP_401', message }, { home });
  const record = readRecords({ home })[0];
  assert.ok(record, 'one record expected');
  const stored = record.message ?? '';
  for (const secret of ['abc123def456ghi', 'hunter2', 'rahasia', 'qwerty123', 'sk-live-1234567890', 'eyJhbGciOiJIUzI1NiJ9']) {
    assert.ok(!stored.includes(secret), `${secret} must not survive in the failure log`);
  }
  assert.match(stored, /\[redacted\]/);
  assert.match(stored, /password=\[redacted\]|password=\*+/);
});

test('the log file is private to the account that wrote it', { skip: process.platform === 'win32' }, () => {
  const home = tempHome();
  recordFailure({ tool: 'browser_click', code: 'x', message: 'boom' }, { home });
  const file = path.join(home, 'tool-failures.jsonl');
  assert.equal(fs.statSync(home).mode & 0o777, 0o700);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
});

test('control characters are stripped from messages before they reach the file', () => {
  const home = tempHome();
  recordFailure({ tool: 'browser_click', code: 'x', message: 'line one\nline two\r\nend' }, { home });
  const record = readRecords({ home })[0];
  assert.ok(record, 'one record expected');
  assert.ok(!record.message!.includes('\n') && !record.message!.includes('\r'), 'newlines in the message collapse before the file write');
});
