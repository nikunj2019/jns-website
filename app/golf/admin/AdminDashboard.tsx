"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  ADMINS_COLLECTION,
  EVENT,
  GOLF_OWNERS,
  SCORES_COLLECTION,
  TEAMS_COLLECTION,
} from "../lib/config";
import { COURSE_PAR, formatToPar, HOLE_COUNT, HOLES } from "../lib/course";
import {
  addAdmin,
  assignAccessCode,
  createTeam,
  deleteTeam,
  mapAdmin,
  mapScores,
  mapTeam,
  readTeamCode,
  removeAdmin,
  saveHoleScore,
  strokesToArray,
  updateTeam,
  type AdminUser,
  type Team,
  type TeamScores,
} from "../lib/data";
import AdminMessages from "./AdminMessages";
import { ANNOUNCEMENTS_COLLECTION, mapAnnouncement, type Announcement } from "../lib/chat";
import { idToken, useSignOut, type AdminRole } from "../lib/useAuth";
import { useGolfCollection } from "../lib/useGolfCollection";

type Tab = "overview" | "teams" | "scores" | "messages" | "admins";

type TeamDraft = { id: string | null; name: string; startHole: number; players: string[] };

const emptyDraft = (): TeamDraft => ({ id: null, name: "", startHole: 1, players: ["", "", "", ""] });

type Confirming =
  | { kind: "delete"; team: Team }
  | { kind: "regenerate"; team: Team }
  | { kind: "removeAdmin"; admin: AdminUser };

