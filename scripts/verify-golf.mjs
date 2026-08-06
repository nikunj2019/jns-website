/**
 * End-to-end verification of the golf app against the static export.
 *
 *   npm run build && node scripts/verify-golf.mjs
 *
 * Serves ./out locally and drives it with a real browser at phone size. All
 * outbound requests except localhost are blocked, so the run is deterministic
 * and doubles as an offline test — with two exceptions that are stubbed:
 * Firestore reads (fixture data) and map tiles.
 *
 * The GPS fixture uses synthetic coordinates near the clubhouse. It exercises
 * the distance and camera code; it is not course data.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serveOut } from "./screenshot-golf.mjs";
import { launchChromium } from "./chromium.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4455;
const BASE = `http://localhost:${PORT}`;

// ─── Fixture ──────────────────────────────────────────────────────────────────

const ME = { lat: 40.096, lng: -86.533 };
/** Due north of ME. Distance is computed independently below and compared. */
const GREEN_1 = { lat: 40.0985, lng: -86.533 };

const EARTH_R = 6_371_008.8;
const rad = (d) => (d * Math.PI) / 180;
function haversineYards(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(rad(a.lat)) * Math.cos(rad(b.lat));
  return (2 * EARTH_R * Math.asin(Math.sqrt(h))) / 0.9144;
}

const latlng = (p) => ({
  mapValue: { fields: { lat: { doubleValue: p.lat }, lng: { doubleValue: p.lng } } },
});

const fixtureHoles = Array.from({ length: 18 }, (_, i) => ({
  mapValue: {
    fields: {
      number: { integerValue: String(i + 1) },
      tee: latlng({ lat: ME.lat + i * 0.001, lng: ME.lng + i * 0.0006 }),
      green: latlng({ lat: GREEN_1.lat + i * 0.001, lng: GREEN_1.lng + i * 0.0006 }),
    },
  },
}));

const fixtureTeams = [
  { id: "team-a", name: "Fairway Legends", strokes: { 1: 4, 2: 4, 3: 5 } },
  { id: "team-b", name: "Mulligans", strokes: { 1: 3, 2: 5, 3: 4 } },
];

function teamDoc(t) {
  return {
    name: `p/d/documents/golf-teams/${t.id}`,
    fields: {
      name: { stringValue: t.name },
      players: {
        arrayValue: {
          values: [
            { mapValue: { fields: { name: { stringValue: "A Player" } } } },
            { mapValue: { fields: { name: { stringValue: "B Player" } } } },
          ],
        },
      },
      playerEmails: { arrayValue: { values: [{ stringValue: "a@example.com" }] } },
    },
  };
}

function scoreDoc(t) {
  return {
    name: `p/d/documents/golf-scores/${t.id}`,
    fields: {
      strokes: {
        mapValue: {
          fields: Object.fromEntries(
            Object.entries(t.strokes).map(([k, v]) => [k, { integerValue: String(v) }])
          ),
        },
      },
    },
  };
}

// ─── Harness ──────────────────────────────────────────────────────────────────

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

/** Routes fulfilled with fixtures; everything else off-localhost is aborted. */
async function installRoutes(context, { withFixtures = true } = {}) {
  await context.route("**", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "localhost") return route.continue();

    if (withFixtures && url.hostname === "firestore.googleapis.com") {
      // Let the streaming listener fail, so this exercises the REST polling
      // fallback — the path that actually runs on flaky course wifi. Stubbing
      // the channel instead would deliver an empty snapshot that legitimately
      // overwrites the REST data.
      if (url.pathname.includes("/Listen/channel")) return route.abort();

      const json = (body) =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

      if (url.pathname.endsWith("golf-course/trophy-club")) {
        return json({
          name: "p/d/documents/golf-course/trophy-club",
          fields: { holes: { arrayValue: { values: fixtureHoles } } },
        });
      }
      if (url.pathname.endsWith("/golf-teams")) {
        return json({ documents: fixtureTeams.map(teamDoc) });
      }
      if (url.pathname.endsWith("/golf-scores")) {
        return json({ documents: fixtureTeams.map(scoreDoc) });
      }
      return json({});
    }

    return route.abort();
  });
}

const ALL_ROUTES = [
  "/golf/",
  "/golf/info/",
  "/golf/sponsors/",
  "/golf/leaderboard/",
  "/golf/teams/",
  "/golf/course/",
  "/golf/course/scorecard/",
  "/golf/course/hole/1/",
  "/golf/course/hole/18/",
  "/golf/score/",
  "/golf/auth/",
  "/golf/admin/",
];

