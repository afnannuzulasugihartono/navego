// @last-edited: 2026-11-17 UTC+7.
// @title: wire - the one place tests read the RPC frames the MCP server answers with.
// @state: unwrap() throws on an error or missing frame so a failing tool shows the refusal, not an undefined property access.
// @dependencies: none.

// THIS FILE EXISTS The server's handle() answers with a union across initialize, tools/list and tools/call; asserting on `'result' in res` at every call site would either push the same guard forty times or force `unknown` casts into every property read.
// Tests need the answer, or the refusal, and the refusal is the worth having part of a failure - so this helper throws with the message the tool refused with.
// This is the ONLY `any` in the test tree: the frame shapes are wire data, not shapes we control.
// Everything typechecked against them stays typechecked; this just states the honest fact that JSON has no static shape.

export type McpFrame = {
  jsonrpc?: string;
  id?: unknown;
  result?: any;
  error?: { code?: number; message?: string } | undefined;
};

export function unwrap(frame: McpFrame | undefined | null): any {
  if (!frame || frame.error) {
    throw new Error(`the tool refused: ${JSON.stringify(frame?.error ?? frame)}`);
  }
  return frame.result;
}
