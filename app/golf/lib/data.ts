"use client";

/**
 * Everything the golf app stores, and the rules that govern it.
 *
 * This replaces the four server routes the original app ran on Cloudflare D1.
 * There is no server here — the site is a static export — so each function
 * below is a direct Firestore call, and the authorization that used to live in
 * `if (!await adminUser()) return 403` now lives in `firestore.rules`. Read
 * that file alongside this one; a check that exists only here is decoration.
 */

import { signInAnonymously, type User } from "firebase/auth";
import { getAuthInstance } from "../../lib/firebase";
import {
  fsAddDoc,
  fsDeleteDoc,
  fsGetDoc,
  fsListDocs,
  fsPatchDoc,
  fsSetDoc,
} from "../../lib/firestoreRest";
import {
  ACCESS_COLLECTION,
  ADMINS_COLLECTION,
  CLAIMS_COLLECTION,
  SCORES_COLLECTION,
  TEAM_CODES_COLLECTION,
  TEAMS_COLLECTION,
} from "./config";
import { HOLE_COUNT } from "./course";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Team = {
  id: string;
  name: string;
  startHole: number;
  players: string[];
  active: boolean;
};

/**
 * One document per team — it's a scramble, so a foursome records a single
 * score per hole.
 *
 * Holes are keyed `h1`…`h18` rather than `1`…`18` so that a single hole can be
 * patched by field path: Firestore requires backtick-quoting for path segments
 * that start with a digit, and quietly misbehaves if you get the escaping
 * wrong. `h5` needs no quoting at all.
 */
export type TeamScores = {
  id: string;
  strokes: Record<string, number>;
  updatedAt: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "admin" | "scorekeeper";
  addedBy: string;
  createdAt: string | null;
};

export const holeKey = (hole: number): string => `h${hole}`;

/** Strokes map → dense 18-slot array, 0 meaning "not played yet". */
export function strokesToArray(strokes: Record<string, number> | undefined): number[] {
  return Array.from({ length: HOLE_COUNT }, (_, i) => {
    const value = strokes?.[holeKey(i + 1)];
    return typeof value === "number" && value > 0 ? value : 0;
  });
}

// ─── Document mappers (for useGolfCollection) ────────────────────────────────

export function mapTeam(doc: Record<string, unknown>): Team {
  const players = Array.isArray(doc.players)
    ? (doc.players as unknown[]).filter((p): p is string => typeof p === "string")
    : [];
  return {
    id: String(doc.id ?? ""),
    name: typeof doc.name === "string" ? doc.name : "Unnamed team",
    startHole: typeof doc.startHole === "number" ? doc.startHole : 1,
    players,
    // Older documents predate the flag; absent means active.
    active: doc.active !== false,
  };
}

export function mapScores(doc: Record<string, unknown>): TeamScores {
  const raw = (doc.strokes ?? {}) as Record<string, unknown>;
  const strokes: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number" && value > 0) strokes[key] = value;
  }
  return {
    id: String(doc.id ?? ""),
    strokes,
    updatedAt: typeof doc.updatedAt === "string" ? doc.updatedAt : null,
  };
}

export function mapAdmin(doc: Record<string, unknown>): AdminUser {
  return {
    id: String(doc.id ?? ""),
    email: typeof doc.email === "string" ? doc.email : String(doc.id ?? ""),
    role: doc.role === "scorekeeper" ? "scorekeeper" : "admin",
    addedBy: typeof doc.addedBy === "string" ? doc.addedBy : "",
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : null,
  };
}

// ─── Access codes ────────────────────────────────────────────────────────────

/**
 * Eight characters from a 32-symbol alphabet — 40 bits, which is far past what
 * anyone will brute-force through Firestore's own rate limits for a one-day
 * neighborhood outing.
 *
 * I, O, 0 and 1 are absent so a code read aloud on a tee box or typed off a
 * text message can't be misread. 256 divides by 32 exactly, so the modulo
 * introduces no bias toward the start of the alphabet.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAccessCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

const normalizeCode = (code: string): string => code.trim().toUpperCase();

/** Local memory of which team this phone belongs to, so a reload stays joined. */
const STORED_CODE_KEY = "stonegate:team-code";

