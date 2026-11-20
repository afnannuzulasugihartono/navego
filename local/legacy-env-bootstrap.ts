// @last-edited: 2026-11-20 UTC+7.
// @title: legacy-env-bootstrap - the first module an entry point evaluates, so a 1.x environment still configures 2.0.
// @state: one side effect, run once per process.
// @dependencies: ./legacy-names.js.

// It is a module and not a call because ESM evaluates an entry's imports before its body.
// The entry points read OPERA_* into module-scope constants, so the adoption has to be the first dependency they name.

import { adoptLegacyEnv } from './legacy-names.js';

adoptLegacyEnv();
