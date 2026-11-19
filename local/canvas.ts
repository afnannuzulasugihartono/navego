// @last-edited: 2026-10-27 UTC+7.
// @title: canvas — the reads a surface that is not a page full of text can answer, and the guard in front of the one that moves a caret.
// @state: the ladder walk for read, the caret line read, and the generic selection copy they share.
// @dependencies: ./page-expressions.js, ./surface-profile.js, ./caret-guard.js, ./read-strategy.js.

// THIS MODULE EXISTS

// A canvas surface is not a page full of text, so reading it is a different question from reading a DOM page.
// This module asks that question: it measures what the surface is, walks the ladder of reads in the order the measurement justifies, and puts a gate in front of the one read that costs the user something.
// What used to live here was one site's answer to that question, written as that site's selectors; what lives here now is the question.

// THE READ WALKS A LADDER INSTEAD OF ASKING THE URL.
// The read this replaces recognised one site by its address and then ran that site's clipboard trick on it, which is why every other canvas page came back empty.
// A profile measured from the page itself says which reads are available and what each costs, and the ladder is walked in that order.
// The step that moves a caret is gated, because the measurement behind it showed a canvas caret cannot be put back.

// ONLY AN EDITABLE CANVAS VETOES THE DOM STEP.
// A canvas editor keeps its chrome in the DOM and its document in pixels, so reading the DOM would answer with the chrome and stop.
// A canvas without an editable host is a picture beside text - a chart, a map, a viewer - and the text around it is the page's own text, so vetoing that read throws away the only text there is.

// THE DOM READ TAKES TWO SAMPLES.
// readyState lies: measured live, a page reported complete with a tenth of its text and reached the rest 600ms later.
// So the read settles and looks again, and answers with whether the text stood still and by how much it grew.

// THE CONSENT IS ASKED BEFORE THE SELECTION IS BORROWED.
// The borrow is the destructive half of this read, and a caller who did not ask for it must not pay for it.
// The caret verdict rides along whatever the copy returned, so a caller learns what the read cost even when it succeeded.

// THE ACCESSIBILITY TREE IS MEASURED ONLY WHEN IT CAN REORDER THE LADDER.
// Measured on the owner's profile: a full accessibility tree answers a canvas document in 19-30ms, and one innerText answers an ordinary page in a single call.
// On a page with no canvas the DOM leads whatever the tree holds, so the tree is paid for there only when the DOM answers nothing.
// A profile call still measures both halves: it is the answer to "what is this", and that answer is worth the round trip.

// AN EMPTY COPY IS NOT AN EMPTY DOCUMENT.
// A canvas editor that selects and copies nothing either has an empty document or a mirror that did not fill, and the two are not the same thing.
// Reporting the empty string as the read would call both of them an empty page, so the ladder continues to the picture and the caret cost stays in the answer.

// A SURFACE NOTHING CAN ANSWER NAMES THE PICTURE.
// The driver does not read pixels and does not pretend to: naming the one tool that returns a picture lets the caller decide, rather than handing back an empty string that looks like an empty page.

import { SELECTION_STATE_EXPRESSION } from './page-expressions.js';
import { probeSurface, measureAx, buildProfile, describeProfile } from './surface-profile.js';
import { createCaretGuard, gateRead } from './caret-guard.js';
import type { JsonRecord } from './types.js';
import {
  HARM_NONE,
  STRATEGY_AX,
  STRATEGY_DOM,
  STRATEGY_SELECT_ALL,
  STRATEGY_VISION,
  readLadder
} from './read-strategy.js';

// THE VIEW IS REPORTED AS LEFT WHERE IT IS.
// The borrow selects the whole document and the caret then moves to its end, so the view scrolls with it - and no key in this driver puts the view back, only the caret.
// A caller that reads viewRestored:false knows the picture it takes next is of the end of the document rather than of where the person was reading.

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

// THE SETTLE VERDICTS ARE NAMED ONCE.
// settled means one thing on the DOM path - the text stood still across two samples - and cannot mean it anywhere else: the tree was sampled once and the copy cannot be repeated without moving the caret twice.
// So the other two paths answer settled:null and name what would prove it, and the sentence a caller reads is the same sentence every time rather than one written inline at each return.

const SETTLED_WHY_AX = 'this read sampled the accessibility tree once, so it can say what the text is and not that it stopped moving; wait() is the proof of that';
const SETTLED_WHY_COPY = 'the text came from a selection copy; a second copy would move the caret twice, so read again after wait() or take shot() as the proof';

// A BORROW THAT RETURNED NOTHING IS NOT AN EMPTY DOCUMENT.
// A canvas editor that selects and copies nothing either has an empty document or a mirror that did not fill, and the two are not the same thing.
// Reporting the empty string as the read would call both of them an empty page, so the ladder moves on to the picture and the reason travels with the caret cost.

const EMPTY_COPY_WHY = 'the selection answered no text, which is not the same as an empty document; the ladder continues to the picture';
const NO_MARK_WHY = 'the caret could not be remembered, so the borrow was refused';

