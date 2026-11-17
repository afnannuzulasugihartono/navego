// @last-edited: 2026-11-17 UTC+7.
// @title: external-origins — the origin allowlist for chrome.runtime.onMessageExternal.
// @state: exports originAllowed; the site origin and the exact Vite dev origin match exactly.
// @dependencies: endpoints.

// The origins allowed to push model config into the extension through chrome.runtime.onMessageExternal (applyModelConfig).
// The official site is the owner's own page; local development is limited to the exact Vite dev origin so a bare localhost prefix cannot reconfigure the extension from any locally-served page.

import { SITE_ORIGIN } from './endpoints.js';

const DEV_ORIGINS = Object.freeze(['http://localhost:5173', 'http://127.0.0.1:5173']);

export function originAllowed(from: unknown) {
  const value = String(from || '');
  if (value === SITE_ORIGIN) return true;
  if (value.startsWith(`${SITE_ORIGIN}/`)) return true;
  return DEV_ORIGINS.some((origin) => value === origin || value.startsWith(`${origin}/`));
}
