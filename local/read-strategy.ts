// @last-edited: 2026-11-19 UTC+7.
// @title: read-strategy — which read to attempt first, decided from evidence rather than from a site name.
// @state: the harm classes, the strategy names, and one pure function that turns a surface profile into an ordered ladder.
// @dependencies: none.

export const HARM_NONE = 'none';
export const HARM_CARET_MOVE = 'caret-move';
export const HARM_CONTENT_CHANGE = 'content-change';

export interface SurfaceProfile {
  canvas?: boolean;
  editable?: boolean;
  axRich?: boolean;
}

export interface ReadStep {
  strategy: string;
  harm: string;
  why: string;
}

export const STRATEGY_AX = 'ax';
export const STRATEGY_DOM = 'dom';
export const STRATEGY_SELECT_ALL = 'select-all';
export const STRATEGY_VISION = 'vision';

const AX_STEP = {
  strategy: STRATEGY_AX,
  harm: HARM_NONE,
  why: 'the accessibility tree answers without touching the page'
};

const DOM_STEP = {
  strategy: STRATEGY_DOM,
  harm: HARM_NONE,
  why: 'the page already holds its text in the DOM'
};

const SELECT_ALL_STEP = {
  strategy: STRATEGY_SELECT_ALL,
  harm: HARM_CARET_MOVE,
  why: 'a canvas editor mirrors its text through the selection or the clipboard, and reading it moves the caret'
};

const VISION_STEP = {
  strategy: STRATEGY_VISION,
  harm: HARM_NONE,
  why: 'a picture is the last read that still asks nothing of the page'
};

// decisions.json -> local-read-strategy-01

// The first step that returns text ends the read, so the mirror has to lead for it to run at all.

export function readLadder(profile: SurfaceProfile = {}): ReadStep[] {
  const canvas = profile.canvas === true;
  const editable = profile.editable === true;
  const axRich = profile.axRich === true;

  if (canvas && editable) return [SELECT_ALL_STEP, DOM_STEP, AX_STEP, VISION_STEP].map((step) => ({ ...step }));
  const ladder: ReadStep[] = [];
  if (canvas && axRich) ladder.push(AX_STEP);
  ladder.push(DOM_STEP);
  if (!(canvas && axRich)) ladder.push(AX_STEP);
  ladder.push(VISION_STEP);
  return ladder.map((step) => ({ ...step }));
}
