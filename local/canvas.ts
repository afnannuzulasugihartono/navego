// @last-edited: 2026-11-19 UTC+7.
// @title: canvas — the reads a surface that is not a page full of text can answer, and the guard in front of the one that moves a caret.
// @state: the ladder walk for read, the caret line read, and the generic selection copy they share.
// @dependencies: ./page-expressions.js, ./surface-profile.js, ./caret-guard.js, ./read-strategy.js.

import { SELECTION_STATE_EXPRESSION } from './page-expressions.js';
import { probeSurface, measureAx, buildProfile, describeProfile } from './surface-profile.js';
import { createCaretGuard, gateRead } from './caret-guard.js';
import { readDevice } from './wallet-client.js';
import type { JsonRecord } from './types.js';
import {
  HARM_NONE,
  STRATEGY_AX,
  STRATEGY_DOM,
  STRATEGY_SELECT_ALL,
  STRATEGY_VISION,
  readLadder
} from './read-strategy.js';

// The borrow scrolls the view to the selection end, and nothing here scrolls it back; only the caret is restored.

const scopedExpression = (selector: string): string => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return { url: document.location.href, title: document.title, text: null };
  return { url: document.location.href, title: document.title, text: String(el.innerText ?? '') };
})()`;

const maxCharsOf = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return undefined;
  return Math.min(Math.floor(parsed), 100000);
};

const truncateTo = (text: string, maxChars: number | undefined): { text: string; truncatedChars: number; originalChars: number } => {
  if (maxChars === undefined || text.length <= maxChars) {
    return { text, truncatedChars: 0, originalChars: text.length };
  }
  return { text: text.slice(0, maxChars), truncatedChars: text.length - maxChars, originalChars: text.length };
};

const VIEW_WHY = 'the borrow selected the whole document, so the view is left where the selection ended;'
  + ' the caret verdict says whether the caret itself came back';

// Only the DOM read samples twice; the tree and the copy sample once, so they answer settled:null and name the proof the caller can run instead.

const SETTLED_WHY_AX = 'this read sampled the accessibility tree once, so it can say what the text is and not that it stopped moving; wait() is the proof of that';
const SETTLED_WHY_COPY = 'the text came from a selection copy; a second copy would move the caret twice, so read again after wait() or take shot() as the proof';

const EMPTY_COPY_WHY = 'the selection answered no text, which is not the same as an empty document; the ladder continues to the picture';
const NO_MARK_WHY = 'the caret could not be remembered, so the borrow was refused';
const VISION_CONSENT_WHY = 'the OCR fallback sends one screenshot of this page off the machine, and no consent was recorded on the call - pass allowVision: true to permit it';

// Page answers are computed in the page and read back whole, so each crosses as the open record its interface owns.

export type OcrReader = () => Promise<{ text: string } | { why: string }>;

export function createCanvasMethods({ primitives, readState, ocr = null }: { primitives: JsonRecord; readState: () => Promise<{ title?: unknown; url?: unknown; text?: unknown; ready?: unknown }>; ocr?: OcrReader | null }) {
  // SELECTION_STATE_EXPRESSION is the same read the caret guard uses, so the text and the caret verdict come from one frame.

  const copySelection = async () => {
    const state = await primitives.evaluate(SELECTION_STATE_EXPRESSION);
    const text = state && typeof state.text === 'string' ? state.text : '';
    return text.length > 0 ? text : null;
  };

  const readClipboard = async () => {
    const text = await primitives.evaluate('navigator.clipboard.readText()').catch(() => '');
    return typeof text === 'string' ? text : '';
  };

  // decisions.json -> local-canvas-02

  // An unfocused tab cannot write the sentinel and leaves the previous clipboard readable, so focus is checked first.
  const copyThroughClipboard = async (): Promise<{ text: string } | { why: string }> => {
    const focused = await primitives.evaluate('document.hasFocus() === true').catch(() => false);
    if (focused !== true) return { why: 'the page is not focused, so a copy would read whatever was on the clipboard instead of this page - focus the tab and read again' };
    const before = await readClipboard();
    const sentinel = `opera-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    const armed = await primitives.evaluate(`navigator.clipboard.writeText(${JSON.stringify(sentinel)}).then(() => true).catch(() => false)`).catch(() => false);
    await primitives.key('c', ['Control']);
    await primitives.settle();
    const after = await readClipboard();
    if (armed === true) {
      await primitives.evaluate(`navigator.clipboard.writeText(${JSON.stringify(before)}).catch(() => null)`).catch(() => null);
      if (after === sentinel) return { why: 'the copy did not replace the clipboard, so the previous contents were refused rather than read as this page' };
      return after.trim().length > 0 ? { text: after } : { why: 'the copy left the clipboard empty' };
    }
    if (after === before || after.trim().length < 2) {
      return { why: 'the copy could not be proven fresh because the clipboard did not change; the previous contents were refused rather than read as this page' };
    }
    return { text: after };
  };

  const guard = createCaretGuard({ evaluate: primitives.evaluate });

  // decisions.json -> hosted-opera-ocr-01
  const OCR_ENDPOINT = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-ocr';
  const defaultOcrFromShot: OcrReader = async () => {
    let held: { deviceName: string; token: string } | null = null;
    try { held = readDevice({}); } catch { held = null; }
    if (!held || !held.token) return { why: 'this machine has no paired device file (~/.opera/device.json), so the OCR edge has no token to accept - pair the driver from the dashboard' };
    const shot = await primitives.ask('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: false }).catch(() => null);
    const bytes = shot && typeof shot.data === 'string' ? shot.data : '';
    if (!bytes) return { why: 'the browser answered Page.captureScreenshot with no picture bytes' };
    try {
      const response = await fetch(OCR_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-opera-token': held.token, 'x-opera-device': held.deviceName },
        body: JSON.stringify({ image_base64: bytes, mime: 'image/jpeg' }),
        signal: AbortSignal.timeout(60000)
      });
      if (!response.ok) return { why: `the OCR edge answered http ${response.status}` };
      const answer = await response.json().catch(() => null) as { text?: unknown } | null;
      const text = answer && typeof answer.text === 'string' ? answer.text.trim() : '';
      return text.length > 0 ? { text } : { why: 'the OCR edge read no text in the picture' };
    } catch (error) {
      return { why: `the OCR edge could not be reached (${String((error as Error)?.name ?? 'error')})` };
    }
  };
  const ocrFromShot = ocr ?? defaultOcrFromShot;

  // One read, one snapshot.
  // Measured live on a Google Doc: the first read cached the accessibility tree for the life of the driver, so every later read answered with the document as it stood minutes earlier - 17,310 characters while the page had grown well past it, and a fresh section typed into the page was invisible to the read that should have proven it.
  // The snapshot is therefore asked for again at the start of every read and reused only inside that one ladder walk.
  let measured: JsonRecord | null = null;
  const axOf = async () => {
    if (!measured) measured = await measureAx({ ask: primitives.ask });
    return measured;
  };

  // A thin AX region on a canvas page is chrome, not the document; on a page with no canvas it is the only text left.
  const textOf = (value: unknown): string => (typeof value === 'string' ? value : String(value ?? ''));
  const readAxText = (ax: JsonRecord | null, surface: { canvas?: boolean }) => {
    if (ax === null) return null;
    const text = String(ax.documentText || '');
    if (text.trim().length === 0) return null;
    if (ax.axRich === true || surface.canvas !== true) return text;
    return null;
  };

  // decisions.json -> local-canvas-01

  // End collapses the selection after the copy; left open, the next keystroke would replace the document.
  const guardedSelectAll = async (allowCaretMove: boolean) => {
    const mark = await guard.remember();
    if (mark.restorable !== true && allowCaretMove !== true) return null;
    await primitives.key('a', ['Control']);
    await primitives.settle();
    const selected = await copySelection();
    const mirrored = selected !== null && selected.trim().length >= 2;
    const copied = mirrored && selected !== null ? { text: selected } : await copyThroughClipboard();
    await primitives.key('End').catch(() => null);
    const caret = await guard.verdict(mark);
    return {
      text: 'text' in copied ? copied.text : '',
      caret,
      clipboardUsed: !mirrored && 'text' in copied,
      clipboardWhy: 'why' in copied ? copied.why : ''
    };
  };

  // The caret fields a read that never borrowed carries, and the ones a read that did carries, kept in one place so no answer can claim more than it measured.
  const untouched = { caretMoved: false, caretRestored: true, viewRestored: true, caretWhy: '', viewWhy: '' };
  const afterBorrow = (borrow: { caret: { restored: boolean; why?: unknown }; text?: string } | null) => borrow === null
    ? untouched
    : {
      caretMoved: true,
      caretRestored: borrow.caret.restored,
      viewRestored: false,
      caretWhy: borrow.caret.why,
      viewWhy: VIEW_WHY
    };

  async function read(options: { allowCaretMove?: boolean; allowVision?: boolean; maxChars?: unknown; selector?: unknown } = {}) {
    measured = null;
    const allowCaretMove = options.allowCaretMove === true;
    const allowVision = options.allowVision === true;
    const maxChars = maxCharsOf(options.maxChars);
    const selector = typeof options.selector === 'string' && options.selector.trim().length > 0 ? options.selector.trim() : null;
    const probe = await probeSurface({ evaluate: primitives.evaluate });
    const ax = probe.canvas?.value === true ? await axOf() : {};
    const surface = buildProfile({ probe, ax });
    const ladder = readLadder(surface);
    const skipped: Array<{ strategy: string; harm: string; why: string }> = [];
    let borrow: { caret: { restored: boolean; why?: unknown }; text: string; clipboardUsed?: boolean } | null = null;

    if (selector) {
      const scoped = await primitives.evaluate(scopedExpression(selector)) as { title?: unknown; url?: unknown; text?: unknown } | null;
      const scopedText = typeof scoped?.text === 'string' ? scoped.text : null;
      if (scopedText === null) {
        throw new Error(`no element matches "${selector}" - the read stops here instead of reading the whole page; drop the selector or pick one that exists`);
      }
      await primitives.settle();
      const again = await primitives.evaluate(scopedExpression(selector)) as { title?: unknown; url?: unknown; text?: unknown } | null;
      const againText = typeof again?.text === 'string' ? again.text : scopedText;
      const trimmed = truncateTo(againText, maxChars);
      return {
        title: String(again?.title ?? scoped?.title ?? ''),
        url: String(again?.url ?? scoped?.url ?? ''),
        text: trimmed.text,
        ready: undefined,
        settled: againText === scopedText,
        grewBy: againText.length - scopedText.length,
        surface,
        strategy: 'dom-scoped',
        harm: HARM_NONE,
        skipped,
        description: `scoped to ${selector}`,
        originalChars: trimmed.originalChars,
        truncatedChars: trimmed.truncatedChars,
        ...untouched
      };
    }

    for (const step of ladder) {
      if (step.harm !== HARM_NONE) {
        const gate = gateRead({ harm: step.harm, allowCaretMove });
        if (!gate.allowed) {
          skipped.push({ strategy: step.strategy, harm: step.harm, why: gate.why });
          continue;
        }
      }

      if (step.strategy === STRATEGY_DOM) {
        if (surface.canvas === true && surface.editable === true) continue;
        const state = await readState();
        if (textOf(state.text).trim().length > 0) {
          await primitives.settle();
          const again = await readState();
          const limited = truncateTo(textOf(again.text), maxChars);
          return {
            title: again.title,
            url: again.url,
            text: limited.text,
            ready: again.ready ?? null,
            settled: again.text === state.text,
            grewBy: textOf(again.text).length - textOf(state.text).length,
            surface,
            strategy: step.strategy,
            harm: step.harm,
            skipped,
            description: describeProfile(surface),
            originalChars: limited.originalChars,
            truncatedChars: limited.truncatedChars,
            ...untouched
          };
        }
        continue;
      }

      if (step.strategy === STRATEGY_AX) {
        const axFull = readAxText(await axOf(), surface);
        const limited = axFull ? truncateTo(axFull, maxChars) : { text: '' as string, truncatedChars: 0, originalChars: 0 };
        const text = limited.text;
        if (text) {
          // The title and url are one cheap call the caller expects; one sample of the tree cannot say the text stopped moving.
          const state = await readState();
          return {
            title: state.title,
            url: state.url,
            text,
            ready: state.ready ?? null,
            settled: null,
            settledWhy: SETTLED_WHY_AX,
            surface,
            strategy: step.strategy,
            harm: step.harm,
            skipped,
            description: describeProfile(surface),
            originalChars: limited.originalChars,
            truncatedChars: limited.truncatedChars,
            ...untouched
          };
        }
        continue;
      }

      if (step.strategy === STRATEGY_SELECT_ALL) {
        const answer = await guardedSelectAll(allowCaretMove);
        if (answer) {
          borrow = { caret: answer.caret, text: answer.text, clipboardUsed: answer.clipboardUsed };
          if (answer.text.length > 0) {
            const limited = truncateTo(answer.text, maxChars);
            // The title and url are one cheap read the caller expects on every answer.
            const state = await readState();
            return {
              title: state.title,
              url: state.url,
              text: limited.text,
              caret: answer.caret,
              ...(answer.clipboardUsed ? { clipboardUsed: true } : {}),
              ...(answer.clipboardWhy ? { clipboardWhy: answer.clipboardWhy } : {}),
              surface,
              strategy: step.strategy,
              harm: step.harm,
              skipped,
              description: describeProfile(surface),
              settled: null,
              settledWhy: SETTLED_WHY_COPY,
              originalChars: limited.originalChars,
              truncatedChars: limited.truncatedChars,
              ...afterBorrow(borrow)
            };
          }
          skipped.push({ strategy: step.strategy, harm: step.harm, why: answer.clipboardWhy || EMPTY_COPY_WHY });
          continue;
        }
        skipped.push({ strategy: step.strategy, harm: step.harm, why: NO_MARK_WHY });
        continue;
      }

      if (step.strategy === STRATEGY_VISION) {
        // decisions.json -> local-canvas-03

        // The screenshot leaves the machine; the caret step only touches this page.
        if (!allowVision) {
          return {
            title: '',
            url: '',
            text: '',
            surface,
            strategy: step.strategy,
            harm: step.harm,
            skipped,
            description: describeProfile(surface),
            visionWhy: VISION_CONSENT_WHY,
            ...afterBorrow(borrow)
          };
        }
        // The OCR edge holds the paired key, so the driver never handles it.
        const ocr = await ocrFromShot();
        if ('text' in ocr) {
          const limited = truncateTo(ocr.text, maxChars);
          return {
            title: '',
            url: '',
            text: limited.text,
            surface,
            strategy: step.strategy,
            harm: HARM_NONE,
            skipped,
            description: describeProfile(surface),
            originalChars: limited.originalChars,
            truncatedChars: limited.truncatedChars,
            settled: null,
            visionWhy: 'the text came from a picture; read again after wait() or press again for something to check it against',
            ...afterBorrow(borrow)
          };
        }
        return {
          title: '',
          url: '',
          text: '',
          surface,
          strategy: step.strategy,
          harm: step.harm,
          skipped,
          description: describeProfile(surface),
          visionWhy: `the OCR fallback could not answer: ${ocr.why}; that is an empty picture, not an empty page`,
          ...afterBorrow(borrow)
        };
      }
    }

    return {
      title: '',
      url: '',
      text: '',
      surface,
      strategy: 'none',
      harm: HARM_NONE,
      skipped,
      description: describeProfile(surface),
      visionWhy: 'every read this surface offers was skipped; call shot for the picture',
      ...afterBorrow(borrow)
    };
  }

  // The selection is cheaper than the clipboard and answers wherever the page holds its text; the copy is the fallback.
  async function caretLine() {
    const mark = await guard.remember();
    await primitives.key('Home');
    await primitives.settle();
    await primitives.key('End', ['Shift']);
    await primitives.settle();
    const line = await copySelection();
    await primitives.key('End').catch(() => null);
    const back = await guard.verdict(mark);
    return {
      line: typeof line === 'string' ? line : '',
      caretMoved: true,
      caretRestored: back.restored,
      viewRestored: false,
      caretWhy: back.why,
      viewWhy: VIEW_WHY
    };
  }

  return { read, caretLine };
}
