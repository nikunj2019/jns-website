"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Icon from "./components/Icon";
import { EVENT, SCORES_COLLECTION, TEAMS_COLLECTION } from "./lib/config";
import {
  COURSE_PAR,
  formatToPar,
  HOLE_COUNT,
  HOLES,
  scoreLabel,
} from "./lib/course";
import {
  clearTeamCode,
  joinTeam,
  mapScores,
  mapTeam,
  storedTeamCode,
  strokesToArray,
  TeamCodeError,
  type Team,
  type TeamScores,
} from "./lib/data";
import { navigateHash, useHashView } from "./lib/useHashView";
import { useGolfCollection } from "./lib/useGolfCollection";
import { useScoreQueue, type SaveStatus } from "./lib/useScoreQueue";

// Leaflet reaches for `window` as it loads, so it can't be part of the
// prerendered bundle. Kept out of the initial chunk too — most people open the
// leaderboard, not the map.
const CourseMap = dynamic(() => import("./CourseMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading course…</div>,
});

type View = "home" | "join" | "score" | "map" | "leaders" | "team" | "sponsors" | "more";

const VIEWS: View[] = ["home", "join", "score", "map", "leaders", "team", "sponsors", "more"];

/** A team with its scorecard resolved — what every screen here actually needs. */
type TeamRow = {
  team: Team;
  strokes: number[];
  thru: number;
  toPar: number;
};

function buildRow(team: Team, strokes: number[]): TeamRow {
  let thru = 0;
  let toPar = 0;
  strokes.forEach((value, index) => {
    if (value > 0) {
      thru += 1;
      toPar += value - HOLES[index].par;
    }
  });
  return { team, strokes, thru, toPar };
}

