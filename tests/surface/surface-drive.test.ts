// @last-edited: 2026-10-27 UTC+7.
// @title: surface-drive — the assembled driver, proved against a fake CDP client.
// @state: the profile tool, the gated read, and the answer that names what it skipped and why.
// @dependencies: node:test, node:assert/strict, ../local/primitives.js, ../local/read-strategy.js.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createPrimitives } from '../../local/primitives.js';
import { HARM_CARET_MOVE, STRATEGY_SELECT_ALL } from '../../local/read-strategy.js';

const richAx = ['PROPOSAL PENAWARAN', 'Kepada Yth.', 'Tim Pengembangan Lokasi', 'PT Indomarco Prismatama', 'Perihal penawaran lokasi', '1. Identitas Pengusul', '2. Latar Belakang', '3. Rincian Penawaran', '4. Nilai Investasi', '5. Jadwal'];
const poorAx = ['Share'];

const axTree = (texts: string[]) => {
  const nodes = [
    { nodeId: 'root', parentId: undefined, childIds: ['chromeRoot', 'docRoot'], role: { value: 'RootWebArea' }, name: { value: '' } },
    { nodeId: 'chromeRoot', parentId: 'root', childIds: [], role: { value: 'toolbar' }, name: { value: '' } },
    { nodeId: 'docRoot', parentId: 'root', childIds: [], role: { value: 'generic' }, name: { value: '' } }
  ];
  texts.forEach((text, i) => nodes.push({ nodeId: `doc${i}`, parentId: 'docRoot', childIds: [], role: { value: 'InlineTextBox' }, name: { value: text } }));
  return { nodes };
};

interface FakeCdpOptions {
  probe: unknown;
  ax?: string[];
  copy?: string | undefined;
  domText?: string | undefined;
  caret?: { rangeCount: number; collapsed: boolean | null; anchorOffset: number; hostTextLength: number } | null | undefined;
  clipboard?: { initial?: string; copyText?: string; focused?: boolean } | undefined;
}