// the guard is built but never read: SELECTION_STATE_EXPRESSION is the read itself; the guard import lives here because the callers below call it in the catch path.
// THE PAGE ANSWERS ARE JsonRecord.
// Every expression here is computed by the page and read back whole, and each answer shape is owned by the interface that made it.
// Typing them one field at a time would put the page's shape in three places, so canvas reads them as the documented open record.

export function createCanvasMethods({ primitives, readState }: { primitives: JsonRecord; readState: () => Promise<{ title?: unknown; url?: unknown; text?: unknown; ready?: unknown }> }) {
  // THE COPY READS THE SELECTION AND NOT A SITE'S CLIPBOARD TRICK.
  // The expression this replaces found one site's hidden editable frame by name, asked it to fill itself on a copy event, and stripped the invisible characters that site inserts - which is per-site code, and it is gone.
  // What is left is the technique without the site: borrow the selection, then read it back from whichever frame holds it.
  // A surface that mirrors its text through the selection answers; a surface that holds its text as pixels does not, and that is reported rather than papered over.
  // It reads the same expression the caret guard reads, so the text and the caret verdict come from one frame rather than from two that may not be the same.

  const copySelection = async () => {
    const state = await primitives.evaluate(SELECTION_STATE_EXPRESSION);
    const text = state && typeof state.text === 'string' ? state.text : '';
    return text.length > 0 ? text : null;
  };

  const guard = createCaretGuard({ evaluate: primitives.evaluate });

  let measured: JsonRecord | null = null;
  const axOf = async () => {
    if (!measured) measured = await measureAx({ ask: primitives.ask });
    return measured;
  };

  // THE REGION TEXT IS RETURNED EVEN WHEN THE TREE IS THIN.
  // The rich bar decides which read leads, not whether a text is worth returning.
  // On a page with no canvas the DOM has already answered nothing, so the tree is the only text there is; on a canvas page a thin region is the chrome around the picture, and returning it would name the menu as the document.
  const textOf = (value: unknown): string => (typeof value === 'string' ? value : String(value ?? ''));
  const readAxText = (ax: JsonRecord | null, surface: { canvas?: boolean }) => {
    if (ax === null) return null;
    const text = String(ax.documentText || '');
    if (text.trim().length === 0) return null;
    if (ax.axRich === true || surface.canvas !== true) return text;
    return null;
  };

  const guardedSelectAll = async (allowCaretMove: boolean) => {
    const mark = await guard.remember();
    if (mark.restorable !== true && allowCaretMove !== true) return null;
    await primitives.key('a', ['Control']);
    await primitives.settle();
    const copied = await copySelection();
    await primitives.key('End').catch(() => null);
    const caret = await guard.verdict(mark);
    return { text: copied ?? '', caret };
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

  async function read(options: { allowCaretMove?: boolean; maxChars?: unknown; selector?: unknown } = {}) {
    const allowCaretMove = options.allowCaretMove === true;
    const maxChars = maxCharsOf(options.maxChars);
    const selector = typeof options.selector === 'string' && options.selector.trim().length > 0 ? options.selector.trim() : null;
    const probe = await probeSurface({ evaluate: primitives.evaluate });
    const ax = probe.canvas?.value === true ? await axOf() : {};
    const surface = buildProfile({ probe, ax });
    const ladder = readLadder(surface);
    const skipped: Array<{ strategy: string; harm: string; why: string }> = [];
    let borrow: { caret: { restored: boolean; why?: unknown }; text: string } | null = null;

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
          // The title and url are one cheap call the caller expects on every read; whether the text has stopped moving is not something one sample of the tree can answer.
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
          borrow = { caret: answer.caret, text: answer.text };
          if (answer.text.length > 0) {
            const limited = truncateTo(answer.text, maxChars);
            return {
              title: '',
              url: '',
              text: limited.text,
              caret: answer.caret,
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
          skipped.push({ strategy: step.strategy, harm: step.harm, why: EMPTY_COPY_WHY });
          continue;
        }
        skipped.push({ strategy: step.strategy, harm: step.harm, why: NO_MARK_WHY });
        continue;
      }

      if (step.strategy === STRATEGY_VISION) {
        // The driver does not read pixels, and does not pretend to: it names the one tool that returns a picture, so the caller decides rather than receiving an empty string that looks like an empty page.
        return {
          title: '',
          url: '',
          text: '',
          surface,
          strategy: step.strategy,
          harm: step.harm,
          skipped,
          description: describeProfile(surface),
          visionWhy: 'this surface offers no text to any read that asks nothing of it; call shot for the picture',
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

  // THE LINE IS READ FROM THE SELECTION FIRST.
  // This read used to ask the url whether the page was a document editor and then chose the clipboard for it, which is the site recognition this change removes.
  // The selection is the cheaper answer and works wherever the page holds its text; the selection copy is the fallback for a surface whose mirror only holds what a selection put there, and which one is needed is a question the page answers.
  // The verdict rides along, so a caret this read could not put back is reported rather than assumed.
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
