// Navego - the monogram, in chrome.
// One mark for the site, the badge and the extension.
// N = the navigator stroke: two stems and a diagonal; the amber cursor tips the far stem.
// Geometric, readable at 16 px.

interface NavegoMarkProps { size?: number; title?: string; }

export function NavegoMark({ size = 22, title = 'Navego' }: NavegoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" role="img" aria-label={title}>
      <defs>
        <linearGradient id="navego-chrome" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#b9c9df" />
          <stop offset="0.6" stopColor="#6d7f9b" />
          <stop offset="1" stopColor="#e8f0fa" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="116" fill="#233259" />
      <path d="M74 178 V62 L166 178 V62" fill="none" stroke="url(#navego-chrome)" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M140 78 L208 36 L162 106 Z" fill="#d8923f" />
    </svg>
  );
}

// The wordmark is drawn from the mark: same round stroke, the amber cursor dot over the g.

export function NavegoWordmark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size * 3.75} height={size} viewBox="0 0 450 120" role="img" aria-label="navego">
      <path d="M40 96 V40" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M40 62 Q64 28 90 58 V96" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M150 72 a22 22 0 1 0 -44 0 a22 22 0 1 0 44 0" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M150 46 V96" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M184 46 L202 96 L220 46" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M238 78 a18 18 0 1 1 28 -8" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M238 86 H268" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M310 66 a20 20 0 1 0 -40 0 a20 20 0 1 0 40 0" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M310 44 V104 Q310 118 288 118 Q268 118 268 102" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M386 72 a22 22 0 1 0 -44 0 a22 22 0 1 0 44 0" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="310" cy="30" r="7" fill="#d8923f" />
    </svg>
  );
}
