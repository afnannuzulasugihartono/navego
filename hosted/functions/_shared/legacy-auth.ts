// @last-edited: 2026-11-20 UTC+7.
// @title: legacy-auth - the one place that reads the device token header, so both names work.
// @state: the header list, in the order the canonical name is read first.
// @dependencies: none.

// THE HEADER MOVED FROM x-navego-token TO x-opera-token, AND A 1.x CLIENT STILL SENDS THE OLD ONE.
// The edge functions answer a device that has not upgraded yet, so the old header is read as a fallback rather than refused.
// The canonical name is read first, so a client that sends both is answered by the canonical one.

export const TOKEN_HEADERS = ["x-opera-token", "x-navego-token"] as const;

export function tokenFromHeaders(headers: { get(name: string): string | null }): string | null {
  for (const name of TOKEN_HEADERS) {
    const value = headers.get(name);
    if (value && value.trim().length > 0) return value.trim();
  }
  return null;
}
