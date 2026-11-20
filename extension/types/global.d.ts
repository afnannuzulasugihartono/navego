// @last-edited: 2026-11-14 UTC+7.
// @title: global.d.ts — the contract between the classic content scripts and the worker: every helper a manifest classic script publishes on globalThis, declared once, here.
// @state: owns every `Opera*` global the extension publishes; a classic script cannot import, so it publishes, and the worker reads the value back through this type.
// @dependencies: none.
// @why-no-casts: reading a global through a double assertion closes this file's eyes and the type then lies by omission; declaring the global here is the one place the shape is named, and both sides check against it.

export {};

declare global {
  var __operaContentV1: boolean | undefined;
  var OPERA_BRIDGE_WS: string | undefined;
  var OPERA_BRIDGE_HANDLE_TIMEOUT_MS: number | string | undefined;
  var OPERA_SOCKET_EXECUTE_TIMEOUT_MS: number | string | undefined;
  var OperaBrowserId: { browserName: string } | undefined;
  var OperaLog: OperaLog | undefined;
  var OperaRoleReconcile: OperaRoleReconcile | undefined;
  var OperaHoverSettle: OperaHoverSettle | undefined;
  var OperaStatementFile: OperaStatementFile | undefined;
  var OperaSemanticIdentity: OperaSemanticIdentity | undefined;
  var OperaSemanticViews: OperaSemanticViews | undefined;
  var OperaPageMap: OperaPageMap | undefined;
  var OperaRecord: Record<string, ((payload?: unknown) => unknown) | undefined> | undefined;

  interface Navigator {
    readonly userAgentData?: { brands?: Array<{ brand?: unknown }> | undefined } | undefined;
    readonly brave?: { isBrave?: (() => boolean) | undefined } | undefined;
  }

  interface OperaLogEntry {
    readonly t: string;
    readonly level: 'debug' | 'warn' | 'error';
    readonly code: string;
    readonly message: string;
    readonly commandId: string | null;
  }

  interface OperaLogFault {
    readonly code: string;
    readonly message: string;
    readonly count: number;
    readonly firstAt?: string | undefined;
    readonly lastAt?: string | undefined;
  }

  interface OperaLog {
    readonly configure: (options: { level?: 'debug' | 'warn' | 'error' } | undefined) => void;
    readonly log: (level: 'debug' | 'warn' | 'error', code: unknown, message: unknown, fields?: { commandId?: unknown } | undefined) => OperaLogEntry;
    readonly debug: (code: unknown, message: unknown, fields?: { commandId?: unknown } | undefined) => OperaLogEntry;
    readonly warn: (code: unknown, message: unknown, fields?: { commandId?: unknown } | undefined) => OperaLogEntry;
    readonly error: (code: unknown, message: unknown, fields?: { commandId?: unknown } | undefined) => OperaLogEntry;
    readonly entries: () => OperaLogEntry[];
    readonly clear: () => void;
    readonly errors: () => OperaLogFault[];
    readonly clearErrors: () => void;
    readonly errorCount: () => number;
  }

  interface OperaRoleReconcile {
    readonly GENERIC_ROLES: readonly string[];
    readonly ROLE_GAP_SAMPLE_SIZE: number;
    readonly isGenericRole: (role: unknown) => boolean;
    readonly hasRoleGap: (root: unknown, axIndex?: unknown) => boolean;
    readonly implicitRole: (item: unknown) => string;
    readonly normalizeAxRole: (role: unknown) => string;
    readonly axRoleIndex: (items: unknown) => unknown;
    readonly reconcileElementRole: (item: unknown, index: unknown) => unknown;
    readonly reconcileElements: (items: unknown, index: unknown) => unknown;
  }

  interface OperaHoverSettleNormalized {
    readonly timeoutMs: number;
    readonly intervalMs: number;
    readonly stableRounds: number;
    readonly text: string;
  }

  interface OperaHoverSettleDecision {
    readonly done: boolean;
    readonly reason: string;
    readonly stableRounds?: unknown;
    readonly expectedText?: string | undefined;
  }

  interface OperaHoverSettle {
    readonly DEFAULTS: Readonly<{ timeoutMs: number; intervalMs: number; stableRounds: number }>;
    readonly normalize: (options?: Record<string, unknown> | undefined) => OperaHoverSettleNormalized;
    readonly plan: (state?: Record<string, unknown> | undefined) => OperaHoverSettleDecision;
  }

  interface OperaStatementFile {
    readonly kindOf: (bytes: Uint8Array) => string;
    readonly countPages: (bytes: Uint8Array) => number;
    readonly pagesFrom: (kind: string, pages: number) => string;
    readonly balanceDigits: (raw: unknown) => string | null;
  }

  interface OperaSemanticState {
    readonly observationRevision?: number | undefined;
    readonly [key: string]: unknown;
  }

  interface OperaSemanticObservation {
    readonly items: unknown[];
    readonly state: OperaSemanticState;
    readonly delta: unknown;
  }

  interface OperaIdentityEngine {
    readonly reset: (reason?: string) => void;
    readonly observe: (items: unknown[]) => OperaSemanticObservation;
    readonly inspect: () => OperaSemanticState;
  }

  interface OperaSemanticIdentity {
    readonly createIdentityEngine: (options?: Record<string, unknown> | undefined) => OperaIdentityEngine;
    readonly stableHash: (value: unknown) => string;
  }

  interface OperaViewEngine {
    readonly observe: (input?: Record<string, unknown> | undefined) => unknown;
    readonly reset: () => void;
  }

  interface OperaSemanticViews {
    readonly COMPLETION_STATUSES: readonly string[];
    readonly classifyCompletion: (input?: Record<string, unknown> | undefined) => {
      readonly status: string;
      readonly scope: string;
      readonly evidence: string[];
      readonly limits: string[];
      readonly unresolved: string[];
      readonly blockedReason?: string | undefined;
    };
    readonly createViewEngine: (options?: Record<string, unknown> | undefined) => OperaViewEngine;
  }

  interface OperaPageMapElement {
    readonly kind?: string | undefined;
    readonly tag?: string | undefined;
    readonly role?: string | null | undefined;
    readonly name?: string | undefined;
    readonly checked?: boolean | undefined;
    readonly type?: string | undefined;
    readonly href?: string | undefined;
    readonly visible?: boolean | undefined;
    readonly style: { pointerEvents?: string | undefined; [key: string]: unknown };
    readonly [key: string]: unknown;
  }

  interface OperaPageMapPull<T = OperaPageMapElement> {
    readonly elements: T[];
    readonly total: number;
    readonly offset: number;
    readonly limit: number;
    readonly hasMore: boolean;
    readonly nextOffset?: number | null | undefined;
  }

  interface OperaPageMap {
    readonly PAGE_MAP_CLASSES: readonly string[];
    readonly CLASS_FIELDS: Readonly<Record<string, readonly string[]>>;
    readonly PAGE_MAP_MAX_ELEMENTS: number;
    readonly classify: (input: Record<string, unknown>) => string;
    readonly isMapClass: (name: unknown) => boolean;
    readonly isActionableClass: (kind: unknown) => boolean;
    readonly projectElement: (raw: Record<string, unknown>) => OperaPageMapElement;
    readonly paginate: (elements: OperaPageMapElement[], offset: unknown, limit: unknown) => OperaPageMapPull;
    readonly unionBox: (elements: OperaPageMapElement[]) => { x: number; y: number; width: number; height: number } | null;
    readonly summarizeClass: (className: string, elements: OperaPageMapElement[]) => { class: string; count: number; bbox: { x: number; y: number; width: number; height: number } | null };
  }
}
