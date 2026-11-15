// Corbin — the raven.
// Drawn flat and dense, after the 1874 Naumann naturalist plate in public/assets/raven-1874.jpg: unified silhouette, layered hackle tones, rictal fans, lanceolate throat hackles, ink on paper with an amber iris.
// No gradients, no texture fills — the mark carries at 16 px because the hook and the eye carry the read.

interface RavenProps {
  size?: number;
  variant?: 'head' | 'icon';
  reverse?: boolean;
  title?: string;
}

const SILHOUETTE =
  'M52 200 Q49 142 55 113 Q63 79 96 64 Q112 56 129 57 Q176 58 212 74 Q219 81 215 91 Q210 101 199 104 Q190 116 171 118 Q152 121 140 118 Q126 129 120 147 Q111 175 112 200 Z';

const CLIP_ID = 'raven-head-clip';

const CROWN_LONG = ['M92 86 C78 76 62 73 48 75', 'M98 78 C86 65 70 61 55 62', 'M106 70 C96 57 80 52 64 53', 'M117 63 C109 50 94 44 78 45', 'M129 58 C123 46 109 40 93 41', 'M141 56 C137 45 124 39 108 40'];
const CROWN_MID = ['M97 89 C82 79 64 77 50 80', 'M103 81 C91 69 73 66 58 67', 'M111 73 C102 61 84 57 70 58', 'M121 67 C114 55 99 50 85 51', 'M132 62 C127 50 113 45 99 46'];
const WASH = ['M64 128 C79 119 98 117 116 123', 'M60 151 C77 142 97 140 117 146', 'M59 170 C75 161 95 159 115 165'];
const WASH_LIGHT = ['M58 118 C73 110 92 109 108 115', 'M56 139 C72 130 91 129 108 134', 'M56 159 C72 150 91 149 108 154'];
const MASK = ['M130 62 L142 73', 'M140 60 L152 72', 'M150 58 L161 71', 'M160 58 L170 70', 'M170 60 L179 71', 'M120 65 L134 74', 'M136 70 L149 78', 'M146 68 L158 77', 'M156 67 L167 76', 'M166 68 L175 77', 'M176 71 L183 80'];
const RICTAL = ['M141 97 C118 87 92 86 68 91', 'M143 102 C120 94 94 94 70 99', 'M143 108 C121 103 97 104 74 110', 'M141 114 C121 113 98 114 76 120', 'M147 118 C129 122 108 127 88 134', 'M152 122 C137 129 119 135 100 141'];
const HACKLES = ['M122 131 L108 165', 'M133 134 L121 170', 'M144 133 L136 168', 'M111 132 L100 160'];
const BILL_SHEEN = 'M140 66 C166 59 192 63 208 75 L204 79 C188 70 166 67 142 72 Z';
const GAPE = 'M209 93 L176 99 L140 102';

export function Raven({ size = 160, variant = 'head', reverse = false, title }: RavenProps) {
  const ink = reverse ? '#f4f1e9' : '#16161a';
  const a = reverse ? 'rgba(244,241,233,0.28)' : '#2e2e36';
  const b = reverse ? 'rgba(244,241,233,0.22)' : '#262630';
  const c = reverse ? 'rgba(244,241,233,0.16)' : '#1f1f29';
  const d = reverse ? 'rgba(244,241,233,0.45)' : '#3f3f4c';
  const deep = reverse ? '#0f0f13' : '#050507';
  const paper = reverse ? '#0f0f13' : '#f4f1e9';

  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 240 210" role="img" aria-label={title ?? 'Corbin'}>
        <rect width="240" height="210" rx="30" fill="#16161a" />
        <path fill="#f4f1e9" d={SILHOUETTE} />
        <circle cx="117" cy="83" r="17" fill="#d8923f" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size * (210 / 240)} viewBox="0 0 240 210" role="img" aria-label={title ?? 'Corbin, the raven'}>
      <defs>
        <clipPath id={CLIP_ID}>
          <path d={SILHOUETTE} />
        </clipPath>
      </defs>
      <path fill={ink} d={SILHOUETTE} />
      <g clipPath={`url(#${CLIP_ID})`} fill="none" strokeLinecap="round">
        <g stroke={a} strokeWidth="1.7">{CROWN_LONG.map((p) => <path key={p} d={p} />)}</g>
        <g stroke={b} strokeWidth="3.2">{CROWN_MID.map((p) => <path key={p} d={p} />)}</g>
        <g stroke={c} strokeWidth="8" opacity=".9">{WASH.map((p) => <path key={p} d={p} />)}</g>
        <g stroke={b} strokeWidth="2.5">{WASH_LIGHT.map((p) => <path key={p} d={p} />)}</g>
        <g stroke={a} strokeWidth="1.5">{MASK.map((p) => <path key={p} d={p} />)}</g>
        <g stroke={d} strokeWidth="1.6">{RICTAL.map((p) => <path key={p} d={p} />)}</g>
        <g stroke={d} strokeWidth="2.1">{HACKLES.map((p) => <path key={p} d={p} />)}</g>
        <path d={BILL_SHEEN} fill={reverse ? 'rgba(244,241,233,0.28)' : '#2b2b33'} stroke="none" />
      </g>
      <path d={GAPE} stroke={deep} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="117" cy="83" r="12.5" fill={deep} />
      <circle cx="117" cy="83" r="9.5" stroke={paper} strokeWidth="3.2" strokeDasharray="2.2 3.4" fill="none" />
      <circle cx="117" cy="83" r="6.6" fill="#d8923f" />
      <circle cx="117" cy="83" r="2.7" fill={deep} />
      <circle cx="114.4" cy="80.4" r="1.8" fill={paper} />
    </svg>
  );
}
