"use client";

import type { ReactNode } from "react";

/**
 * The app's icon set, inline so the score screen paints in one round trip on
 * course wifi rather than waiting on a sprite.
 */
export type IconName =
  | "home"
  | "score"
  | "map"
  | "trophy"
  | "team"
  | "heart"
  | "more"
  | "pin"
  | "locate"
  | "install"
  | "settings";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ART: Record<IconName, ReactNode> = {
  home: (
    <>
      <path {...stroke} d="M3 10.5 12 3l9 7.5" />
      <path {...stroke} d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" />
    </>
  ),
  score: (
    <>
      <path {...stroke} d="M5 20h14M7 17l8.8-8.8 2 2L9 19H7z" />
      <path {...stroke} d="m14.8 9.2-2-2" />
    </>
  ),
  map: <path {...stroke} d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" />,
  trophy: (
    <>
      <path {...stroke} d="M8 4h8v5a4 4 0 0 1-8 0zM10 13v4M14 13v4M8 21h8M10 17h4" />
      <path {...stroke} d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />
    </>
  ),
  team: (
    <>
      <circle {...stroke} cx="9" cy="8" r="3" />
      <circle {...stroke} cx="17" cy="9" r="2.5" />
      <path {...stroke} d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M14 15.3a4.5 4.5 0 0 1 6.5 4V20" />
    </>
  ),
  heart: (
    <path
      {...stroke}
      d="M20.8 5.7a5.2 5.2 0 0 0-7.4 0L12 7.1l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 22l8.8-8.9a5.2 5.2 0 0 0 0-7.4z"
    />
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  pin: (
    <>
      <path {...stroke} d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z" />
      <circle {...stroke} cx="12" cy="10" r="2.5" />
    </>
  ),
  locate: (
    <>
      <circle {...stroke} cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path {...stroke} d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  install: (
    <>
      <path {...stroke} d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path {...stroke} d="M5 19v2h14v-2" />
    </>
  ),
  settings: (
    <>
      <circle {...stroke} cx="12" cy="12" r="3" />
      <path
        {...stroke}
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"
      />
    </>
  ),
};

export default function Icon({ name }: { name: IconName }) {
  return (
    <span className={`i i-${name}`} aria-hidden>
      <svg viewBox="0 0 24 24">{ART[name]}</svg>
    </span>
  );
}
