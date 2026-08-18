"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import {
  AERIAL_HEIGHT,
  AERIAL_MAX_ZOOM,
  AERIAL_WIDTH,
  COURSE_ROUTES,
  distanceYards,
  HOLE_COUNT,
  HOLES,
  metresToYards,
  PINS,
  toImagePoint,
} from "./lib/course";

type GpsState =
  | { kind: "off" }
  | { kind: "locating" }
  | { kind: "unavailable" }
  | { kind: "denied" }
  | { kind: "fixed"; lat: number; lon: number; accuracy: number };

/**
 * The course, as a flat image with the routing drawn over it.
 *
 * Deliberately not a tile map. The aerial is one 400 KB file the service worker
 * precaches, so the map works standing in a dead spot on the ninth — which is
 * most of this course. `CRS.Simple` puts it on a plain pixel grid; at the scale
 * of eighteen holes the projection error is far below GPS noise.
 */
export default function CourseMap({
  hole,
  setHole,
  onScore,
}: {
  hole: number;
  setHole: (n: number) => void;
  onScore: () => void;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const routeLayer = useRef<Leaflet.LayerGroup | null>(null);
  const gpsMarker = useRef<Leaflet.CircleMarker | null>(null);
  const watchId = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [gps, setGps] = useState<GpsState>({ kind: "off" });

  const info = HOLES[hole - 1];

  const fitHole = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.fitBounds(COURSE_ROUTES[hole - 1].map(toImagePoint) as Leaflet.LatLngBoundsExpression, {
      paddingTopLeft: [34, 120],
      paddingBottomRight: [34, 132],
      maxZoom: Math.min(1.8, AERIAL_MAX_ZOOM),
      animate: true,
    });
  }, [hole]);

  // ── Map setup ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let active = true;

    void (async () => {
      const L = await import("leaflet");
      if (!active || !host.current) return;
      leafletRef.current = L;

      const bounds = L.latLngBounds([0, 0], [AERIAL_HEIGHT, AERIAL_WIDTH]);
      const map = L.map(host.current, {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: AERIAL_MAX_ZOOM,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        maxBounds: bounds.pad(0.04),
        maxBoundsViscosity: 1,
      });
      mapRef.current = map;

      L.imageOverlay("/golf/trophy-club-course-aerial.webp", bounds, {
        interactive: false,
        className: "real-aerial-layer",
      }).addTo(map);

      requestAnimationFrame(() => map.invalidateSize());
      setReady(true);
    })();

    const resize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    return () => {
      active = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      mapRef.current?.remove();
      mapRef.current = null;
      gpsMarker.current = null;
      routeLayer.current = null;
    };
  }, []);

  // ── The selected hole's line ───────────────────────────────────────────────

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    const route = COURSE_ROUTES[hole - 1];
    const points = route.map(toImagePoint);
    const tee = points[0];
    const green = points[points.length - 1];

    routeLayer.current?.remove();

    const layers: Leaflet.Layer[] = [
      // Drawn twice: a dark casing under a light line, so the routing stays
      // readable over both fairway and bunker.
      L.polyline(points, {
        color: "#082c21",
        weight: 6,
        opacity: 0.65,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      }),
      L.polyline(points, {
        color: "#fffdf4",
        weight: 2.5,
        opacity: 0.92,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      }),
      L.circleMarker(tee, {
        radius: 7,
        color: "white",
        weight: 2.5,
        fillColor: "#dcb446",
        fillOpacity: 1,
        interactive: false,
      }),
      L.circleMarker(green, {
        radius: 9,
        color: "white",
        weight: 2.5,
        fillColor: "#0a573d",
        fillOpacity: 1,
        interactive: false,
      }),
      L.marker(tee, {
        interactive: false,
        icon: L.divIcon({
          className: "course-endpoint tee-endpoint",
          html: "<span><b>TEE</b><small>START</small></span>",
          iconSize: [58, 30],
          iconAnchor: [29, 38],
        }),
      }),
      L.marker(green, {
        interactive: false,
        icon: L.divIcon({
          className: "course-endpoint green-endpoint",
          html: "<span><b>GREEN</b><small>PIN</small></span>",
          iconSize: [62, 30],
          iconAnchor: [31, -7],
        }),
      }),
    ];

    // Direction arrows and per-leg yardages, so a dogleg reads correctly from
    // the tee without having to zoom.
    for (let i = 0; i < points.length - 1; i += 1) {
      const from = points[i];
      const to = points[i + 1];
      const arrowAt: [number, number] = [
        from[0] + (to[0] - from[0]) * 0.58,
        from[1] + (to[1] - from[1]) * 0.58,
      ];
      const labelAt: [number, number] = [
        from[0] + (to[0] - from[0]) * 0.36,
        from[1] + (to[1] - from[1]) * 0.36,
      ];
      const angle = (Math.atan2(-(to[0] - from[0]), to[1] - from[1]) * 180) / Math.PI;
      const legYards = distanceYards(route[i][1], route[i][0], route[i + 1][1], route[i + 1][0]);

      layers.push(
        L.marker(arrowAt, {
          interactive: false,
          icon: L.divIcon({
            className: "direction-arrow clean-arrow",
            html: `<span style="transform:rotate(${angle}deg)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12M13 7l5 5-5 5"/></svg></span>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
        })
      );

      // Below ~75 yards the labels collide with the tee and green markers.
      if (legYards >= 75) {
        layers.push(
          L.marker(labelAt, {
            interactive: false,
            icon: L.divIcon({
              className: "segment-yardage clean-yardage",
              html: `<span>${legYards}<small>yd</small></span>`,
              iconSize: [54, 26],
              iconAnchor: [27, -14],
            }),
          })
        );
      }
    }

    routeLayer.current = L.layerGroup(layers).addTo(map);
    // The puck belongs to the old layer group's z-order; drop the ref so the
    // position effect re-adds it above the new routing.
    gpsMarker.current = null;
    fitHole();
  }, [hole, ready, fitHole]);

  // ── GPS ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || gps.kind !== "fixed") return;

    const point = toImagePoint([gps.lon, gps.lat]);
    if (gpsMarker.current) {
      gpsMarker.current.setLatLng(point);
      return;
    }
    gpsMarker.current = L.circleMarker(point, {
      radius: 10,
      color: "white",
      weight: 4,
      fillColor: "#2589ff",
      fillOpacity: 1,
      interactive: false,
      className: "gps-course-puck",
    }).addTo(map);
  }, [gps, ready]);

  const startGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGps({ kind: "unavailable" });
      return;
    }
    setGps({ kind: "locating" });
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = navigator.geolocation.watchPosition(
      (position) =>
        setGps({
          kind: "fixed",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => setGps({ kind: "denied" }),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10_000 }
    );
  }, []);

  const yardsToPin =
    gps.kind === "fixed"
      ? distanceYards(gps.lat, gps.lon, PINS[hole - 1].lat, PINS[hole - 1].lon)
      : null;

  const gpsLabel =
    gps.kind === "fixed"
      ? `±${metresToYards(gps.accuracy)} yd`
      : gps.kind === "locating"
        ? "Locating…"
        : gps.kind === "denied"
          ? "Allow location"
          : gps.kind === "unavailable"
            ? "Unavailable"
            : "GPS off";

  const step = (delta: number) => setHole(((hole - 1 + delta + HOLE_COUNT) % HOLE_COUNT) + 1);

  return (
    <section className="course-screen leaflet-course real-course-map">
      <div ref={host} className="leaflet-map" role="img" aria-label={`Course map, hole ${hole}`} />

      <div className="course-topbar">
        <div>
          <small>
            HOLE {hole} · PAR {info.par} · HCP {info.handicap}
          </small>
          <b>
            {info.yards} <em>yards</em>
          </b>
        </div>
        <button
          className={yardsToPin !== null ? "gps-live" : ""}
          onClick={startGps}
          aria-label="Show my distance to the green"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
          <span>
            {yardsToPin !== null ? (
              <>
                <b>{yardsToPin}</b>
                <small>yd to green</small>
              </>
            ) : (
              gpsLabel
            )}
          </span>
        </button>
      </div>

      <div className="leaflet-controls">
        <button aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn(0.5)}>
          +
        </button>
        <button className="fit-button" aria-label="Fit selected hole" onClick={fitHole}>
          FIT
        </button>
        <button aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut(0.5)}>
          −
        </button>
      </div>

      <div className="map-source">Summer aerial · USDA/USGS · GPS routing by ProVisualizer</div>

      <div className="hole-dock">
        <button className="dock-arrow" aria-label="Previous hole" onClick={() => step(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <div className="dock-summary">
          <strong>{hole}</strong>
          <span>
            <small>HOLE {hole}</small>
            <b>
              Par {info.par} · {info.yards} yd
            </b>
          </span>
        </div>
        <button className="dock-score" onClick={onScore}>
          Score
        </button>
        <button className="dock-arrow" aria-label="Next hole" onClick={() => step(1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
