// Corbin — the raven, in chrome.
// The Y2K mark: the 1874 Naumann silhouette rebuilt as polished metal, set inside an iridescent ring with a lit eye and one lens flare.
// Read at 16 px from the hook, the eye, and the ring.

interface RavenProps {
  size?: number;
  variant?: 'head' | 'icon';
  reverse?: boolean;
  title?: string;
}

const SILHOUETTE =
  'M52 200 Q49 142 55 113 Q63 79 96 64 Q112 56 129 57 Q176 58 212 74 Q219 81 215 91 Q210 101 199 104 Q190 116 171 118 Q152 121 140 118 Q126 129 120 147 Q111 175 112 200 Z';

export function Raven({ size = 160, variant = 'head', reverse = false, title }: RavenProps) {
  const titleText = title ?? (variant === 'icon' ? 'Corbin' : 'Corbin, the raven');

  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 240 240" role="img" aria-label={titleText}>
        <defs>
          <radialGradient id="corbin-orb" cx="34%" cy="28%" r="78%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.28" stopColor="#d7e3f2" />
            <stop offset="0.62" stopColor="#8496b0" />
            <stop offset="0.88" stopColor="#2c3a63" />
            <stop offset="1" stopColor="#0d1338" />
          </radialGradient>
          <linearGradient id="corbin-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#00e5ff" />
            <stop offset="0.3" stopColor="#7a5cff" />
            <stop offset="0.58" stopColor="#ff2bd6" />
            <stop offset="0.82" stopColor="#9cff3d" />
            <stop offset="1" stopColor="#00e5ff" />
          </linearGradient>
          <radialGradient id="corbin-eye" cx="42%" cy="38%" r="70%">
            <stop offset="0" stopColor="#ffd88a" />
            <stop offset="0.45" stopColor="#d8923f" />
            <stop offset="1" stopColor="#8a4f10" />
          </radialGradient>
          <radialGradient id="corbin-flare" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <clipPath id="corbin-orb-clip">
            <circle cx="120" cy="120" r="104" />
          </clipPath>
        </defs>
        <circle cx="120" cy="120" r="116" fill="none" stroke="url(#corbin-ring)" strokeWidth="9" />
        <circle cx="120" cy="120" r="104" fill="url(#corbin-orb)" />
        <g clipPath="url(#corbin-orb-clip)">
          <path d={SILHOUETTE} transform="translate(6 18) scale(0.95)" fill="#0b1130" opacity="0.92" />
          <path d={SILHOUETTE} transform="translate(6 16) scale(0.95)" fill="none" stroke="#9ff3ff" strokeWidth="2" opacity="0.5" />
          <circle cx="122" cy="92" r="22" fill="url(#corbin-flare)" opacity="0.5" />
        </g>
        <circle cx="121" cy="92" r="13" fill="url(#corbin-eye)" />
        <circle cx="118" cy="88" r="3.6" fill="#fff6e2" opacity="0.85" />
        <circle cx="72" cy="62" r="13" fill="url(#corbin-flare)" opacity="0.75" />
        <circle cx="52" cy="46" r="5" fill="#ffffff" opacity="0.65" />
      </svg>
    );
  }

  const metal = reverse
    ? 'url(#corbin-head-metal-light)'
    : 'url(#corbin-head-metal-dark)';
  const stroke = reverse ? 'rgba(255,255,255,0.5)' : 'rgba(20,30,60,0.4)';

  return (
    <svg width={size} height={size * (210 / 240)} viewBox="0 0 240 210" role="img" aria-label={titleText}>
      <defs>
        <linearGradient id="corbin-head-metal-light" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.36" stopColor="#d5e3f4" />
          <stop offset="0.58" stopColor="#8fa2bd" />
          <stop offset="0.78" stopColor="#eaf2fb" />
          <stop offset="1" stopColor="#63748f" />
        </linearGradient>
        <linearGradient id="corbin-head-metal-dark" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#eef4fb" />
          <stop offset="0.36" stopColor="#b3c2d6" />
          <stop offset="0.58" stopColor="#6d7f9b" />
          <stop offset="0.78" stopColor="#cdd9e8" />
          <stop offset="1" stopColor="#3d4a68" />
        </linearGradient>
        <radialGradient id="corbin-head-eye" cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#ffe6a8" />
          <stop offset="0.45" stopColor="#d8923f" />
          <stop offset="1" stopColor="#7d460c" />
        </radialGradient>
      </defs>
      <path fill={metal} stroke={stroke} strokeWidth="1.6" d={SILHOUETTE} />
      <path d="M140 66 C166 59 192 63 208 75 L204 79 C188 70 166 67 142 72 Z" fill="rgba(255,255,255,0.55)" />
      <path d={SILHOUETTE} fill="none" stroke="rgba(0, 184, 230, 0.55)" strokeWidth="1.4" />
      <circle cx="117" cy="83" r="14" fill="url(#corbin-head-eye)" />
      <circle cx="113.6" cy="79.6" r="4" fill="#fff8e8" opacity="0.9" />
      <circle cx="117" cy="83" r="5.2" fill="#4a2c08" opacity="0.85" />
    </svg>
  );
}
