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
import { CODE_WORDS } from "./code-words";
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
 * A team code a human can actually relay: `CEDAR-EAGLE-472`.
 *
 * This replaced `9673XSBQ`. Eight random characters carried 40 bits, but a
 * captain reading one to three people on a tee box mis-says it, and the people
 * typing it mis-hear it — the entropy was being spent on a threat that barely
 * exists while costing real usability on the one day it matters.
 *
 * Two words from a 128-word list plus three digits is 7 + 7 + ~10 = ~24 bits,
 * about 16.7 million codes. Against roughly ten live codes that's a one-in-1.7
 * million chance per guess, and the guesser has to hit Firestore for every
 * attempt from an origin that can be shut off. It is a deliberate trade of
 * ~16 bits for a code that survives being spoken.
 *
 * What backs it up rather than the entropy: an organizer can rotate a code
 * instantly from the admin screen, a stolen code reaches exactly one team's
 * scorecard, and an organizer can correct any score it touched. Turn on
 * Firebase App Check if you ever want the brute-force path closed properly.
 */
const CODE_DIGITS = 3;

/**
 * Uniform pick with rejection sampling.
 *
 * `value % list.length` alone would bias toward the start of the list whenever
 * the length doesn't divide 2^32 — which for 128 words it does, but the digits
 * and any future list edit would not. Doing it correctly costs nothing.
 */
function pick<T>(list: readonly T[]): T {
  const limit = Math.floor(0x1_0000_0000 / list.length) * list.length;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return list[value % list.length];
}

export function generateAccessCode(): string {
  const first = pick(CODE_WORDS);
  // TIMBER-TIMBER-340 is a valid code but reads like a bug, and someone
  // relaying it will assume they misheard and ask again.
  let second = pick(CODE_WORDS);
  while (second === first) second = pick(CODE_WORDS);

  const digits = Array.from({ length: CODE_DIGITS }, () =>
    pick(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])
  ).join("");
  return `${first}-${second}-${digits}`;
}

/**
 * Canonical lookup form: letters and digits only, upper-cased.
 *
 * The document id drops the hyphens so `cedar eagle 472`, `CEDAR-EAGLE-472` and
 * `cedareagle472` all resolve to the same team. People retype these from a text
 * message with whatever spacing they feel like.
 */
const normalizeCode = (code: string): string =>
  code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

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

/** Longest a team name may be; mirrored in the security rules. */
export const TEAM_NAME_MAX = 40;

export class TeamNameError extends Error {}

/**
 * Let a foursome rename itself.
 *
 * Deliberately not `updateTeam`: that one writes the roster and starting hole
 * too, which players are not allowed to change, and sending those fields would
 * be refused by the rules even when they are unchanged — the rule compares
 * affected keys, not values. The field mask here names `name` and `updatedAt`
 * and nothing else, which is exactly what the rule permits.
 */
export async function renameTeam(teamId: string, rawName: string): Promise<string> {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < 2) throw new TeamNameError("Give your team a name of at least two characters.");
  if (name.length > TEAM_NAME_MAX)
    throw new TeamNameError(`Keep it to ${TEAM_NAME_MAX} characters or fewer.`);

  const user = await ensureAnonymousUser();
  await fsPatchDoc(
    TEAMS_COLLECTION,
    teamId,
    { name, updatedAt: new Date().toISOString() },
    await user.getIdToken(),
    ["name", "updatedAt"]
  );
  return name;
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
  if (existing) await fsDeleteDoc(ACCESS_COLLECTION, normalizeCode(existing), token).catch(() => {});
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

  /*
   * Vanishingly unlikely at ten teams in a 16-million keyspace, but a collision
   * would silently repoint another team's code at this one — their captain's
   * link would start opening someone else's scorecard, and nothing would say
   * so. One read per attempt is a cheap way to make that impossible.
   */
  let code = generateAccessCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await fsGetDoc(ACCESS_COLLECTION, normalizeCode(code), token);
    if (!taken || taken.teamId === teamId) break;
    code = generateAccessCode();
  }

  // Two forms of the same code. `golf-access` is keyed by the canonical
  // letters-and-digits id so any spacing a player types resolves; the readable
  // form with hyphens is what the organizer shares and is stored alongside.
  await fsSetDoc(ACCESS_COLLECTION, normalizeCode(code), { teamId, code }, token);
  await fsSetDoc(TEAM_CODES_COLLECTION, teamId, { code, updatedAt: new Date().toISOString() }, token);

  if (previous && normalizeCode(previous) !== normalizeCode(code)) {
    await fsDeleteDoc(ACCESS_COLLECTION, normalizeCode(previous), token).catch(() => {});
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
