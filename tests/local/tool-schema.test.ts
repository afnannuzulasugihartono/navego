// @last-edited: 2026-11-19 UTC+7.
// @title: tool-schema — the runtime check a tool call passes before its branch reads a key.
// @state: the schema table is the only contract; a required key, a type, a bound, an enum and an unknown key each refuse by name.
// @dependencies: node:test, strict, ../../local/tool-schema.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateArguments, type ArgumentSchema } from '../../local/tool-schema.js';

const schema: ArgumentSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    count: { type: 'integer', minimum: 1, maximum: 3 },
    mode: { type: 'string', enum: ['a', 'b'] },
    tags: { type: 'array', minItems: 1, maxItems: 2, items: { type: 'string' } },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: { action: { type: 'string', enum: ['click'] } },
        required: ['action']
      }
    }
  },
  required: ['name']
};

test('a valid call is returned unchanged', () => {
  const args = { name: 'ok', count: 2, mode: 'a', tags: ['x'], steps: [{ action: 'click' }] };
  assert.equal(validateArguments('demo', args, schema), args);
});

test('a required key is refused when it is missing, null or empty', () => {
  for (const args of [{}, { name: null }, { name: '' }]) {
    assert.throws(() => validateArguments('demo', args, schema), /demo\.name is required/, JSON.stringify(args));
  }
});

test('a value of the wrong type is refused with the type it got', () => {
  assert.throws(() => validateArguments('demo', { name: 5 }, schema), /demo\.name must be string - got number 5/);
  assert.throws(() => validateArguments('demo', { name: 'ok', count: '2' }, schema), /demo\.count must be integer - got string "2"/);
  assert.throws(() => validateArguments('demo', { name: 'ok', count: 1.5 }, schema), /demo\.count must be integer - got number 1\.5/);
  assert.throws(() => validateArguments('demo', { name: 'ok', count: Number.POSITIVE_INFINITY }, schema), /non-finite number/);
});

test('bounds and enums are enforced, not documented', () => {
  assert.throws(() => validateArguments('demo', { name: 'ok', count: 0 }, schema), /demo\.count must be at least 1 - got 0/);
  assert.throws(() => validateArguments('demo', { name: 'ok', count: 4 }, schema), /demo\.count must be at most 3 - got 4/);
  assert.throws(() => validateArguments('demo', { name: 'ok', mode: 'c' }, schema), /demo\.mode must be one of "a", "b" - got "c"/);
});

test('an array is checked by length and by item type', () => {
  assert.throws(() => validateArguments('demo', { name: 'ok', tags: [] }, schema), /demo\.tags must hold at least 1 item\(s\) - got 0/);
  assert.throws(() => validateArguments('demo', { name: 'ok', tags: ['a', 'b', 'c'] }, schema), /demo\.tags must hold at most 2 item\(s\) - got 3/);
  assert.throws(() => validateArguments('demo', { name: 'ok', tags: [1] }, schema), /demo\.tags\[0\] must be string - got number 1/);
});

test('a nested object is closed and its required key is enforced', () => {
  assert.throws(() => validateArguments('demo', { name: 'ok', steps: [{}] }, schema), /demo\.steps\[0\]\.action is required/);
  assert.throws(() => validateArguments('demo', { name: 'ok', steps: [{ action: 'nope' }] }, schema), /demo\.steps\[0\]\.action must be one of "click" - got "nope"/);
  assert.throws(() => validateArguments('demo', { name: 'ok', steps: [{ action: 'click', extra: true }] }, schema), /demo\.steps\[0\]\.extra is not an argument this tool declares/);
});

test('an unknown root argument is refused instead of ignored', () => {
  assert.throws(() => validateArguments('demo', { name: 'ok', typo: 1 }, schema), /demo\.typo is not an argument this tool declares/);
});

test('arguments that are not a JSON object are refused before any branch reads them', () => {
  assert.throws(() => validateArguments('demo', null, schema), /demo arguments must be a JSON object - got null/);
  assert.throws(() => validateArguments('demo', ['x'], schema), /got array/);
});
