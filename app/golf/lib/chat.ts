"use client";

/**
 * Support chat and announcements.
 *
 * Two shapes, and the difference is deliberate:
 *
 *   golf-chats/{teamId}/messages   private to one team and the organizers.
 *                                  Access is decided by the path, so a player's
 *                                  claim must equal the {teamId} segment — see
 *                                  firestore.rules.
 *   golf-announcements             said to everyone, readable by anyone, like
 *                                  the leaderboard.
 *
 * Anything aimed at *some* teams is delivered as an admin message into each of
 * those teams' threads rather than as a filtered announcement. Firestore rules
 * can't filter the rows a query returns, so a "targeted announcement" in one
 * public collection would be readable by every team regardless of who it named.
 * Writing it into the threads makes the targeting real.
 */

import { ensureAnonymousUser } from "./data";
import {
  fsAddDoc,
  fsGetDoc,
  fsListDocs,
  fsPatchDoc,
} from "../../lib/firestoreRest";

export const CHATS_COLLECTION = "golf-chats";
export const ANNOUNCEMENTS_COLLECTION = "golf-announcements";

const MAX_BODY = 1000;

export type ChatMessage = {
  id: string;
  body: string;
  from: "team" | "admin";
  author: string;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  teamName: string;
  lastBody: string;
  lastFrom: "team" | "admin" | "";
  lastAt: string;
  /** When an organizer last opened this thread — drives the admin unread dot. */
  adminSeenAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: string;
};

export const messagesPath = (teamId: string) => `${CHATS_COLLECTION}/${teamId}/messages`;

// ─── Mappers ─────────────────────────────────────────────────────────────────

export function mapMessage(doc: Record<string, unknown>): ChatMessage {
  return {
    id: String(doc.id ?? ""),
    body: typeof doc.body === "string" ? doc.body : "",
    from: doc.from === "admin" ? "admin" : "team",
    author: typeof doc.author === "string" ? doc.author : "",
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : "",
  };
}

export function mapThread(doc: Record<string, unknown>): ChatThread {
  return {
    id: String(doc.id ?? ""),
    teamName: typeof doc.teamName === "string" ? doc.teamName : "",
    lastBody: typeof doc.lastBody === "string" ? doc.lastBody : "",
    lastFrom: doc.lastFrom === "admin" ? "admin" : doc.lastFrom === "team" ? "team" : "",
    lastAt: typeof doc.lastAt === "string" ? doc.lastAt : "",
    adminSeenAt: typeof doc.adminSeenAt === "string" ? doc.adminSeenAt : "",
  };
}

export function mapAnnouncement(doc: Record<string, unknown>): Announcement {
  return {
    id: String(doc.id ?? ""),
    title: typeof doc.title === "string" ? doc.title : "",
    body: typeof doc.body === "string" ? doc.body : "",
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : "",
    author: typeof doc.author === "string" ? doc.author : "",
  };
}

function clean(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Write a message first.");
  if (trimmed.length > MAX_BODY) {
    throw new Error(`Keep it under ${MAX_BODY} characters — that's ${trimmed.length}.`);
  }
  return trimmed;
}

// ─── Sending ─────────────────────────────────────────────────────────────────

/**
 * Send as a player.
 *
 * The thread summary is updated after the message rather than before: if the
 * summary write fails, the worst outcome is an organizer's inbox preview being
 * stale, not a message that was never delivered.
 */
export async function sendTeamMessage(
  teamId: string,
  teamName: string,
  body: string
): Promise<void> {
  const text = clean(body);
  const user = await ensureAnonymousUser();
  const token = await user.getIdToken();
  const createdAt = new Date().toISOString();

  await fsAddDoc(messagesPath(teamId), { body: text, from: "team", author: teamName, createdAt }, token);
  await touchThread(teamId, { teamName, lastBody: text, lastFrom: "team", lastAt: createdAt }, token).catch(
    () => {}
  );
}

