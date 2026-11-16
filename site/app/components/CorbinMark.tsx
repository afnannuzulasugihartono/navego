// Corbin - the monogram, in chrome. One mark for the site, the badge and the extension.
// C = the open arc; the short bar ends in an amber cursor. Geometric, readable at 16 px.
interface CorbinMarkProps { size?: number; title?: string; }

export function CorbinMark({ size = 22, title = 'Corbin' }: CorbinMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" role="img" aria-label={title}>
      <defs>
        <linearGradient id="corbin-chrome" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#b9c9df" />
          <stop offset="0.6" stopColor="#6d7f9b" />
          <stop offset="1" stopColor="#e8f0fa" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="116" fill="#233259" />
      <path d="M170 62 A76 76 0 1 0 170 178" fill="none" stroke="url(#corbin-chrome)" strokeWidth="24" strokeLinecap="round" />
      <path d="M120 120 H178" stroke="url(#corbin-chrome)" strokeWidth="20" strokeLinecap="round" />
      <path d="M166 103 L198 120 L166 137 Z" fill="#d8923f" />
    </svg>
  );
}

// The wordmark is drawn from the mark: same round stroke, same open arc on the c,
// circular bowls, and the amber cursor becomes the dot of the i.
export function CorbinWordmark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size * 3.75} height={size} viewBox="0 0 450 120" role="img" aria-label="corbin">
      <path d="M70 50 A28 28 0 1 0 70 86" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M130 68 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M176 40 V96" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M176 56 Q194 40 212 50" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M242 34 V96" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M268 76 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M322 56 V96" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M364 96 V68 Q364 44 392 44 Q424 44 424 68 V96" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="322" cy="30" r="7" fill="#d8923f" />
    </svg>
  );
}
