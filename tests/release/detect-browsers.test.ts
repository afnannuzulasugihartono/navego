// @last-edited: 2026-11-12 UTC+7.
// @title: detect-browsers - one truth, two answers: what detectBrowsers finds, and what the installer does with it.
// @state: the package's one browser list, asked through its own detectBrowsers; no second path table anywhere.
// @dependencies: test, assert, ../local/browsers.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import type { Dirent } from 'node:fs';
import { detectBrowsers, BROWSERS, expandPath } from '../../local/browsers.js';

const tree = (paths: string[]) => { const set = new Set(paths); return (p: string) => set.has(p); };

const lower = (p: string) => String(p).toLowerCase().replace(/\\/g, '/');

test('finds chrome at the Program Files path', () => {
  const paths = BROWSERS.filter((b) => b.id === 'chrome').flatMap((b) => b.paths.win32).map((p) => lower(expandPath(p, {})));
  const found = detectBrowsers({ platform: 'win32', exists: tree(paths), env: {} });
  assert.deepEqual(found.map((b) => b.id), ['chrome']);
});

test('finds nothing when nothing exists', () => {
  const found = detectBrowsers({ platform: 'win32', exists: () => false, env: {} });
  assert.deepEqual(found, []);
});

test('finds brave when it exists', () => {
  const paths = BROWSERS.filter((b) => b.id === 'brave').flatMap((b) => b.paths.win32).map((p) => lower(expandPath(p, {})));
  const found = detectBrowsers({ platform: 'win32', exists: tree(paths), env: {} });
  assert.deepEqual(found.map((b) => b.id), ['brave']);
});

test('finds edge when it exists', () => {
  const paths = BROWSERS.filter((b) => b.id === 'edge').flatMap((b) => b.paths.win32).map((p) => lower(expandPath(p, {})));
  const found = detectBrowsers({ platform: 'win32', exists: tree(paths), env: {} });
  assert.deepEqual(found.map((b) => b.id), ['edge']);
});

test('finds all four with the four-browser filter the installer uses', () => {
  const paths = BROWSERS.filter((b) => ['chrome', 'brave', 'edge', 'chromeForTesting'].includes(b.id)).flatMap((b) => b.paths.win32).map((p) => lower(expandPath(p, {})));
  const found = detectBrowsers({ platform: 'win32', exists: tree(paths), env: {} }).filter((b) => ['chrome', 'brave', 'edge', 'chromeForTesting'].includes(b.id));
  assert.deepEqual(found.map((b) => b.id), ['chrome', 'edge', 'brave', 'chromeForTesting']);
});

test('finds chrome-for-testing through the playwright glob', () => {
  const found = detectBrowsers({
    platform: 'win32',
    env: { LOCALAPPDATA: 'C:/Users/X/AppData/Local' },
    exists: (p) => p === 'c:/users/x/appdata/local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
    readdir: (p) => {
      const entry = (name: string) => ({ name, isDirectory: () => true }) as unknown as Dirent<string>;
      if (p === 'c:/users/x/appdata/local/ms-playwright') return [entry('chromium-1243')];
      if (p === 'c:/users/x/appdata/local/ms-playwright/chromium-1243') return [entry('chrome-win64')];
      return [];
    },
  });
  assert.deepEqual(found.map((b) => b.id), ['chromeForTesting']);
});

test('ignores browsers the installer does not support', () => {
  const paths = BROWSERS.filter((b) => ['opera', 'vivaldi', 'chromium'].includes(b.id)).flatMap((b) => b.paths.win32).map((p) => lower(expandPath(p, {})));
  const found = detectBrowsers({ platform: 'win32', exists: tree(paths), env: {} }).filter((b) => ['chrome', 'brave', 'edge', 'chromeForTesting'].includes(b.id));
  assert.deepEqual(found, []);
});

test('%LOCALAPPDATA% expands against env', () => {
  assert.match(expandPath('%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe', { LOCALAPPDATA: 'C:\\Users\\X\\AppData\\Local' }), /Users\\X\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe/);
});
