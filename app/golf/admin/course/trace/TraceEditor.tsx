"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource, MapMouseEvent, Marker } from "maplibre-gl";
import { fsPatchDoc } from "../../../../lib/firestoreRest";
import { COURSE, type Hole, type LatLng } from "../../../lib/course";
import { buildMapStyle } from "../../../lib/mapStyle";
import { idToken, useAuth } from "../../../lib/useAuth";
import { COURSE_COLLECTION, GEOMETRY_DOC, useCourse } from "../../../lib/useCourse";
import { useGeolocation } from "../../../lib/useGeolocation";
import { Button, SaveNote, saveErrorMessage } from "../../ui";

/** What a click currently does. */
type Tool =
  | { kind: "point"; hole: number; which: "tee" | "green" }
  | { kind: "polygon"; golf: FeatureKind }
  | { kind: "idle" };

type FeatureKind = "green" | "fairway" | "tee" | "bunker" | "water_hazard" | "rough";

const FEATURE_KINDS: { id: FeatureKind; label: string }[] = [
  { id: "green", label: "Green" },
  { id: "fairway", label: "Fairway" },
  { id: "tee", label: "Tee box" },
  { id: "bunker", label: "Bunker" },
  { id: "water_hazard", label: "Water" },
  { id: "rough", label: "Rough" },
];

/**
 * Draws the course on top of the aerial.
 *
 * Two jobs, both one-time. Setting each hole's tee and green point is what makes
 * GPS yardages possible at all; tracing the polygons is what makes the map look
 * like a golf course rather than a photograph. Either can be done from a desk by
 * clicking, or on a phone at the course with "use my location".
 *
 * Everything is saved to Firestore, so it survives deploys and never needs a
 * code change.
 */
