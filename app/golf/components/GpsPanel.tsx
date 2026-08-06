"use client";

import Link from "next/link";
import type { Hole, LatLng } from "../lib/course";
import { distanceYards, greenDistances, isUsableFix, MAX_USABLE_ACCURACY_M } from "../lib/geo";
import { TargetIcon } from "./icons";

type Props = {
  hole: Hole | null;
  position: LatLng | null;
  accuracy: number | null;
  active: boolean;
  acquiring: boolean;
  error: string | null;
  onToggle: () => void;
  measurePoint?: LatLng | null;
  onClearMeasure?: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[0.58rem] uppercase tracking-[0.16em] text-cream-golf/45">{label}</p>
      <p className="golf-nums mt-0.5 text-xl font-medium text-cream-golf">{value}</p>
    </div>
  );
}

/**
 * The readout below the map: distances to the selected hole's green, the
 * tap-to-measure result, and the GPS on/off control.
 *
 * When the fix is too coarse to be meaningful, or the hole has no coordinates
 * yet, it says so rather than printing a number that looks authoritative.
 */
export default function GpsPanel({
  hole,
  position,
  accuracy,
  active,
  acquiring,
  error,
  onToggle,
  measurePoint,
  onClearMeasure,
}: Props) {
  const usable = position && isUsableFix(accuracy);
  const distances = usable && hole ? greenDistances(position, hole) : null;
  const hasGeometry = Boolean(hole?.green);

  const measured =
    usable && measurePoint
      ? {
          fromMe: Math.round(distanceYards(position, measurePoint)),
          toGreen: hole?.green ? Math.round(distanceYards(measurePoint, hole.green)) : null,
        }
      : null;

  return (
    <div className="border-t border-brass/20 bg-fairway-800">
      {/* ── Hole summary ─────────────────────────────────────────────────── */}
      {hole && (
        <div className="flex items-center gap-3 px-4 pt-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass text-base font-semibold text-fairway-900 golf-nums">
            {hole.number}
          </span>
          <div className="min-w-0 flex-1">
            <p className="golf-nums text-sm text-cream-golf">
              Par {hole.par} · {hole.yards} yds · HCP {hole.handicap}
            </p>
            {hole.note && (
              <p className="truncate text-[0.75rem] text-cream-golf/55">{hole.note}</p>
            )}
          </div>
          <Link
            href={`/golf/course/hole/${hole.number}/`}
            className="shrink-0 rounded-lg border border-cream-golf/20 px-3 py-1.5 text-[0.72rem] text-cream-golf/80 transition-colors hover:bg-cream-golf/10"
          >
            Details
          </Link>
        </div>
      )}

      {/* ── Distances ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        {!active ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-brass/45 bg-brass/10 px-4 py-3 text-sm font-medium text-brass-soft transition-colors hover:bg-brass/20"
          >
            <TargetIcon size={18} />
            Show my distances
          </button>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">
            <p className="text-[0.82rem] text-red-200">{error}</p>
          </div>
        ) : acquiring || !position ? (
          <p className="py-2 text-center text-sm text-cream-golf/55">Finding you…</p>
        ) : !hasGeometry ? (
          <div className="rounded-xl border border-cream-golf/12 bg-fairway-900/50 px-4 py-3 text-center">
            <p className="text-[0.82rem] leading-relaxed text-cream-golf/60">
              This hole hasn&rsquo;t been mapped yet, so there&rsquo;s no yardage to measure
              from.
            </p>
            <p className="mt-1 text-[0.72rem] text-cream-golf/40">
              An organizer can add it at /golf/admin/course/trace/
            </p>
          </div>
        ) : !usable ? (
          <div className="rounded-xl border border-cream-golf/12 bg-fairway-900/50 px-4 py-3 text-center">
            <p className="text-[0.82rem] text-cream-golf/60">
              Signal too weak to quote a yardage
              {accuracy ? ` (±${Math.round(accuracy)} m)` : ""}.
            </p>
            <p className="mt-1 text-[0.72rem] text-cream-golf/40">
              Needs better than ±{MAX_USABLE_ACCURACY_M} m. Try again in the open.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Front" value={distances?.front ? String(distances.front) : "—"} />
              <Stat label="Centre" value={distances?.center ? String(distances.center) : "—"} />
              <Stat label="Back" value={distances?.back ? String(distances.back) : "—"} />
            </div>
            <p className="mt-1.5 text-center text-[0.62rem] text-cream-golf/35">
              yards · GPS ±{Math.round(accuracy ?? 0)} m — a guide, not a rangefinder
            </p>
          </>
        )}

        {/* ── Tap-to-measure ─────────────────────────────────────────────── */}
        {measured && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-brass/30 bg-brass/8 px-4 py-2.5">
            <div className="flex-1 text-[0.82rem] text-cream-golf">
              <span className="golf-nums font-medium text-brass-soft">{measured.fromMe}</span> to
              carry
              {measured.toGreen !== null && (
                <>
                  {" · "}
                  <span className="golf-nums font-medium text-brass-soft">
                    {measured.toGreen}
                  </span>{" "}
                  left in
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClearMeasure}
              className="text-[0.72rem] text-cream-golf/50 underline underline-offset-2"
            >
              Clear
            </button>
          </div>
        )}

        {active && !error && (
          <button
            type="button"
            onClick={onToggle}
            className="mt-2 w-full text-center text-[0.72rem] text-cream-golf/40 underline underline-offset-2"
          >
            Turn off GPS (saves battery)
          </button>
        )}
      </div>
    </div>
  );
}
