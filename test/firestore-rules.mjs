/*
 * Security-rules tests for the golf app.
 *
 *   npm run test:rules
 *
 * Needs Java and the Firestore emulator, which firebase-tools downloads on
 * first run (~130 MB). Not wired into CI for that reason — run it by hand when
 * firestore.rules changes, which is exactly when it earns its keep.
 *
 * The rules are the *only* thing standing between a team code and someone
 * else's data: there is no server. Reading them and agreeing they look right
 * is not the same as watching the emulator refuse the write.
 */
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TEAM = "team-alpha";
const OTHER = "team-beta";

const env = await initializeTestEnvironment({
  projectId: "rules-test",
  firestore: { host: "127.0.0.1", port: 8080, rules: readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "firestore.rules"), "utf8") },
});

// Seed: two teams, and a claim binding uid "player" to TEAM.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  for (const id of [TEAM, OTHER])
    await setDoc(doc(db, "golf-teams", id), {
      name: id === TEAM ? "Fairway Four" : "Bogey Boys",
      startHole: 12, players: ["A", "B", "C", "D"], active: true,
    });
  await setDoc(doc(db, "golf-claims", "player"), { teamId: TEAM, code: "CEDAREAGLE472" });
});

const player = env.authenticatedContext("player").firestore();
const stranger = env.authenticatedContext("nobody").firestore();
const anon = env.unauthenticatedContext().firestore();

const t = (name, fn) => fn().then(
  () => console.log("  PASS  " + name),
  (e) => { console.log("  FAIL  " + name + " — " + (e.message || e).slice(0, 110)); process.exitCode = 1; });

console.log("Team renaming its own name");
await t("own team, valid name", () =>
  assertSucceeds(updateDoc(doc(player, "golf-teams", TEAM), { name: "The Sandbaggers", updatedAt: "x" })));
await t("name only, no updatedAt", () =>
  assertSucceeds(updateDoc(doc(player, "golf-teams", TEAM), { name: "Short Game Kings" })));

console.log("\nWhat a team must NOT be able to do");
await t("rename another team", () =>
  assertFails(updateDoc(doc(player, "golf-teams", OTHER), { name: "Hacked" })));
await t("change its own starting hole", () =>
  assertFails(updateDoc(doc(player, "golf-teams", TEAM), { startHole: 1 })));
await t("smuggle startHole alongside a rename", () =>
  assertFails(updateDoc(doc(player, "golf-teams", TEAM), { name: "Nice Try", startHole: 1 })));
await t("rewrite its roster", () =>
  assertFails(updateDoc(doc(player, "golf-teams", TEAM), { players: ["Me", "Me", "Me", "Me"] })));
await t("remove itself from the outing", () =>
  assertFails(updateDoc(doc(player, "golf-teams", TEAM), { active: false })));
await t("delete its team", () =>
  assertFails(import("firebase/firestore").then(({ deleteDoc }) => deleteDoc(doc(player, "golf-teams", TEAM)))));
await t("create a new team", () =>
  assertFails(setDoc(doc(player, "golf-teams", "invented"), { name: "Ghost", startHole: 1, players: [], active: true })));

console.log("\nName validation");
await t("empty name refused", () =>
  assertFails(updateDoc(doc(player, "golf-teams", TEAM), { name: "" })));
await t("one character refused", () =>
  assertFails(updateDoc(doc(player, "golf-teams", TEAM), { name: "A" })));
await t("whitespace-only refused", () =>
  assertFails(updateDoc(doc(player, "golf-teams", TEAM), { name: "   " })));
await t("41 characters refused", () =>
  assertFails(updateDoc(doc(player, "golf-teams", TEAM), { name: "x".repeat(41) })));
await t("40 characters allowed", () =>
  assertSucceeds(updateDoc(doc(player, "golf-teams", TEAM), { name: "x".repeat(40) })));
await t("non-string refused", () =>
  assertFails(updateDoc(doc(player, "golf-teams", TEAM), { name: 42 })));

console.log("\nUsers with no claim");
await t("unclaimed signed-in user cannot rename", () =>
  assertFails(updateDoc(doc(stranger, "golf-teams", TEAM), { name: "Nope" })));
await t("anonymous visitor cannot rename", () =>
  assertFails(updateDoc(doc(anon, "golf-teams", TEAM), { name: "Nope" })));
await t("anyone can still read the leaderboard", () =>
  assertSucceeds(getDoc(doc(anon, "golf-teams", TEAM))));

await env.cleanup();