/** Send as an organizer, into one team's thread. */
export async function sendAdminMessage(
  teamId: string,
  teamName: string,
  body: string,
  author: string,
  token: string
): Promise<void> {
  const text = clean(body);
  const createdAt = new Date().toISOString();

  await fsAddDoc(messagesPath(teamId), { body: text, from: "admin", author, createdAt }, token);
  await touchThread(teamId, { teamName, lastBody: text, lastFrom: "admin", lastAt: createdAt }, token).catch(
    () => {}
  );
}

async function touchThread(
  teamId: string,
  data: Record<string, unknown>,
  token: string
): Promise<void> {
  await fsPatchDoc(CHATS_COLLECTION, teamId, data, token, Object.keys(data));
}

/** Mark a thread as read by organizers, clearing its unread dot in the inbox. */
export async function markThreadSeen(teamId: string, token: string): Promise<void> {
  await fsPatchDoc(
    CHATS_COLLECTION,
    teamId,
    { adminSeenAt: new Date().toISOString() },
    token,
    ["adminSeenAt"]
  ).catch(() => {});
}

export async function listThreads(token: string): Promise<ChatThread[]> {
  const docs = await fsListDocs(CHATS_COLLECTION, token);
  return docs.map(mapThread).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export async function readThread(teamId: string, token?: string): Promise<ChatThread | null> {
  const doc = await fsGetDoc(CHATS_COLLECTION, teamId, token);
  return doc ? mapThread(doc) : null;
}

// ─── Announcements ───────────────────────────────────────────────────────────

export type Audience = { kind: "all" } | { kind: "teams"; teams: { id: string; name: string }[] };

/**
 * Post an announcement.
 *
 * "Everyone" writes one public document. "Some teams" writes an admin message
 * into each of those threads instead — see the note at the top of this file for
 * why a filtered public collection would not actually be private.
 */
export async function postAnnouncement(
  { title, body }: { title: string; body: string },
  audience: Audience,
  author: string,
  token: string
): Promise<{ delivered: number }> {
  const text = clean(body);
  const heading = title.trim();

  if (audience.kind === "all") {
    await fsAddDoc(
      ANNOUNCEMENTS_COLLECTION,
      { title: heading, body: text, author, createdAt: new Date().toISOString() },
      token
    );
    return { delivered: 0 };
  }

  if (audience.teams.length === 0) throw new Error("Pick at least one team.");

  // Sequential rather than parallel: a handful of teams at most, and a partial
  // failure part-way through is easier to reason about than a scattered one.
  let delivered = 0;
  for (const team of audience.teams) {
    const line = heading ? `${heading}\n\n${text}` : text;
    await sendAdminMessage(team.id, team.name, line, author, token);
    delivered += 1;
  }
  return { delivered };
}

export async function deleteAnnouncement(id: string, token: string): Promise<void> {
  const { fsDeleteDoc } = await import("../../lib/firestoreRest");
  await fsDeleteDoc(ANNOUNCEMENTS_COLLECTION, id, token);
}

// ─── Unread tracking (per device) ────────────────────────────────────────────

/**
 * What this phone has already seen, kept locally.
 *
 * Deliberately not stored in Firestore: unread state is per-device, and four
 * team-mates sharing one code would otherwise clear each other's badges.
 */
const seenKey = (teamId: string) => `stonegate:chat-seen:${teamId}`;
const ANNOUNCE_SEEN_KEY = "stonegate:announce-seen";

export function lastSeen(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function markSeen(key: string, at: string): void {
  try {
    window.localStorage.setItem(key, at);
  } catch {
    /* Private browsing — badges will reappear next session. */
  }
}

export const teamSeenKey = seenKey;
export const announcementsSeenKey = ANNOUNCE_SEEN_KEY;

/** Newest ISO timestamp in a list, or "" when empty. */
export function newestAt(items: { createdAt: string }[]): string {
  return items.reduce((max, i) => (i.createdAt > max ? i.createdAt : max), "");
}

export function unreadCount(items: { createdAt: string }[], seenAt: string): number {
  return items.filter((i) => i.createdAt > seenAt).length;
}
