// Corbin — the raven.
// A realistic profile head, drawn flat: unified silhouette (near-flat forehead → culmen → hooked tip, deep gonys), ricti nasal bristles, lanceolate throat hackles, ink on paper with an amber iris.
// No gradients, no texture fills — the mark survives at 16 px because the hook and the eye carry the read.

interface RavenProps {
  size?: number;
  variant?: 'head' | 'icon';
  reverse?: boolean;
  title?: string;
}

const SILHOUETTE =
  'M52 200 Q50 144 56 113 Q64 79 97 65 Q114 58 131 59 Q176 60 212 77 Q218 83 214 92 Q209 101 198 103 Q189 114 171 117 Q152 120 140 117 Q127 127 121 145 Q112 173 112 200 Z';

const DETAIL = {
  ricti: ['M146 76 L172 68', 'M150 83 L177 75', 'M143 69 L166 62'],
  gape: 'M209 93 L176 99 L140 102',
  sheen1: 'M72 110 C92 96 122 91 148 98 C132 109 104 116 76 118 Z',
  sheen2: 'M66 126 C90 112 124 108 152 114 C134 126 102 132 70 134 Z',
  hackles: ['M112 128 L100 160', 'M125 130 L117 165', 'M138 128 L131 160']
};

export function Raven({ size = 160, variant = 'head', reverse = false, title }: RavenProps) {
  const ink = reverse ? '#f4f1e9' : '#16161a';
  const detail = reverse ? '#f4f1e9' : '#16161a';
  const ricti = reverse ? 'rgba(244,241,233,0.65)' : '#4a4a56';
  const deep = reverse ? '#0f0f13' : '#050507';

  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 240 210" role="img" aria-label={title ?? 'Corbin'}>
        <rect width="240" height="210" rx="30" fill="#16161a" />
        <path fill="#f4f1e9" d={SILHOUETTE} />
        <circle cx="124" cy="80" r="15" fill="#d8923f" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size * (210 / 240)} viewBox="0 0 240 210" role="img" aria-label={title ?? 'Corbin, the raven'}>
      <path fill={ink} d={SILHOUETTE} />
      <g stroke={ricti} strokeLinecap="round" fill="none">
        <path d={DETAIL.ricti[0]} strokeWidth="1.8" />
        <path d={DETAIL.ricti[1]} strokeWidth="1.8" />
        <path d={DETAIL.ricti[2]} strokeWidth="1.5" />
      </g>
      <path d={DETAIL.gape} stroke={deep} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d={DETAIL.sheen1} fill={reverse ? '#d8d3c4' : '#262630'} opacity=".9" />
      <path d={DETAIL.sheen2} fill={reverse ? '#c9c4b6' : '#1f1f29'} opacity=".92" />
      <g stroke={reverse ? 'rgba(244,241,233,0.6)' : '#4a4a56'} strokeLinecap="round" strokeWidth="1.9" fill="none">
        {DETAIL.hackles.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <circle cx="124" cy="80" r="10.5" fill={reverse ? '#f4f1e9' : '#0a0a0f'} opacity={reverse ? 0.9 : 1} />
      <circle cx="124" cy="80" r="6.2" fill="#d8923f" />
      <circle cx="125.2" cy="78.8" r="2.4" fill={reverse ? '#f4f1e9' : '#050507'} />
    </svg>
  );
}