export default function AdminDashboard({
  user,
  email,
  role,
  lookupError,
}: {
  user: User;
  email: string;
  role: AdminRole;
  lookupError?: string | null;
}) {
  const owner = role === "owner";
  const signOut = useSignOut();

  const teamsState = useGolfCollection<Team>(TEAMS_COLLECTION, mapTeam);
  const scoresState = useGolfCollection<TeamScores>(SCORES_COLLECTION, mapScores);
  const adminsState = useGolfCollection<AdminUser>(ADMINS_COLLECTION, mapAdmin);
  const announcementsState = useGolfCollection<Announcement>(
    ANNOUNCEMENTS_COLLECTION,
    mapAnnouncement
  );

  // Chat reads are authenticated, so they need a live token rather than the
  // anonymous path the public collections use.
  const tokenFor = useCallback(() => idToken(user), [user]);

  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<TeamDraft | null>(null);
  const [confirming, setConfirming] = useState<Confirming | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  // "…" and "no code at all" are different states, and a team without a code
  // is unusable rather than merely still loading.
  const [codesLoaded, setCodesLoaded] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "scorekeeper">("admin");
  const [scoreTeam, setScoreTeam] = useState<string | null>(null);
  const [selectedHole, setSelectedHole] = useState(1);
  const [saveState, setSaveState] = useState("");

  const teams = useMemo(
    () => teamsState.docs.filter((t) => t.active).sort((a, b) => a.name.localeCompare(b.name)),
    [teamsState.docs]
  );

  const strokesById = useMemo(() => {
    const byId = new Map<string, number[]>();
    for (const doc of scoresState.docs) byId.set(doc.id, strokesToArray(doc.strokes));
    return byId;
  }, [scoresState.docs]);

  const stats = useMemo(
    () =>
      teams.map((team) => {
        const strokes = strokesById.get(team.id) ?? strokesToArray({});
        let played = 0;
        let toPar = 0;
        strokes.forEach((value, index) => {
          if (value > 0) {
            played += 1;
            toPar += value - HOLES[index].par;
          }
        });
        return { team, strokes, played, toPar };
      }),
    [teams, strokesById]
  );

  /**
   * Access codes live in an admin-only collection, one document per team, so
   * they never ride along on the world-readable team document. That means one
   * extra read each — cheap, and it keeps codes off the public leaderboard.
   */
  const loadCodes = useCallback(async () => {
    if (teams.length === 0) return;
    try {
      const token = await idToken(user);
      const entries = await Promise.all(
        teams.map(async (team) => [team.id, await readTeamCode(team.id, token)] as const)
      );
      setCodes((prev) => ({
        ...prev,
        ...(Object.fromEntries(entries.filter(([, code]) => code)) as Record<string, string>),
      }));
      setCodesLoaded(true);
    } catch {
      /* Codes are a convenience; the rest of the screen still works. */
    }
  }, [teams, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches over the network first; the state update lands in a later tick
    void loadCodes();
  }, [loadCodes]);

  const run = useCallback(
    async (message: string, action: (token: string) => Promise<void>) => {
      setBusy(true);
      setNotice("");
      try {
        await action(await idToken(user));
        setNotice(message);
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "That didn't work. Try again.");
      } finally {
        setBusy(false);
        setConfirming(null);
      }
    },
    [user]
  );

  // ── Team actions ───────────────────────────────────────────────────────────

  const saveTeam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const input = { name: draft.name, startHole: draft.startHole, players: draft.players };
    await run(draft.id ? "Team updated." : "Team created — its private link is ready.", async (token) => {
      if (draft.id) {
        await updateTeam(draft.id, input, token);
      } else {
        /*
         * createTeam already generates the code. Keep it.
         *
         * This used to discard the return value and rely on loadCodes(), which
         * closes over `teams` — and `teams` hasn't updated yet, because the
         * Firestore listener hasn't delivered the new team. So the card showed
         * "…" until the roster refreshed, up to 20s on the polling path, and
         * the obvious move was to hit "New code" and rotate a code that was
         * already perfectly good.
         */
        const { id, code } = await createTeam(input, token);
        setCodes((prev) => ({ ...prev, [id]: code }));
      }
      setDraft(null);
      await loadCodes();
    });
  };

  const doDelete = (team: Team) =>
    run(`${team.name} was deleted.`, async (token) => {
      await deleteTeam(team.id, token);
      setCodes((prev) => {
        const next = { ...prev };
        delete next[team.id];
        return next;
      });
    });

  const doRegenerate = (team: Team) =>
    run("A new private team link was generated.", async (token) => {
      const code = await assignAccessCode(team.id, token);
      setCodes((prev) => ({ ...prev, [team.id]: code }));
    });

  const teamLink = (team: Team): string | null => {
    const code = codes[team.id];
    return code ? `${window.location.origin}/golf/?code=${code}` : null;
  };

  /** The message a captain receives, wherever it's sent from. */
  const inviteText = (team: Team, link: string) =>
    `${team.name} — your scorecard for the ${EVENT.name} at ${EVENT.venue.name}. ` +
    `Open this on your phone and it'll remember your team:\n${link}`;

  const copyLink = async (team: Team) => {
    const link = teamLink(team);
    if (!link) {
      setNotice("No code loaded for that team yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setNotice(`Copied ${team.name}'s private link.`);
    } catch {
      // Clipboard access is denied in plenty of in-app browsers; showing the
      // link is more useful than an error nobody can act on.
      setNotice(link);
    }
  };

  /**
   * Hand the link to whatever the organizer already uses to reach people.
   *
   * Deliberately not an email or SMS service. Sending on the site's behalf
   * needs a server and a paid provider (SendGrid, Twilio); the share sheet is
   * free, needs no backend, and puts Messages, Mail and WhatsApp one tap away
   * on the phone the organizer is already holding. Desktop has no share sheet,
   * so it falls back to the mail and SMS links below.
   */
  const shareLink = async (team: Team) => {
    const link = teamLink(team);
    if (!link) {
      setNotice("No code loaded for that team yet.");
      return;
    }
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${team.name} — ${EVENT.name}`, text: inviteText(team, link), url: link });
        return;
      } catch (err) {
        // A cancelled share sheet is not a failure worth reporting.
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    await copyLink(team);
  };

  // ── Score corrections ──────────────────────────────────────────────────────

  const currentStrokes =
    (scoreTeam ? strokesById.get(scoreTeam)?.[selectedHole - 1] : 0) || HOLES[selectedHole - 1].par;

  const correctScore = async (value: number) => {
    if (!scoreTeam) return;
    setSaveState("Saving…");
    try {
      await saveHoleScore(scoreTeam, selectedHole, value);
      setSaveState("Saved just now");
    } catch {
      setSaveState("Could not save — try again");
    }
  };

  // ── Access ─────────────────────────────────────────────────────────────────

  const grantAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    await run(`${newEmail.trim().toLowerCase()} can now administer the outing.`, async (token) => {
      await addAdmin(newEmail, newRole, email, token);
      setNewEmail("");
    });
  };

  const scored = stats.reduce((total, row) => total + row.played, 0);
  const possible = Math.max(1, teams.length * HOLE_COUNT);
  const active = stats.filter((row) => row.played > 0).length;

  const loading = teamsState.loading || scoresState.loading;
  const error = teamsState.error ?? scoresState.error;

  const titles: Record<Tab, string> = {
    overview: "Tournament dashboard",
    teams: "Teams & players",
    scores: "Live scoring",
    messages: "Messages",
    admins: "Access & roles",
  };

  return (
    <main className="admin-shell">
      <aside className="admin-side">
        <div className="admin-event">
          <span>S</span>
          <div>
            <small>STONEGATE</small>
            <b>Golf Outing</b>
          </div>
        </div>
        <nav aria-label="Admin sections">
          {(
            [
              ["overview", "Dashboard", "Live event status"],
              ["teams", "Teams", "Players and private links"],
              ["scores", "Scoring", "Review and correct"],
              ["messages", "Messages", "Announcements and support"],
              ["admins", "Access", "Administrators and roles"],
            ] as const
          ).map(([key, label, hint]) => (
            <button
              key={key}
              className={tab === key ? "on" : ""}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => setTab(key)}
            >
              <i />
              <span>
                <b>{label}</b>
                <small>{hint}</small>
              </span>
            </button>
          ))}
        </nav>
        <a className="view-app" href="/golf/">
          ← View live app
        </a>
        <div className="admin-powered">
          <small>TECHNOLOGY BY</small>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized */}
          <img src="/golf/jns-logo.png" alt="JNS" width={260} height={130} />
          <span>Smart Solutions, Built for You.</span>
        </div>
      </aside>

      <div className="admin-main">
        <header>
          <div>
            <small>EVENT ADMINISTRATION</small>
            <h1>{titles[tab]}</h1>
          </div>
          <div className="admin-user">
            <span>{email[0]?.toUpperCase()}</span>
            <div>
              <b>{email}</b>
              <small>{owner ? "Owner" : role === "scorekeeper" ? "Scorekeeper" : "Administrator"}</small>
            </div>
            <button onClick={() => void signOut()}>Sign out</button>
          </div>
        </header>

        <section>
          {loading ? (
            <div className="admin-state">
              <i />
              <b>Loading outing data…</b>
            </div>
          ) : (
            <>
              {lookupError && (
                <div className="admin-state error" role="alert">
                  <b>Your access couldn&rsquo;t be verified.</b>
                  <p>
                    Reading the <code>golf-admins</code> list failed: {lookupError}. You can work
                    normally — every save is re-checked by the security rules regardless — but the
                    Access tab will look empty, and anyone you add here won&rsquo;t be able to sign
                    in until the rules allow reading that collection. Re-publish{" "}
                    <code>firestore.rules</code> to fix it.
                  </p>
                </div>
              )}

              {error && (
                <div className="admin-state error">
                  <b>{error}</b>
                </div>
              )}
              {notice && (
                <p className="admin-notice" aria-live="polite">
                  {notice}
                </p>
              )}

              {confirming && (
                <div className="admin-confirm" role="alertdialog" aria-label="Confirm action">
                  <b>
                    {confirming.kind === "delete" &&
                      `Delete ${confirming.team.name}, its players and all its scores? This cannot be undone.`}
                    {confirming.kind === "regenerate" &&
                      `Generate a new code for ${confirming.team.name}? Their current link stops working immediately.`}
                    {confirming.kind === "removeAdmin" &&
                      `Remove admin access for ${confirming.admin.email}?`}
                  </b>
                  <div>
                    <button onClick={() => setConfirming(null)}>Cancel</button>
                    <button
                      className="danger"
                      disabled={busy}
                      onClick={() => {
                        if (confirming.kind === "delete") void doDelete(confirming.team);
                        else if (confirming.kind === "regenerate") void doRegenerate(confirming.team);
                        else
                          void run(`${confirming.admin.email} was removed.`, (token) =>
                            removeAdmin(confirming.admin.email, token)
                          );
                      }}
                    >
                      {busy ? "Working…" : "Yes, continue"}
                    </button>
                  </div>
                </div>
              )}

              {tab === "overview" && (
                <>
                  <div className="admin-livebar">
                    <span>
                      <i />
                      SCORING OPEN
                    </span>
                    <div>
                      <b>{EVENT.venue.name}</b>
                      <small>
                        {teams.length} teams · Foursome scramble · Par {COURSE_PAR}
                      </small>
                    </div>
                    <a href="/golf/">Open player view ↗</a>
                  </div>

                  <div className="admin-cards">
                    <article>
                      <small>SCORES ENTERED</small>
                      <b>{scored}</b>
                      <span>of {possible} possible scores</span>
                    </article>
                    <article>
                      <small>TEAMS ACTIVE</small>
                      <b>
                        {active}
                        <em>/{teams.length}</em>
                      </b>
                      <span>teams currently scoring</span>
                    </article>
                    <article>
                      <small>COMPLETION</small>
                      <b>{Math.round((scored / possible) * 100)}%</b>
                      <span>live tournament progress</span>
                    </article>
                  </div>

                  <div className="admin-panel">
                    <div className="panel-head">
                      <div>
                        <small>LIVE TEAM STATUS</small>
                        <h2>Scoring progress</h2>
                      </div>
                      <button onClick={() => setTab("teams")}>Manage teams</button>
                    </div>
                    {stats.length ? (
                      stats.map((row, index) => (
                        <div className="team-status" key={row.team.id}>
                          <strong>{index + 1}</strong>
                          <span>
                            <b>{row.team.name}</b>
                            <small>
                              Start {row.team.startHole} · {row.team.players[0] || "No captain"}
                            </small>
                          </span>
                          <div className="progress">
                            <i style={{ width: `${(row.played / HOLE_COUNT) * 100}%` }} />
                          </div>
                          <em>
                            {row.played}/{HOLE_COUNT}
                          </em>
                          <mark>{row.played ? formatToPar(row.toPar) : "—"}</mark>
                        </div>
                      ))
                    ) : (
                      <div className="empty-admin">
                        <b>No teams yet</b>
                        <p>Create your first foursome to generate its private scoring link.</p>
                        <button
                          onClick={() => {
                            setDraft(emptyDraft());
                            setTab("teams");
                          }}
                        >
                          Create team
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {tab === "teams" && (
                <div className="admin-panel teams-panel">
                  <div className="panel-head">
                    <div>
                      <small>EVENT ROSTER</small>
                      <h2>
                        {teams.length} teams ·{" "}
                        {teams.reduce((total, team) => total + team.players.length, 0)} players
                      </h2>
                      <p>Create foursomes and share each private scoring link with its captain.</p>
                    </div>
                    <button onClick={() => setDraft(emptyDraft())}>+ New team</button>
                  </div>

                  <div className="team-admin-list">
                    {stats.map((row) => (
                      <article key={row.team.id}>
                        <div className="team-card-head">
                          <span>
                            <small>START HOLE</small>
                            <b>{row.team.startHole}</b>
                          </span>
                          <div>
                            <h3>{row.team.name}</h3>
                            <p>{row.team.players.join(" · ")}</p>
                          </div>
                          <mark>
                            {row.played}/{HOLE_COUNT} scored
                          </mark>
                        </div>
                        <div className="team-code">
                          <span>
                            <small>PRIVATE TEAM CODE</small>
                            <b>{codes[row.team.id] ?? (codesLoaded ? "Not generated" : "…")}</b>
                          </span>
                          <button onClick={() => void shareLink(row.team)}>Share link</button>
                        </div>
                        <div className="team-send">
                          <button onClick={() => void copyLink(row.team)}>Copy</button>
                          <a
                            href={`mailto:?subject=${encodeURIComponent(
                              `${row.team.name} — ${EVENT.name}`
                            )}&body=${encodeURIComponent(
                              inviteText(row.team, teamLink(row.team) ?? "")
                            )}`}
                          >
                            Email
                          </a>
                          {/* `?body=` is the form both iOS and Android accept. */}
                          <a
                            href={`sms:?body=${encodeURIComponent(
                              inviteText(row.team, teamLink(row.team) ?? "")
                            )}`}
                          >
                            Text
                          </a>
                        </div>
                        <div className="team-actions">
                          <button
                            onClick={() =>
                              setDraft({
                                id: row.team.id,
                                name: row.team.name,
                                startHole: row.team.startHole,
                                players: [...row.team.players, "", "", ""].slice(0, 4),
                              })
                            }
                          >
                            Edit roster
                          </button>
                          <button onClick={() => setConfirming({ kind: "regenerate", team: row.team })}>
                            {codes[row.team.id] ? "New code" : "Generate code"}
                          </button>
                          <button
                            className="danger"
                            onClick={() => setConfirming({ kind: "delete", team: row.team })}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  {draft && (
                    <form className="team-editor" onSubmit={saveTeam}>
                      <div className="team-editor-head">
                        <div>
                          <small>{draft.id ? "EDIT FOURSOME" : "NEW FOURSOME"}</small>
                          <h2>{draft.id ? draft.name : "Create a team"}</h2>
                        </div>
                        <button type="button" aria-label="Close" onClick={() => setDraft(null)}>
                          ×
                        </button>
                      </div>
                      <label>
                        <span>Team name</span>
                        <input
                          required
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          placeholder="Example: Fairway Legends"
                        />
                      </label>
                      <label>
                        <span>Starting hole</span>
                        <select
                          value={draft.startHole}
                          onChange={(e) => setDraft({ ...draft, startHole: Number(e.target.value) })}
                        >
                          {Array.from({ length: HOLE_COUNT }, (_, i) => (
                            <option key={i} value={i + 1}>
                              Hole {i + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                      <fieldset>
                        <legend>Players</legend>
                        {draft.players.map((player, index) => (
                          <label key={index}>
                            <span>{index === 0 ? "Captain" : `Player ${index + 1}`}</span>
                            <input
                              required={index === 0}
                              value={player}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  players: draft.players.map((p, j) => (j === index ? e.target.value : p)),
                                })
                              }
                              placeholder={index === 0 ? "Captain name" : "Player name (optional)"}
                            />
                          </label>
                        ))}
                      </fieldset>
                      <button className="primary" disabled={busy}>
                        {busy ? "Saving…" : draft.id ? "Save changes" : "Create team & link"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {tab === "scores" && (
                <div className="admin-panel scoring-panel">
                  <div className="panel-head">
                    <div>
                      <small>LIVE SCORE REVIEW</small>
                      <h2>Teams &amp; hole scores</h2>
                      <p>Select a team to correct its scramble score.</p>
                    </div>
                  </div>

                  <div className="score-team-list">
                    {stats.map((row) => (
                      <button
                        className={scoreTeam === row.team.id ? "selected" : ""}
                        key={row.team.id}
                        onClick={() => {
                          setScoreTeam(row.team.id);
                          setSelectedHole(row.team.startHole);
                          setSaveState("");
                        }}
                      >
                        <span>
                          <b>{row.team.name}</b>
                          <small>{row.team.players.join(" · ")}</small>
                        </span>
                        <em>
                          {row.played}/{HOLE_COUNT}
                        </em>
                        <mark>{row.played ? formatToPar(row.toPar) : "—"}</mark>
                      </button>
                    ))}
                  </div>

                  {scoreTeam && (
                    <div className="score-editor">
                      <div>
                        <small>SELECT A HOLE</small>
                        <div className="hole-grid">
                          {Array.from({ length: HOLE_COUNT }, (_, i) => {
                            const value = strokesById.get(scoreTeam)?.[i] ?? 0;
                            return (
                              <button
                                className={selectedHole === i + 1 ? "on" : value ? "done" : ""}
                                key={i}
                                onClick={() => {
                                  setSelectedHole(i + 1);
                                  setSaveState("");
                                }}
                              >
                                <small>{i + 1}</small>
                                <b>{value || "—"}</b>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="score-adjust">
                        <small>
                          HOLE {selectedHole} · PAR {HOLES[selectedHole - 1].par}
                        </small>
                        <div>
                          <button
                            aria-label="One fewer stroke"
                            onClick={() => void correctScore(Math.max(1, currentStrokes - 1))}
                          >
                            −
                          </button>
                          <b>{currentStrokes}</b>
                          <button
                            aria-label="One more stroke"
                            onClick={() => void correctScore(Math.min(15, currentStrokes + 1))}
                          >
                            +
                          </button>
                        </div>
                        <p aria-live="polite">{saveState || "Changes save immediately"}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "messages" && (
                <AdminMessages
                  teams={teams}
                  author={email}
                  tokenFor={tokenFor}
                  announcements={announcementsState.docs}
                />
              )}

              {tab === "admins" && (
                <div className="admin-panel access-panel">
                  <div className="panel-head">
                    <div>
                      <small>SECURE ACCESS</small>
                      <h2>Administrators</h2>
                      <p>Manage who can access this control center.</p>
                    </div>
                  </div>

                  {owner && (
                    <form className="invite" onSubmit={grantAccess}>
                      <label>
                        <span>Email address</span>
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="admin@example.com"
                        />
                      </label>
                      <label>
                        <span>Role</span>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as "admin" | "scorekeeper")}
                        >
                          <option value="admin">Administrator</option>
                          <option value="scorekeeper">Scorekeeper</option>
                        </select>
                      </label>
                      <button disabled={busy}>Grant access</button>
                    </form>
                  )}

                  <div className="admin-list">
                    {GOLF_OWNERS.map((ownerEmail) => (
                      <div key={ownerEmail}>
                        <span className="avatar">{ownerEmail[0].toUpperCase()}</span>
                        <span>
                          <b>{ownerEmail}</b>
                          <small>Owner · Active</small>
                        </span>
                        <em>Protected</em>
                      </div>
                    ))}
                    {adminsState.docs
                      .filter((a) => !GOLF_OWNERS.includes(a.email.toLowerCase()))
                      .map((admin) => (
                        <div key={admin.id}>
                          <span className="avatar">{admin.email[0].toUpperCase()}</span>
                          <span>
                            <b>{admin.email}</b>
                            <small>{admin.role === "scorekeeper" ? "Scorekeeper" : "Administrator"}</small>
                          </span>
                          {owner ? (
                            <button onClick={() => setConfirming({ kind: "removeAdmin", admin })}>
                              Remove
                            </button>
                          ) : (
                            <em>Managed by owner</em>
                          )}
                        </div>
                      ))}
                  </div>

                  <p className="access-footnote">
                    Owners are listed in <code>firestore.rules</code>, which is what actually enforces
                    this. Editing the list here alone would change nothing.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
