// @last-edited: 2026-11-14 UTC+7.
// @title: global.d.ts — the contract between the classic content scripts and the worker: every helper a manifest classic script publishes on globalThis, declared once, here.
// @state: owns every `Navego*` global the extension publishes; a classic script cannot import, so it publishes, and the worker reads the value back through this type.
// @dependencies: none.
// @why-no-casts: reading a global through a double assertion closes this file's eyes and the type then lies by omission; declaring the global here is the one place the shape is named, and both sides check against it.

export {};

declare global {
  var __navegoContentV1: boolean | undefined;
  var NAVEGO_BRIDGE_WS: string | undefined;
  var NAVEGO_BRIDGE_HANDLE_TIMEOUT_MS: number | string | undefined;
  var NAVEGO_SOCKET_EXECUTE_TIMEOUT_MS: number | string | undefined;
  var NavegoBrowserId: { browserName: string } | undefined;
  var NavegoLog: NavegoLog | undefined;
  var NavegoRoleReconcile: NavegoRoleReconcile | undefined;
  var NavegoHoverSettle: NavegoHoverSettle | undefined;
  var NavegoStatementFile: NavegoStatementFile | undefined;
  var NavegoSemanticIdentity: NavegoSemanticIdentity | undefined;
  var NavegoSemanticViews: NavegoSemanticViews | undefined;
  var NavegoPageMap: NavegoPageMap | undefined;
  var NavegoRecord: Record<string, ((payload?: unknown) => unknown) | undefined> | undefined;

  interface Navigator {
    readonly userAgentData?: { brands?: Array<{ brand?: unknown }> | undefined } | undefined;
    readonly brave?: { isBrave?: (() => boolean) | undefined } | undefined;
  }

  interface NavegoLogEntry {
    readonly t: string;
    readonly level: 'debug' | 'warn' | 'error';
    readonly code: string;
    readonly message: string;
    readonly commandId: string | null;
  }

  interface NavegoLogFault {
    readonly code: string;
    readonly message: string;
    readonly count: number;
    readonly firstAt?: string | undefined;
    readonly lastAt?: string | undefined;
  }

  interface NavegoLog {
    readonly configure: (options: { level?: 'debug' | 'warn' | 'error' } | undefined) => void;
    readonly log: (level: 'debug' | 'warn' | 'error', code: unknown, message: unknown, fields?: { commandId?: unknown } | undefined) => NavegoLogEntry;
    readonly debug: (code: unknown, message: unknown, fields?: { commandId?: unknown } | undefined) => NavegoLogEntry;
    readonly warn: (code: unknown, message: unknown, fields?: { commandId?: unknown } | undefined) => NavegoLogEntry;
    readonly error: (code: unknown, message: unknown, fields?: { commandId?: unknown } | undefined) => NavegoLogEntry;
    readonly entries: () => NavegoLogEntry[];
    readonly clear: () => void;
    readonly errors: () => NavegoLogFault[];
    readonly clearErrors: () => void;
    readonly errorCount: () => number;
  }

  interface NavegoRoleReconcile {
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

  interface NavegoHoverSettleNormalized {
    readonly timeoutMs: number;
    readonly intervalMs: number;
    readonly stableRounds: number;
    readonly text: string;
  }

  interface NavegoHoverSettleDecision {
    readonly done: boolean;
    readonly reason: string;
    readonly stableRounds?: unknown;
    readonly expectedText?: string | undefined;
  }

  interface NavegoHoverSettle {
    readonly DEFAULTS: Readonly<{ timeoutMs: number; intervalMs: number; stableRounds: number }>;
    readonly normalize: (options?: Record<string, unknown> | undefined) => NavegoHoverSettleNormalized;
    readonly plan: (state?: Record<string, unknown> | undefined) => NavegoHoverSettleDecision;
  }

  interface NavegoStatementFile {
    readonly kindOf: (bytes: Uint8Array) => string;
    readonly countPages: (bytes: Uint8Array) => number;
    readonly pagesFrom: (kind: string, pages: number) => string;
    readonly balanceDigits: (raw: unknown) => string | null;
  }

  interface NavegoSemanticState {
    readonly observationRevision?: number | undefined;
    readonly [key: string]: unknown;
  }

  interface NavegoSemanticObservation {
    readonly items: unknown[];
    readonly state: NavegoSemanticState;
    readonly delta: unknown;
  }

  interface NavegoIdentityEngine {
    readonly reset: (reason?: string) => void;
    readonly observe: (items: unknown[]) => NavegoSemanticObservation;
    readonly inspect: () => NavegoSemanticState;
  }

  interface NavegoSemanticIdentity {
    readonly createIdentityEngine: (options?: Record<string, unknown> | undefined) => NavegoIdentityEngine;
    readonly stableHash: (value: unknown) => string;
  }

  interface NavegoViewEngine {
    readonly observe: (input?: Record<string, unknown> | undefined) => unknown;
    readonly reset: () => void;
  }

  interface NavegoSemanticViews {
    readonly COMPLETION_STATUSES: readonly string[];
    readonly classifyCompletion: (input?: Record<string, unknown> | undefined) => {
      readonly status: string;
      readonly scope: string;
      readonly evidence: string[];
      readonly limits: string[];
      readonly unresolved: string[];
      readonly blockedReason?: string | undefined;
    };
    readonly createViewEngine: (options?: Record<string, unknown> | undefined) => NavegoViewEngine;
  }

  interface NavegoPageMapElement {
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

  interface NavegoPageMapPull<T = NavegoPageMapElement> {
    readonly elements: T[];
    readonly total: number;
    readonly offset: number;
    readonly limit: number;
    readonly hasMore: boolean;
    readonly nextOffset?: number | null | undefined;
  }

  interface NavegoPageMap {
    readonly PAGE_MAP_CLASSES: readonly string[];
    readonly CLASS_FIELDS: Readonly<Record<string, readonly string[]>>;
    readonly PAGE_MAP_MAX_ELEMENTS: number;
    readonly classify: (input: Record<string, unknown>) => string;
    readonly isMapClass: (name: unknown) => boolean;
    readonly isActionableClass: (kind: unknown) => boolean;
    readonly projectElement: (raw: Record<string, unknown>) => NavegoPageMapElement;
    readonly paginate: (elements: NavegoPageMapElement[], offset: unknown, limit: unknown) => NavegoPageMapPull;
    readonly unionBox: (elements: NavegoPageMapElement[]) => { x: number; y: number; width: number; height: number } | null;
    readonly summarizeClass: (className: string, elements: NavegoPageMapElement[]) => { class: string; count: number; bbox: { x: number; y: number; width: number; height: number } | null };
  }
}
