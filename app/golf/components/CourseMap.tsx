"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MLMap, Marker, MapMouseEvent, GeoJSONSource } from "maplibre-gl";
import type { Course, Hole, LatLng } from "../lib/course";
import { bearing, distanceYards, midpoint } from "../lib/geo";
import { buildMapStyle, MAP_COLORS, metersPerPixel } from "../lib/mapStyle";

export type MapMode = "course" | "hole";

/** Keeps hole markers clear of the sticky header and the readout panel. */
const MAP_PADDING = { top: 72, bottom: 48, left: 44, right: 44 };

type Props = {
  course: Course;
  geometry: GeoJSON.FeatureCollection;
  mode: MapMode;
  selectedHole: Hole | null;
  onSelectHole: (hole: Hole) => void;
  position: LatLng | null;
  accuracy: number | null;
  /** Emits the point the player tapped, for the measure readout. */
  onMeasure?: (point: LatLng | null) => void;
  measurePoint?: LatLng | null;
};

/**
 * The interactive course map.
 *
 * MapLibre is imported dynamically so its ~200 KB never lands in the bundle for
 * anyone who doesn't open the map. Everything below the import is imperative:
 * we drive the map instance from effects rather than wrapping it in React
 * components, which keeps it clear of React-version compatibility questions and
 * avoids re-creating the map on every render.
 */
