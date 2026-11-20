// @last-edited: 2026-11-21 UTC+7.
// @title: tool-bounds — every cap the tool catalog advertises is a bound the runtime validator enforces.
// @state: the real catalog and the real validator, proving a call past an advertised cap is refused and a call at the cap is accepted.
// @dependencies: node:test, strict, ../../local/tools.js, ../../local/tool-schema.js.

// decisions.json -> local-tools-bounds-01

import test from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS } from '../../local/tools.js';
import { validateArguments } from '../../local/tool-schema.js';

interface Bound {
  tool: string;
  property: string;
  minimum?: number;
  maximum: number;
  atCap: Record<string, unknown>;
  pastCap: Record<string, unknown>;
}

const BOUNDS: Bound[] = [
  {
    tool: 'browser_read_page',
    property: 'maxChars',
    minimum: 1,
    maximum: 100000,
    atCap: { maxChars: 100000 },
    pastCap: { maxChars: 100001 }
  },
  {
    tool: 'browser_search_web',
    property: 'timeoutMs',
    minimum: 1000,
    maximum: 30000,
    atCap: { query: 'navego', timeoutMs: 30000 },
    pastCap: { query: 'navego', timeoutMs: 30001 }
  },
  {
    tool: 'browser_find_element',
    property: 'limit',
    minimum: 1,
    maximum: 500,
    atCap: { role: 'button', limit: 500 },
    pastCap: { role: 'button', limit: 501 }
  },
  {
    tool: 'browser_run_steps',
    property: 'timeoutMs',
    minimum: 500,
    maximum: 12000,
    atCap: { timeoutMs: 12000, steps: [{ action: 'browser_press_key', key: 'Escape' }] },
    pastCap: { timeoutMs: 12001, steps: [{ action: 'browser_press_key', key: 'Escape' }] }
  },
  {
    tool: 'browser_wait_until',
    property: 'timeoutMs',
    minimum: 500,
    maximum: 60000,
    atCap: { until: 'row', role: 'button', name: 'Save', timeoutMs: 60000 },
    pastCap: { until: 'row', role: 'button', name: 'Save', timeoutMs: 60001 }
  }
];

function schemaOf(name: string) {
  const tool = TOOLS.find((candidate) => candidate.name === name);
  assert.ok(tool, `the catalog carries ${name}`);
  return tool.inputSchema as { properties?: Record<string, { minimum?: number; maximum?: number }> };
}

test('every advertised cap is declared in the schema the client reads', () => {
  for (const bound of BOUNDS) {
    const schema = schemaOf(bound.tool);
    const property = schema.properties?.[bound.property];
    assert.ok(property, `${bound.tool}.${bound.property} is declared`);
    assert.equal(property.maximum, bound.maximum, `${bound.tool}.${bound.property} must carry the cap it advertises`);
    if (bound.minimum !== undefined) {
      assert.equal(property.minimum, bound.minimum, `${bound.tool}.${bound.property} must carry its floor`);
    }
  }
});

test('a call past an advertised cap is refused by the runtime validator', () => {
  for (const bound of BOUNDS) {
    const schema = schemaOf(bound.tool);
    assert.throws(
      () => validateArguments(bound.tool, bound.pastCap, schema),
      new RegExp(`${bound.tool}\\.${bound.property} must be at most ${bound.maximum}`),
      `${bound.tool}.${bound.property} must refuse a call past its cap`
    );
  }
});

test('a call at the advertised cap is accepted', () => {
  for (const bound of BOUNDS) {
    const schema = schemaOf(bound.tool);
    assert.doesNotThrow(
      () => validateArguments(bound.tool, bound.atCap, schema),
      `${bound.tool}.${bound.property} must accept a call at its cap`
    );
  }
});
