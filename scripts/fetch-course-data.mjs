/**
 * Pulls real course data for The Trophy Club.
 *
 *   node scripts/fetch-course-data.mjs
 *
 * ⚠️  RUN THIS FROM A NORMAL NETWORK (your laptop, or CI).
 * The agent sandbox this project was built in blocks outbound HTTPS to
 * everything but a small allowlist, so none of these hosts are reachable from
 * there. Nothing about that reflects on the sources themselves.
 *
 * Three independent steps; each is optional and failure in one doesn't stop the
 * others. Run it, commit whatever it writes, and the app picks it up:
 *
 *   1. AERIAL   USGS NAIP imagery for the course bounding box, cut into XYZ
 *               tiles under public/golf/tiles/. Public domain.
 *   2. GEOMETRY OpenStreetMap golf features via Overpass — greens, fairways,
 *               tees, bunkers, water, and per-hole ways. ODbL, attribution
 *               required (already rendered in the map's attribution control).
 *   3. CARD     The official scorecard, read with a real browser.
 *
 * Flags:
 *   --skip-aerial --skip-geometry --skip-card
 *   --zoom 15,16,17,18       tile zoom levels for the aerial (default 15-18)
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TILE_DIR = join(ROOT, "public", "golf", "tiles");
const DATA_DIR = join(ROOT, "app", "golf", "lib");

// Must match COURSE.bbox in app/golf/lib/course.ts.
const BBOX = [-86.5405, 40.0899, -86.5205, 40.106]; // [w, s, e, n]
const CENTER = { lat: 40.0979318, lng: -86.5304796 };

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const value = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const ZOOMS = value("--zoom", "15,16,17,18").split(",").map(Number);

// USGS's NAIPPlus imagery service. Public domain, no key, no attribution
// requirement — which is why it's preferred over a commercial tile provider.
const NAIP_TILE_URL =
  "https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/tile/{z}/{y}/{x}";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// ─── Slippy-map tile maths ────────────────────────────────────────────────────

function lngToTileX(lng, z) {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}

function latToTileY(lat, z) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z
  );
}

// ─── 1. Aerial imagery ────────────────────────────────────────────────────────

async function fetchAerial() {
  console.log("\n▸ Aerial imagery (USGS NAIP, public domain)");
  const [w, s, e, n] = BBOX;
  let ok = 0;
  let failed = 0;

  for (const z of ZOOMS) {
    const x0 = lngToTileX(w, z);
    const x1 = lngToTileX(e, z);
    const y0 = latToTileY(n, z);
    const y1 = latToTileY(s, z);
    const count = (x1 - x0 + 1) * (y1 - y0 + 1);
    console.log(`  z${z}: ${count} tiles`);

    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const url = NAIP_TILE_URL.replace("{z}", z).replace("{x}", x).replace("{y}", y);
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length < 500) throw new Error("empty tile");
          const dir = join(TILE_DIR, String(z), String(x));
          await mkdir(dir, { recursive: true });
          await writeFile(join(dir, `${y}.jpg`), buf);
          ok++;
        } catch {
          failed++;
        }
      }
    }
  }

  // The map reads this manifest to decide between committed tiles and the live
  // layer. Without it, it assumes there's no local imagery.
  if (ok > 0) {
    await writeFile(
      join(TILE_DIR, "index.json"),
      JSON.stringify(
        { source: "USGS NAIP (public domain)", bbox: BBOX, zooms: ZOOMS, tiles: ok },
        null,
        2
      )
    );
  }

  console.log(`  → ${ok} tiles written to public/golf/tiles/, ${failed} failed`);
  if (ok === 0) {
    console.log("  ! No imagery retrieved. The map falls back to its live tile layer.");
  }
  return ok > 0;
}

// ─── 2. OSM golf geometry ─────────────────────────────────────────────────────

const OVERPASS_QUERY = `
[out:json][timeout:90];
(
  way["golf"](${BBOX[1]},${BBOX[0]},${BBOX[3]},${BBOX[2]});
  relation["golf"](${BBOX[1]},${BBOX[0]},${BBOX[3]},${BBOX[2]});
  way["leisure"="golf_course"](${BBOX[1]},${BBOX[0]},${BBOX[3]},${BBOX[2]});
);
out geom tags;
`.trim();

async function fetchGeometry() {
  console.log("\n▸ Course geometry (OpenStreetMap / Overpass, ODbL)");

  let data = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: OVERPASS_QUERY }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      break;
    } catch (err) {
      console.log(`  · ${new URL(endpoint).hostname}: ${err.message}`);
    }
  }

  if (!data) {
    console.log("  ! Overpass unreachable. Trace the course at /golf/admin/course/trace/.");
    return false;
  }

  const elements = data.elements ?? [];
  console.log(`  · ${elements.length} elements returned`);

  const features = [];
  const holes = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const kind = tags.golf ?? (tags.leisure === "golf_course" ? "course" : null);
    if (!kind || !el.geometry) continue;

    const coords = el.geometry.map((p) => [p.lon, p.lat]);
    if (coords.length < 2) continue;

    if (kind === "hole") {
      holes.push({
        number: Number(tags.ref) || null,
        par: Number(tags.par) || null,
        handicap: Number(tags.handicap) || null,
        // OSM `dist` is metres; the app works in yards.
        yards: tags.dist ? Math.round(Number(tags.dist) / 0.9144) : null,
        tee: { lat: coords[0][1], lng: coords[0][0] },
        green: { lat: coords.at(-1)[1], lng: coords.at(-1)[0] },
        path: coords,
      });
      continue;
    }

    const closed =
      coords.length > 3 &&
      coords[0][0] === coords.at(-1)[0] &&
      coords[0][1] === coords.at(-1)[1];

    features.push({
      type: "Feature",
      properties: { golf: kind, ref: tags.ref ?? null },
      geometry: closed
        ? { type: "Polygon", coordinates: [coords] }
        : { type: "LineString", coordinates: coords },
    });
  }

  holes.sort((a, b) => (a.number ?? 99) - (b.number ?? 99));

  const byKind = features.reduce((acc, f) => {
    acc[f.properties.golf] = (acc[f.properties.golf] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  · holes: ${holes.length}`);
  console.log(
    `  · features: ${Object.entries(byKind)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ") || "none"}`
  );

  if (!features.length && !holes.length) {
    console.log("  ! This course isn't mapped in OSM. Trace it at /golf/admin/course/trace/.");
    return false;
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    join(DATA_DIR, "course-geo.json"),
    JSON.stringify(
      {
        source: "OpenStreetMap contributors (ODbL)",
        fetchedFor: "The Trophy Club, Lebanon, IN",
        center: CENTER,
        bbox: BBOX,
        holes,
        features: { type: "FeatureCollection", features },
      },
      null,
      2
    )
  );
  console.log("  → app/golf/lib/course-geo.json");
  return true;
}

// ─── 3. Official scorecard ────────────────────────────────────────────────────

const CARD_SOURCES = [
  "https://thetrophyclubgolf.com/course/scorecard/",
  "https://course.bluegolf.com/bluegolf/course/course/trophyc/actual.htm",
  "https://www.golflink.com/golf-courses/in/lebanon/the-trophy-club",
];

async function fetchScorecard() {
  console.log("\n▸ Official scorecard");

  let launchChromium;
  try {
    ({ launchChromium } = await import("./chromium.mjs"));
  } catch {
    console.log("  ! Playwright not available; skipping.");
    return false;
  }

  const browser = await launchChromium();
  try {
    for (const url of CARD_SOURCES) {
      const page = await browser.newPage({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      });
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForTimeout(2500);

        // Pull every table that looks like a scorecard: a row of hole numbers
        // 1..9 or 1..18, plus at least one numeric row beneath it.
        const tables = await page.evaluate(() =>
          Array.from(document.querySelectorAll("table")).map((table) =>
            Array.from(table.querySelectorAll("tr")).map((tr) =>
              Array.from(tr.querySelectorAll("th,td")).map((c) => c.textContent.trim())
            )
          )
        );

        const candidate = tables.find((rows) =>
          rows.some((row) => {
            const nums = row.map(Number).filter((n) => Number.isFinite(n));
            return nums.length >= 9 && nums[0] === 1 && nums[1] === 2 && nums[2] === 3;
          })
        );

        if (candidate) {
          await mkdir(DATA_DIR, { recursive: true });
          await writeFile(
            join(DATA_DIR, "scorecard-raw.json"),
            JSON.stringify({ source: url, rows: candidate }, null, 2)
          );
          console.log(`  → app/golf/lib/scorecard-raw.json (from ${new URL(url).hostname})`);
          console.log("    Review it, then put the numbers into course.ts or /golf/admin/course/.");
          await page.close();
          return true;
        }
        console.log(`  · ${new URL(url).hostname}: no scorecard table found`);
      } catch (err) {
        console.log(`  · ${new URL(url).hostname}: ${err.message.split("\n")[0]}`);
      } finally {
        if (!page.isClosed()) await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log("  ! Couldn't read a scorecard. Fastest alternative: screenshot it from");
  console.log("    Hole19, or call the pro shop on (765) 482-7272, then enter it at");
  console.log("    /golf/admin/course/.");
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching course data for The Trophy Club, Lebanon, IN");
  console.log(`bbox ${BBOX.join(", ")}`);

  const results = {
    aerial: has("--skip-aerial") ? null : await fetchAerial().catch(() => false),
    geometry: has("--skip-geometry") ? null : await fetchGeometry().catch(() => false),
    scorecard: has("--skip-card") ? null : await fetchScorecard().catch(() => false),
  };

  console.log("\n─── Summary ───");
  for (const [key, ok] of Object.entries(results)) {
    console.log(`  ${ok === null ? "–" : ok ? "✓" : "✗"} ${key}`);
  }
  console.log("\nCommit anything written above, then redeploy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