export default function TraceEditor() {
  const { user } = useAuth();
  const { course, geometry, loaded } = useCourse();
  const geo = useGeolocation();

  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);

  const [holes, setHoles] = useState<Hole[]>(COURSE.holes);
  const [features, setFeatures] = useState<GeoJSON.Feature[]>([]);
  const [tool, setTool] = useState<Tool>({ kind: "idle" });
  const [draft, setDraft] = useState<[number, number][]>([]);
  const [save, setSave] = useState("idle");
  const [error, setError] = useState("");

  // The map's click handler is registered once, so it reads the active tool
  // through a ref rather than a stale closure.
  const toolRef = useRef(tool);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    if (!loaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding the editor from stored geometry fetched after mount
    setHoles(course.holes);
    setFeatures(geometry.features ?? []);
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Map ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let instance: MLMap | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !container.current) return;

      const localTiles = await fetch("/golf/tiles/index.json", { cache: "force-cache" })
        .then((r) => r.ok)
        .catch(() => false);
      if (cancelled || !container.current) return;

      instance = new maplibre.Map({
        container: container.current,
        style: buildMapStyle({ localTiles, hasGeometry: true }),
        bounds: COURSE.bbox,
        fitBoundsOptions: { padding: 30 },
        maxZoom: 20,
      });
      instance.addControl(new maplibre.NavigationControl(), "top-right");

      const markReady = () => {
        if (cancelled || !instance) return;
        map.current = instance;
        setReady(true);
      };
      instance.on("load", markReady);
      instance.on("styledata", markReady);
      timer = setTimeout(markReady, 3000);

      instance.on("click", (e: MapMouseEvent) => {
        const active = toolRef.current;
        const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];

        if (active.kind === "polygon") {
          setDraft((prev) => [...prev, point]);
        } else if (active.kind === "point") {
          setHoles((prev) =>
            prev.map((h) =>
              h.number === active.hole
                ? { ...h, [active.which]: { lat: point[1], lng: point[0] } }
                : h
            )
          );
        }
      });
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      instance?.remove();
      map.current = null;
    };
  }, []);

  // Push saved + in-progress geometry to the map.
  useEffect(() => {
    if (!ready || !map.current) return;
    const source = map.current.getSource("course");
    if (!source || !("setData" in source)) return;

    const live: GeoJSON.Feature[] = [...features];
    if (draft.length >= 2) {
      live.push({
        type: "Feature",
        properties: { golf: toolRef.current.kind === "polygon" ? toolRef.current.golf : "rough" },
        geometry:
          draft.length >= 3
            ? { type: "Polygon", coordinates: [[...draft, draft[0]]] }
            : { type: "LineString", coordinates: draft },
      });
    }

    (source as GeoJSONSource).setData({ type: "FeatureCollection", features: live });
  }, [ready, features, draft]);

  // Markers for every placed tee and green.
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !map.current) return;

      markers.current.forEach((m) => m.remove());
      markers.current = [];

      for (const hole of holes) {
        for (const which of ["tee", "green"] as const) {
          const point = hole[which];
          if (!point) continue;
          const el = document.createElement("div");
          el.className = "golf-hole-marker";
          el.style.opacity = which === "tee" ? "0.75" : "1";
          el.textContent = which === "tee" ? `${hole.number}t` : String(hole.number);
          markers.current.push(
            new maplibre.Marker({ element: el }).setLngLat([point.lng, point.lat]).addTo(map.current)
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, holes]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const finishPolygon = useCallback(() => {
    if (tool.kind !== "polygon" || draft.length < 3) {
      setDraft([]);
      return;
    }
    setFeatures((prev) => [
      ...prev,
      {
        type: "Feature",
        properties: { golf: tool.golf },
        geometry: { type: "Polygon", coordinates: [[...draft, draft[0]]] },
      },
    ]);
    setDraft([]);
  }, [tool, draft]);

  const useMyLocation = useCallback(() => {
    if (tool.kind !== "point" || !geo.position) return;
    const here: LatLng = geo.position;
    setHoles((prev) =>
      prev.map((h) => (h.number === tool.hole ? { ...h, [tool.which]: here } : h))
    );
  }, [tool, geo.position]);

  async function saveAll() {
    setSave("saving");
    setError("");
    try {
      const token = await idToken(user);
      await Promise.all([
        fsPatchDoc(COURSE_COLLECTION, COURSE.id, { holes }, token),
        // GeoJSON nests arrays several levels deep, which Firestore's document
        // model can't represent — so it goes in as a JSON string.
        fsPatchDoc(
          COURSE_COLLECTION,
          GEOMETRY_DOC,
          {
            geojson: JSON.stringify({ type: "FeatureCollection", features }),
            updatedAt: new Date().toISOString(),
          },
          token
        ),
      ]);
      setSave("saved");
      setTimeout(() => setSave("idle"), 2500);
    } catch (err) {
      setError(saveErrorMessage(err));
      setSave("error");
    }
  }

  const placed = holes.filter((h) => h.green).length;
  const pointTool = tool.kind === "point" ? tool : null;

  return (
    <div className="space-y-3">
      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <div className="relative h-[52vh] overflow-hidden rounded-2xl border border-cream-golf/12">
        <div ref={container} className="h-full w-full" data-testid="trace-map" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-fairway-900">
            <p className="text-sm text-cream-golf/50">Loading aerial…</p>
          </div>
        )}
        {tool.kind !== "idle" && (
          <div className="pointer-events-none absolute inset-x-3 top-3">
            <p className="rounded-lg bg-fairway-900/90 px-3 py-2 text-center text-[0.75rem] text-brass-soft backdrop-blur-sm">
              {tool.kind === "point"
                ? `Tap the ${tool.which} of hole ${tool.hole}`
                : `Tap around the ${tool.golf.replace("_", " ")} — ${draft.length} points`}
            </p>
          </div>
        )}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-cream-golf/12 bg-fairway-800 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-[0.62rem] uppercase tracking-[0.14em] text-cream-golf/45">
            Trace
          </p>
          {FEATURE_KINDS.map((kind) => (
            <button
              key={kind.id}
              type="button"
              onClick={() => {
                setDraft([]);
                setTool({ kind: "polygon", golf: kind.id });
              }}
              className={`rounded-lg border px-3 py-1.5 text-[0.75rem] transition-colors ${
                tool.kind === "polygon" && tool.golf === kind.id
                  ? "border-brass bg-brass text-fairway-900"
                  : "border-cream-golf/20 text-cream-golf/75 hover:bg-cream-golf/10"
              }`}
            >
              {kind.label}
            </button>
          ))}
        </div>

        {tool.kind === "polygon" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={finishPolygon} disabled={draft.length < 3}>
              Close shape ({draft.length})
            </Button>
            <Button variant="ghost" onClick={() => setDraft((p) => p.slice(0, -1))}>
              Undo point
            </Button>
            <Button variant="ghost" onClick={() => setTool({ kind: "idle" })}>
              Done
            </Button>
          </div>
        )}

        <hr className="golf-rule my-4" />

        <div className="flex items-center justify-between">
          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-cream-golf/45">
            Tees &amp; greens
          </p>
          <p className="golf-nums text-[0.72rem] text-cream-golf/50">{placed}/18 greens set</p>
        </div>

        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {holes.map((hole) => (
            <button
              key={hole.number}
              type="button"
              onClick={() => setTool({ kind: "point", hole: hole.number, which: "green" })}
              className={`golf-nums rounded-lg border py-2 text-[0.78rem] transition-colors ${
                pointTool?.hole === hole.number
                  ? "border-brass bg-brass text-fairway-900"
                  : hole.green
                    ? "border-cream-golf/20 bg-fairway-700 text-cream-golf"
                    : "border-cream-golf/10 text-cream-golf/35"
              }`}
            >
              {hole.number}
            </button>
          ))}
        </div>

        {pointTool && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              {(["tee", "green"] as const).map((which) => (
                <button
                  key={which}
                  type="button"
                  onClick={() => setTool({ ...pointTool, which })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-[0.78rem] capitalize transition-colors ${
                    pointTool.which === which
                      ? "border-brass bg-brass/15 text-cream-golf"
                      : "border-cream-golf/20 text-cream-golf/70"
                  }`}
                >
                  {which}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={geo.position ? useMyLocation : geo.start}
            >
              {geo.position
                ? `Use my location (±${Math.round(geo.accuracy ?? 0)} m)`
                : "Use my location"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setTool({ kind: "idle" })}>
              Done with hole {pointTool.hole}
            </Button>
          </div>
        )}
      </div>

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cream-golf/12 bg-fairway-800 p-4">
        <Button onClick={saveAll}>Save course geometry</Button>
        <Button
          variant="danger"
          onClick={() => {
            if (window.confirm("Discard every traced shape? Tee and green points are kept."))
              setFeatures([]);
          }}
        >
          Clear shapes
        </Button>
        <SaveNote state={save} error={error} />
        <p className="w-full text-[0.72rem] leading-relaxed text-cream-golf/40">
          {features.length} shape{features.length === 1 ? "" : "s"} traced. Nothing is stored
          until you save.
        </p>
      </div>
    </div>
  );
}
