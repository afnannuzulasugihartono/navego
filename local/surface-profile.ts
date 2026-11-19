// @last-edited: 2026-11-19 UTC+7.
// @title: surface-profile — what a surface is, measured in the page and in its accessibility tree, with the evidence for every claim.
// @state: the in-page probe expression, the accessibility measurement, and the profile both halves build.
// @dependencies: none.

// The probe reads page-generic properties only; a selector or domain here would be per-site code.
// The bar is interpolated into the expression because a page string cannot see this module's constants; a ReferenceError there reads as an empty surface.

import type { JsonRecord } from './types.js';

// A cheap pre-filter for wait(): a length bar cannot tell a short page's text from a canvas editor's chrome, so this only skips the obvious case.

export const MIN_DOM_TEXT = 40;

export const SURFACE_PROBE_EXPRESSION = `(() => {
  const MIN_DOM_TEXT = ${MIN_DOM_TEXT};
  const body = document.body;
  const text = body ? String(body.innerText || '') : '';
  const canvases = [...document.querySelectorAll('canvas')];
  const viewport = Math.max(1, window.innerWidth * window.innerHeight);
  const covered = canvases.reduce((sum, el) => {
    const box = el.getBoundingClientRect();
    return sum + Math.max(0, box.width) * Math.max(0, box.height);
  }, 0);
  const editableHost = document.querySelector('[contenteditable=""], [contenteditable="true"], [role="textbox"]');
  const active = document.activeElement;
  const editorFrame = Boolean(active && active.tagName === 'IFRAME');
  return {
    textInDom: { value: text.trim().length >= MIN_DOM_TEXT, evidence: text.trim().length },
    canvas: { value: canvases.length > 0 && covered / viewport >= 0.2, evidence: Math.round((covered / viewport) * 100) / 100 },
    editable: { value: Boolean(editableHost), evidence: editableHost ? (editableHost.getAttribute('contenteditable') || editableHost.getAttribute('role')) : 'no editable host' },
    editorFrame: { value: editorFrame, evidence: editorFrame ? 'activeElement is an iframe' : String(active ? active.tagName : 'no activeElement') },
    focused: { value: document.hasFocus() === true, evidence: 'document.hasFocus() is ' + String(document.hasFocus()) }
  };
})()`;

// One claim as the probe makes it: the boolean is the decision, the evidence is why it was made.

export interface ProbeClaim {
  value?: unknown;
  evidence?: unknown;
}

// decisions.json -> local-surface-profile-01

export interface ProbeAnswers {
  textInDom: ProbeClaim;
  canvas: ProbeClaim;
  editable: ProbeClaim;
  editorFrame: ProbeClaim;
  focused: ProbeClaim;
}

export interface AxMeasurement {
  axRich: boolean;
  textBoxes: number;
  textLength: number;
  documentText: string;
  truncated: boolean;
}

export async function probeSurface({ evaluate }: { evaluate: (expression: string) => Promise<unknown> }): Promise<ProbeAnswers> {
  // The probe's expression returns a record; the cast names that contract once.
  const probe = (await evaluate(SURFACE_PROBE_EXPRESSION)) as JsonRecord;
  return {
    textInDom: probe?.textInDom ?? { value: false, evidence: 0 },
    canvas: probe?.canvas ?? { value: false, evidence: 0 },
    editable: probe?.editable ?? { value: false, evidence: 'the probe did not answer' },
    editorFrame: probe?.editorFrame ?? { value: false, evidence: 'the probe did not answer' },
    focused: probe?.focused ?? { value: false, evidence: 'the probe did not answer' }
  };
}

// A frameId appears on one node only and getPartialAXTree wants a node id, so the document is the subtree that dominates its siblings, not a frame or a printed string.

// The root is the biggest subtree and holds the chrome, so descend into the child that dominates its siblings.

// A parent's total is the sum of its children, so the comparison is against the siblings, not the parent.

const TEXT_ROLES = new Set(['InlineTextBox', 'StaticText']);

