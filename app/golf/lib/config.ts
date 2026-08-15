/**
 * Who may organize the outing, and where the event happens.
 *
 * ── Changing the owner list ──────────────────────────────────────────────────
 * `firestore.rules` is the authority: it is what actually stops a write, and it
 * runs on Google's servers where nobody can edit it. The copy below only
 * decides whether this app bothers to render the admin UI. Change one and you
 * must change the other, or an owner will see an admin screen whose every save
 * is refused.
 *
 * Everyone else is added at runtime through the admin screen, which writes to
 * the `golf-admins` collection — no deploy needed to hand someone a scorecard
 * on the morning of the outing.
 */
export const GOLF_OWNERS: readonly string[] = [
  "hello@jnssolutions.ai",
  "nikunjjadawala@nyu.edu",
  "nvj208@nyu.edu",
];

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return GOLF_OWNERS.includes(email.trim().toLowerCase());
}

/** Collection names, in one place so a typo can't silently read an empty set. */
export const TEAMS_COLLECTION = "golf-teams";
export const SCORES_COLLECTION = "golf-scores";
export const ADMINS_COLLECTION = "golf-admins";
export const ACCESS_COLLECTION = "golf-access";
export const TEAM_CODES_COLLECTION = "golf-team-codes";
export const CLAIMS_COLLECTION = "golf-claims";

/**
 * Outing sponsors, in the order they appeared on the sponsor sheet.
 *
 * JNS is not in this list — it sits above it as the technology partner, and is
 * rendered separately so it can't be reordered into the middle of the pack.
 *
 * Logos are the artwork supplied by each sponsor, used as-is. `width`/`height`
 * are the real pixel dimensions of each file, which keeps the grid from
 * reflowing as the images arrive.
 */
export type Sponsor = {
  name: string;
  logo: string;
  width: number;
  height: number;
};

export const SPONSORS: readonly Sponsor[] = [
  { name: "Viewegh Crafted Homes", logo: "/golf/sponsors/viewegh.png", width: 133, height: 88 },
  {
    name: "Extra Space Storage",
    logo: "/golf/sponsors/extra-space-storage.png",
    width: 224,
    height: 72,
  },
  { name: "Coomer Roofing Co.", logo: "/golf/sponsors/coomer-roofing.png", width: 320, height: 192 },
  {
    name: "Omni Management Services",
    logo: "/golf/sponsors/omni-management.png",
    width: 172,
    height: 81,
  },
  {
    name: "Extreme Outdoor Solutions",
    logo: "/golf/sponsors/extreme-outdoor-solutions.png",
    width: 451,
    height: 373,
  },
  { name: "Engledow Group", logo: "/golf/sponsors/engledow-group.png", width: 217, height: 97 },
  {
    name: "Salon on Point Suites",
    logo: "/golf/sponsors/salon-on-point-suites.png",
    width: 325,
    height: 238,
  },
];

export const EVENT = {
  name: "Stonegate Golf Outing",
  tagline: "Golf for a greater purpose.",
  beneficiary: "Supporting Stonegate Elementary School",
  format: "4-person scramble · 18 holes",
  venue: {
    name: "The Trophy Club",
    address: "3887 N US Highway 52",
    city: "Lebanon, Indiana",
    phone: "(765) 482-7272",
    summary: "18 holes · Par 72",
  },
} as const;
