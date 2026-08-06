import type { StyleSpecification } from "maplibre-gl";
import { COURSE } from "./course";

/**
 * Colours for the course overlay. Tuned to sit on top of aerial photography:
 * saturated enough to read as a golf map, translucent enough that you can still
 * see the ground underneath.
 */
export const MAP_COLORS = {
  fairway: "#3f8f5a",
  green: "#5fc27e",
  tee: "#7fb069",
  bunker: "#e3d3a8",
  water: "#3b82c4",
  rough: "#2c5f3f",
  aim: "#e0c469",
  position: "#4da3ff",
} as const;

const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const ESRI_ATTRIBUTION =
  'Imagery © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics';

const NAIP_ATTRIBUTION = "Imagery: USGS NAIP (public domain)";

const OSM_ATTRIBUTION =
  'Course data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

/**
 * Builds the MapLibre style.
 *
 * `localTiles` switches the base layer between imagery committed to the repo
 * (works offline, no third-party terms) and Esri's live service. The tile
 * manifest at /golf/tiles/index.json decides which one is available.
 */
export function buildMapStyle({
  localTiles,
  hasGeometry,
}: {
  localTiles: boolean;
  hasGeometry: boolean;
}): StyleSpecification {
  const attribution = [localTiles ? NAIP_ATTRIBUTION : ESRI_ATTRIBUTION];
  if (hasGeometry) attribution.push(OSM_ATTRIBUTION);

  return {
    version: 8,
    // A blank glyph endpoint would break any symbol layer with a text-field, so
    // labels are drawn as HTML markers instead and no glyphs are needed.
    sources: {
      aerial: localTiles
        ? {
            type: "raster",
            tiles: ["/golf/tiles/{z}/{x}/{y}.jpg"],
            tileSize: 256,
            minzoom: 15,
            maxzoom: 18,
            bounds: COURSE.bbox,
            attribution: attribution.join(" · "),
          }
        : {
            type: "raster",
            tiles: [ESRI_IMAGERY],
            tileSize: 256,
            maxzoom: 19,
            attribution: attribution.join(" · "),
          },
      course: { type: "geojson", data: emptyCollection() },
      aim: { type: "geojson", data: emptyCollection() },
      position: { type: "geojson", data: emptyCollection() },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#0b2016" } },
      {
        id: "aerial",
        type: "raster",
        source: "aerial",
        paint: { "raster-opacity": 1, "raster-fade-duration": 200 },
      },

      // ── Course overlay, painted ground-up ─────────────────────────────────
      {
        id: "rough",
        type: "fill",
        source: "course",
        filter: ["==", ["get", "golf"], "rough"],
        paint: { "fill-color": MAP_COLORS.rough, "fill-opacity": 0.25 },
      },
      {
        id: "fairway",
        type: "fill",
        source: "course",
        filter: ["==", ["get", "golf"], "fairway"],
        paint: { "fill-color": MAP_COLORS.fairway, "fill-opacity": 0.42 },
      },
      {
        id: "water",
        type: "fill",
        source: "course",
        filter: ["in", ["get", "golf"], ["literal", ["water_hazard", "lateral_water_hazard"]]],
        paint: { "fill-color": MAP_COLORS.water, "fill-opacity": 0.55 },
      },
      {
        id: "water-line",
        type: "line",
        source: "course",
        filter: [
          "all",
          ["==", ["geometry-type"], "LineString"],
          ["in", ["get", "golf"], ["literal", ["water_hazard", "lateral_water_hazard"]]],
        ],
        paint: { "line-color": MAP_COLORS.water, "line-width": 3, "line-opacity": 0.75 },
      },
      {
        id: "bunker",
        type: "fill",
        source: "course",
        filter: ["==", ["get", "golf"], "bunker"],
        paint: { "fill-color": MAP_COLORS.bunker, "fill-opacity": 0.8 },
      },
      {
        id: "tee",
        type: "fill",
        source: "course",
        filter: ["==", ["get", "golf"], "tee"],
        paint: { "fill-color": MAP_COLORS.tee, "fill-opacity": 0.5 },
      },
      {
        id: "green",
        type: "fill",
        source: "course",
        filter: ["==", ["get", "golf"], "green"],
        paint: { "fill-color": MAP_COLORS.green, "fill-opacity": 0.62 },
      },
      {
        id: "green-outline",
        type: "line",
        source: "course",
        filter: ["==", ["get", "golf"], "green"],
        paint: { "line-color": "#eafff1", "line-width": 1.4, "line-opacity": 0.8 },
      },

      // ── Aim line for the selected hole ────────────────────────────────────
      {
        id: "aim-line",
        type: "line",
        source: "aim",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": MAP_COLORS.aim,
          "line-width": 2,
          "line-opacity": 0.85,
          "line-dasharray": [2, 2],
        },
      },

      // ── The player ────────────────────────────────────────────────────────
      {
        id: "accuracy",
        type: "circle",
        source: "position",
        paint: {
          // Radius comes from the GPS fix's own accuracy, converted to pixels at
          // the current latitude and zoom, so the halo is honest about precision.
          "circle-radius": ["get", "radiusPx"],
          "circle-color": MAP_COLORS.position,
          "circle-opacity": 0.15,
          "circle-stroke-width": 1,
          "circle-stroke-color": MAP_COLORS.position,
          "circle-stroke-opacity": 0.4,
        },
      },
      {
        id: "position-dot",
        type: "circle",
        source: "position",
        paint: {
          "circle-radius": 7,
          "circle-color": MAP_COLORS.position,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      },
    ],
  };
}

export function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

/**
 * Metres-per-pixel at a given latitude and zoom — used to size the accuracy halo
 * in screen pixels, since MapLibre circle radii are pixel-based.
 */
export function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}