// A tree can carry parentId without childIds, so children are rebuilt from parentId; a childIds-only walk reads an empty page.

interface AxNode {
  nodeId?: unknown;
  parentId?: unknown;
  childIds?: unknown[];
  role?: { value?: unknown };
  name?: { value?: unknown };
  [key: string]: unknown;
}

interface RegionSummary {
  count: number;
  length: number;
  parts: string[];
}

const documentRegion = (nodes: AxNode[]): RegionSummary & { deepest: number } => {
  const byId = new Map<string, AxNode>();
  for (const node of nodes) {
    if (node.nodeId === undefined || node.nodeId === null) continue;
    byId.set(String(node.nodeId), node);
  }
  // Two passes, because a tree does not promise its parents before its children.
  const children = new Map<string, string[]>();
  for (const [id, node] of byId) {
    const parent = node.parentId === undefined || node.parentId === null ? null : String(node.parentId);
    if (parent && byId.has(parent)) {
      const list = children.get(parent) ?? [];
      if (!list.includes(id)) list.push(id);
      children.set(parent, list);
    }
    for (const child of node.childIds || []) {
      const childId = String(child);
      if (!byId.has(childId)) continue;
      const list = children.get(id) ?? [];
      if (!list.includes(childId)) list.push(childId);
      children.set(id, list);
    }
  }
  const measured = new Map<string, RegionSummary>();
  const textOf = (id: string): RegionSummary => {
    const node = byId.get(id);
    if (!node || !TEXT_ROLES.has(String(node.role?.value ?? ''))) return { count: 0, length: 0, parts: [] };
    const name = String(node.name?.value ?? '');
    return { count: 1, length: name.length, parts: [name] };
  };
  const total = (id: string, seen: Set<string>): RegionSummary => {
    if (measured.has(id)) {
      const cached = measured.get(id);
      if (cached !== undefined) return cached;
    }
    if (seen.has(id)) return { count: 0, length: 0, parts: [] };
    seen.add(id);
    let sum = textOf(id);
    for (const childId of children.get(id) || []) {
      if (!byId.has(childId)) continue;
      const inner = total(childId, seen);
      sum = { count: sum.count + inner.count, length: sum.length + inner.length, parts: [...sum.parts, ...inner.parts] };
    }
    measured.set(id, sum);
    return sum;
  };
  const roots: string[] = [];
  for (const [id, node] of byId) {
    const parent = node.parentId === undefined || node.parentId === null ? null : String(node.parentId);
    if (!parent || !byId.has(parent)) roots.push(id);
  }
  let here: { id: string; sum: RegionSummary } | null = null;
  for (const id of roots) {
    const sum = total(id, new Set());
    if (!here || sum.count > here.sum.count) here = { id, sum };
  }
  if (!here) return { count: 0, length: 0, parts: [], deepest: 0 };
  // A cycle hangs the walk synchronously, so the descent carries a visited set; measured with a three-node loop.
  const start = here;
  let hereRow: { id: string; sum: RegionSummary } = start;
  const visited = new Set([hereRow.id]);
  for (;;) {
    const kids: Array<{ id: string; sum: RegionSummary }> = [];
    for (const childId of children.get(hereRow.id) || []) {
      if (!byId.has(childId) || visited.has(childId)) continue;
      kids.push({ id: childId, sum: total(childId, new Set()) });
    }
    const leader = kids[0];
    if (!leader) break;
    kids.sort((a, b) => b.sum.count - a.sum.count);
    const winning = kids[0];
    if (winning === undefined) break;
    const siblings = kids.reduce((sum, kid) => sum + kid.sum.count, 0);
    if (winning.sum.count * 2 <= siblings) break;
    hereRow = winning;
    visited.add(hereRow.id);
  }
  // Reaching the cap is the only evidence the text was cut, so it is reported as truncated rather than guessed at.
  let deepest = 0;
  const walked = new Set(roots);
  let frontier = roots;
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const childId of children.get(id) || []) {
        if (!byId.has(childId) || walked.has(childId)) continue;
        walked.add(childId);
        next.push(childId);
      }
    }
    if (next.length) deepest += 1;
    frontier = next;
  }
  return { count: hereRow.sum.count, length: hereRow.sum.length, parts: hereRow.sum.parts, deepest };
};

