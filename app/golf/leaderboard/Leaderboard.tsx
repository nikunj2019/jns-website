"use client";

import { useMemo, useState } from "react";
import { formatToPar } from "../lib/course";
import {
  buildRow,
  positions,
  SCORES_COLLECTION,
  sortRows,
  TEAMS_COLLECTION,
  toScore,
  toTeam,
  type LeaderboardScope,
  type Team,
  type TeamScore,
} from "../lib/scoring";
import { useCourse } from "../lib/useCourse";
import { useGolfCollection } from "../lib/useGolfCollection";
import { TrophyIcon } from "../components/icons";

const TABS: { id: LeaderboardScope; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "front", label: "Front 9" },
  { id: "back", label: "Back 9" },
];

export default function Leaderboard() {
  const { course } = useCourse();
  const teamsState = useGolfCollection<Team>(TEAMS_COLLECTION, toTeam);
  const scoresState = useGolfCollection<TeamScore>(SCORES_COLLECTION, toScore);
  const [scope, setScope] = useState<LeaderboardScope>("overall");

  const rows = useMemo(() => {
    const scoreById = new Map(scoresState.docs.map((s) => [s.id, s]));
    const built = teamsState.docs.map((team) =>
      buildRow(team, scoreById.get(team.id), course.holes)
    );
    return sortRows(built, scope);
  }, [teamsState.docs, scoresState.docs, course.holes, scope]);

  const ranks = useMemo(() => positions(rows, scope), [rows, scope]);
  const loading = teamsState.loading || scoresState.loading;
  const live = teamsState.live && scoresState.live;

  const scopedToPar = (row: (typeof rows)[number]) =>
    scope === "front" ? row.frontToPar : scope === "back" ? row.backToPar : row.toPar;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-12 pt-4">
      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Leaderboard view"
        className="flex gap-1 rounded-xl border border-cream-golf/12 bg-fairway-800 p-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={scope === tab.id}
            onClick={() => setScope(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-[0.8rem] font-medium transition-colors ${
              scope === tab.id
                ? "bg-brass text-fairway-900"
                : "text-cream-golf/65 hover:text-cream-golf"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Status ───────────────────────────────────────────────────────── */}
      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-[0.62rem] uppercase tracking-[0.16em] text-cream-golf/40">
          {rows.length} {rows.length === 1 ? "team" : "teams"}
        </p>
        {!loading && (
          <p className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-cream-golf/40">
            <span
              className={`h-1.5 w-1.5 rounded-full ${live ? "glow-pulse bg-green-400" : "bg-cream-golf/30"}`}
              aria-hidden="true"
            />
            {live ? "Live" : "Updating every 20s"}
          </p>
        )}
      </div>

      {/* ── Board ────────────────────────────────────────────────────────── */}
      {loading ? (
        <p className="py-12 text-center text-sm text-cream-golf/50">Loading scores…</p>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-cream-golf/12 bg-fairway-800 px-5 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fairway-700 text-brass">
            <TrophyIcon size={24} />
          </span>
          <p className="font-display mt-4 text-lg text-cream-golf">No teams yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[0.85rem] leading-relaxed text-cream-golf/55">
            Foursomes appear here once Curtis has them in. Scores go live on the day.
          </p>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-cream-golf/12 bg-fairway-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-golf/10 text-[0.6rem] uppercase tracking-[0.14em] text-cream-golf/45">
                <th scope="col" className="w-12 py-2.5 pl-4 text-left font-medium">
                  Pos
                </th>
                <th scope="col" className="py-2.5 text-left font-medium">
                  Team
                </th>
                <th scope="col" className="w-16 py-2.5 text-right font-medium">
                  To Par
                </th>
                <th scope="col" className="w-14 py-2.5 pr-4 text-right font-medium">
                  Thru
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-golf/8">
              {rows.map((row, i) => {
                const toPar = scopedToPar(row);
                return (
                  <tr key={row.team.id} className={i === 0 && toPar !== null ? "bg-brass/8" : ""}>
                    <td className="golf-nums py-3 pl-4 text-[0.82rem] text-cream-golf/60">
                      {ranks[i]}
                    </td>
                    <td className="py-3 pr-2">
                      <p className="truncate font-medium text-cream-golf">{row.team.name}</p>
                      {row.team.players.length > 0 && (
                        <p className="truncate text-[0.72rem] text-cream-golf/45">
                          {row.team.players.map((p) => p.name).join(", ")}
                        </p>
                      )}
                    </td>
                    <td
                      className={`golf-nums py-3 text-right font-medium ${
                        toPar === null
                          ? "text-cream-golf/30"
                          : toPar < 0
                            ? "text-brass-soft"
                            : "text-cream-golf"
                      }`}
                    >
                      {toPar === null ? "—" : formatToPar(toPar)}
                    </td>
                    <td className="golf-nums py-3 pr-4 text-right text-[0.82rem] text-cream-golf/55">
                      {row.thru === 18 ? "F" : row.thru || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 px-1 text-[0.72rem] leading-relaxed text-cream-golf/40">
        Scramble scoring — one score per team per hole. Teams are ranked against par over the
        holes they&rsquo;ve completed, so a group still out on the course isn&rsquo;t penalised
        for holes it hasn&rsquo;t played.
      </p>
    </div>
  );
}
