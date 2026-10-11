"use client";

/**
 * Rectangular rubber-stamp style badge (SVG, no external assets).
 * tone: green = genuine license, amber = development build, red = not activated.
 */
const TONES = {
  green: { ink: "#0f7a3d", bg: "rgba(15,122,61,0.06)" },
  amber: { ink: "#b45309", bg: "rgba(180,83,9,0.06)" },
  red: { ink: "#b91c1c", bg: "rgba(185,28,28,0.06)" },
} as const;

export function LicenseStamp({
  title, subtitle, detail, footer, tone = "green", width = 360, rotate = -4,
}: {
  title: string; subtitle: string; detail?: string; footer?: string; tone?: keyof typeof TONES; width?: number; rotate?: number;
}) {
  const { ink, bg } = TONES[tone];
  const id = `rough-${tone}`;
  return (
    <svg width={width} height={(width * 150) / 400} viewBox="0 0 400 150" role="img" aria-label={`${title} — ${subtitle}`} style={{ transform: `rotate(${rotate}deg)`, opacity: 0.95 }} direction="ltr">
      <defs>
        <filter id={id} x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.3" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill="none" stroke={ink}>
        <rect x="5" y="5" width="390" height="140" rx="16" fill={bg} strokeWidth="5" />
        <rect x="14" y="14" width="372" height="122" rx="10" strokeWidth="1.6" />
        {/* seal: shield with check inside a ring */}
        <circle cx="76" cy="75" r="42" strokeWidth="3" />
        <circle cx="76" cy="75" r="35" strokeWidth="1" strokeDasharray="2 3" />
        <path d="M76 48 L98 57 V77 C98 90 89 98 76 103 C63 98 54 90 54 77 V57 Z" strokeWidth="3" />
        <path d="M65 76 L73 84 L88 66" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="136" y1="26" x2="136" y2="124" strokeWidth="1.6" />
        <line x1="150" y1="88" x2="372" y2="88" strokeWidth="1.2" strokeDasharray="5 3" />
      </g>
      <g fill={ink} filter={`url(#${id})`} fontFamily='"El Messiri","Segoe UI", Tahoma, Arial, sans-serif'>
        <text x="261" y="56" fontSize={title.length > 10 ? 25 : 31} fontWeight="800" textAnchor="middle">{title}</text>
        <text x="261" y="78" fontSize="13" fontWeight="700" letterSpacing="3" textAnchor="middle">{subtitle}</text>
        {detail && <text x="261" y="106" fontSize="12" fontWeight="700" letterSpacing="1.4" textAnchor="middle">{detail}</text>}
        {footer && <text x="261" y="126" fontSize="9.5" fontWeight="600" letterSpacing="1.2" textAnchor="middle" opacity="0.85">{footer}</text>}
      </g>
    </svg>
  );
}