export default function CourseMap({
  course,
  geometry,
  mode,
  selectedHole,
  onSelectHole,
  position,
  accuracy,
  onMeasure,
  measurePoint,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const measureMarker = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // The map is built once and its event handlers close over these refs, so the
  // handlers always see the latest callbacks without the init effect re-running
  // (which would tear down and rebuild the map on every parent render).
  const selectRef = useRef(onSelectHole);
  const measureRef = useRef(onMeasure);
  useEffect(() => {
    selectRef.current = onSelectHole;
    measureRef.current = onMeasure;
  });

  // ── Create the map once ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let instance: MLMap | null = null;
    let readyTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        // The stylesheet ships with the package; importing it here keeps it out
        // of the global CSS for pages that never load a map.
        await import("maplibre-gl/dist/maplibre-gl.css");
        if (cancelled || !container.current) return;

        // Committed aerial tiles are present only after the fetch script has
        // run; without them we fall back to the live imagery service.
        const localTiles = await fetch("/golf/tiles/index.json", { cache: "force-cache" })
          .then((r) => r.ok)
          .catch(() => false);
        if (cancelled || !container.current) return;

        instance = new maplibre.Map({
          container: container.current,
          style: buildMapStyle({ localTiles, hasGeometry: geometry.features.length > 0 }),
          bounds: course.bbox,
          // Extra top padding keeps hole markers clear of the sticky header.
          fitBoundsOptions: { padding: MAP_PADDING },
          maxZoom: 19,
          minZoom: 13,
          attributionControl: { compact: true },
          // Rotation is the point of using MapLibre here; keep the gestures on.
          dragRotate: true,
          pitchWithRotate: true,
          crossSourceCollisions: false,
        });

        instance.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "top-right");
        instance.addControl(
          new maplibre.ScaleControl({ maxWidth: 90, unit: "imperial" }),
          "bottom-left"
        );

        // MapLibre's `load` only fires once a frame has fully rendered, which
        // never happens if every tile request fails — precisely the case in a
        // dead spot on the course. `styledata` fires as soon as the style spec
        // is parsed, which is all we actually need to start driving the map, and
        // the timer covers anything slower still. Whichever lands first wins.
        const markReady = () => {
          if (cancelled || !instance) return;
          map.current = instance;
          setReady(true);
        };
        instance.on("load", markReady);
        instance.on("styledata", markReady);
        readyTimer = setTimeout(markReady, 3_000);

        instance.on("error", (e) => {
          // Tile 404s are expected before the aerial is fetched — only surface
          // failures that leave the map unusable.
          const msg = (e as { error?: Error }).error?.message ?? "";
          if (msg && !/tile|404|Failed to fetch/i.test(msg)) setFailed(msg);
        });

        instance.on("click", (e: MapMouseEvent) => {
          measureRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        });
      } catch (err) {
        if (!cancelled) setFailed((err as Error).message);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(readyTimer);
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      measureMarker.current?.remove();
      measureMarker.current = null;
      instance?.remove();
      map.current = null;
    };
    // Built once; later data changes are pushed through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Course geometry ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !map.current) return;
    const source = map.current.getSource("course");
    if (source && "setData" in source) {
      (source as GeoJSONSource).setData(geometry);
    }
  }, [ready, geometry]);

  // ── Hole markers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !map.current) return;

      markers.current.forEach((m) => m.remove());
      markers.current = [];

      for (const hole of course.holes) {
        const anchor = hole.green ?? hole.tee;
        if (!anchor) continue;

        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", `Hole ${hole.number}, par ${hole.par}`);
        el.className = "golf-hole-marker";
        el.textContent = String(hole.number);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          selectRef.current(hole);
        });

        markers.current.push(
          new maplibre.Marker({ element: el })
            .setLngLat([anchor.lng, anchor.lat])
            .addTo(map.current)
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, course.holes]);

  // Highlight whichever hole is selected.
  useEffect(() => {
    markers.current.forEach((marker, i) => {
      const hole = course.holes.filter((h) => h.green ?? h.tee)[i];
      marker
        .getElement()
        .classList.toggle("is-active", Boolean(hole && hole.number === selectedHole?.number));
    });
  }, [selectedHole, course.holes]);

  // ── Aim line ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !map.current) return;
    const source = map.current.getSource("aim");
    if (!source || !("setData" in source)) return;

    const from = selectedHole?.tee;
    const to = selectedHole?.green;
    const data: GeoJSON.FeatureCollection =
      mode === "hole" && from && to
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [from.lng, from.lat],
                    [to.lng, to.lat],
                  ],
                },
              },
            ],
          }
        : { type: "FeatureCollection", features: [] };

    (source as GeoJSONSource).setData(data);
  }, [ready, mode, selectedHole]);

  // ── Player position and accuracy halo ─────────────────────────────────────
  useEffect(() => {
    if (!ready || !map.current) return;
    const source = map.current.getSource("position");
    if (!source || !("setData" in source)) return;

    if (!position) {
      (source as GeoJSONSource).setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const zoom = map.current.getZoom();
    const radiusPx = accuracy ? accuracy / metersPerPixel(position.lat, zoom) : 0;

    (source as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { radiusPx: Math.min(Math.max(radiusPx, 0), 200) },
          geometry: { type: "Point", coordinates: [position.lng, position.lat] },
        },
      ],
    });
  }, [ready, position, accuracy]);

  // Keep the halo sized correctly as the map zooms.
  useEffect(() => {
    if (!ready || !map.current || !position) return;
    const m = map.current;
    const resize = () => {
      const source = m.getSource("position");
      if (!source || !("setData" in source)) return;
      const radiusPx = accuracy ? accuracy / metersPerPixel(position.lat, m.getZoom()) : 0;
      (source as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { radiusPx: Math.min(Math.max(radiusPx, 0), 200) },
            geometry: { type: "Point", coordinates: [position.lng, position.lat] },
          },
        ],
      });
    };
    m.on("zoomend", resize);
    return () => {
      m.off("zoomend", resize);
    };
  }, [ready, position, accuracy]);

  // ── Measure marker ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !map.current) return;

      measureMarker.current?.remove();
      measureMarker.current = null;
      if (!measurePoint) return;

      const el = document.createElement("div");
      el.className = "golf-measure-marker";
      measureMarker.current = new maplibre.Marker({ element: el })
        .setLngLat([measurePoint.lng, measurePoint.lat])
        .addTo(map.current);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, measurePoint]);

  // ── Camera ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !map.current) return;

    if (mode === "course" || !selectedHole) {
      map.current.easeTo({ bearing: 0, pitch: 0, duration: 700 });
      map.current.fitBounds(course.bbox, { padding: MAP_PADDING, duration: 700 });
      return;
    }

    const { tee, green } = selectedHole;
    if (!tee || !green) return;

    // Turn the map so the hole plays away from the viewer: tee at the bottom,
    // green at the top. This is what makes it read as a golf map rather than a
    // north-up satellite view.
    const holeBearing = bearing(tee, green);
    const center = midpoint(tee, green);
    const yards = distanceYards(tee, green);
    // Longer holes need to be further out to fit end to end.
    const zoom = yards > 500 ? 15.6 : yards > 400 ? 16 : yards > 300 ? 16.4 : 16.9;

    map.current.easeTo({
      center: [center.lng, center.lat],
      bearing: holeBearing,
      pitch: 45,
      zoom,
      duration: 900,
    });
  }, [ready, mode, selectedHole, course.bbox]);

  const recenter = useCallback(() => {
    if (!map.current || !position) return;
    map.current.easeTo({ center: [position.lng, position.lat], duration: 600 });
  }, [position]);

  return (
    <div className="relative h-full w-full">
      <div ref={container} className="h-full w-full" data-testid="course-map" />

      {!ready && !failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-fairway-900">
          <p className="text-sm text-cream-golf/50">Loading course…</p>
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-fairway-900 p-6 text-center">
          <div>
            <p className="text-sm text-cream-golf/70">The map couldn&rsquo;t load.</p>
            <p className="mt-1 text-xs text-cream-golf/40">{failed}</p>
          </div>
        </div>
      )}

      {position && ready && (
        <button
          type="button"
          onClick={recenter}
          aria-label="Centre on my location"
          className="absolute bottom-4 right-3 flex h-11 w-11 items-center justify-center rounded-full border border-cream-golf/20 bg-fairway-900/85 text-cream-golf backdrop-blur-sm transition-colors hover:bg-fairway-800"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="2.5" fill={MAP_COLORS.position} />
            <path
              d="M12 2v3M12 19v3M2 12h3M19 12h3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
