// @last-edited: 2026-10-15 UTC+7.
// @title: dialog — an operating system dialog is a window the machine can answer.
// @state: three named calls, honest refusals, the proof that a page's picker is reachable.
// @dependencies: node:test, assert, ../local/dialog.js, ../local/mcp-server.js, ../local/agent-guide.js.

// THESE CLAIMS EXIST.
// Measured live on this product's own author: a drive clicked "Upload from computer" in Google Docs, the operating system's file dialog opened, and nothing in the browser could type into it, read it, or close it - a walk that used to end there.
// The agent runs on the machine, so that dialog is an ordinary window.
// These are the claims that it is: the dialog is found, its field is read back, a path goes in, and a button answers.

import test from 'node:test';
import assert from 'node:assert/strict';

import { dialogState, dialogType, dialogPress } from '../../local/dialog.js';
import { TOOLS } from '../../local/mcp-server.js';
import { guide } from '../../local/agent-guide.js';

// EVERY CALL ANSWERS EVEN WHEN THERE IS NOTHING TO ANSWER ABOUT.
// A caller that asked the machine a question gets words back when the machine has none to give, because a bare false reads the same as a dialog that refused to answer.

test('with no dialog open, every call says so in words', async () => {
  for (const call of [await dialogState(), await dialogType('C:\\\\nope.png'), await dialogPress('Open')]) {
    assert.equal(typeof call.open, 'boolean');
    assert.equal(call.platform, process.platform);
    if (!call.open) assert.ok(call.why.length > 0, 'a refusal says why');
  }
});

// THE FIELD IS READ AND NOT ASSUMED.
// Typed into a live file dialog and read back empty the first time, which reads exactly like a field that never took the text - and the write had gone through.
// WM_GETTEXT with a marshalled buffer is what carries text across a process boundary, so the read is what says whether the type landed.

test('a type that reports success also reads back what it typed', async () => {
  const typed = await dialogType('C:\\\\Users\\\\ASUS\\\\AppData\\\\Local\\\\Temp\\\\opencode\\\\thesis-test.png');
  if (!typed.open) return;
  const seen = await dialogState();
  if (!seen.open) return;
  if (typed.typed) {
    assert.equal(seen.field, 'C:\\\\Users\\\\ASUS\\\\AppData\\\\Local\\\\Temp\\\\opencode\\\\thesis-test.png');
  }
});

// THE THREE CALLS ARE NAMED IN THE CATALOGUE.
// Driving an operating system dialog is the first thing this driver does outside the browser, so it is visible by name rather than hidden behind a flag: a caller reading the catalogue can see it before it happens, and an agent can find it without being told.

test('the catalogue names the dialog roads, and says they are outside the browser', () => {
  const read = TOOLS.find((candidate) => candidate.name === 'browser_read_dialog');
  const type = TOOLS.find((candidate) => candidate.name === 'browser_type_into_dialog');
  const press = TOOLS.find((candidate) => candidate.name === 'browser_press_dialog_button');

  assert.ok(read && type && press, 'all three dialog tools are in the catalogue');
  assert.match(read.description, /outside the browser/i);
  assert.deepEqual(Object.keys(type.inputSchema.properties), ['text']);
  assert.deepEqual(type.inputSchema.required, ['text']);
  assert.deepEqual(Object.keys(press.inputSchema.properties), ['name']);
  assert.deepEqual(press.inputSchema.required, ['name']);
});

test('the guide says a dialog is answerable now, not only avoidable', () => {
  const { recipes } = guide(undefined);
  const chooser = recipes.find((recipe) => /chooser has no input/i.test(recipe.task));

  assert.ok(chooser, 'the recipe for a chooser with no input is there');
  assert.match(chooser.note, /dialog/, 'and it names the road that answers one that is already open');
});

test('the guide declares what the dialog call does to the machine', () => {
  const { sideEffects } = guide(undefined);
  const byTool = Object.fromEntries(sideEffects.map((entry) => [entry.tool, entry.effects]));
  const readDialog = byTool.browser_read_dialog;
  const typeDialog = byTool.browser_type_into_dialog;
  const pressDialog = byTool.browser_press_dialog_button;
  assert.ok(readDialog && typeDialog && pressDialog, 'all three dialog tools declare side effects');

  assert.ok(readDialog.some((line) => /outside the browser/.test(line)), 'and names the outside browser');
  assert.ok(typeDialog.some((line) => /writes text/.test(line)), 'type writes');
  assert.ok(pressDialog.some((line) => /presses a button/.test(line)), 'press presses');
});
