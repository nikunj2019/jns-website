import { existsSync } from "node:fs";
import { chromium } from "playwright";

/**
 * Launches Chromium, preferring a browser already present on the machine.
 *
 * CI images and sandboxes often ship a Chromium build that doesn't match the
 * revision this Playwright version would download, and downloading may not be
 * possible at all. Pointing `executablePath` at the installed binary keeps these
 * scripts runnable without a `playwright install` step; when nothing is
 * pre-installed we fall back to Playwright's own managed browser.
 */
const CANDIDATES = [
  process.env.CHROMIUM_PATH,
  "/opt/pw-browsers/chromium",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].filter(Boolean);

export function findChromium() {
  return CANDIDATES.find((p) => existsSync(p));
}

export function launchChromium(options = {}) {
  const executablePath = findChromium();
  return chromium.launch({
    ...options,
    ...(executablePath ? { executablePath } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage", ...(options.args ?? [])],
  });
}
