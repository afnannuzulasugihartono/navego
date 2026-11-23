// @last-edited: 2026-11-13 UTC+7.
// @title: boundary-locks - the frozen locks on the public boundary, shared by the checkpoint tests.
// @state: ten pins over four stacks; each line says why the current pin exists, and nothing else.
// @dependencies: none.

// Each entry is the git-blob SHA-256 (LF-normalized) of a runtime source whose public contract is frozen.
// Changing one means the contract changed, which is a reviewed decision: update the SHA in the same commit and say what moved.

// WHY there is no re-pin history here.
// Every entry below states why its CURRENT pin exists, and `git log -p` on this file is the record of what it used to be.
// The file carried ~90 lines of dated re-pin narratives that said "nothing about the contract moved" over and over; each one was true when written and is noise now, and a reader checking whether a contract moved had to read all of them to learn that none had.

// WHY these files are pinned at all: a public contract can change without any test failing.
// content.js and background.js carry the primitives the MCP surface advertises, and the MCP function carries the tool schemas; if one moves and the other does not, the product advertises something the runtime no longer accepts.
// Pinning the bytes turns that silence into a red test.

// WHY background.js changes more often than anything else here: the worker split moved dispatch out of it while keeping the bytes, so its extraction tasks re-pin it in the same commit.
// That is expected, not a smell.

// WHY the MCP function was re-pinned on 2026-11-11: the device contract moved, and it moved on purpose.
// The pin used to be honoured only while the pinned browser was live, and a sleeping pin was quietly replaced by whichever browser was freshest.
// Tab ids live inside one browser, so a chain of calls that started on the pinned browser and continued on another left the agent holding a tab id that existed on neither, and the failure read as a broken tool.
// Now the pin decides: a live pin answers every call, a sleeping pin is a named refusal that names the awake browsers and the header that reaches one, and X-Opera-Device: any opts into the old fallback on purpose.
// The tool schemas did not move, so tools.ts keeps its pin - except for the one line that names device.alternatives in the browser_status answer, which is the output fact the new refusal needs the agent to see.

// WHY the MCP function was re-pinned again on 2026-11-11: the device contract moved a second time, in the same direction.
// A device the owner revoked is not a device, so the resolver must never pick it and the query must never bring it in.
// The criterion did not change; it got stricter: the surface that names the browser to drive now also refuses the ones that were cut off.

// WHY the public surface was re-pinned a third time on 2026-11-11: the device itself can now be asked to pull the newest build.
// The extension answers extension.update by writing the served build over its own folder and restarting, and the hosted surface carries the two tools the reader and the agent have: check_update and apply_update.
// The dispatch case, the tool schemas and the update-status helper are the reviewed changes; content.js and manifest.json did not move.

// WHY manifest.json was re-pinned on 2026-11-11: it now names its icons.
// The action carried a popup and no icon, so the toolbar showed the browser's generic extension glyph - the product had no face in the one place every reader sees.
// The icon is the site icon, drawn by scripts/dev/draw-icon.py from the same path the website uses; nothing else in the manifest moved.

// WHY manifest.json was re-pinned a second time on 2026-11-11: the release bump.
// 1.6.40 to 1.6.41; nothing else in the manifest moved.

// WHY index.ts was re-pinned on 2026-11-11: the release bump rode in it.
// The server version constant moved 1.6.40 to 1.6.41; the surface did not move with it.

// WHY index.ts was re-pinned on 2026-11-11 a third time: the hosted answer stopped being a stream.
// The transport answers one JSON body now, because a client that waits for an SSE stream to close waited ten seconds for work the device had done in four hundred milliseconds.

// WHY index.ts was re-pinned on 2026-11-11 a fourth time: the wait no longer parks a connection.
// The edge function reaches the database through PostgREST, so a wait that held a connection for the whole command filled PostgREST's pool and every later call queued behind it - ten seconds for work the device did in four hundred milliseconds.
// The adaptive wait is now asked in short slices; the capture wait is still asked once, because it consumes its result.

// WHY manifest.json and index.ts were re-pinned on 2026-11-11 a fifth time: the 1.6.43 release bump.
// 1.6.42 to 1.6.43; the icons, the dispatch case and the wait slices are the reviewed parts.

// WHY manifest.json and index.ts were re-pinned a second time on 2026-11-11: the release bump again.
// 1.6.41 to 1.6.42; the icons and the update-dispatch case are the reviewed parts, nothing else moved.

