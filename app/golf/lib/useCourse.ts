"use client";

import { useEffect, useState } from "react";
import { fsGetDoc } from "../../lib/firestoreRest";
import { COURSE, type Course, type Hole } from "./course";
import geoData from "./course-geo.json";

export const COURSE_COLLECTION = "golf-course";
export const GEOMETRY_DOC = "geometry";

type GeoFile = {
  holes: Array<{
    number: number | null;
    par: number | null;
    handicap: number | null;
    yards: number | null;
    tee: { lat: number; lng: number };
    green: { lat: number; lng: number };
  }>;
  features: GeoJSON.FeatureCollection;
};

/**
 * The course, assembled from three layers in increasing order of authority:
 *
 *   1. `course.ts`        — committed defaults, provisional until the real card lands
 *   2. `course-geo.json`  — imported OpenStreetMap geometry, if the fetch script ran
 *   3. Firestore          — anything an organizer traced or corrected in the admin
 *
 * All three are optional. With none of them, the app still renders a scorecard;
 * it just won't show GPS distances, because it has no coordinates to measure from.
 */
export function useCourse(): {
  course: Course;
  geometry: GeoJSON.FeatureCollection;
  loaded: boolean;
} {
  const [course, setCourse] = useState<Course>(() => withImportedGeometry(COURSE));
  const [geometry, setGeometry] = useState<GeoJSON.FeatureCollection>(
    () => (geoData as unknown as GeoFile).features ?? emptyCollection()
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fsGetDoc(COURSE_COLLECTION, COURSE.id).catch(() => null),
      fsGetDoc(COURSE_COLLECTION, GEOMETRY_DOC).catch(() => null),
    ])
      .then(([courseDoc, geoDoc]) => {
        if (cancelled) return;

        if (courseDoc) {
          setCourse((prev) => mergeCourse(prev, courseDoc));
        }
        // Geometry is stored as a JSON string: Firestore can't hold the deeply
        // nested arrays a GeoJSON FeatureCollection needs.
        if (geoDoc && typeof geoDoc.geojson === "string") {
          try {
            const parsed = JSON.parse(geoDoc.geojson) as GeoJSON.FeatureCollection;
            if (parsed?.features?.length) setGeometry(parsed);
          } catch {
            /* Malformed stored geometry — keep whatever we already had. */
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { course, geometry, loaded };
}

/** Folds imported OSM hole coordinates into the committed hole list. */
function withImportedGeometry(base: Course): Course {
  const imported = (geoData as unknown as GeoFile).holes ?? [];
  if (!imported.length) return base;

  const byNumber = new Map(imported.filter((h) => h.number).map((h) => [h.number, h]));

  return {
    ...base,
    holes: base.holes.map((hole) => {
      const match = byNumber.get(hole.number);
      if (!match) return hole;
      return {
        ...hole,
        tee: match.tee ?? hole.tee,
        green: match.green ?? hole.green,
        // OSM tags are authoritative where present; otherwise keep the stand-in.
        par: match.par ?? hole.par,
        yards: match.yards ?? hole.yards,
        handicap: match.handicap ?? hole.handicap,
        verified: hole.verified || Boolean(match.par),
      };
    }),
  };
}

/** Overlays a stored course document, including its per-hole array. */
function mergeCourse(base: Course, doc: Record<string, unknown>): Course {
  const next: Course = { ...base };

  for (const [key, value] of Object.entries(doc)) {
    if (key === "id" || key === "holes" || value === null || value === undefined) continue;
    if (key in base) (next as unknown as Record<string, unknown>)[key] = value;
  }

  if (Array.isArray(doc.holes)) {
    const stored = doc.holes as Partial<Hole>[];
    const byNumber = new Map(stored.filter((h) => h.number).map((h) => [h.number, h]));
    next.holes = base.holes.map((hole) => {
      const patch = byNumber.get(hole.number);
      if (!patch) return hole;
      const merged: Hole = { ...hole };
      for (const [k, v] of Object.entries(patch)) {
        if (v !== null && v !== undefined) (merged as unknown as Record<string, unknown>)[k] = v;
      }
      return merged;
    });
  }

  return next;
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}
