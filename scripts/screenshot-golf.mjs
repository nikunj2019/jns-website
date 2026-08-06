/**
 * Screenshots the golf app from the static export, for visual review.
 *
 *   npm run build && node scripts/screenshot-golf.mjs [route ...]
 *
 * Serves ./out on a local port and captures each route at phone width.
 */
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChromium } from "./chromium.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const SHOTS = join(ROOT, ".screenshots");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

export function serveOut(port = 4321) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${port}`);
      let path = join(OUT, decodeURIComponent(url.pathname));
      if (existsSync(path) && !extname(path)) path = join(path, "index.html");
      else if (!existsSync(path) && existsSync(`${path}.html`)) path = `${path}.html`;
      if (!existsSync(path)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = await readFile(path);
      res.writeHead(200, { "Content-Type": MIME[extname(path)] ?? "application/octet-stream" });
      res.end(body);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

const DEFAULT_ROUTES = ["/golf/", "/golf/info/", "/golf/sponsors/"];

async function main() {
  const routes = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROUTES;
  await mkdir(SHOTS, { recursive: true });

  const port = 4321;
  const server = await serveOut(port);
  const browser = await launchChromium();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // Nothing outside the static export should be needed to render a page. Failing
  // these fast keeps the harness deterministic and doubles as an offline check.
  await context.route("**", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "localhost") return route.continue();
    return route.abort();
  });

  const errors = [];
  for (const route of routes) {
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`${route}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => errors.push(`${route}: ${err.message}`));

    await page.goto(`http://localhost:${port}${route}`, {
      waitUntil: "load",
      timeout: 30_000,
    });
    // Long enough for lazily-imported chunks (the map) to mount and settle.
    await page.waitForTimeout(2500);

    const name = route.replace(/\//g, "_").replace(/^_|_$/g, "") || "home";
    await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
    console.log(`  ✓ ${route} → .screenshots/${name}.png`);
    await page.close();
  }

  await browser.close();
  server.close();

  if (errors.length) {
    console.log("\nConsole errors:");
    for (const e of errors) console.log(`  ✗ ${e}`);
  } else {
    console.log("\nNo console errors.");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
