// @last-edited: 2026-11-11 UTC+7.
// @title: popup-update-hint - the popup says when the version it runs is behind the one the server serves, and offers the one door that fixes it.
// @state: the check the popup makes, the smart door it offers (allow the folder once, or write the build over it), and the doors the menu carries.
// @dependencies: node:test, node:assert/strict, node:fs.

// WHY THIS GATE READS THE SOURCE.
// The popup is an extension page: it runs in the browser with chrome APIs around it, so it cannot be imported here.
// What can be proved is the text: that the popup asks the update service which version it serves, that it compares the two, that the button it offers does the work a browser cannot do from here, and that the doors out of the popup exist.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const popup = fs.readFileSync(new URL('extension/popup.js', root), 'utf8');
const popupHtml = fs.readFileSync(new URL('extension/popup.html', root), 'utf8');
const css = fs.readFileSync(new URL('extension/styles.css', root), 'utf8');

test('the popup asks the update service which version is served', () => {
  assert.match(popup, /import \{ servedVersion, newerThan \} from '\.\/lib\/self-update\.js'/, 'it asks, through the one served-version check the product owns');
  assert.match(popup, /showServedVersion\(String\(reply\.version\)\)/, 'the answer is compared with the version that is running');
});

test('the one served-version check asks the archive, not the legacy health page', () => {
  const lib = fs.readFileSync(new URL('extension/lib/self-update.js', root), 'utf8');
  assert.match(lib, /method: 'HEAD'/, 'the version is asked cheaply, carrying nothing');
  assert.match(lib, /download\/navego\.zip/, 'from the archive this extension is updated from');
  assert.match(lib, /x-opera-version/, 'and the answer is the version the build carries');
  assert.doesNotMatch(lib, /fetch\([^)]*health/, 'not the health page, which answers for another extension by design');
});

test('a newer served version is shown, and the same version is not', () => {
  assert.match(popup, /newerThan/, 'the two versions are compared as numbers, not as strings');
  assert.match(popup, /door\.hidden = true/, 'and the door hides when the installed version is the newest');
  assert.match(popup, /door\.hidden = false/, 'while it appears when the server serves a newer one');
  assert.match(popup, /t\('update\.smartReady', \{ v: served \}\)/, 'the door names the version that is waiting, in the reader\'s language');
});

test('the one door does the work a browser cannot do from here', () => {
  assert.match(popup, /applyNewBuild\(/, 'the granted folder is written by the same build the alarm applies');
  assert.match(popup, /chrome\.runtime\.reload\(/, 'and the extension can restart itself, which is the last click of the update');
  assert.match(popup, /update\.html/, 'the not-granted state opens the page that holds the folder picker, which the popup cannot hold');
  assert.doesNotMatch(popup, /chrome\.downloads\.download\(/, 'the zip-to-Downloads ritual is gone');
  assert.doesNotMatch(popup, /chrome:\/\/extensions/, 'and the chrome://extensions detour with it');
  assert.match(popupHtml, /id="updateDoorButton"/, 'the popup carries the one update door');
  assert.match(popupHtml, /id="updateDoorTitle"/, 'with the line that names what the press will do');
  assert.doesNotMatch(popupHtml, /id="updateButton"/, 'the amber download row is gone');
  assert.doesNotMatch(popupHtml, /id="reloadButton"/, 'the separate reload row is gone');
  assert.doesNotMatch(popupHtml, /id="autoUpdateButton"/, 'the folder-allow door is folded into the one update door');
  assert.doesNotMatch(popupHtml, /id="updateNowButton"/, 'and the apply door with it');
});

test('the popup has the doors out of it, the dashboard among them', () => {
  assert.match(popupHtml, /id="dashboardButton"/, 'the dashboard door exists');
  assert.match(popup, /dashboardButton.*dashboard\.html/s, 'and it opens the dashboard');
  assert.match(popupHtml, /id="docsButton"/, 'the documentation door exists');
  assert.match(popupHtml, /id="pairQuickButton"/, 'and the one-click pair door exists');
});

test('the status is one line, and the popup is a dark surface', () => {
  assert.match(popupHtml, /id="statusMain"/, 'the status is one line');
  assert.match(css, /body\.popup \.status\[data-tone="pending"\] \.icoClock/, 'the connected state has its own colour');
  assert.match(css, /body\.popup\s*\{[\s\S]*background: #10131c/, 'the popup carries its own dark surface');
  assert.match(css, /body\.popup \.door/, 'and the menu rows are styled as rows');
});
