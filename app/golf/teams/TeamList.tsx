"use client";

import { useMemo } from "react";
import { EVENT } from "../lib/event";
import { isOnTeam, TEAMS_COLLECTION, toTeam, type Team } from "../lib/scoring";
import { useAuth } from "../lib/useAuth";
import { useGolfCollection } from "../lib/useGolfCollection";
import { MailIcon, TeamIcon } from "../components/icons";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function TeamList() {
  const { email } = useAuth();
  const { docs: teams, loading } = useGolfCollection<Team>(TEAMS_COLLECTION, toTeam);

  const sorted = useMemo(
    () =>
      [...teams].sort((a, b) => (a.startingHole ?? 99) - (b.startingHole ?? 99) || a.name.localeCompare(b.name)),
    [teams]
  );

  const playerCount = teams.reduce((sum, t) => sum + t.players.length, 0);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-12 pt-5">
      {loading ? (
        <p className="py-12 text-center text-sm text-cream-golf/50">Loading teams…</p>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-cream-golf/12 bg-fairway-800 px-5 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fairway-700 text-brass">
            <TeamIcon size={24} />
          </span>
          <p className="font-display mt-4 text-lg text-cream-golf">Teams aren&rsquo;t set yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[0.85rem] leading-relaxed text-cream-golf/55">
            Foursomes go up here once Curtis has the names. Send him yours — or come solo and
            he&rsquo;ll fill out a group.
          </p>
          <a
            href={`mailto:${EVENT.rsvp.email}?subject=${encodeURIComponent(
              "Stonegate Golf Scramble — my foursome"
            )}`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cream-golf px-5 py-3 text-sm font-medium text-fairway-900 transition-opacity hover:opacity-90"
          >
            <MailIcon size={17} />
            Send your names
          </a>
        </div>
      ) : (
        <>
          <p className="px-1 text-[0.62rem] uppercase tracking-[0.16em] text-cream-golf/40">
            {sorted.length} {sorted.length === 1 ? "team" : "teams"} · {playerCount} players
          </p>

          <ul className="mt-3 space-y-3">
            {sorted.map((team) => {
              const mine = isOnTeam(team, email);
              return (
                <li
                  key={team.id}
                  className={`rounded-2xl border bg-fairway-800 p-4 ${
                    mine ? "border-brass/50" : "border-cream-golf/12"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display truncate text-lg text-cream-golf">
                        {team.name}
                      </h2>
                      {team.captain && (
                        <p className="mt-0.5 text-[0.72rem] text-cream-golf/45">
                          Captain: {team.captain}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {mine && (
                        <span className="rounded-full bg-brass/20 px-2.5 py-1 text-[0.6rem] uppercase tracking-wider text-brass-soft">
                          Your team
                        </span>
                      )}
                      {team.startingHole && (
                        <span className="golf-nums rounded-full border border-cream-golf/20 px-2.5 py-1 text-[0.68rem] text-cream-golf/70">
                          Starts {team.startingHole}
                        </span>
                      )}
                    </div>
                  </div>

                  {team.players.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {team.players.map((player, i) => (
                        <li key={`${team.id}-${i}`} className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fairway-700 text-[0.62rem] font-medium text-brass-soft">
                            {initials(player.name)}
                          </span>
                          <span className="truncate text-[0.88rem] text-cream-golf/85">
                            {player.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