// WHY CRLF does not cause false failures: a Windows checkout rewrites line endings, so the test normalizes CRLF to LF before hashing.
// Otherwise every developer on Windows would see all nine pins fail for a reason that is not a contract change.

// WHY these two were re-pinned on 2026-11-12: the 1.6.47 alignment and tool merge.
// The version constants moved (manifest.json `version`, index.ts `SERVER_VERSION`), and tools.ts carries the merged read_page (view: brief|map) in place of read_page + read_page_map; nothing about the public contract moved except the numbers and the tool count.

// WHY these two were re-pinned on 2026-11-12: the 1.6.46 alignment.
// The version constants moved (manifest.json `version` and index.ts `SERVER_VERSION`); nothing about the public contract moved.
// Any other diff in either file would have broken this before it got this far.

// WHY tools.ts was re-pinned on 2026-11-13 a second time: the dump_page executor forgot one parameter.
// The dump_page tool's handler called execute("page.dump", { offset, limit }) without tabId, so the relay silently dispatched the read to the tab the extension was currently active on instead of the requested tab.
// The pin moves with the reviewed one-line fix; the artifact hash moves before the reader sees a tab the user never asked for.
// dump_page reads a whole page as one structured object; save_page is the silent rename of scan_page, writing straight to Downloads without any user confirmation dialog.
// The surface review moved with the tools by design.

// WHY these four were re-pinned on 2026-11-12: the surface gained the two tools that go beyond stills, on purpose.
// The device now mirrors a page into one self-contained html file in Downloads (page.scan, for reading or rebuilding a site offline instead of hand-transcribing it), and it records the tab to a webm in Downloads while the page smooth-scrolls from the top to the bottom (page.record, the honest way to see features and animations a screenshot cannot).
// The dispatch cases, the tool schemas, the executors that shape the two results, and the content script list the manifest injects are the reviewed changes; content.js did not move, and the recording lives in its own content module with its own scope, not in the pinned file.

// WHY these four moved again on 2026-11-12: the recording is now an arm/stop session, not one fixed scroll.
// The agent asked for the recording to capture whatever happens between arm and stop - clicks, fills, scrolls, bursts - so the surface carries page.record_start and page.record_stop instead of page.record; the tools.ts schemas, the index.ts executors and the dispatch switch moved with it, on purpose.

// WHY these two were re-pinned on 2026-11-13: the agent gained one more read-only primitive.
// background.js imports dump-page.js and dispatches page.dump so the agent can read a whole page as one structured object instead of one viewport; the public contract gained exactly that method and nothing else moved.

// WHY these three were re-pinned on 2026-11-12: the 1.6.48 provider pins and the version constants.
// The relay gained per-provider routing (`resolveDeviceFresh` reads `opera_provider_pins` when no X-Opera-Device header names a browser; index.ts) and the use_browser tool (tools.ts), so a multi-harness account can bind opencode to one browser and claude to another without editing client configs.
// The refusal for a sleeping provider pin names use_browser; the browser_status device object reports pinSource.
// manifest.json and index.ts also carry the version bump to 1.6.48; the contract moved, so the pin moves with it - content.js and background.js did not.

// WHY these ten moved on 2026-11-12 a fourth time: the hash is now SHA-256.
// The pinning protocol used a weak hash (git-blob SHA1); the finding is a critical vulnerability for any consumer of the convention, and the answer is a stronger digest, not a waiver.
// The contract criterion did not change; the digest got stronger, so every pin below was recomputed in the same act.

// WHY these three were re-pinned on 2026-11-12: the 1.6.49 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-12: the 1.6.50 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these two were re-pinned on 2026-11-13: the surface gained search_bing, and it gained it as a workflow over the primitives, not as a new one.
// The relay opens one background tab on the Bing SERP, reads up to three result pages with page.dump following Bing's own pagination links, zips the external anchors into rank, title, url, site and the snippet each card renders, dedupes across pages and closes the tab.
// The extension gained nothing: tabs.open, tabs.navigate, page.dump and tabs.close are the whole road, so the 36-method protocol and its pins above did not move.
// The local stdio road carries the same tool over its own tab broker, reading the one parser (local/bing-serp.js), shipped as source in the package since the parser moved into local/.
// The evaluator that walks the SERP lives in local/page-expressions.js; the tools.ts schema and the tools.ts registration moved with it.

