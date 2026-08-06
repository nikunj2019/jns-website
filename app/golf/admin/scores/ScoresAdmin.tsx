"use client";

import { useCallback, useEffect, useState } from "react";
import { fsListDocs, fsPatchDoc } from "../../../lib/firestoreRest";
import { formatToPar } from "../../lib/course";
import {
  buildRow,
  SCORES_COLLECTION,
  TEAMS_COLLECTION,
  toScore,
  toTeam,
  type Team,
  type TeamScore,
} from "../../lib/scoring";
import { idToken, useAuth } from "../../lib/useAuth";
import { useCourse } from "../../lib/useCourse";
import { Card, SaveNote, saveErrorMessage } from "../ui";

/**
 * Score override for organizers.
 *
 * This is the fallback that makes the whole scoring feature safe to rely on: if
 * a player's magic-link email never arrives, their phone dies, or they simply
 * can't be bothered, someone at the scoring table can enter the card here.
 */
export default function ScoresAdmin() {
  const { user } = useAuth();
  const { course } = useCourse();

  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<Record<string, TeamScore>>({});
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [save, setSave] = useState("idle");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const [teamDocs, scoreDocs] = await Promise.all([
        fsListDocs(TEAMS_COLLECTION, ""),
        fsListDocs(SCORES_COLLECTION, "").catch(() => []),
      ]);
      setTeams(teamDocs.map(toTeam).sort((a, b) => a.name.localeCompare(b.name)));
      setScores(
        Object.fromEntries(scoreDocs.map(toScore).map((s) => [s.id, s]))
      );
    } catch {
      /* Offline or empty. */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the initial fetch; state lands in the promise callback
    void reload();
  }, [reload]);

  async function setStroke(teamId: string, holeNumber: number, value: number) {
    const existing = scores[teamId]?.strokes ?? {};
    const next = { ...existing };
    if (value <= 0) delete next[String(holeNumber)];
    else next[String(holeNumber)] = value;

    // Update on screen first so a slow save doesn't feel like a dropped tap.
    setScores((prev) => ({ ...prev, [teamId]: { id: teamId, strokes: next } }));
    setSave("saving");
    setError("");

    try {
      const token = await idToken(user);
      await fsPatchDoc(
        SCORES_COLLECTION,
        teamId,
        { strokes: next, updatedAt: new Date().toISOString() },
        token
      );
      setSave("saved");
      setTimeout(() => setSave("idle"), 1500);
    } catch (err) {
      setError(saveErrorMessage(err));
      setSave("error");
    }
  }

  if (loading) return <p className="text-sm text-cream-golf/50">Loading…</p>;

  if (teams.length === 0) {
    return (
      <Card title="No teams yet" description="Add foursomes on the Teams tab first.">
        <span />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[0.7rem] text-cream-golf/40">
          Tap a team to open its card. Changes save immediately.
        </p>
        <SaveNote state={save} error={error} />
      </div>

      {teams.map((team) => {
        const score = scores[team.id];
        const row = buildRow(team, score, course.holes);
        const open = openTeam === team.id;

        return (
          <section
            key={team.id}
            className="overflow-hidden rounded-2xl border border-cream-golf/12 bg-fairway-800"
          >
            <button
              type="button"
              onClick={() => setOpenTeam(open ? null : team.id)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-cream-golf">{team.name}</p>
                <p className="text-[0.72rem] text-cream-golf/45">
                  {row.thru === 18 ? "Finished" : `Thru ${row.thru}`}
                </p>
              </div>
              <p
                className={`golf-nums text-lg font-medium ${
                  row.toPar < 0 ? "text-brass-soft" : "text-cream-golf"
                }`}
              >
                {row.thru ? formatToPar(row.toPar) : "—"}
              </p>
              <span className="text-cream-golf/40" aria-hidden="true">
                {open ? "▾" : "▸"}
              </span>
            </button>

            {open && (
              <div className="border-t border-cream-golf/10 px-3 pb-4 pt-3">
                <div className="space-y-1.5">
                  {course.holes.map((hole) => {
                    const value = score?.strokes?.[String(hole.number)] ?? 0;
                    return (
                      <div key={hole.number} className="flex items-center gap-3">
                        <span className="golf-nums w-6 shrink-0 text-[0.75rem] text-cream-golf/45">
                          {hole.number}
                        </span>
                        <span className="w-12 shrink-0 text-[0.7rem] text-cream-golf/35">
                          Par {hole.par}
                        </span>
                        <button
                          type="button"
                          onClick={() => setStroke(team.id, hole.number, Math.max(0, value - 1))}
                          aria-label={`Hole ${hole.number}, one fewer stroke`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cream-golf/20 text-cream-golf/80 hover:bg-cream-golf/10"
                        >
                          −
                        </button>
                        <span className="golf-nums w-8 text-center text-base text-cream-golf">
                          {value || "–"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setStroke(team.id, hole.number, value + 1)}
                          aria-label={`Hole ${hole.number}, one more stroke`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cream-golf/20 text-cream-golf/80 hover:bg-cream-golf/10"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setStroke(team.id, hole.number, hole.par)}
                          className="ml-auto shrink-0 rounded-lg border border-cream-golf/15 px-2.5 py-1.5 text-[0.7rem] text-cream-golf/60 hover:bg-cream-golf/10"
                        >
                          Par
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