const fakeCdp = ({ probe, ax = richAx, copy, domText = '', caret = null, clipboard = undefined }: FakeCdpOptions) => {
  const sent: Array<{ method: string; expression: unknown }> = [];
  let clipboardText = clipboard?.initial ?? '';
  return {
    sent,
    async send(method: string, params: Record<string, unknown> = {}) {
      sent.push({ method, expression: params.expression });
      const expression = String(params.expression ?? '');
      // The probe is keyed on the canvas-coverage arithmetic, which no other expression in the driver contains, so readState is not mistaken for it.
      if (method === 'Runtime.evaluate' && expression.includes('window.innerHeight')) {
        return { result: { value: probe } };
      }
      if (method === 'Accessibility.getFullAXTree') return axTree(ax);
      if (method === 'Runtime.evaluate' && expression.includes('innerText')) {
        return { result: { value: { title: 'Fake', url: 'https://example.invalid/', text: domText, ready: 'complete' } } };
      }
      // The clipboard is a small machine of its own: focus gates it, a write replaces it, and Ctrl+C is the only thing that puts the page's text in it.
      if (method === 'Runtime.evaluate' && expression.includes('document.hasFocus()')) {
        return { result: { value: clipboard?.focused !== false } };
      }
      if (method === 'Runtime.evaluate' && expression.includes('navigator.clipboard.readText')) {
        return { result: { value: clipboardText } };
      }
      if (method === 'Runtime.evaluate' && expression.includes('navigator.clipboard.writeText')) {
        const literal = expression.match(/writeText\(("(?:\\.|[^"\\])*")\)/)?.[1] ?? '';
        clipboardText = literal ? JSON.parse(literal) as string : '';
        return { result: { value: true } };
      }
      if (method === 'Input.dispatchKeyEvent' && String(params.key) === 'c' && Number(params.modifiers) === 2 && typeof clipboard?.copyText === 'string') {
        clipboardText = clipboard.copyText;
        return { result: { value: null } };
      }
      // The one selection state, read by both the copy and the caret guard.
      if (method === 'Runtime.evaluate' && expression.includes('richest')) {
        return { result: { value: { ...(caret ?? { frame: -1, hostPath: '', rangeCount: 0, collapsed: null, anchorOffset: 0, hostTextLength: 0 }), text: typeof copy === 'string' ? copy : '' } } };
      }
      return { result: { value: null } };
    },
    clipboard: () => clipboardText,
    close() {}
  };
};

const canvasProbe = {
  textInDom: { value: false, evidence: 0 },
  canvas: { value: true, evidence: 0.61 },
  editable: { value: true, evidence: 'true' },
  focused: { value: true, evidence: 'document.hasFocus() is true' }
};

test('probe answers without reading the document', async () => {
  const cdp = fakeCdp({ probe: canvasProbe, ax: richAx, copy: '' });
  const primitives = createPrimitives(cdp, { sleep: async () => {} });
  const out = await primitives.surfaceProfile();
  assert.equal(out.surface.canvas, true);
  assert.equal(out.surface.editable, true);
  assert.ok(out.description.includes('canvas'));
  assert.equal(out.strategy[0].strategy, STRATEGY_SELECT_ALL);
});

test('a read with no consent skips the caret-moving step and says why', async () => {
  const cdp = fakeCdp({ probe: canvasProbe, ax: poorAx, copy: '' });
  const primitives = createPrimitives(cdp, { sleep: async () => {} });
  const out = await primitives.read({ allowCaretMove: false });
  const skipped = out.skipped.find((entry: { harm: string; why: string }) => entry.harm === HARM_CARET_MOVE);
  assert.ok(skipped, 'the caret-moving step is reported as skipped');
  assert.match(skipped.why, /consent/i);
  assert.equal(out.text, '', 'nothing was read from a step that was refused');
});

test('a read with consent runs the caret-moving step', async () => {
  // A canvas caret: offset 0 on a node with no text, which is what the real measurement found, so the verdict must report it could not be restored.
  const canvasCaret = { rangeCount: 1, collapsed: true, anchorOffset: 0, hostTextLength: 0 };
  const cdp = fakeCdp({
    probe: canvasProbe,
    ax: poorAx,
    copy: 'PROPOSAL PENAWARAN',
    caret: canvasCaret
  });
  const primitives = createPrimitives(cdp, { sleep: async () => {} });
  const out = await primitives.read({ allowCaretMove: true });
  assert.equal(out.text, 'PROPOSAL PENAWARAN');
  assert.equal(out.harm, HARM_CARET_MOVE);
  assert.equal(out.skipped.length, 0);
  assert.equal(out.caretRestored, false, 'the verdict never claims a restore it did not measure');
  assert.equal(out.caret.restored, false);
});

test('a rich accessibility tree answers when the mirror is refused', async () => {
  const cdp = fakeCdp({ probe: canvasProbe, ax: richAx, copy: 'PROPOSAL PENAWARAN' });
  const primitives = createPrimitives(cdp, { sleep: async () => {} });
  const out = await primitives.read({ allowCaretMove: false });
  assert.equal(out.strategy, 'ax');
  assert.equal(out.harm, 'none', 'the accessibility read touches nothing, so it carries no harm');
  assert.equal(out.skipped.length, 1, 'the refused mirror is named rather than silently dropped');
  assert.equal(out.skipped[0].strategy, STRATEGY_SELECT_ALL);
  assert.ok((out.text || '').includes('PROPOSAL PENAWARAN'));
});

test('an ordinary DOM page is read through the DOM and nothing is skipped', async () => {
  const domProbe = {
    textInDom: { value: true, evidence: 4200 },
    canvas: { value: false, evidence: 0 },
    editable: { value: false, evidence: 'no editable host' },
    focused: { value: false, evidence: 'document.hasFocus() is false' }
  };
  const cdp = fakeCdp({ probe: domProbe, ax: [], copy: '', domText: 'A page that already holds its own words.' });
  const primitives = createPrimitives(cdp, { sleep: async () => {} });
  const out = await primitives.read();
  assert.equal(out.strategy, 'dom');
  assert.equal(out.harm, 'none');
  assert.equal(out.skipped.length, 0);
  assert.equal(out.text, 'A page that already holds its own words.');
});

test('a surface no read can answer names the picture instead of returning nothing', async () => {
  const bareProbe = {
    textInDom: { value: false, evidence: 0 },
    canvas: { value: true, evidence: 0.4 },
    editable: { value: false, evidence: 'no editable host' },
    focused: { value: false, evidence: 'document.hasFocus() is false' }
  };
  const cdp = fakeCdp({ probe: bareProbe, ax: poorAx, copy: '', domText: '' });
  const primitives = createPrimitives(cdp, { sleep: async () => {} });
  const out = await primitives.read();
  assert.equal(out.strategy, 'vision');
  assert.match(out.visionWhy, /OCR|empty picture/);
  assert.match(out.visionWhy, /allowVision/);
  assert.equal(out.text, '');
  assert.equal(cdp.sent.some((entry) => entry.method === 'Page.captureScreenshot'), false, 'no picture is taken without consent');
});

test('vision reads text only when the caller opts in', async () => {
  const bareProbe = {
    textInDom: { value: false, evidence: 0 },
    canvas: { value: true, evidence: 0.4 },
    editable: { value: false, evidence: 'no editable host' },
    focused: { value: false, evidence: 'document.hasFocus() is false' }
  };
  const cdp = fakeCdp({ probe: bareProbe, ax: poorAx, copy: '' });
  const primitives = createPrimitives(cdp, { sleep: async () => {}, ocr: async () => ({ text: 'OCR TEXT' }) });
  const out = await primitives.read({ allowVision: true });
  assert.equal(out.strategy, 'vision');
  assert.equal(out.text, 'OCR TEXT');
});

test('a canvas editor reads through the clipboard when the DOM mirrors one space', async () => {
  const cdp = fakeCdp({
    probe: canvasProbe,
    ax: poorAx,
    copy: ' ',
    clipboard: { initial: 'previous clipboard', copyText: 'DOCUMENT FROM CLIPBOARD' }
  });
  const out = await createPrimitives(cdp, { sleep: async () => {} }).read({ allowCaretMove: true });
  assert.equal(out.strategy, 'select-all');
  assert.equal(out.text, 'DOCUMENT FROM CLIPBOARD');
  assert.equal(out.clipboardUsed, true);
  assert.equal(cdp.clipboard(), 'previous clipboard', 'the clipboard is put back after the copy');
});

test('a copy that never ran is refused instead of returning the stale clipboard', async () => {
  const cdp = fakeCdp({
    probe: canvasProbe,
    ax: poorAx,
    copy: ' ',
    clipboard: { initial: 'STALE TEXT FROM ANOTHER PAGE' }
  });
  const out = await createPrimitives(cdp, { sleep: async () => {} }).read({ allowCaretMove: true });
  const skipped = out.skipped.find((entry: { strategy: string }) => entry.strategy === 'select-all');
  assert.ok(skipped, 'the refused copy is named');
  assert.match(skipped.why, /did not replace|proven fresh/);
  assert.notEqual(out.text, 'STALE TEXT FROM ANOTHER PAGE');
  assert.equal(cdp.clipboard(), 'STALE TEXT FROM ANOTHER PAGE', 'the stale clipboard is left where it was');
});

test('an unfocused page never reads the clipboard', async () => {
  const cdp = fakeCdp({
    probe: canvasProbe,
    ax: poorAx,
    copy: ' ',
    clipboard: { initial: 'STALE TEXT', focused: false }
  });
  const out = await createPrimitives(cdp, { sleep: async () => {} }).read({ allowCaretMove: true });
  const skipped = out.skipped.find((entry: { strategy: string }) => entry.strategy === 'select-all');
  assert.ok(skipped, 'the refused copy is named');
  assert.match(skipped.why, /not focused/);
  assert.equal(out.text, '');
  assert.equal(cdp.clipboard(), 'STALE TEXT');
});
