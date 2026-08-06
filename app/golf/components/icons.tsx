/**
 * Line icons for the home tiles and info rows. 24×24, 1.6 stroke, currentColor —
 * matched weight so the tile grid reads as one set.
 */

type IconProps = { size?: number };

function Svg({ size = 26, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    <path d="M12 14v4M9 20h6" />
  </Svg>
);

export const MapIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 7z" />
    <path d="M9 4v13M15 7v12.5" />
  </Svg>
);

export const FlagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 21V3" />
    <path d="M6 4h11l-2.5 3.5L17 11H6z" />
  </Svg>
);

export const TeamIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.8M17 14.5a6 6 0 0 1 4 5.5" />
  </Svg>
);

export const InfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
);

export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.6-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.6C19 15.4 12 20 12 20z" />
  </Svg>
);

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const DollarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v18" />
    <path d="M16 7.5A3 3 0 0 0 13 6h-2a2.5 2.5 0 0 0 0 5h2a2.5 2.5 0 0 1 0 5h-2.2A3 3 0 0 1 8 16.5" />
  </Svg>
);

export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3h3l2 5-2.5 1.5a12 12 0 0 0 5 5L14 12l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 3 5.2 2 2 0 0 1 5 3z" />
  </Svg>
);

export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 13 4 4L19 7" />
  </Svg>
);

export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12M7 11l5 5 5-5" />
    <path d="M4 20h16" />
  </Svg>
);

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
    <path d="M6 12H4v8h16v-8h-2" />
  </Svg>
);

export const TargetIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </Svg>
);