// Chrome truncates at the requested depth, so the cap and the truncation report must agree.

const MAX_AX_DEPTH = 60;

export async function measureAx({ ask, method = 'Accessibility.getFullAXTree' }: { ask: (method: string, params?: Record<string, unknown>) => Promise<JsonRecord>; method?: string }): Promise<AxMeasurement> {
  const empty: AxMeasurement = { axRich: false, textBoxes: 0, textLength: 0, documentText: '', truncated: false };
  let tree: JsonRecord;
  try {
    tree = await ask(method, { maxDepth: MAX_AX_DEPTH });
  } catch {
    return empty;
  }
  const nodes = (Array.isArray(tree.nodes) ? tree.nodes : []) as AxNode[];
  if (!nodes.length) return empty;

  const region = documentRegion(nodes);
  // decisions.json -> local-surface-profile-02

  // The bar decides which read leads, not whether the text exists.
  const rich = region.count >= 10;
  return {
    axRich: rich,
    textBoxes: region.count,
    textLength: region.length,
    documentText: region.parts.join(''),
    truncated: region.deepest >= MAX_AX_DEPTH
  };
}

// The profile both probes build together: booleans are the decision, the evidence block is why.

export interface BuiltProfile {
  textInDom: boolean;
  canvas: boolean;
  editable: boolean;
  axRich: boolean;
  truncated: boolean;
  focused: boolean;
  evidence: {
    textInDom: unknown;
    canvas: unknown;
    editable: unknown;
    editorFrame: unknown;
    focused: unknown;
    ax: { textBoxes: number; textLength: number; truncated: boolean };
  };
}

export function buildProfile({ probe = {}, ax = {} }: { probe?: Partial<ProbeAnswers>; ax?: Partial<AxMeasurement> | null } = {}): BuiltProfile {
  // An absent claim answers as not-true rather than as a hole in the profile.
  const evidenceAx = ax ?? {};
  // decisions.json -> local-surface-profile-01
  const editorFrame = probe.editorFrame?.value === true && probe.canvas?.value === true;
  const editable = probe.editable?.value === true || editorFrame;
  return {
    textInDom: probe.textInDom?.value === true,
    canvas: probe.canvas?.value === true,
    editable,
    axRich: evidenceAx.axRich === true,
    truncated: evidenceAx.truncated === true,
    focused: probe.focused?.value === true,
    // The number that made each boolean rides along, so a wrong call is visible.
    evidence: {
      textInDom: probe.textInDom?.evidence ?? null,
      canvas: probe.canvas?.evidence ?? null,
      editable: probe.editable?.evidence ?? null,
      editorFrame: probe.editorFrame?.evidence ?? null,
      focused: probe.focused?.evidence ?? null,
      ax: {
        textBoxes: evidenceAx.textBoxes ?? 0,
        textLength: evidenceAx.textLength ?? 0,
        truncated: evidenceAx.truncated === true
      }
    }
  };
}

// The description names the surface's shape and nothing about where it was found.

export function describeProfile(profile: { canvas?: boolean; editable?: boolean; axRich?: boolean; truncated?: boolean; focused?: boolean } = {}): string {
  const parts: string[] = [];
  parts.push(profile.canvas === true ? 'canvas-rendered' : 'text in the DOM');
  if (profile.editable === true) parts.push('editable');
  if (profile.axRich === true) parts.push('accessibility-rich');
  if (profile.truncated === true) parts.push('accessibility tree cut at the depth cap');
  parts.push(profile.focused === true ? 'focused' : 'unfocused');
  return parts.join(', ');
}
