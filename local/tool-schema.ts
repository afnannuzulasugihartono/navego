// @last-edited: 2026-11-19 UTC+7.
// @title: tool-schema - the runtime validator every tool call passes before its branch reads an argument.
// @state: pure and total; it either returns the argument bag or throws one message that names the tool, the path and the value.
// @dependencies: ./types.js.

import type { JsonRecord } from './types.js';

// decisions.json -> local-tool-schema-01

export interface ArgumentSchema {
  type?: string | string[];
  properties?: Record<string, ArgumentSchema>;
  required?: string[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  items?: ArgumentSchema;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const typeOf = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number' && !Number.isFinite(value)) return 'non-finite number';
  return typeof value;
};

const matchesType = (value: unknown, wanted: string): boolean => {
  if (wanted === 'string') return typeof value === 'string';
  if (wanted === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (wanted === 'integer') return typeof value === 'number' && Number.isInteger(value);
  if (wanted === 'boolean') return typeof value === 'boolean';
  if (wanted === 'object') return isRecord(value);
  if (wanted === 'array') return Array.isArray(value);
  if (wanted === 'null') return value === null;
  return false;
};

const wantedTypes = (schema: ArgumentSchema): string[] => schema.type === undefined
  ? []
  : Array.isArray(schema.type) ? schema.type : [schema.type];

const show = (value: unknown): string => {
  if (typeof value === 'string') {
    const oneLine = value.replace(/\s+/g, ' ').trim();
    return JSON.stringify(oneLine.length > 80 ? `${oneLine.slice(0, 77)}...` : oneLine);
  }
  if (Array.isArray(value)) return `an array of ${value.length}`;
  if (isRecord(value)) return 'an object';
  return String(value);
};

const pathOf = (tool: string, path: string): string => path ? `${tool}.${path}` : tool;

function fail(tool: string, path: string, sentence: string): never {
  throw new Error(`${pathOf(tool, path)} ${sentence}`);
}

const validateValue = (tool: string, path: string, value: unknown, schema: ArgumentSchema): void => {
  const wanted = wantedTypes(schema);
  if (wanted.length > 0 && !wanted.some((type) => matchesType(value, type))) {
    fail(tool, path, `must be ${wanted.join(' or ')} - got ${typeOf(value)} ${show(value)}`);
  }
  if (schema.enum && !schema.enum.some((allowed) => allowed === value)) {
    fail(tool, path, `must be one of ${schema.enum.map((allowed) => show(allowed)).join(', ')} - got ${show(value)}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) fail(tool, path, `must be at least ${schema.minimum} - got ${value}`);
    if (schema.maximum !== undefined && value > schema.maximum) fail(tool, path, `must be at most ${schema.maximum} - got ${value}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) fail(tool, path, `must hold at least ${schema.minItems} item(s) - got ${value.length}`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) fail(tool, path, `must hold at most ${schema.maxItems} item(s) - got ${value.length}`);
    const itemSchema = schema.items;
    if (itemSchema) value.forEach((item, index) => validateValue(tool, `${path}[${index}]`, item, itemSchema));
  }
  if (isRecord(value)) validateObject(tool, path, value, schema);
};

const validateObject = (tool: string, path: string, value: Record<string, unknown>, schema: ArgumentSchema): void => {
  const declared = schema.properties;
  for (const name of schema.required ?? []) {
    const held = value[name];
    if (held === undefined || held === null || held === '') {
      fail(tool, path ? `${path}.${name}` : name, 'is required by the tool schema, and this call left it out or empty');
    }
  }
  if (!declared) return;
  for (const [name, held] of Object.entries(value)) {
    if (held === undefined) continue;
    const property = declared[name];
    if (!property) fail(tool, path ? `${path}.${name}` : name, 'is not an argument this tool declares - the schema is closed, so an unknown key is refused instead of ignored');
    validateValue(tool, path ? `${path}.${name}` : name, held, property);
  }
};

export function validateArguments(name: string, args: unknown, schema: ArgumentSchema): JsonRecord {
  if (!isRecord(args)) {
    throw new Error(`${name} arguments must be a JSON object - got ${typeOf(args)}. Every tool call names its arguments by key.`);
  }
  validateObject(name, '', args, schema);
  return args;
}
