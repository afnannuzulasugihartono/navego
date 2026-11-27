// decisions.json -> docs-agent-roles-16, docs-agent-org-spec-01 A lane message is a notification and a pointer, never the source of truth.
// The visible label keeps a report from being mistaken for the owner speaking.

export type MessageKind = 'report' | 'review' | 'approve';
export type LaneId = 'operator' | 'engineer' | 'sales-rep' | 'onboarding-guide';

export interface MessageInput {
  kind: MessageKind;
  from: LaneId;
  to: LaneId;
  ticket: string;
  round: number;
  text: string;
}

export interface MessageRoster {
  operatorSessionTitle?: string;
  messagePairs?: Array<{ from: string; to: string; kinds: string[] }>;
}

export function labelOf(input: MessageInput): string {
  const tail = ` ticket=${input.ticket} round=${input.round}`;
  if (input.kind === 'report') return `[LANE-REPORT ${input.from}]${tail}`;
  if (input.kind === 'review') return `[LANE-REVIEW ${input.from} -> ${input.to}]${tail}`;
  return `[LANE-APPROVAL ${input.from} -> ${input.to}]${tail}`;
}

export function messageIdOf(input: MessageInput): string {
  return `${input.ticket}:${input.round}:${input.kind}`;
}

export function assertAllowed(input: MessageInput, roster: MessageRoster): void {
  if (!Number.isInteger(input.round) || input.round < 1 || input.round > 3) {
    throw new Error('ROUND_LIMIT_REACHED');
  }
  const pairs = roster.messagePairs ?? [];
  const allowed = pairs.some((pair) => pair.from === input.from
    && pair.to === input.to
    && pair.kinds.includes(input.kind));
  if (!allowed) throw new Error('NOT_ALLOWED');
}