export default function GolfApp() {
  const rawView = useHashView();
  const view: View = (VIEWS as string[]).includes(rawView) ? (rawView as View) : "home";

  // Null means "wherever this team starts" — a shotgun start scatters
  // foursomes across the course, so opening on hole 1 would be wrong for
  // everyone but one group.
  const [holeOverride, setHoleOverride] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [note, setNote] = useState("");
  const headingRef = useRef<HTMLDivElement | null>(null);

  const teamsState = useGolfCollection<Team>(TEAMS_COLLECTION, mapTeam);
  const scoresState = useGolfCollection<TeamScores>(SCORES_COLLECTION, mapScores);
  const queue = useScoreQueue(teamId);

  const teams = useMemo(
    () => teamsState.docs.filter((t) => t.active).sort((a, b) => a.name.localeCompare(b.name)),
    [teamsState.docs]
  );

  const scoresById = useMemo(() => {
    const byId = new Map<string, TeamScores>();
    for (const doc of scoresState.docs) byId.set(doc.id, doc);
    return byId;
  }, [scoresState.docs]);

  /**
   * Every team's card. The joined team gets the outbound queue laid over the
   * server's copy, so a stroke you just tapped stays on screen even while it's
   * still in flight — or stuck behind a dead spot.
   */
  const rows = useMemo(
    () =>
      teams.map((team) => {
        const stored = scoresById.get(team.id)?.strokes ?? {};
        const merged = team.id === teamId ? { ...stored, ...queue.pending } : stored;
        return buildRow(team, strokesToArray(merged));
      }),
    [teams, scoresById, teamId, queue.pending]
  );

  const myRow = useMemo(() => rows.find((r) => r.team.id === teamId) ?? null, [rows, teamId]);

  const ranked = useMemo(
    () =>
      [...rows].sort(
        (a, b) => a.toPar - b.toPar || b.thru - a.thru || a.team.name.localeCompare(b.team.name)
      ),
    [rows]
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  // The screens are one component, but each gets a hash so the Android back
  // button steps back through them instead of closing the app outright — the
  // single worst thing a golf PWA can do to someone mid-round.

  const go = useCallback(
    (next: View, replace = false) => {
      const target: View = (next === "score" || next === "team") && !teamId ? "join" : next;
      setNote("");
      navigateHash(target, replace);
    },
    [teamId]
  );

  // Move focus to the new screen's heading so a screen reader announces the
  // change — a view swap with no route change is otherwise silent.
  useEffect(() => {
    headingRef.current?.focus();
  }, [view]);

  // ── Joining ────────────────────────────────────────────────────────────────

  const join = useCallback(async (code: string) => {
    const { team } = await joinTeam(code);
    setTeamId(team.id);
    return team;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const supplied = params.get("code") ?? storedTeamCode();
    if (!supplied) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resolving the URL and localStorage, neither readable during render
      setJoining(false);
      return;
    }
    let cancelled = false;
    join(supplied)
      .catch(() => {
        // A revoked or mistyped code shouldn't strand the app on a dead
        // session — drop it and let them enter another.
        clearTeamCode();
      })
      .finally(() => {
        if (!cancelled) setJoining(false);
      });
    return () => {
      cancelled = true;
    };
  }, [join]);

  // Derived rather than pushed into state by an effect, so the scorecard opens
  // on the team's starting hole as soon as the roster arrives — and stays
  // wherever the player moved it after that.
  const hole = holeOverride ?? myRow?.team.startHole ?? 1;
  const setHole = setHoleOverride;

  // ── Install ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = useCallback(async () => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setNote("Stonegate Golf is already installed on this phone.");
      return;
    }
    if (installEvent) {
      await installEvent.prompt();
      setInstallEvent(null);
      return;
    }
    setNote(
      /android/i.test(navigator.userAgent)
        ? "In Chrome, tap the ⋮ menu, then “Add to Home screen”."
        : "On iPhone, tap Share, then “Add to Home Screen”."
    );
  }, [installEvent]);

  const setScore = useCallback(
    (strokes: number) => {
      if (!teamId) return;
      queue.save(hole, Math.min(15, Math.max(1, strokes)));
    },
    [teamId, hole, queue]
  );

  const loading = teamsState.loading || joining;

  // A deep link to #score before a code has been redeemed lands on the join
  // screen rather than an empty shell — but only once we know there's no
  // remembered team, otherwise it flashes past on every cold start.
  const needsTeam = (view === "score" || view === "team") && !teamId;
  const effectiveView: View = needsTeam && !joining ? "join" : view;
  const awaitingTeam = needsTeam && joining;

  return (
    <main className="v3-shell">
      <AppHeader onHome={() => go("home")} onMore={() => go("more")} live={teamsState.live} />

      <div className="v3-body" ref={headingRef} tabIndex={-1}>
        {awaitingTeam && <p className="app-loading">Finding your team…</p>}

        {view === "home" && (
          <Home
            go={go}
            install={install}
            teamCount={teams.length}
            loading={loading}
            error={teamsState.error}
          />
        )}
        {effectiveView === "join" && (
          <JoinTeam join={join} onDone={() => go("score", true)} back={() => go("home")} />
        )}
        {effectiveView === "score" &&
          (myRow ? (
            <ScoreEntry
              row={myRow}
              hole={hole}
              setHole={setHole}
              status={queue.status}
              setScore={setScore}
            />
          ) : (
            <p className="app-loading">Loading your scorecard…</p>
          ))}
        {view === "map" && <CourseMap hole={hole} setHole={setHole} onScore={() => go("score")} />}
        {view === "leaders" && <Leaderboard rows={ranked} loading={loading} live={scoresState.live} />}
        {effectiveView === "team" &&
          (myRow ? <MyTeam row={myRow} /> : <p className="app-loading">Loading your team…</p>)}
        {view === "sponsors" && <Sponsors />}
        {view === "more" && <More go={go} install={install} />}

        {note && (
          <p className="app-note" role="status">
            {note}
          </p>
        )}
      </div>

      <BottomNav view={view} go={go} />
    </main>
  );
}

// ─── Chrome ──────────────────────────────────────────────────────────────────

function AppHeader({
  onHome,
  onMore,
  live,
}: {
  onHome: () => void;
  onMore: () => void;
  live: boolean;
}) {
  return (
    <header className="v3-head">
      <button className="brand-button" onClick={onHome}>
        <span className="mini-crest">S</span>
        <span>
          <b>STONEGATE</b>
          <small>GOLF OUTING</small>
        </span>
      </button>
      <div className="header-actions">
        {/* Only claims to be live when a listener is actually delivering. */}
        <span className={`v3-live${live ? "" : " is-idle"}`}>
          <i />
          {live ? "LIVE" : "SYNCING"}
        </span>
        <button className="header-more" aria-label="More options" onClick={onMore}>
          <Icon name="more" />
        </button>
      </div>
    </header>
  );
}

