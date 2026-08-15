"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteAnnouncement,
  listThreads,
  markThreadSeen,
  postAnnouncement,
  sendAdminMessage,
  type Announcement,
  type Audience,
  type ChatThread,
} from "../lib/chat";
import { useChatMessages } from "../lib/useChat";
import type { Team } from "../lib/data";

/**
 * The organizers' side: an inbox of team threads, and a composer for
 * announcements.
 *
 * The inbox lists every team, not only those who have written — starting a
 * conversation with a foursome shouldn't require them to message first. Threads
 * supply the last-message preview where one exists.
 */
export default function AdminMessages({
  teams,
  author,
  tokenFor,
  announcements,
}: {
  teams: Team[];
  author: string;
  tokenFor: () => Promise<string>;
  announcements: Announcement[];
}) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [openTeam, setOpenTeam] = useState<Team | null>(null);
  const [notice, setNotice] = useState("");

  const loadThreads = useCallback(async () => {
    try {
      setThreads(await listThreads(await tokenFor()));
    } catch {
      /* Inbox previews are a convenience; the threads themselves still open. */
    }
  }, [tokenFor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadThreads fetches first; the state update lands in a later tick
    void loadThreads();
    const timer = setInterval(() => void loadThreads(), 30_000);
    return () => clearInterval(timer);
  }, [loadThreads]);

  const byId = useMemo(() => {
    const map = new Map<string, ChatThread>();
    for (const t of threads) map.set(t.id, t);
    return map;
  }, [threads]);

  const rows = useMemo(
    () =>
      teams
        .map((team) => ({ team, thread: byId.get(team.id) ?? null }))
        // Teams waiting on a reply first, then most recent, then the rest.
        .sort((a, b) => (b.thread?.lastAt ?? "").localeCompare(a.thread?.lastAt ?? "")),
    [teams, byId]
  );

  if (openTeam) {
    return (
      <AdminThread
        team={openTeam}
        author={author}
        tokenFor={tokenFor}
        onBack={() => {
          setOpenTeam(null);
          void loadThreads();
        }}
      />
    );
  }

  return (
    <div className="admin-panel messages-panel">
      <Announcer
        teams={teams}
        author={author}
        tokenFor={tokenFor}
        onDone={(m) => {
          setNotice(m);
          void loadThreads();
        }}
      />

      {notice && (
        <p className="admin-notice" aria-live="polite">
          {notice}
        </p>
      )}

      <Posted announcements={announcements} tokenFor={tokenFor} onDeleted={setNotice} />

      <div className="panel-head">
        <div>
          <small>SUPPORT INBOX</small>
          <h2>Team threads</h2>
          <p>Private to each foursome. Nothing here is visible to other teams.</p>
        </div>
      </div>

      {rows.length === 0 && <p className="chat-empty">No teams yet.</p>}

      <div className="thread-list">
        {rows.map(({ team, thread }) => {
          const waiting = !!thread && thread.lastFrom === "team" && thread.lastAt > thread.adminSeenAt;
          return (
            <button key={team.id} className={waiting ? "waiting" : ""} onClick={() => setOpenTeam(team)}>
              <span>
                <b>
                  {team.name}
                  {waiting && <i className="unread-dot" aria-label="Waiting on a reply" />}
                </b>
                <small>{thread?.lastBody ? preview(thread) : "No messages yet"}</small>
              </span>
              <em>›</em>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Announcements already posted, newest first, with a way to take one down.
 *
 * Worth having: "rain delay" stops being true an hour later, and an organizer
 * needs to remove it without a console.
 */
function Posted({
  announcements,
  tokenFor,
  onDeleted,
}: {
  announcements: Announcement[];
  tokenFor: () => Promise<string>;
  onDeleted: (message: string) => void;
}) {
  const [removing, setRemoving] = useState<string | null>(null);
  const sorted = useMemo(
    () => [...announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [announcements]
  );

  if (sorted.length === 0) return null;

  return (
    <div className="posted-list">
      <small className="chat-label">POSTED TO ALL TEAMS</small>
      {sorted.map((item) => (
        <article className="announce-card" key={item.id}>
          {item.title && <b>{item.title}</b>}
          <p>{item.body}</p>
          <div className="posted-foot">
            <time dateTime={item.createdAt}>
              {new Date(item.createdAt).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </time>
            <button
              disabled={removing === item.id}
              onClick={async () => {
                setRemoving(item.id);
                try {
                  await deleteAnnouncement(item.id, await tokenFor());
                  onDeleted("Announcement removed.");
                } catch (err) {
                  onDeleted(err instanceof Error ? err.message : "Couldn't remove that.");
                } finally {
                  setRemoving(null);
                }
              }}
            >
              {removing === item.id ? "Removing…" : "Remove"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function preview(thread: ChatThread): string {
  const who = thread.lastFrom === "admin" ? "You: " : "";
  return `${who}${thread.lastBody}`.slice(0, 70);
}

// ─── One thread ──────────────────────────────────────────────────────────────

function AdminThread({
  team,
  author,
  tokenFor,
  onBack,
}: {
  team: Team;
  author: string;
  tokenFor: () => Promise<string>;
  onBack: () => void;
}) {
  const { messages, loading, error } = useChatMessages(team.id, tokenFor);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState("");

  // Opening the thread is what clears its "waiting" flag in the inbox.
  useEffect(() => {
    if (loading) return;
    void (async () => {
      await markThreadSeen(team.id, await tokenFor());
    })();
  }, [team.id, loading, tokenFor]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSendError("");
    try {
      await sendAdminMessage(team.id, team.name, draft, author, await tokenFor());
      setDraft("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-panel messages-panel">
      <div className="panel-head">
        <div>
          <small>THREAD</small>
          <h2>{team.name}</h2>
          <p>{team.players.join(" · ")}</p>
        </div>
        <button onClick={onBack}>← Inbox</button>
      </div>

      <div className="chat-scroll admin-chat-scroll">
        {loading && <p className="chat-empty">Loading…</p>}
        {!loading && error && (
          <p className="chat-empty chat-error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && messages.length === 0 && (
          <p className="chat-empty">Nothing yet. You can start the conversation.</p>
        )}
        {messages.map((m) => (
          <div className={`chat-bubble ${m.from === "admin" ? "from-admin" : "from-team"}`} key={m.id}>
            <span className="chat-from">{m.from === "admin" ? m.author || "You" : team.name}</span>
            <p>{m.body}</p>
            <time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
          </div>
        ))}
      </div>

      <form className="chat-compose" onSubmit={send}>
        <label htmlFor="admin-reply" className="sr-only">
          Reply to {team.name}
        </label>
        <textarea
          id="admin-reply"
          rows={1}
          maxLength={1000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Reply to ${team.name}…`}
        />
        <button disabled={busy || !draft.trim()}>{busy ? "…" : "Send"}</button>
      </form>
      {sendError && (
        <p className="chat-send-error" role="alert">
          {sendError}
        </p>
      )}
    </div>
  );
}

// ─── Announcements ───────────────────────────────────────────────────────────

function Announcer({
  teams,
  author,
  tokenFor,
  onDone,
}: {
  teams: Team[];
  author: string;
  tokenFor: () => Promise<string>;
  onDone: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [everyone, setEveryone] = useState(true);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const audience: Audience = everyone
        ? { kind: "all" }
        : {
            kind: "teams",
            teams: teams.filter((t) => picked.has(t.id)).map((t) => ({ id: t.id, name: t.name })),
          };
      const { delivered } = await postAnnouncement({ title, body }, audience, author, await tokenFor());
      setTitle("");
      setBody("");
      setPicked(new Set());
      onDone(
        everyone
          ? "Announcement posted to every team."
          : `Sent to ${delivered} ${delivered === 1 ? "team" : "teams"}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="announcer" onSubmit={submit}>
      <div className="panel-head">
        <div>
          <small>ANNOUNCE</small>
          <h2>Send a notice</h2>
          <p>
            Everyone sees it in the app. Nobody gets a push notification — for anything urgent,
            say so and expect to be called.
          </p>
        </div>
      </div>

      <label>
        <span>Heading (optional)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rain delay" maxLength={80} />
      </label>

      <label>
        <span>Message</span>
        <textarea
          rows={3}
          maxLength={1000}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Play is suspended for 30 minutes. Head back to the clubhouse."
        />
      </label>

      <div className="audience">
        <button type="button" className={everyone ? "on" : ""} onClick={() => setEveryone(true)}>
          All teams
        </button>
        <button type="button" className={!everyone ? "on" : ""} onClick={() => setEveryone(false)}>
          Pick teams
        </button>
      </div>

      {!everyone && (
        <div className="audience-picker">
          {teams.map((team) => (
            <button
              type="button"
              key={team.id}
              className={picked.has(team.id) ? "on" : ""}
              aria-pressed={picked.has(team.id)}
              onClick={() => toggle(team.id)}
            >
              {team.name}
            </button>
          ))}
          {teams.length === 0 && <p className="chat-empty">No teams to pick.</p>}
        </div>
      )}

      {/* Worth being explicit: a targeted notice is delivered into each team's
          private thread, because a filtered public collection would still be
          readable by every other team. */}
      <p className="announce-note">
        {everyone
          ? "Posted publicly to the Messages screen."
          : "Delivered privately into each selected team's thread."}
      </p>

      {error && <em role="alert">{error}</em>}

      <button className="primary" disabled={busy || !body.trim() || (!everyone && picked.size === 0)}>
        {busy ? "Sending…" : everyone ? "Post to all teams" : `Send to ${picked.size || 0}`}
      </button>
    </form>
  );
}