export function storedTeamCode(): string | null {
  try {
    return window.localStorage.getItem(STORED_CODE_KEY);
  } catch {
    return null;
  }
}

export function storeTeamCode(code: string): void {
  try {
    window.localStorage.setItem(STORED_CODE_KEY, code);
  } catch {
    /* Private browsing — the player will just re-enter the code next time. */
  }
}

export function clearTeamCode(): void {
  try {
    window.localStorage.removeItem(STORED_CODE_KEY);
  } catch {
    /* Nothing to clear. */
  }
}

// ─── Joining a team ──────────────────────────────────────────────────────────

export class TeamCodeError extends Error {}

/**
 * Redeem a team code.
 *
 * Three steps, and all three matter:
 *
 *   1. `get` the code document. Rules allow this to anyone — the code *is* the
 *      credential — but forbid listing, so codes can't be harvested.
 *   2. Sign in anonymously. This costs the player nothing (no email, no
 *      password, no prompt) but gives Firestore a stable uid to hang the
 *      claim on.
 *   3. Write the claim. Rules re-check the code against the access document
 *      server-side, so a forged claim naming someone else's team is rejected.
 *
 * After this, `golf-scores/{teamId}` accepts writes from this device for this
 * team and no other.
 */
export async function joinTeam(rawCode: string): Promise<{ team: Team; code: string }> {
  const code = normalizeCode(rawCode);
  if (code.length < 4) throw new TeamCodeError("Enter your team code.");

  const access = await fsGetDoc(ACCESS_COLLECTION, code);
  const teamId = access && typeof access.teamId === "string" ? access.teamId : null;
  if (!teamId) throw new TeamCodeError("That team code was not found.");

  const teamDoc = await fsGetDoc(TEAMS_COLLECTION, teamId);
  if (!teamDoc) throw new TeamCodeError("That team code was not found.");
  const team = mapTeam(teamDoc);
  if (!team.active) throw new TeamCodeError("That team is no longer in the outing.");

  const user = await ensureAnonymousUser();
  await fsSetDoc(
    CLAIMS_COLLECTION,
    user.uid,
    { teamId, code, joinedAt: new Date().toISOString() },
    await user.getIdToken()
  );

  storeTeamCode(code);
  return { team, code };
}

/**
 * The signed-in user, creating an anonymous one if needed.
 *
 * An organizer who is already signed in with their real account keeps it —
 * replacing it with an anonymous session would drop their admin rights
 * mid-round.
 */
