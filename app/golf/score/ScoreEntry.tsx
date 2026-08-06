"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SignIn from "../components/SignIn";
import { CheckIcon, TrophyIcon } from "../components/icons";
import { formatToPar, type Hole } from "../lib/course";
import { fsGetDoc, fsPatchDoc } from "../../lib/firestoreRest";
import {
  buildRow,
  findMyTeam,
  SCORES_COLLECTION,
  TEAMS_COLLECTION,
  toScore,
  toTeam,
  type Team,
} from "../lib/scoring";
import { idToken, useAuth, useSignOut } from "../lib/useAuth";
import { useCourse } from "../lib/useCourse";
import { useEvent } from "../lib/useEvent";
import { useGolfCollection } from "../lib/useGolfCollection";

type SaveState = "idle" | "saving" | "saved" | "error";

/** Relative-to-par label for a single hole. */
function strokeLabel(strokes: number, par: number): string {
  const diff = strokes - par;
  if (strokes === 1) return "Ace";
  if (diff <= -3) return "Albatross";
  if (diff === -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double";
  return `+${diff}`;
}

export default function ScoreEntry() {
  const { user, email, loading: authLoading } = useAuth();
  const signOut = useSignOut();
  const { course } = useCourse();
  const { event } = useEvent();
  const { docs: teams, loading: teamsLoading } = useGolfCollection<Team>(
    TEAMS_COLLECTION,
    toTeam,
    { enabled: Boolean(email) }
  );

  const myTeam = useMemo(() => findMyTeam(teams, email), [teams, email]);

  const [strokes, setStrokes] = useState<Record<string, number>>({});
  const [loadedScores, setLoadedScores] = useState(false);
  const [holeIndex, setHoleIndex] = useState(0);
  const [save, setSave] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Pull this team's existing card once, so a reload or a second phone in the
  // group picks up where the last one left off.
  useEffect(() => {
    if (!myTeam) return;
    let cancelled = false;

    fsGetDoc(SCORES_COLLECTION, myTeam.id)
      .then((doc) => {
        if (cancelled || !doc) return;
        setStrokes(toScore(doc).strokes);
      })
      .catch(() => {
        /* Nothing saved yet, or offline. Start from an empty card. */
      })
      .finally(() => {
        if (!cancelled) setLoadedScores(true);
      });

    return () => {
      cancelled = true;
    };
  }, [myTeam]);

  // Open on the team's starting hole — a shotgun start means hole 1 is wrong
  // for almost everyone — then on the first hole still without a score.
  useEffect(() => {
    if (!myTeam || !loadedScores) return;
    const start = myTeam.startingHole ?? 1;
    const order = course.holes.map((h) => h.number);
    const rotated = [...order.slice(start - 1), ...order.slice(0, start - 1)];
    const nextUnplayed = rotated.find((n) => !strokes[String(n)]);
    const target = nextUnplayed ?? start;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening hole depends on the saved card, which loads after mount
    setHoleIndex(course.holes.findIndex((h) => h.number === target));
    // Only when the card first loads; afterwards the player drives navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTeam, loadedScores]);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const hole: Hole | undefined = course.holes[holeIndex];

  const persist = useCallback(
    async (next: Record<string, number>) => {
      if (!myTeam) return;
      setSave("saving");
      setSaveError("");
      try {
        const token = await idToken(user);
        await fsPatchDoc(
          SCORES_COLLECTION,
          myTeam.id,
          { strokes: next, updatedAt: new Date().toISOString() },
          token
        );
        setSave("saved");
        clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSave("idle"), 2000);
      } catch (err) {
        setSave("error");
        setSaveError(
          (err as Error).message.includes("PERMISSION")
            ? "You're not allowed to score for this team."
            : "Couldn't save — it'll need signal. Your entry is still on screen."
        );
      }
    },
    [myTeam, user]
  );

  const setStroke = useCallback(
    (value: number) => {
      if (!hole) return;
      const next = { ...strokes };
      if (value <= 0) delete next[String(hole.number)];
      else next[String(hole.number)] = value;
      setStrokes(next);
      void persist(next);
    },
    [hole, strokes, persist]
  );

  const step = useCallback(
    (delta: number) => {
      setHoleIndex((i) => (i + delta + course.holes.length) % course.holes.length);
      setSave("idle");
    },
    [course.holes.length]
  );

  // ── Gates ─────────────────────────────────────────────────────────────────

  if (authLoading) {
    return <p className="py-16 text-center text-sm text-cream-golf/50">Loading…</p>;
  }

  if (!email) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-8">
        <SignIn />
      </div>
    );
  }

  if (teamsLoading) {
    return <p className="py-16 text-center text-sm text-cream-golf/50">Finding your team…</p>;
  }

  if (!myTeam) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-8">
        <div className="rounded-2xl border border-cream-golf/12 bg-fairway-800 p-5 text-center">
          <h2 className="font-display text-xl text-cream-golf">You&rsquo;re not on a team yet</h2>
          <p className="mx-auto mt-2 max-w-xs text-[0.88rem] leading-relaxed text-cream-golf/70">
            Signed in as <span className="text-cream-golf">{email}</span>, but that address
            isn&rsquo;t on a foursome. Ask {event.rsvp.contact} to add it.
          </p>
          <a
            href={`mailto:${event.rsvp.email}?subject=${encodeURIComponent(
              "Stonegate Golf Scramble — add me to a team"
            )}&body=${encodeURIComponent(`Please add ${email} to a foursome.`)}`}
            className="mt-4 inline-block rounded-xl bg-cream-golf px-5 py-3 text-sm font-medium text-fairway-900"
          >
            Email {event.rsvp.contact}
          </a>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 block w-full text-[0.75rem] text-cream-golf/40 underline underline-offset-4"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!event.scoringOpen && event.status === "upcoming") {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-8">
        <div className="rounded-2xl border border-cream-golf/12 bg-fairway-800 p-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fairway-700 text-brass">
            <TrophyIcon size={24} />
          </span>
          <h2 className="font-display mt-4 text-xl text-cream-golf">Scoring isn&rsquo;t open yet</h2>
          <p className="mx-auto mt-2 max-w-xs text-[0.88rem] leading-relaxed text-cream-golf/70">
            You&rsquo;re signed in and on <span className="text-cream-golf">{myTeam.name}</span> —
            nothing else to do until the shotgun.
          </p>
          <Link
            href="/golf/leaderboard/"
            className="mt-4 inline-block rounded-xl border border-cream-golf/25 px-5 py-3 text-sm text-cream-golf"
          >
            View leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (!hole) return null;

  // ── Card ──────────────────────────────────────────────────────────────────

  const current = strokes[String(hole.number)] ?? 0;
  const row = buildRow(myTeam, { id: myTeam.id, strokes }, course.holes);
  const quickScores = [hole.par - 2, hole.par - 1, hole.par, hole.par + 1, hole.par + 2].filter(
    (v) => v >= 1
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-4">
      {/* ── Team summary ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-xl border border-cream-golf/12 bg-fairway-800 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-cream-golf">{myTeam.name}</p>
          <p className="text-[0.7rem] text-cream-golf/45">
            {row.thru} {row.thru === 1 ? "hole" : "holes"} in
          </p>
        </div>
        <p
          className={`golf-nums text-2xl font-medium ${
            row.toPar < 0 ? "text-brass-soft" : "text-cream-golf"
          }`}
        >
          {row.thru ? formatToPar(row.toPar) : "—"}
        </p>
      </div>

      {/* ── Hole picker ──────────────────────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous hole"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-cream-golf/20 text-cream-golf/80 transition-colors hover:bg-cream-golf/10"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="golf-eyebrow">Hole</p>
          <p className="golf-nums font-display text-4xl leading-none text-cream-golf">
            {hole.number}
          </p>
          <p className="golf-nums mt-1 text-[0.78rem] text-cream-golf/55">
            Par {hole.par} · {hole.yards} yds
          </p>
        </div>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next hole"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-cream-golf/20 text-cream-golf/80 transition-colors hover:bg-cream-golf/10"
        >
          ›
        </button>
      </div>

      {/* ── Stroke entry ─────────────────────────────────────────────────── */}
      <div className="mt-5 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => setStroke(Math.max(0, current - 1))}
          aria-label="One fewer stroke"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-cream-golf/25 text-2xl text-cream-golf transition-colors hover:bg-cream-golf/10 active:scale-95"
        >
          −
        </button>
        <div className="w-24 text-center">
          <p
            className="golf-nums text-6xl font-medium leading-none text-cream-golf"
            aria-live="polite"
          >
            {current || "–"}
          </p>
          <p className="mt-1.5 h-4 text-[0.75rem] text-brass-soft">
            {current ? strokeLabel(current, hole.par) : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStroke(current + 1)}
          aria-label="One more stroke"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-cream-golf/25 text-2xl text-cream-golf transition-colors hover:bg-cream-golf/10 active:scale-95"
        >
          +
        </button>
      </div>

      {/* Common scores, so a par is one tap rather than four. */}
      <div className="mt-5 flex justify-center gap-2">
        {quickScores.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStroke(value)}
            className={`golf-nums h-11 w-11 rounded-full border text-sm transition-colors ${
              current === value
                ? "border-brass bg-brass text-fairway-900"
                : "border-cream-golf/20 text-cream-golf/80 hover:bg-cream-golf/10"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {/* ── Save state ───────────────────────────────────────────────────── */}
      <div className="mt-4 min-h-[2.5rem] text-center">
        {save === "saving" && <p className="text-[0.78rem] text-cream-golf/45">Saving…</p>}
        {save === "saved" && (
          <p className="flex items-center justify-center gap-1.5 text-[0.78rem] text-green-300">
            <CheckIcon size={14} />
            Saved
          </p>
        )}
        {save === "error" && (
          <p className="mx-auto max-w-xs text-[0.78rem] leading-relaxed text-red-300">
            {saveError}
          </p>
        )}
      </div>

      {/* ── Card so far ──────────────────────────────────────────────────── */}
      <div className="mt-2 rounded-2xl border border-cream-golf/12 bg-fairway-800 p-3">
        <p className="golf-eyebrow mb-2 px-1">Your card</p>
        <div className="grid grid-cols-9 gap-1">
          {course.holes.map((h, i) => {
            const value = strokes[String(h.number)];
            const isCurrent = i === holeIndex;
            return (
              <button
                key={h.number}
                type="button"
                onClick={() => setHoleIndex(i)}
                aria-label={`Hole ${h.number}${value ? `, ${value} strokes` : ", no score"}`}
                aria-current={isCurrent ? "true" : undefined}
                className={`golf-nums flex aspect-square flex-col items-center justify-center rounded-md border text-[0.7rem] transition-colors ${
                  isCurrent
                    ? "border-brass bg-brass/20 text-cream-golf"
                    : value
                      ? "border-cream-golf/15 bg-fairway-700 text-cream-golf"
                      : "border-cream-golf/10 text-cream-golf/30"
                }`}
              >
                <span className="text-[0.55rem] text-cream-golf/40">{h.number}</span>
                <span className="font-medium">{value ?? "–"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Link
        href="/golf/leaderboard/"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-cream-golf/25 px-4 py-3 text-sm font-medium text-cream-golf transition-colors hover:bg-cream-golf/10"
      >
        <TrophyIcon size={17} />
        See the leaderboard
      </Link>

      <button
        type="button"
        onClick={signOut}
        className="mt-4 text-center text-[0.72rem] text-cream-golf/35 underline underline-offset-4"
      >
        Sign out ({email})
      </button>
    </div>
  );
}
