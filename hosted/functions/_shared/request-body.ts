// @last-edited: 2026-11-21 UTC+7.
// @title: request-body - the one edge-runtime rule for a JSON request body that must be a plain object.
// @state: the parsed object, or the reason the body was malformed JSON or valid JSON that was not an object.
// @dependencies: none.

// decisions.json -> hosted-request-body-01

// The helper separates the two refusals so each function can keep its own error envelope.
// A malformed body and a JSON array are different failures, and neither may reach typed action code.

export type RequestBodyResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; reason: "invalid_json" | "not_object" };

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJsonObject(raw: string): RequestBodyResult {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (!isJsonObject(value)) return { ok: false, reason: "not_object" };
  return { ok: true, body: value };
}

export async function readJsonObject(req: Request): Promise<RequestBodyResult> {
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  return parseJsonObject(raw);
}
