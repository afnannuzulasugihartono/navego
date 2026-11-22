// @last-edited: 2026-11-22 UTC+7.
// @title: site-session — the header tells the visitor whether this browser is signed in, and the session survives a restart.
// @state: the session store, the header's branch on the account, and the sign-out that clears it.
// @dependencies: node:test, strict, ../../site/app/lib/auth.ts, ../../site/app/components/Chrome.tsx.

// THIS GATE EXISTS.
// The header always said "Masuk", so a signed-in visitor could not tell whether the browser held a session; and the session itself lived in a token the site never renewed once the access token aged out, so a restart ended it.
// The session is now one store: the token, the rotating refresh token, and the account email, all in localStorage, and the header reads the account from it on every page.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const auth = fs.readFileSync(path.join(root, 'site/app/lib/auth.ts'), 'utf8');
const chrome = fs.readFileSync(path.join(root, 'site/app/components/Chrome.tsx'), 'utf8');
const login = fs.readFileSync(path.join(root, 'site/app/routes/index.tsx'), 'utf8');

test('the session lives in localStorage, so it survives a tab close and a browser restart', () => {
  assert.match(auth, /browserGlobals\.localStorage\?\.setItem\(EMAIL_KEY, email\)/);
  assert.match(auth, /browserGlobals\.localStorage\.getItem\(EMAIL_KEY\)/);
  assert.match(auth, /const EMAIL_KEY = 'navego-session-email'/);
});

test('a remembered email without a token is not a session', () => {
  assert.match(auth, /if \(!browserGlobals\.localStorage\?\.getItem\(ACCESS_KEY\)\) return null;/);
});

test('the bar only claims a session the token can still carry', () => {
  assert.match(auth, /export async function sessionAccount\(\): Promise<string \| null> \{[\s\S]*?const proof = await proveSession\(stored\)/);
  assert.doesNotMatch(auth, /export async function sessionAccount\(\): Promise<string \| null> \{[\s\S]*?if \(remembered\) return remembered;/);
});

test('the header asks the session who the visitor is, and shows the dashboard when it knows', () => {
  assert.match(chrome, /sessionAccount\(\)/);
  assert.match(chrome, /to="\/dashboard"/);
  assert.match(chrome, /\{email \? \(/);
  assert.match(chrome, />Masuk</);
});

test('a sign-out clears the session and tells every tab', () => {
  assert.match(auth, /export function clearSession\(\) \{[\s\S]*?storeEmail\(null\);[\s\S]*?announceSession\(null\);/);
  assert.match(auth, /browserGlobals\.window\?\.dispatchEvent\(new CustomEvent\(SESSION_EVENT/);
  assert.match(auth, /browserGlobals\.window\?\.addEventListener\('storage', handler\)/);
});

test('a sign-in stores the account before it redirects', () => {
  assert.match(login, /storeEmail\(proof\.email as string\);/);
  assert.match(login, /announceSession\(proof\.email as string\);/);
});
