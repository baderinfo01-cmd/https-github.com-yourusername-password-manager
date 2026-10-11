"use client";

/**
 * Rubber-stamp style square badge (SVG, no external assets).
 * tone: green = genuine license, amber = development build, red = not activated.
 */
const TONES = {
  green: { ink: "#15803d", bg: "rgba(21,128,61,0.07)" },
  amber: { ink: "#b45309", bg: "rgba(180,83,9,0.07)" },
  red: { ink: "#b91c1c", bg: "rgba(185,28,28,0.07)" },
} as const;

export default function LicenseStamp({
  title,
  subtitle,
  footer,
  tone = "green",
  size = 190,
  rotate = -7,
}: {
  title: string;
  subtitle: string;
  footer: string;
  tone?: keyof typeof TONES;
  size?: number;
  rotate?: number;
}) {
  const { ink, bg } = TONES[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`${title} — ${subtitle}`}
      style={{ transform: `rotate(${rotate}deg)`, opacity: 0.94 }}
    >
      <defs>
        {/* slightly rough edge, like real ink */}
        <filter id={`rough-${tone}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" />
        </filter>
      </defs>
      <g filter={`url(#rough-${tone})`} fill="none" stroke={ink}>
        <rect x="8" y="8" width="184" height="184" rx="18" fill={bg} strokeWidth="6" />
        <rect x="19" y="19" width="162" height="162" rx="11" strokeWidth="2.2" />

        {/* shield + check */}
        <path d="M100 30 L128 41 V70 C128 88 116 100 100 107 C84 100 72 88 72 70 V41 Z" strokeWidth="3.5" />
        <path d="M87 68 L97 79 L115 56" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

        <line x1="34" y1="118" x2="166" y2="118" strokeWidth="1.6" />
        <line x1="34" y1="167" x2="166" y2="167" strokeWidth="1.6" />
      </g>
      <g fill={ink} textAnchor="middle" fontFamily='"Segoe UI", Tahoma, Arial, sans-serif' filter={`url(#rough-${tone})`}>
        <text x="100" y="143" fontSize={title.length > 12 ? 19 : 25} fontWeight="800">{title}</text>
        <text x="100" y="158" fontSize="9.5" fontWeight="700" letterSpacing="1.6">{subtitle}</text>
        <text x="100" y="180" fontSize="9" fontWeight="700" letterSpacing="1.2">{footer}</text>
      </g>
    </svg>
  );
}