async function main() {
  if (!existsSync(join(ROOT, "out", "golf", "index.html"))) {
    console.error("out/golf/ is missing — run `npm run build` first.");
    process.exit(1);
  }

  const server = await serveOut(PORT);
  const browser = await launchChromium();

  try {
    // ── 1. Static export shape ──────────────────────────────────────────────
    console.log("\n▸ Static export");
    for (const n of [1, 6, 18]) {
      check(
        `hole ${n} prerendered`,
        existsSync(join(ROOT, "out", "golf", "course", "hole", String(n), "index.html"))
      );
    }
    const golfHtml = await readFile(join(ROOT, "out", "golf", "index.html"), "utf8");
    // The marketing header renders these nav links on every non-golf page.
    check(
      "golf page has no JNS marketing nav",
      !/>\s*Services\s*</.test(golfHtml) && !/aria-label="JNS Consulting, Home"/.test(golfHtml)
    );
    check("golf page carries the dark shell", golfHtml.includes("golf-root"));
    check(
      "golf page has its own share card",
      /property="og:title"\s+content="Annual Stonegate/.test(golfHtml)
    );
    const homeHtml = await readFile(join(ROOT, "out", "index.html"), "utf8");
    check("marketing home unaffected", !homeHtml.includes("golf-root"));
    check("golf is noindex", /noindex/.test(golfHtml));
    const robots = await readFile(join(ROOT, "public", "robots.txt"), "utf8");
    check("robots disallows /golf/", robots.includes("Disallow: /golf/"));

    // ── 2. PWA assets ───────────────────────────────────────────────────────
    console.log("\n▸ PWA");
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await installRoutes(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/golf/`, { waitUntil: "load" });

    const manifestHref = await page.getAttribute('link[rel="manifest"]', "href");
    check("manifest is linked", manifestHref === "/golf/manifest.webmanifest", manifestHref ?? "");

    const manifest = await page.evaluate(async (href) => {
      const res = await fetch(href);
      return res.ok ? res.json() : null;
    }, manifestHref);
    check("manifest parses", Boolean(manifest));
    check("start_url scoped to /golf/", manifest?.start_url === "/golf/");
    check("scope is /golf/", manifest?.scope === "/golf/");
    check("standalone display", manifest?.display === "standalone");
    check("has a maskable icon", manifest?.icons?.some((i) => i.purpose === "maskable"));

    const iconStatuses = await page.evaluate(async (icons) => {
      const out = {};
      for (const icon of icons) out[icon.src] = (await fetch(icon.src)).status;
      return out;
    }, manifest?.icons ?? []);
    check(
      "all manifest icons resolve",
      Object.values(iconStatuses).every((s) => s === 200),
      JSON.stringify(iconStatuses)
    );

    const appleIcon = await page.evaluate(
      async () => (await fetch("/golf/icons/apple-touch-icon.png")).status
    );
    check("apple-touch-icon resolves", appleIcon === 200);

    const swStatus = await page.evaluate(async () => (await fetch("/golf/sw.js")).status);
    check("service worker file served", swStatus === 200);

    // MapLibre must not be in the home page's bundle.
    const homeScripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll("script[src]")).map((s) => s.src)
    );
    const homeBundles = await Promise.all(
      homeScripts.map(async (src) => {
        const res = await fetch(src);
        return res.ok ? (await res.text()).includes("maplibre") : false;
      })
    );
    check("MapLibre is lazy-loaded (absent from home bundle)", !homeBundles.some(Boolean));

    await page.close();
    await ctx.close();

    // ── 3. Leaderboard with fixture scores ──────────────────────────────────
    console.log("\n▸ Leaderboard");
    const lbCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await installRoutes(lbCtx);
    const lb = await lbCtx.newPage();
    await lb.goto(`${BASE}/golf/leaderboard/`, { waitUntil: "load" });
    await lb.waitForTimeout(2500);
    const lbText = await lb.innerText("body");

    check("both fixture teams listed", /Fairway Legends/.test(lbText) && /Mulligans/.test(lbText));
    // team-b: 3+5+4 = 12 over par 4+5+4 = 13 → −1, ahead of team-a's 4+4+5 = 13 → E.
    const order = lbText.indexOf("Mulligans") < lbText.indexOf("Fairway Legends");
    check("lower score ranks first", order, "Mulligans (−1) above Fairway Legends (E)");
    check("to-par rendered", /-1/.test(lbText) && /\bE\b/.test(lbText));
    check("thru column rendered", /\b3\b/.test(lbText));
    await lb.close();
    await lbCtx.close();

    // ── 4. Course map + GPS ─────────────────────────────────────────────────
    console.log("\n▸ Course map and GPS");
    const mapCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ["geolocation"],
      geolocation: { latitude: ME.lat, longitude: ME.lng, accuracy: 5 },
    });
    await installRoutes(mapCtx);
    const mapPage = await mapCtx.newPage();
    await mapPage.goto(`${BASE}/golf/course/`, { waitUntil: "load" });
    await mapPage.waitForTimeout(4000);

    const markerCount = await mapPage.locator(".golf-hole-marker").count();
    check("18 hole markers rendered", markerCount === 18, `${markerCount} found`);
    check("map canvas present", (await mapPage.locator("canvas").count()) > 0);

    // GPS is opt-in, so nothing is detected until the player enables it.
    await mapPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      buttons.find((b) => /Show my distances/i.test(b.textContent ?? ""))?.click();
    });
    await mapPage.waitForTimeout(2500);

    // With a fix, the app should jump to hole 1 — its green is nearest to ME.
    // Getting this right is what makes a shotgun start work.
    const panel = await mapPage.innerText("body");
    check("auto-detected the nearest hole", /Hole 1\b/.test(panel), "shotgun-start safe");

    const expected = Math.round(haversineYards(ME, GREEN_1));
    const shown = await mapPage.innerText("body");
    const nearExpected = [expected - 1, expected, expected + 1].some((v) =>
      new RegExp(`\\b${v}\\b`).test(shown)
    );
    check(
      "GPS yardage matches an independent haversine",
      nearExpected,
      `expected ~${expected} yds to hole 1 green`
    );

    await mapPage.screenshot({ path: join(ROOT, ".screenshots", "verify-course.png") });
    await mapPage.close();
    await mapCtx.close();

    // ── 5. Location denied ──────────────────────────────────────────────────
    console.log("\n▸ Location denied");
    const denyCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await denyCtx.grantPermissions([]);
    await installRoutes(denyCtx);
    const deny = await denyCtx.newPage();
    const denyErrors = [];
    deny.on("pageerror", (e) => denyErrors.push(e.message));
    await deny.goto(`${BASE}/golf/course/`, { waitUntil: "load" });
    await deny.waitForTimeout(3000);
    await deny.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      buttons.find((b) => /Show my distances/i.test(b.textContent ?? ""))?.click();
    });
    await deny.waitForTimeout(2500);
    check("map still renders without location", (await deny.locator("canvas").count()) > 0);
    check("no crash when location is refused", denyErrors.length === 0, denyErrors[0] ?? "");
    await deny.close();
    await denyCtx.close();

    // ── 6. Offline app shell ────────────────────────────────────────────────
    console.log("\n▸ Offline");
    const offCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await installRoutes(offCtx);
    const off = await offCtx.newPage();
    await off.goto(`${BASE}/golf/`, { waitUntil: "load" });
    await off.waitForTimeout(1200);
    await offCtx.setOffline(true);
    await off.reload({ waitUntil: "load" }).catch(() => {});
    await off.waitForTimeout(1500);
    const offlineText = await off.innerText("body").catch(() => "");
    check(
      "app shell survives going offline",
      /Stonegate/i.test(offlineText),
      offlineText ? "" : "page was blank"
    );
    await offCtx.setOffline(false);
    await off.close();
    await offCtx.close();

    // ── 7. Every route, console-clean ───────────────────────────────────────
    console.log("\n▸ All routes");
    const allCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await installRoutes(allCtx);
    const noisy = [];
    for (const route of ALL_ROUTES) {
      const p = await allCtx.newPage();
      const errs = [];
      p.on("pageerror", (e) => errs.push(e.message));
      await p.goto(`${BASE}${route}`, { waitUntil: "load" });
      await p.waitForTimeout(route.includes("course/") ? 3000 : 900);
      if (errs.length) noisy.push(`${route}: ${errs[0]}`);
      await p.close();
    }
    check("no uncaught errors on any route", noisy.length === 0, noisy.join(" | "));
    await allCtx.close();
  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n─── ${results.length - failed.length}/${results.length} checks passed ───`);
  if (failed.length) {
    for (const f of failed) console.log(`  ✗ ${f.name} ${f.detail}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
