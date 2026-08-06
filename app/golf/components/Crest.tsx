/**
 * The Stonegate shield — an "S" monogram over crossed clubs, wrapped in laurel.
 *
 * Drawn inline rather than shipped as an image so it stays crisp at any size and
 * inherits colour from the theme. The same artwork is rasterized into the PWA
 * icons by scripts/generate-golf-icons.mjs, so edits here should be followed by
 * a re-run of that script.
 */
export default function Crest({
  size = 96,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      fill="none"
      className={className}
      role="img"
      aria-label="Stonegate Golf Scramble crest"
    >
      {/* Shield body */}
      <path
        d="M50 3 L94 17 V60 C94 87 74 106 50 117 C26 106 6 87 6 60 V17 Z"
        fill="var(--color-fairway-800)"
        stroke="var(--color-brass)"
        strokeWidth="2.5"
      />
      {/* Inner hairline */}
      <path
        d="M50 10 L87 21 V60 C87 83 70 100 50 110 C30 100 13 83 13 60 V21 Z"
        fill="none"
        stroke="var(--color-brass)"
        strokeWidth="0.8"
        opacity="0.5"
      />

      {/* Crossed clubs — shafts with heads at the bottom */}
      <g stroke="var(--color-brass-soft)" strokeWidth="2.6" strokeLinecap="round">
        <line x1="30" y1="34" x2="66" y2="86" />
        <line x1="70" y1="34" x2="34" y2="86" />
      </g>
      <path
        d="M66 86 q6 2 7 8 q-7 1 -10 -3 z"
        fill="var(--color-brass-soft)"
      />
      <path
        d="M34 86 q-6 2 -7 8 q7 1 10 -3 z"
        fill="var(--color-brass-soft)"
      />

      {/* Monogram */}
      <text
        x="50"
        y="66"
        textAnchor="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="46"
        fill="var(--color-cream-golf)"
      >
        S
      </text>

      {/* Laurel sprigs */}
      <g stroke="var(--color-brass)" strokeWidth="1.4" fill="none" opacity="0.85">
        <path d="M24 74 q6 10 8 22" />
        <path d="M76 74 q-6 10 -8 22" />
        <path d="M25 79 q-5 1 -7 5" />
        <path d="M27 87 q-5 1 -7 5" />
        <path d="M75 79 q5 1 7 5" />
        <path d="M73 87 q5 1 7 5" />
      </g>
    </svg>
  );
}