// WHY these two were re-pinned on 2026-11-14: the hosted MCP function is gone from the tree.
// The local driver carries the surface byte-for-byte on its own road (56 tools), and the extension's pin stayed untouched with it.
// Extension files and the manifest did not move.

// WHY these five moved again: the extension went to TypeScript, and the bytes moved with it.
// content.ts and background.ts carry the same primitives the JavaScript carried, the MCP tool list is byte-for-byte identical (42 tools, same order, verified before the re-pin), and the VM is the same program the suite already proves.
// The pins move with the reviewed conversion, and the CRX is built from the same source they guard.
// tools.ts and manifest.json did not move; the tool schemas and the manifest are the contract.

// WHY content.ts moved four times: the manifest loads content.js as a classic script, and no ES-module boundary of any kind may exist inside it.
// The converted source imported isRecord from lib/guards.js; an MV3 classic script cannot parse that, so the import became a local copy of the same guard and the module marker the build appends is stripped from the classic-script files.
// Behaviour is unchanged - the primitives are the same ones the suite drives; only the stub broke the load, and only the load noticed.
// WHY the second move: the ReDoS round replaced the two character-class-alternating patterns with one class and with split/join, normalized lines via trim(), and the best-effort close paths use .catch(() => {}) with no comment inside the body (the comment-placement gate holds comments above what they document).
// WHY the third move: the last super-linear regex left the file — every line is normalized by line.trim(), and nothing in this file requires a backtracking regex.
// The byte pin moves with the contract review.

// WHY control-flow and collect moved: the frozen VM went to TypeScript, and the two pure cores moved with it.
// The runtime validator and the collection engine are the same programs the suite already proves; the pins move with the reviewed conversion.
// WHY control-flow moved twice: the comment-placement gate demanded the frame-exists comment stand above the pop instead of trailing it, and a gate is the gate.
// Comment lines do not reach the runtime; nothing else in the file moved with it.

// WHY background.ts moved again: the agent now marks the tab it is holding.
// dispatch() begins an in-memory activity around every action that names an explicit tab and records it to chrome.storage.local; the agent-chip content script renders from it.
// The chip is the only visible sign the agent is in the page; behaviour of the agent itself is unchanged.
// WHY the comment-canonical spelling matters to this pin: the gate rewrites the activity.ts and background.ts comment lines, so bytes track the canonical form.

// WHY these three were re-pinned on 2026-11-14: the 1.6.51 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// The hosted MCP server is gone from the tree: the opencode entrypoint moved to the local driver, and the driver carries the paywall through the paired device + the bridge's session open/report pair.
// The extension's own pins stay; the tool surface verification is the local TOOLS table, which the local-side gates read, not a frozen digest of a file that no longer exists.

// WHY these three were re-pinned on 2026-11-15: the 1.6.52 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-15: the 1.6.53 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-15: the 1.6.54 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-15: the 1.6.55 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-15: the 1.6.56 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-15: the 1.6.57 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-15: the 1.6.58 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-15: the 1.6.59 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY manifest.json and background.ts were re-pinned on 2026-11-15: the rebrand moved the product name.
// Navego is Navego everywhere a human reads: the manifest carries the new name and default_title, and background.js reports product: 'Navego' on browser.ping.
// The extension ID, the signing key and every wire contract are untouched, so a browser already holding 1.6.59 updates into the new name without a beat; the pins move with the reviewed bytes and nothing else.

// WHY these three were re-pinned on 2026-11-16: the 1.7.1 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY background.ts was re-pinned on 2026-11-17: the owner unified the product name to Navego.
// `product` on browser.ping now answers 'Navego'; the wire contract, the extension id and every other byte are untouched, so the pin moves with the reviewed one-line change and nothing else.

// WHY these three were re-pinned on 2026-11-17: the 1.7.2 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-17: the 1.7.3 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY these three were re-pinned on 2026-11-17: the 1.7.4 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY manifest.json was re-pinned again on 2026-11-17: the CSP lost its bare https: wildcard.
// A wildcard connect-src admitted any https origin as an exfiltration path; named hosts are the shape the extension actually needs.

