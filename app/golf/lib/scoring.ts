import type { Hole } from "./course";

export const TEAMS_COLLECTION = "golf-teams";
export const SCORES_COLLECTION = "golf-scores";

export type Player = { name: string; email?: string };

export type Team = {
  id: string;
  name: string;
  captain?: string;
  players: Player[];
  /** Lower-cased addresses allowed to score for this team; mirrors `players`. */
  playerEmails: string[];
  /** Which hole this foursome starts on — shotgun starts scatter them. */
  startingHole?: number;
};

export type TeamScore = {
  id: string;
  /** Hole number (as a string key) → strokes. One score per team: it's a scramble. */
  strokes: Record<string, number>;
  updatedAt?: string;
};

export type LeaderboardRow = {
  team: Team;
  strokes: Record<string, number>;
  /** Holes with a score entered. */
  thru: number;
  /** Total strokes over the holes played. */
  total: number;
  /** Strokes relative to par, counting only holes played. */
  toPar: number;
  frontToPar: number | null;
  backToPar: number | null;
};

/** Normalises an address for comparison; emails are case-insensitive in practice. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isOnTeam(team: Team, email: string | null | undefined): boolean {
  if (!email) return false;
  return team.playerEmails.includes(normalizeEmail(email));
}

export function findMyTeam(teams: Team[], email: string | null | undefined): Team | null {
  if (!email) return null;
  return teams.find((team) => isOnTeam(team, email)) ?? null;
}

/**
 * Builds one leaderboard row.
 *
 * Only holes with a score count toward the total, so a group thru 12 isn't
 * penalised against a group thru 18 — the `thru` column carries that context,
 * which is how a real leaderboard reads mid-round.
 */
export function buildRow(team: Team, score: TeamScore | undefined, holes: Hole[]): LeaderboardRow {
  const strokes = score?.strokes ?? {};
  const parByHole = new Map(holes.map((h) => [h.number, h.par]));

  let total = 0;
  let parPlayed = 0;
  let thru = 0;
  let frontStrokes = 0;
  let frontPar = 0;
  let backStrokes = 0;
  let backPar = 0;

  for (const hole of holes) {
    const value = strokes[String(hole.number)];
    if (typeof value !== "number" || value <= 0) continue;

    const par = parByHole.get(hole.number) ?? 4;
    total += value;
    parPlayed += par;
    thru += 1;

    if (hole.number <= 9) {
      frontStrokes += value;
      frontPar += par;
    } else {
      backStrokes += value;
      backPar += par;
    }
  }

  return {
    team,
    strokes,
    thru,
    total,
    toPar: total - parPlayed,
    frontToPar: frontPar ? frontStrokes - frontPar : null,
    backToPar: backPar ? backStrokes - backPar : null,
  };
}

export type LeaderboardScope = "overall" | "front" | "back";

/**
 * Sorts a leaderboard.
 *
 * Lowest to-par first; ties broken by holes completed, because a team level
 * through 15 is genuinely ahead of one level through 9. Teams with no scores at
 * all sink to the bottom rather than tying for the lead at even par.
 */
export function sortRows(rows: LeaderboardRow[], scope: LeaderboardScope): LeaderboardRow[] {
  const key = (row: LeaderboardRow) =>
    scope === "front" ? row.frontToPar : scope === "back" ? row.backToPar : row.toPar;

  return [...rows].sort((a, b) => {
    const aKey = key(a);
    const bKey = key(b);
    if (aKey === null && bKey === null) return a.team.name.localeCompare(b.team.name);
    if (aKey === null) return 1;
    if (bKey === null) return -1;
    if (aKey !== bKey) return aKey - bKey;
    if (a.thru !== b.thru) return b.thru - a.thru;
    return a.team.name.localeCompare(b.team.name);
  });
}

/** Position numbers with ties shown as "T2". */
export function positions(rows: LeaderboardRow[], scope: LeaderboardScope): string[] {
  const key = (row: LeaderboardRow) =>
    scope === "front" ? row.frontToPar : scope === "back" ? row.backToPar : row.toPar;

  const result: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (key(rows[i]) === null) {
      result.push("—");
      continue;
    }
    const tiedAbove = i > 0 && key(rows[i]) === key(rows[i - 1]) && rows[i].thru === rows[i - 1].thru;
    if (tiedAbove) {
      result.push(result[i - 1]);
      continue;
    }
    const tiedBelow =
      i < rows.length - 1 &&
      key(rows[i]) === key(rows[i + 1]) &&
      rows[i].thru === rows[i + 1].thru;
    result.push(`${tiedBelow ? "T" : ""}${i + 1}`);
  }
  return result;
}

/** Coerces a Firestore document into a Team. */
export function toTeam(doc: Record<string, unknown>): Team {
  const players = Array.isArray(doc.players)
    ? (doc.players as Record<string, unknown>[]).map((p) => ({
        name: String(p?.name ?? ""),
        email: p?.email ? String(p.email) : undefined,
      }))
    : [];

  const emails = Array.isArray(doc.playerEmails)
    ? (doc.playerEmails as unknown[]).map((e) => normalizeEmail(String(e)))
    : players.filter((p) => p.email).map((p) => normalizeEmail(p.email!));

  return {
    id: String(doc.id ?? ""),
    name: String(doc.name ?? "Unnamed team"),
    captain: doc.captain ? String(doc.captain) : undefined,
    players,
    playerEmails: emails,
    startingHole: typeof doc.startingHole === "number" ? doc.startingHole : undefined,
  };
}

/** Coerces a Firestore document into a TeamScore. */
export function toScore(doc: Record<string, unknown>): TeamScore {
  const raw = (doc.strokes ?? {}) as Record<string, unknown>;
  const strokes: Record<string, number> = {};
  for (const [hole, value] of Object.entries(raw)) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) strokes[hole] = n;
  }
  return {
    id: String(doc.id ?? ""),
    strokes,
    updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
  };
}
