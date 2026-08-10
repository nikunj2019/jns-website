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
