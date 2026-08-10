# Stonegate Golf Outing — setup

The event app lives at **`/golf/`** on the existing JNS site. It's a Next.js
static export served by the same Firebase Hosting project, so it needs no new
domain, DNS, or deploy pipeline — pushing to `main` ships it.

- **Players:** `https://jnsconsulting.ai/golf/`
- **Organizers:** `https://jnsconsulting.ai/golf/admin/`

It's deliberately `noindex` and `Disallow`ed in `robots.txt`.

---

## 1. Firebase Console — one-time, and required

None of this can be done from the app. Without it, joining a team and scoring
won't work (the flyer content, course map and scorecard work regardless).

1. **Authentication → Sign-in method** — enable both:
   - **Anonymous.** This is how players score. Redeeming a team code signs the
     phone in anonymously; that anonymous uid is what the security rules bind a
     scorecard to. Without it, nobody can enter a score.
   - **Email/Password.** Organizers only.
2. **Authentication → Users** — add each organizer with a password.
3. **Verify each organizer's email.** The rules require
   `email_verified == true`, and an account created in the console is *not*
   verified. Send the verification email (Authentication → Users → ⋮ → Reset
   password / verification) or have them run through a verification flow once.
   This is not red tape: Firebase allows public self-signup as soon as
   Email/Password is enabled, so without the check anyone could register an
   account claiming an owner's address.
4. **Authentication → Settings → Authorized domains** — add `jnsconsulting.ai`.
5. **Security rules deploy themselves** on every push to `main`, via the
   `Deploy Firestore Rules` job. They are the golf app's only access control,
   so leaving them to a manual step meant they could lag the app that depends
   on them. To run it by hand:
   ```bash
   firebase deploy --only firestore:rules
   ```
   If that CI job fails with a permissions error, the hosting service account
   in `FIREBASE_SERVICE_ACCOUNT` needs the **Firebase Rules Admin** role
   (`roles/firebaserules.admin`) in the Google Cloud console. The site still
   deploys when this job fails — only the rules are held back.

### Who can administer

Owners are hard-coded in **`firestore.rules`** — that file is the only real
enforcement, because a static site has no server to check anything:

```
'hello@jnssolutions.ai',
'nikunjjadawala@nyu.edu',
'nvj208@nyu.edu'
```

`app/golf/lib/config.ts` carries the same list purely so the app knows whether
to render the admin UI. **Change both, or an owner will see an admin screen
whose every save is refused.**

Owners can add further organizers from `/golf/admin/` → *Access*, which writes
to the `golf-admins` collection — no deploy needed.

---

## 2. How team access works

There is no player sign-in. Each foursome gets an eight-character code, and the
captain's link carries it: `https://jnsconsulting.ai/golf/?code=ABCD2345`.

Making a shared secret enforceable without a server takes three collections:

| Collection | Who can read | Purpose |
|---|---|---|
| `golf-access/{CODE}` | anyone **who knows the code** (`get` allowed, `list` denied) | maps a code to a team |
| `golf-claims/{uid}` | only that uid | records which team this phone proved |
| `golf-team-codes/{teamId}` | organizers only | the codes, for the share links |

Redeeming a code signs the player in anonymously and writes a claim; the rules
re-check the code against `golf-access` at write time, so a forged claim naming
someone else's team is rejected. Scores are then writable only by a phone whose
claim names that exact team.

The trick that makes this work is that security rules may `get()` documents the
client itself cannot read — so a code never has to live on a publicly readable
document, and `list` being denied means the collection can't be walked to
harvest codes.

**Rotating a code** (admin → *New code*) invalidates the old link immediately.

---

## 3. Running the outing

| When | Where | What |
|---|---|---|
| Beforehand | `/golf/admin/` → Teams | Add each foursome and its starting hole for the shotgun. Each team gets a code; use **Copy team link** and text it to the captain. |
| Beforehand | Tell players | Open the link, tap **Add to Home Screen**. No sign-in, no email — the link carries the code and the phone remembers it. |
| During | Players | **Score** — one score per team per hole. Saves as they tap. |
| During | `/golf/admin/` → Scoring | Override or enter any team's card. Worth having someone at the scoring table regardless. |

---

## 4. Developing

```bash
npm run dev              # local dev server
npm run build            # static export into ./out
npm run golf:screenshot  # phone-sized screenshots into .screenshots/
npm run golf:icons       # regenerate PWA icons after editing the crest
```

### How it fits together

- `app/golf/GolfApp.tsx` — the player app: every screen, switched on the URL
  hash so the Android back button steps back instead of closing the PWA.
- `app/golf/CourseMap.tsx` — Leaflet over a self-hosted aerial, `CRS.Simple`.
- `app/golf/lib/` — `course.ts` (verified Trophy Club routing), `data.ts` (all
  Firestore access), `useScoreQueue.ts` (the offline write queue).
- `app/golf/golf.css` — the app's styles, imported from `app/golf/layout.tsx`
  **only**. Next chunks CSS per route, so these generic selectors ship to
  `/golf/**` and can't reach the marketing site. Don't import it anywhere else.
- `app/components/SiteChrome.tsx` — hides the JNS header and footer under
  `/golf`. Evaluated at build time, so the export is prerendered without them.
- `firestore.rules` — the actual access control.

### Things worth knowing

- **Static export.** No server, no API routes. Every dynamic thing is
  client-side Firebase, and the security rules are the only enforcement.
- **Scores are queued, not fired and forgotten.** `useScoreQueue` captures
  `{hole, strokes}` at the moment of the tap and mirrors the queue into
  `localStorage`, so losing signal on the twelfth — or closing the app — doesn't
  lose the score. It flushes on reconnect, on returning to the app, and on a
  timer.
- **The leaderboard tries `onSnapshot` first, then falls back to REST polling
  every 20 s.** Course wifi breaks streaming transports. An empty *cached*
  snapshot is ignored rather than treated as "no teams" — otherwise losing
  signal would blank the board.
- **`Permissions-Policy` in `firebase.json` must keep `geolocation=(self)`.**
  A bare `geolocation=()` blocks the yards-to-the-green readout outright, before
  the browser ever asks the player.
- **iOS can't be prompted to install.** Safari never fires
  `beforeinstallprompt`, so iPhone users get Share → Add to Home Screen
  instructions instead. There's no way around it.
- **Hero imagery.** The design originally hotlinked photos from the golf
  course's own WordPress. It now uses the public-domain USDA/USGS aerial this
  app self-hosts. To use a real course photo, get one you're licensed to use,
  add it to `public/golf/` and to `SHELL_URLS` in `public/golf/sw.js`, and
  change the `url()` references at the end of `app/golf/golf.css`.
