/**
 * Event facts for the Annual Stonegate Men's Golf Scramble.
 *
 * This file is the build-time default. Anything an organizer edits at
 * /golf/admin/event/ is stored in Firestore (`golf-config/event`) and overrides
 * these values at runtime, so day-of changes never need a redeploy.
 */

export type EventStatus = "upcoming" | "live" | "final";

export type GolfEvent = {
  name: string;
  tagline: string;
  /** ISO date of the outing, local to the course. */
  date: string;
  teeTime: string;
  format: string;
  costPerPlayer: number;
  venue: {
    name: string;
    address: string;
    city: string;
    phone: string;
    website: string;
    lat: number;
    lng: number;
  };
  payment: {
    venmo: string;
    checkPayableTo: string;
    dropOff: string;
    note: string;
  };
  rsvp: {
    contact: string;
    email: string;
    phone: string;
  };
  status: EventStatus;
  scoringOpen: boolean;
};

export const EVENT: GolfEvent = {
  name: "Annual Stonegate Men's Golf Scramble",
  tagline: "A Stonegate neighborhood tradition",
  date: "2026-08-28",
  teeTime: "9:00 AM (Shotgun Start)",
  format: "4-person scramble · 18 holes",
  costPerPlayer: 90,
  venue: {
    name: "The Trophy Club",
    address: "3887 N US Hwy 52",
    city: "Lebanon, IN 46052",
    phone: "(765) 482-7272",
    website: "https://thetrophyclubgolf.com",
    lat: 40.0979318,
    lng: -86.5304796,
  },
  payment: {
    venmo: "@curtis-condict",
    checkPayableTo: "Trophy Club",
    dropOff: "7597 W. Stonegate Drive (John's front porch)",
    note: "Payment to be made prior to the event.",
  },
  rsvp: {
    contact: "Curtis Condict",
    email: "ccondict@hanover.com",
    phone: "(317) 605-0763",
  },
  status: "upcoming",
  scoringOpen: false,
};

/** "Friday, August 28, 2026" — parsed as local time, not UTC, so the date can't slip a day. */
export function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Whole days until the outing; negative once it's past. */
export function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const event = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((event.getTime() - today.getTime()) / 86_400_000);
}

/** Digits only, for tel: links. */
export function telHref(phone: string): string {
  return `tel:+1${phone.replace(/\D/g, "")}`;
}