export async function ensureAnonymousUser(): Promise<User> {
  const auth = getAuthInstance();
  if (auth.currentUser) return auth.currentUser;
  try {
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (err) {
    // Anonymous sign-in is off by default in a new Firebase project, and the
    // raw error names no cause. Without it every score write is refused, so
    // say which switch is missing rather than blaming the network.
    if ((err as { code?: string }).code === "auth/operation-not-allowed") {
      throw new TeamCodeError(
        "Scoring isn't switched on yet — Anonymous sign-in is disabled for this site. An organizer needs to enable it in the Firebase console."
      );
    }
    throw err;
  }
}

// ─── Scores ──────────────────────────────────────────────────────────────────

/**
 * Record one hole for one team.
 *
 * Patches a single field path so two phones scoring for the same foursome —
 * the captain on 7, someone catching up hole 5 — can't overwrite each other.
 */
export async function saveHoleScore(
  teamId: string,
  hole: number,
  strokes: number
): Promise<void> {
  if (!Number.isInteger(hole) || hole < 1 || hole > HOLE_COUNT) {
    throw new Error(`Hole ${hole} isn't on this course.`);
  }
  if (!Number.isInteger(strokes) || strokes < 1 || strokes > 15) {
    throw new Error("A hole score must be between 1 and 15.");
  }

  const user = await ensureAnonymousUser();
  await fsPatchDoc(
    SCORES_COLLECTION,
    teamId,
    { strokes: { [holeKey(hole)]: strokes }, updatedAt: new Date().toISOString() },
    await user.getIdToken(),
    [`strokes.${holeKey(hole)}`, "updatedAt"]
  );
}

// ─── Admin: teams ────────────────────────────────────────────────────────────

export type TeamInput = {
  name: string;
  startHole: number;
  players: string[];
};

function validateTeam(input: TeamInput): { name: string; startHole: number; players: string[] } {
  const name = input.name.trim();
  const players = input.players.map((p) => p.trim()).filter(Boolean).slice(0, 4);
  const startHole = Number(input.startHole);
  if (!name) throw new Error("Give the team a name.");
  if (!Number.isInteger(startHole) || startHole < 1 || startHole > HOLE_COUNT) {
    throw new Error(`Starting hole must be between 1 and ${HOLE_COUNT}.`);
  }
  if (players.length < 1) throw new Error("Add at least one player.");
  return { name, startHole, players };
}

export async function createTeam(input: TeamInput, token: string): Promise<{ id: string; code: string }> {
  const { name, startHole, players } = validateTeam(input);
  const now = new Date().toISOString();

  const id = await fsAddDoc(
    TEAMS_COLLECTION,
    { name, startHole, players, active: true, createdAt: now, updatedAt: now },
    token
  );
  const code = await assignAccessCode(id, token);
  return { id, code };
}

export async function updateTeam(id: string, input: TeamInput, token: string): Promise<void> {
  const { name, startHole, players } = validateTeam(input);
  await fsPatchDoc(
    TEAMS_COLLECTION,
    id,
    { name, startHole, players, updatedAt: new Date().toISOString() },
    token
  );
}

/**
 * Remove a team, its code and its scores.
 *
 * The access document goes first. If anything later fails, the worst outcome
 * is an orphaned team nobody can score for — rather than a live code still
 * pointing at a half-deleted team.
 */
export async function deleteTeam(id: string, token: string): Promise<void> {
  const existing = await readTeamCode(id, token);
  if (existing) await fsDeleteDoc(ACCESS_COLLECTION, existing, token).catch(() => {});
  await fsDeleteDoc(TEAM_CODES_COLLECTION, id, token).catch(() => {});
  await fsDeleteDoc(SCORES_COLLECTION, id, token).catch(() => {});
  await fsDeleteDoc(TEAMS_COLLECTION, id, token);
}

/** The team's current code, for the organizer's share link. Admin-only by rule. */
export async function readTeamCode(teamId: string, token: string): Promise<string | null> {
  const doc = await fsGetDoc(TEAM_CODES_COLLECTION, teamId, token);
  return doc && typeof doc.code === "string" ? doc.code : null;
}

/**
 * Issue a fresh code, retiring the old one.
 *
 * Writes the new access document before deleting the old, so a player who taps
 * their link mid-rotation gets one code or the other, never a dead end.
 */
export async function assignAccessCode(teamId: string, token: string): Promise<string> {
  const previous = await readTeamCode(teamId, token);
  const code = generateAccessCode();

  await fsSetDoc(ACCESS_COLLECTION, code, { teamId }, token);
  await fsSetDoc(TEAM_CODES_COLLECTION, teamId, { code, updatedAt: new Date().toISOString() }, token);
  if (previous && previous !== code) {
    await fsDeleteDoc(ACCESS_COLLECTION, previous, token).catch(() => {});
  }
  return code;
}

// ─── Admin: organizers ───────────────────────────────────────────────────────

export async function listAdmins(token: string): Promise<AdminUser[]> {
  const docs = await fsListDocs(ADMINS_COLLECTION, token);
  return docs.map(mapAdmin);
}

/**
 * Grant admin access. Keyed by lower-cased email so the document id is exactly
 * what `firestore.rules` looks up — the rule does `exists(.../golf-admins/` +
 * the signed-in address lower-cased`)`, and a capitalised id would silently
 * never match.
 */
export async function addAdmin(
  email: string,
  role: "admin" | "scorekeeper",
  addedBy: string,
  token: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  await fsSetDoc(
    ADMINS_COLLECTION,
    normalized,
    { email: normalized, role, addedBy, createdAt: new Date().toISOString() },
    token
  );
}

export async function removeAdmin(email: string, token: string): Promise<void> {
  await fsDeleteDoc(ADMINS_COLLECTION, email.trim().toLowerCase(), token);
}