// WHY these three were re-pinned on 2026-11-17: the 1.7.5 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY background.ts was re-pinned on 2026-11-17: the worker file gained an ambient declaration for the two reads of `self`.
// `declare const self: Pick<EventTarget, 'addEventListener'> | undefined` names the browser script scope without binding an address TypeScript does not know; the emitted background.js is byte-identical.
// The public surface, the manifest and the protocol did not move, so only this pin moves.

// WHY content.ts was re-pinned on 2026-11-18: the product-wide rename retire-Opera Agent/trademMark sweep replaced the remaining brand-token occurrences inside the frozen file (Opera Agent -> Navego throughout).
// WHY content.ts was re-pinned a second time on 2026-11-18: the listen-capture error paths called AudioContext.close()/resume() as if they were synchronous and swallowed nothing; a rejection would have leaked to unhandledrejection.
// They now close and resume through void .catch(() => {}), the same contract, no behavioural change (the failure is still ignored, but deliberately and silently, as the surrounding code always assumed).
// The runtime surface, the dispatch tables and the primitives are unchanged; only the brand strings moved.
// WHY background.ts was re-pinned on 2026-11-18: the product-wide rename retired Opera Agent/Kemudi/legacy tokens including type-only internal global names (example: `__operaAgentContentV1`, `__operaAgentCursorIdle`); the runtime dispatch table and wire contract are unchanged; the change set is the rename sweep itself.

// WHY background.ts was re-pinned on 2026-11-24: browser_open_url now opens tabs in the background by default on both extension and bridge roads, so an agent can use the user's real session without taking over the visible window; the owner asked for that behavior directly.

// WHY these three were re-pinned on 2026-11-19: the 1.7.7 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

// WHY the manifest pin was re-pinned on 2026-11-20: the 1.8.0 release rode it.
// The manifest carries the version (1.7.7 to 1.8.0) and nothing else moved: the name, the permissions, the update url and the extension id are the same bytes as before.

// WHY these three were re-pinned on 2026-11-21: the 1.8.1 release rode them.
// The version constants moved (manifest.json version, index.ts SERVER_VERSION); nothing about the public contract moved with them.

export const PUBLIC_SURFACE_LOCKS = Object.freeze([
  ['../extension/content.ts', '4d9cf6aec864f5c75f318aed43969ffbc37681ab71b19401985349d69d2a60fe'],
  ['../extension/background.ts', 'dd34ee4b22603475fa626dc75577db6722e3628109262a3154456f18296b7750'],
  ['../extension/manifest.json', '5868652b9db07baaa9d1c4975820c2e0e144460e7ae3937f6aaced70699e5063'],
]);

// WHY collect and control-flow moved on 2026-11-17: the hosted functions are now type-checked by CI (deno check in ci.yml).
// Deno does not resolve a ./x.js import to its .ts or .d.ts twin, so collect and control-flow derive their guards type from the runtime value they already import instead of importing the type, and collect's type-only import names the .ts file it means.
// Every edit is type-only; the emitted shared/*.js twins are byte-for-byte unchanged, verified in the same commit by hashing every file before and after the conversion.

export const OBSERVATION_STACK_LOCKS = Object.freeze([
  ['../shared/reactive-vm.ts', '7d15b2764ef9eb8f9929d0e6095d6f8fa1442898678b563d00852f7dc3b74d06'],
  ['../shared/reactive-vm-control-flow.ts', '25145d90fa9d9db026e32f829da75ed040fc790fe1670fab7d4ab56f8dd8c5d4'],
  ['../shared/reactive-vm-collect.ts', 'e7901a77a8072899293342e97973c26d0ab2323117177a3dfdf229353e7a8647'],
]);

// WHY multi-signal-relevance and delta-first-observation moved on 2026-11-17: the hosted functions are now type-checked by CI (deno check in ci.yml).
// Deno does not resolve a ./x.js import to its .ts or .d.ts twin, so the type-only imports inside these frozen sources now name the .ts file they mean; the runtime import stays on the .js twin.
// Every edit is type-only; the emitted shared/*.js twins are byte-for-byte unchanged, verified in the same commit by hashing every file before and after the conversion.

export const RELEVANCE_STACK_LOCKS = Object.freeze([
  ['../shared/multi-signal-relevance.ts', '40b6a2d33789fb02f61d1910ee5dd0d64c5f9198c908a77b378a2246111d549d'],
  ['../shared/delta-first-observation.ts', '25d55f8f547b5361da4a6423d300d36a7450afa375d2470c40f62ee936a8b143'],
]);