function BottomNav({ view, go }: { view: View; go: (v: View) => void }) {
  const items: { key: View; icon: "home" | "score" | "map" | "trophy"; label: string }[] = [
    { key: "home", icon: "home", label: "Home" },
    { key: "score", icon: "score", label: "Score" },
    { key: "map", icon: "map", label: "Course" },
    { key: "leaders", icon: "trophy", label: "Leaderboard" },
  ];
  return (
    <nav className="v3-nav" aria-label="Main">
      {items.map((item) => (
        <button
          key={item.key}
          className={view === item.key ? "on" : ""}
          aria-current={view === item.key ? "page" : undefined}
          onClick={() => go(item.key)}
        >
          <Icon name={item.icon} />
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

function Title({ top, title, sub }: { top: string; title: string; sub: string }) {
  return (
    <div className="v3-titlebar">
      <small>{top}</small>
      <h2>{title}</h2>
      <p>{sub}</p>
    </div>
  );
}

// ─── Screens ─────────────────────────────────────────────────────────────────

function Home({
  go,
  install,
  teamCount,
  loading,
  error,
}: {
  go: (v: View) => void;
  install: () => void;
  teamCount: number;
  loading: boolean;
  error: string | null;
}) {
  // The original hard-coded "4 teams on the course" regardless of the actual
  // field. This says what's really there, including when that's nothing yet.
  const status = loading
    ? "Loading the field…"
    : error
      ? "Standings unavailable offline"
      : teamCount === 0
        ? "No teams posted yet"
        : `${teamCount} ${teamCount === 1 ? "team" : "teams"} on the course`;

  return (
    <section className="v3-home">
      <div className="v3-hero">
        <div className="hero-shade" />
        <div className="v3-title">
          <span className="hero-kicker">{EVENT.name.toUpperCase()}</span>
          <h1>
            Golf for a<br />
            greater purpose.
          </h1>
          <p>{EVENT.beneficiary}</p>
        </div>
      </div>

      <div className="v3-dashboard">
        <button className="status-card" onClick={() => go("leaders")}>
          <i />
          <span>
            <small>LIVE TOURNAMENT</small>
            <b>{status}</b>
            <em>Leaderboard updates automatically</em>
          </span>
          <strong>View</strong>
        </button>

        <div className="v3-actions">
          <button onClick={() => go("score")}>
            <Icon name="score" />
            <span>
              <b>Enter score</b>
              <small>Autosaves instantly</small>
            </span>
          </button>
          <button onClick={() => go("map")}>
            <Icon name="map" />
            <span>
              <b>Course map</b>
              <small>GPS hole view</small>
            </span>
          </button>
          <button onClick={() => go("leaders")}>
            <Icon name="trophy" />
            <span>
              <b>Leaderboard</b>
              <small>Live standings</small>
            </span>
          </button>
          <button onClick={() => go("team")}>
            <Icon name="team" />
            <span>
              <b>My team</b>
              <small>Your foursome</small>
            </span>
          </button>
        </div>

        <div className="home-secondary">
          <button onClick={install}>
            <Icon name="install" />
            Install app
          </button>
          <button onClick={() => go("more")}>
            <Icon name="more" />
            Event details
          </button>
        </div>

        <div className="course-chip">
          <Icon name="pin" />
          <span>
            <b>{EVENT.venue.name}</b>
            <small>
              {EVENT.venue.city} · {EVENT.venue.summary}
            </small>
          </span>
        </div>
      </div>
    </section>
  );
}

function JoinTeam({
  join,
  onDone,
  back,
}: {
  join: (code: string) => Promise<Team>;
  onDone: () => void;
  back: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await join(code);
      onDone();
    } catch (err) {
      setError(
        err instanceof TeamCodeError
          ? err.message
          : "Couldn't reach the scoring service. Check your signal and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="team-login">
      <button className="team-login-back" onClick={back}>
        ← Back
      </button>
      <div className="team-login-card">
        <span className="team-login-icon">
          <Icon name="team" />
        </span>
        <small>PRIVATE TEAM ACCESS</small>
        <h2>Join your foursome</h2>
        <p>
          Enter the code shared by your outing administrator. Your phone will remember your team.
        </p>
        <form onSubmit={submit}>
          <label htmlFor="team-code">Team code</label>
          <input
            id="team-code"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EXAMPLE7"
            maxLength={12}
            aria-describedby={error ? "team-code-error" : undefined}
          />
          {error && (
            <em id="team-code-error" role="alert">
              {error}
            </em>
          )}
          <button disabled={busy || code.trim().length < 4}>
            {busy ? "Checking…" : "Open my team"}
          </button>
        </form>
        <small className="team-help">
          Captains can share the same private link with their foursome.
        </small>
      </div>
    </section>
  );
}

const SAVE_COPY: Record<SaveStatus, string> = {
  idle: "Ready",
  saving: "Saving…",
  saved: "Saved",
  queued: "Queued — will sync",
};

function ScoreEntry({
  row,
  hole,
  setHole,
  status,
  setScore,
}: {
  row: TeamRow;
  hole: number;
  setHole: (n: number) => void;
  status: SaveStatus;
  setScore: (n: number) => void;
}) {
  const info = HOLES[hole - 1];
  const strokes = row.strokes[hole - 1];

  return (
    <section className="v3-screen">
      <Title
        top="FOURSOME SCRAMBLE"
        title={`Hole ${hole}`}
        sub={`Par ${info.par} · ${info.yards} yards · Handicap ${info.handicap}`}
      />

      <div className="hole-progress">
        <button aria-label="Previous hole" onClick={() => setHole(hole === 1 ? HOLE_COUNT : hole - 1)}>
          ‹
        </button>
        <div>
          {row.strokes.map((value, index) => (
            <i
              key={index}
              className={index + 1 === hole ? "current" : value ? "complete" : ""}
            />
          ))}
        </div>
        <button aria-label="Next hole" onClick={() => setHole(hole === HOLE_COUNT ? 1 : hole + 1)}>
          ›
        </button>
      </div>

      <div className="score-stage">
        <div className="score-team">
          <small>TEAM SCORE</small>
          <h3>{row.team.name}</h3>
        </div>

        <div className="score-control">
          <button
            aria-label="One fewer stroke"
            onClick={() => setScore((strokes || info.par + 1) - 1)}
          >
            −
          </button>
          <strong aria-live="polite" aria-label={strokes ? `${strokes} strokes` : "No score yet"}>
            {strokes || "–"}
          </strong>
          <button aria-label="One more stroke" onClick={() => setScore((strokes || info.par - 1) + 1)}>
            +
          </button>
        </div>

        <div className={`save-state ${status === "saved" ? "saved" : ""} ${status === "queued" ? "queued" : ""}`}>
          <i />
          {SAVE_COPY[status]}
        </div>

        <div className="score-result">
          {strokes ? scoreLabel(strokes, info.par) : "Tap + or − to enter score"}
        </div>

        <div className="roster-row">
          {row.team.players.map((player) => (
            <span key={player}>
              <i>{initials(player)}</i>
              <small>{player.split(" ")[0]}</small>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Leaderboard({
  rows,
  loading,
  live,
}: {
  rows: TeamRow[];
  loading: boolean;
  live: boolean;
}) {
  const [tab, setTab] = useState<"overall" | "front 9" | "back 9">("overall");
  const range: [number, number] = tab === "front 9" ? [0, 9] : tab === "back 9" ? [9, 18] : [0, 18];

  const scoped = rows
    .map((row) => {
      let thru = 0;
      let toPar = 0;
      for (let i = range[0]; i < range[1]; i += 1) {
        if (row.strokes[i]) {
          thru += 1;
          toPar += row.strokes[i] - HOLES[i].par;
        }
      }
      return { ...row, thru, toPar };
    })
    .sort((a, b) => a.toPar - b.toPar || b.thru - a.thru || a.team.name.localeCompare(b.team.name));

  return (
    <section className="v3-screen">
      <Title top="LIVE SCORING" title="Leaderboard" sub={`Par ${COURSE_PAR} · ${EVENT.venue.name}`} />

      <div className="leader-tabs">
        {(["overall", "front 9", "back 9"] as const).map((option) => (
          <button
            key={option}
            className={tab === option ? "on" : ""}
            aria-pressed={tab === option}
            onClick={() => setTab(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="leaders">
        <div className="leader-label">
          <span>POS</span>
          <span>TEAM</span>
          <span>THRU</span>
          <span>TO PAR</span>
        </div>

        {loading && <p className="leader-empty">Loading standings…</p>}
        {!loading && scoped.length === 0 && (
          <p className="leader-empty">No teams have been added to the outing yet.</p>
        )}

        {scoped.map((row, index) => (
          <div className="leader-row" key={row.team.id}>
            <strong>{index + 1}</strong>
            <span>
              <b>{row.team.name}</b>
              <small>{row.team.players[0] ? `${row.team.players[0]} · Captain` : "—"}</small>
            </span>
            <em>{row.thru || "–"}</em>
            <mark>{row.thru ? formatToPar(row.toPar) : "–"}</mark>
          </div>
        ))}
      </div>

      <p className="last-sync">
        <i />
        {live ? "Live · updating automatically" : "Reconnecting…"}
      </p>
    </section>
  );
}

function MyTeam({ row }: { row: TeamRow }) {
  return (
    <section className="v3-screen">
      <Title
        top="YOUR FOURSOME"
        title={row.team.name}
        sub={`Starting hole ${row.team.startHole} · Thru ${row.thru}`}
      />
      <div className="team-card-v3">
        <div className="team-icon">
          <Icon name="team" />
        </div>
        {row.team.players.map((player, index) => (
          <div className="player-v3" key={player}>
            <i>{initials(player)}</i>
            <span>
              <b>{player}</b>
              <small>{index === 0 ? "Captain" : "Player"}</small>
            </span>
          </div>
        ))}
      </div>
      <div className="scramble-note">
        <b>Scramble format</b>
        <p>
          Everyone hits. Choose the best shot and repeat until the ball is holed. Record one team
          score.
        </p>
      </div>
    </section>
  );
}

function Sponsors() {
  return (
    <section className="v3-screen">
      <Title top="OUR SPONSORS" title="Thank you" sub={EVENT.beneficiary} />
      <div className="jns-v3">
        <small>OFFICIAL TECHNOLOGY PARTNER</small>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized */}
        <img src="/golf/jns-logo.png" alt="JNS — Smart Solutions, Built for You" width={520} height={260} />
        <p>Custom applications, AI and automation for growing businesses.</p>
        <a href="https://jnssolutions.ai" target="_blank" rel="noreferrer">
          Visit jnssolutions.ai
        </a>
      </div>
    </section>
  );
}

function More({ go, install }: { go: (v: View) => void; install: () => void }) {
  return (
    <section className="v3-screen">
      <Title top="STONEGATE OUTING" title="More" sub="Event resources" />
      <div className="menu-v3">
        <button onClick={() => go("team")}>
          <Icon name="team" />
          <span>
            <b>My team</b>
            <small>Foursome and starting hole</small>
          </span>
          <em>›</em>
        </button>
        <button onClick={() => go("sponsors")}>
          <Icon name="heart" />
          <span>
            <b>Sponsors</b>
            <small>JNS technology partner</small>
          </span>
          <em>›</em>
        </button>
        <button onClick={install}>
          <Icon name="install" />
          <span>
            <b>Install the app</b>
            <small>Add to your phone</small>
          </span>
          <em>›</em>
        </button>
        <a href="/golf/admin/">
          <Icon name="settings" />
          <span>
            <b>Admin login</b>
            <small>Organizers only</small>
          </span>
          <em>›</em>
        </a>
      </div>
      <div className="course-info-v3">
        <small>HOST COURSE</small>
        <h3>{EVENT.venue.name}</h3>
        <p>
          {EVENT.venue.address} · {EVENT.venue.city}
          <br />
          {EVENT.venue.summary} · {EVENT.venue.phone}
        </p>
      </div>
    </section>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

/** Chrome's install prompt, which isn't in the standard DOM lib. */
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };
