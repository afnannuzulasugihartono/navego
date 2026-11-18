// @last-edited: 2026-11-18 UTC+7.
// @title: consent — the two first-party cookies the site sets, and how they are read.
// @state: navego_consent stores the banner choice (granted|denied); navego_region stores the pricing-band country (two letters) and is written only after consent.
// @dependencies: none.

// WHY TWO COOKIES AND NO MORE.
// navego_region is a display preference: without it, every visit re-detects the region and /harga asks the browser for the geolocation permission again.
// navego_consent is what lets the site remember the choice about the region cookie, so the banner shows exactly once.
// Neither carries identity, neither is shared with anyone, and both are named here so the privacy page cannot drift from what the code does.

export type ConsentChoice = 'granted' | 'denied' | null;

function cookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds = 31_536_000): void {
  if (typeof document === 'undefined') return;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax${secure}`;
}

export function readConsent(): ConsentChoice {
  const value = cookieValue('navego_consent');
  return value === 'granted' || value === 'denied' ? value : null;
}

export function storeConsent(choice: 'granted' | 'denied'): void {
  writeCookie('navego_consent', choice);
}

export function readRegionCookie(): string | null {
  const value = cookieValue('navego_region');
  return value && /^[A-Z]{2}$/.test(value) ? value : null;
}

export function storeRegionCookie(code: string): void {
  if (!/^[A-Z]{2}$/.test(code)) return;
  writeCookie('navego_region', code);
}
