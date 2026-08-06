"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GpsPanel from "../components/GpsPanel";
import type { MapMode } from "../components/CourseMap";
import { hasGeometry, type Hole, type LatLng } from "../lib/course";
import { nearestHole } from "../lib/geo";
import { useCourse } from "../lib/useCourse";
import { useGeolocation } from "../lib/useGeolocation";

// MapLibre is heavy and only ever needed here, so it stays out of the shared
// bundle. `ssr: false` because it needs a real DOM to initialise.
const CourseMap = dynamic(() => import("../components/CourseMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-fairway-900">
      <p className="text-sm text-cream-golf/50">Loading course…</p>
    </div>
  ),
});

export default function CourseView() {
  const { course, geometry } = useCourse();
  const geo = useGeolocation();

  const [mode, setMode] = useState<MapMode>("course");
  const [selected, setSelected] = useState<Hole | null>(null);
  const [measurePoint, setMeasurePoint] = useState<LatLng | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);
  const userPicked = useRef(false);

  const mappedHoles = useMemo(() => course.holes.filter(hasGeometry), [course.holes]);

  // Once there's a fix, jump to whichever hole the player is standing on. A
  // shotgun start means guessing "hole 1" would be wrong for 17 of 18 groups.
  // Only ever done once, and never over a hole the player picked themselves.
  useEffect(() => {
    if (autoDetected || userPicked.current || !geo.position || !mappedHoles.length) return;
    const near = nearestHole(geo.position, mappedHoles);
    if (!near) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a GPS fix arriving from an external subscription
    setSelected(near.hole);
    setMode("hole");
    setAutoDetected(true);
  }, [geo.position, mappedHoles, autoDetected]);

  const selectHole = useCallback((hole: Hole) => {
    userPicked.current = true;
    setSelected(hole);
    setMode("hole");
    setMeasurePoint(null);
  }, []);

  const showAll = useCallback(() => {
    userPicked.current = true;
    setMode("course");
    setMeasurePoint(null);
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (!selected) return;
      const next = ((selected.number - 1 + delta + 18) % 18) + 1;
      const hole = course.holes.find((h) => h.number === next);
      if (hole) selectHole(hole);
    },
    [selected, course.holes, selectHole]
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <div className="relative min-h-[42vh] flex-1">
        <CourseMap
          course={course}
          geometry={geometry}
          mode={mode}
          selectedHole={selected}
          onSelectHole={selectHole}
          position={geo.position}
          accuracy={geo.accuracy}
          measurePoint={measurePoint}
          onMeasure={setMeasurePoint}
        />

        {/* Mode switch, floating over the map */}
        <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
          <button
            type="button"
            onClick={showAll}
            className={`pointer-events-auto rounded-full border px-3.5 py-1.5 text-[0.72rem] font-medium backdrop-blur-sm transition-colors ${
              mode === "course"
                ? "border-brass bg-brass text-fairway-900"
                : "border-cream-golf/25 bg-fairway-900/80 text-cream-golf/85 hover:bg-fairway-800"
            }`}
          >
            All 18
          </button>
          {mode === "hole" && selected && (
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-cream-golf/25 bg-fairway-900/80 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous hole"
                className="flex h-8 w-8 items-center justify-center rounded-full text-cream-golf/80 hover:text-cream-golf"
              >
                ‹
              </button>
              <span className="golf-nums min-w-[3.6rem] text-center text-[0.72rem] font-medium text-cream-golf">
                Hole {selected.number}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next hole"
                className="flex h-8 w-8 items-center justify-center rounded-full text-cream-golf/80 hover:text-cream-golf"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* No coordinates anywhere yet — say why the map looks bare. */}
        {!mappedHoles.length && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3">
            <div className="rounded-xl border border-brass/30 bg-fairway-900/90 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-[0.78rem] leading-relaxed text-cream-golf/75">
                The course hasn&rsquo;t been mapped yet — no hole positions or yardages.
              </p>
              <p className="mt-1 text-[0.7rem] text-cream-golf/45">
                Import them with the fetch script, or trace the course in the admin.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Readout ──────────────────────────────────────────────────────── */}
      <GpsPanel
        hole={selected}
        position={geo.position}
        accuracy={geo.accuracy}
        active={geo.active}
        acquiring={geo.acquiring}
        error={geo.error}
        onToggle={geo.toggle}
        measurePoint={measurePoint}
        onClearMeasure={() => setMeasurePoint(null)}
      />
    </div>
  );
}
