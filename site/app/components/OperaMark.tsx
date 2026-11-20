// decisions.json -> D28, D29, D30, D31, D33 (hand-drawn stroke, symmetric underline, handwritten wordmark, mark palette) Opera — written, not set.
// One pen stroke: left stem, the diagonal, right stem; one amber underline beneath.
// The wordmark is the same hand, one motion per letter.
// Legible at 16 px; the underline is the warm point at every size.

const DISC = '#233259';
const CREAM = '#f4f1e9';
const AMBER = '#d8923f';

interface OperaMarkProps { size?: number; title?: string; }

export function OperaMark({ size = 22, title = 'Opera' }: OperaMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" role="img" aria-label={title}>
      <circle cx="120" cy="120" r="116" fill={DISC} />
      <path d="M78 176 C74 134 74 94 80 54 C107 79 131 122 156 176 C161 132 160 90 152 52" fill="none" stroke={CREAM} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M56 197 C94 205 146 205 184 197" fill="none" stroke={AMBER} strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

// The wordmark is the same hand: one stroke per letter, round caps, no tittle.
// viewBox is 384 × 124; the aspect is carried by OperaWordmark.

export function OperaWordmark({ size = 16 }: { size?: number }) {
  return (
    <svg width={Math.round(size * (384 / 124))} height={size} viewBox="0 0 384 124" role="img" aria-label="opera" fill="none">
      <path d="M37 94 C34 72 34 61 39 51 M38 64 C46 47 69 46 74 60 C78 71 77 82 75 94" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M127 54 V96 M127 72 C119 50 89 53 89 75 C89 95 119 97 127 79" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M148 51 C156 67 162 82 167 97 C173 79 180 63 189 47" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M205 70 H238 M238 70 C241 49 204 48 203 67 C202 84 229 92 238 80" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M288 55 V100 C287 112 268 117 251 109 M288 70 C279 49 249 52 249 74 C249 93 278 95 288 75" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M330 51 C352 49 357 97 327 97 C300 98 300 54 330 51 Z" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
