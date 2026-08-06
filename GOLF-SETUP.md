# Stonegate Golf Scramble — setup

The event app lives at **`/golf/`** on the existing JNS site. It's a Next.js
static export served by the same Firebase Hosting project, so it needs no new
domain, DNS, or deploy pipeline — pushing to `main` ships it.

- **Players:** `https://jnsconsulting.ai/golf/`
- **Organizers:** `https://jnsconsulting.ai/golf/admin/`

It's deliberately `noindex` and `Disallow`ed in `robots.txt`, because it
publishes a home address and a personal mobile number for RSVPs.

---

## 1. Firebase Console — one-time, and required

None of this can be done from the app. Without it, sign-in and scoring won't work
(everything else — the flyer content, the course map, the scorecard — works
regardless).

1. **Authentication → Sign-in method**
   - Enable **Email/Password** (organizers).
   - Enable **Email link (passwordless sign-in)** (players). It's a checkbox
     inside the Email/Password provider.
2. **Authentication → Settings → Authorized domains**
   - Add `jnsconsulting.ai`. Magic links are rejected from any other domain.
3. **Authentication → Users**
   - Add each organizer with a password. Those addresses must also appear in
     `firestore.rules` (see below) or their writes will be refused.
4. **Deploy the security rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```
   The GitHub Actions workflow deploys hosting only, so this is manual whenever
   `firestore.rules` changes.

### Admin allowlist

Organizer emails are hard-coded in `firestore.rules`:

```
'nvj208@nyu.edu',
'ccondict@hanover.com'
```

Edit that list and redeploy the rules to change who can administer the outing.
This is the real access control — the admin login screen is only a convenience,
since a static site can't stop anyone loading a page.

---

## 2. Course data

The app ships with a **provisional** par-72 routing. The course total (par 72,
7,208 yards) and holes 2, 5, and 6 are verified from public sources; the rest is
a stand-in, and the app says so on the scorecard and hole pages until it's
replaced.

**Fastest fix — the scorecard.** Screenshot it from Hole19 (or photograph the
paper card from the pro shop, (765) 482-7272) and type it into
`/golf/admin/course/`. Tick *"These numbers are the official card"* and the
unofficial notice disappears everywhere. No redeploy.

**The map.** Two things are missing until you do one of the following: aerial
imagery, and per-hole tee/green coordinates. Without coordinates the map shows no
yardages — by design, rather than inventing numbers.

```bash
npm run golf:course-data
```

⚠️ **Run this from a normal network** — a laptop, not a CI sandbox. It:

1. Downloads **USGS NAIP** aerial imagery (public domain) for the course
   bounding box into `public/golf/tiles/`.
2. Queries **OpenStreetMap** via Overpass for golf geometry — greens, fairways,
   bunkers, water, and per-hole ways with par/handicap/distance tags. Coverage
   varies by course; if The Trophy Club isn't mapped, it says so.
3. Tries to read the official scorecard with a real browser.

Commit whatever it writes, then push. If OSM has nothing, trace the course
yourself at **`/golf/admin/course/trace/`** — click each green and tee (about 15
minutes from a desk on the satellite view), and optionally outline fairways,
bunkers, and the creek. On a phone at the course there's a *"use my location"*
button for each point. Everything saves to Firestore, so it's one-time and
survives deploys.

Sanity check: stand on a tee with Hole19 open and compare its yardage to ours.

---

## 3. Running the outing

| When | Where | What |
|---|---|---|
| Beforehand | `/golf/admin/teams/` | Add each foursome. **A player can only score for a team their email is listed on** — that's enforced in the security rules, so the roster emails matter. Set starting holes for the shotgun. |
| Beforehand | Tell players | Open `/golf/`, tap **Add to Home Screen**, and **sign in before leaving for the course**. The magic-link email is the only step that needs a data connection, and it can land in spam. |
| Shotgun | `/golf/admin/` | Set status to **Live** and turn **Scoring open** on. |
| During | Players | `/golf/score/` — one score per team per hole. Saves as they tap. |
| During | `/golf/admin/scores/` | Override or enter any team's card. This is the fallback for a dead phone or an email that never arrived — worth having someone at the scoring table regardless. |
| After | `/golf/admin/` | Set status to **Final**. |

---

## 4. Developing

```bash
npm run dev              # local dev server
npm run build            # static export into ./out
npm run golf:verify      # 31 end-to-end checks against ./out (needs a build first)
npm run golf:screenshot  # phone-sized screenshots into .screenshots/
npm run golf:icons       # regenerate PWA icons after editing the crest
```

`npm run golf:verify` covers the export shape, chrome isolation, PWA manifest and
icons, offline app shell, leaderboard maths, GPS distances against an independent
haversine, and the location-denied path. It stubs Firestore with fixtures and
blocks all other network access, so it runs anywhere.

### How it fits together

- `app/golf/` — the app. `lib/` holds event and course data, geo maths, and the
  Firestore hooks; `components/` holds shared UI and the map.
- `app/components/SiteChrome.tsx` — hides the JNS header and footer under
  `/golf`. Evaluated at build time, so the export is prerendered without them.
- `public/golf/` — manifest, service worker, icons, and aerial tiles.
- `firestore.rules` — the actual access control.

### Things worth knowing

- **Static export.** No server, no API routes. Every dynamic thing is
  client-side Firebase, and the security rules are the only enforcement.
- **The leaderboard tries `onSnapshot` first, then falls back to REST polling
  every 20 s.** Course wifi breaks streaming transports, and this repo already
  had trouble with Firestore's WebChannel. An empty *cached* snapshot is ignored
  rather than treated as "no teams" — otherwise losing signal would blank the
  board.
- **iOS can't be prompted to install.** Safari never fires
  `beforeinstallprompt`, so iPhone users get Share → Add to Home Screen
  instructions instead. There's no way around it.
- **GPS is opt-in and off by default**, and suspends when the page is
  backgrounded — `watchPosition` over a four-hour round is a real battery cost.
  Yardages are hidden when the fix is worse than ±25 m.
