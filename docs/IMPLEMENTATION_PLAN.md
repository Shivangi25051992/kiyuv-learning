# Kiyuv Learning Production Plan

Nov 10, 2026 · @Vinod Kumar Palanisamy

Move to Firestore first: it is low-risk because both databases hold no data today. Then replace the browser-only PIN, which currently protects nothing, before adding any other feature. A free launch should cost about $0 a month up to roughly 4,000 daily users.

**Status update (2026-11-10).** The Phase 1 code changes to `public/index.html`, `public/sw.js`, `firebase.json`, `firestore.rules` and `firestore.indexes.json` are merged into `main` but not deployed. D1 is resolved: this is a fresh start, with no migration from `kids-playground-5b055`. A new requirement was added: a simple onboarding form and a "Who's learning?" multi-profile experience, where several children share one parent account across different devices. It touches Phases 1 to 7 and adds decision D8.

## Where things stand

The app is one 1,628-line HTML file, and neither database holds any user data. These findings come from reading the repo and the live `kiyuv-learning` project on 2026-11-10.

| Area | Finding | What it means |
| --- | --- | --- |
| Postgres data | All 6 SQL Connect tables have 0 rows. | No row migration is needed. Only code moves. |
| Firestore data | The database has 0 collections. It is Standard edition, `asia-south1`, on the free tier. Delete protection and point-in-time recovery are off. | The final data model can be used from day one. |
| Cloud SQL | Instance `kiyuv-learning-fdc` exists in `asia-south1`. Its tier and trial status could not be read because `gcloud` is not installed. | It must be deleted separately from the SQL Connect service. |
| Parent PIN | Stored as plain text in `localStorage` under `kidsAcad_session`. Compared in the browser. Can be skipped. | It provides no security. The Firebase session stays valid without it. |
| Firestore rules | Owner-only access, but no field validation or write limits. | A signed-in user can write any shape or size of data to their own tree. |
| Write frequency | Saves fire 1.5 seconds after each answer, usually as 2 Firestore writes. Each save also upserts every played topic to Postgres. | About 80 writes per child per day at 40 answers. This is the main cost driver. |
| Reset | `resetProgress` clears Postgres only. | Reset progress comes back from Firestore at next login. This is a live bug. |
| Curriculum | SQL tables are empty. Content is in JavaScript constants. The catalog queries are defined but never called. | There is no catalog to migrate. |
| Personal data in code | Children's first names appear on 33 lines across 4 public files. Ages appear in the code and README. | Remove before any public release. |
| Web platform | No Content-Security-Policy. No build, tests or CI. HTML cache rules miss clean URLs: `/simple` is served with `max-age=3600`. | Addressed in Phases 2 and 3. |
| Layout | One 600px breakpoint, `user-scalable=no`, and a portrait-locked manifest. | Tablets and accessibility need real work. |
| Native apps | Only one web app is registered in Firebase. | Android and iOS apps must be registered. |
| Repo | Root is `C:\Kiyuv\kiyuv-learning`, with an empty inner `kiyuv-learning` folder. The GitHub remote is under another account. Its visibility could not be checked. | Run all commands from the outer folder. |

`public/simple.html` is a separate, unauthenticated playground with its own local progress. It has no cloud sync.

## Decisions needed

D1 is resolved. The rest block the phase shown. The plan assumes the recommended option unless you say otherwise.

| ID | Decision | Recommended | Why | Blocks |
| --- | --- | --- | --- | --- |
| D1 | Does real progress in the old project, `kids-playground-5b055`, need to be kept? | **Resolved: fresh start.** No data is migrated. Shut that project down when convenient. | Decided by the owner on 2026-11-10. | Nothing |
| D2 | Where should curriculum and questions live? | Ship them as versioned JSON in the app, not in Firestore. | They are not user data. Firestore would charge a read per question. This narrows "everything to Firestore" to user data. | Phase 2 |
| D3 | PIN length and scope | 6 digits, required for every account, unlocking a device for 12 hours. | 4 digits has 10,000 combinations. Parent-only actions need a PIN from the last 5 minutes. | Phase 3 |
| D4 | Which Apple store category? | Decide with counsel. Default to Education, age-rated for parents and children, with all kids-safe rules applied anyway. | Kids Category limits third-party data flows, and Google sign-in needs review against that. | Phase 6 |
| D5 | Parental consent method and privacy review | Hire a children's-privacy lawyer before public launch. | COPPA, India's DPDP Rules and GDPR apply differently. This plan is not legal advice. | Phase 4 |
| D6 | Repo visibility and history | Make the repo private and scrub children's names from history. | History rewrites affect everyone with a clone. | Phase 2 |
| D7 | Automatic stop at what spend? | Block writes at $25 a month. Remove billing only at $100. | Removing billing can take the whole app offline and risks data. | Phase 7 |
| D8 | What does each onboarding field collect, and what is it used for? | Name: first name only, shown to the parent only. Nickname: shown to the child. Age: whole years, 2 to 13, never a birthdate. Country: ISO code. State: optional, region only, never city or address. Colour: one of 8 fixed choices. | The form is called non-PII, but name, age, country and state together are personal information under COPPA and DPDP. Each field needs a stated purpose or it is dropped. Counsel confirms in D5. | Phase 1 deploy, Phase 4 |

## Phases at a glance

The full programme is about 7.5 to 11 weeks with an agent doing the work and one person reviewing. Estimates are judgment calls, not measurements. Phases 5 and 6 can overlap.

| Phase | Outcome | Estimate | Human gate before the next phase |
| --- | --- | --- | --- |
| 1. Firestore only | SQL Connect and Cloud SQL are gone. Writes are cut by about 90%. The kid schema carries the onboarding fields. | 2 to 3 days | Approve deleting the service and instance. |
| 2. Codebase | TypeScript app, tests, CI, separate dev and production projects, onboarding form and "Who's learning?" picker. | 1.5 to 2.5 weeks | Review the structure and the dev deploy. |
| 3. Sign-in and security | Real sign-in, server-verified PIN, strict rules, App Check, and profile-aware rules. | 2 weeks | Independent security review. |
| 4. Privacy | Consent per child profile, data export, profile and account deletion, retention. | 1 week | Lawyer sign-off. |
| 5. Phone and tablet | Layouts, picker and colour themes pass the device matrix and accessibility checks. | 1 week | Test on real devices. |
| 6. Native apps | Android and iOS builds in internal testing, then store review. | 1 to 2 weeks, plus review time | Store accounts and final listing approval. |
| 7. Guardrails and launch | Spend controls tested, monitoring on, staged rollout. | 3 to 4 days | Go or no-go. |

Budget alerts are set up in Phase 1 as well, because Blaze billing is already on.

## Target architecture

One TypeScript web codebase ships to web, Android and iOS, with Firestore for user data and a few Cloud Functions for anything that must not be trusted to the device.

| Layer | Choice | Reason |
| --- | --- | --- |
| Client | React, TypeScript and Vite. Use current stable versions. | Replaces global scripts and inline handlers, and allows a strict CSP. |
| Native shell | Capacitor, with assets bundled in the app. | One codebase. Bundling also avoids per-user Hosting transfer. |
| Database | Cloud Firestore, Standard edition, `asia-south1`. | Already provisioned and on the free tier. |
| Server logic | Cloud Functions 2nd gen, `asia-south1`, callable only. | PIN checks, account deletion and data export need a trusted server. |
| Identity | Firebase Auth: Google, Apple, and email with verification. | Parents sign in. Children have no accounts; each child is a profile under the parent account. |
| Active profile | Chosen per device and kept in local storage (Capacitor Preferences in the apps). Never stored in Firestore. | Lets each device run a different child at the same time with no shared "current child" to fight over. |
| App integrity | App Check: reCAPTCHA Enterprise, Play Integrity, App Attest. | Rejects most traffic that is not from your apps. |
| Content | Versioned JSON packs and math generators in the bundle. | No database reads for questions, and full offline play. |

### Repository layout

```text
apps/client/            React app, Capacitor config, android/, ios/
  src/app/              routing, providers, error boundary
  src/features/         auth, pin, onboarding, profiles, play, progress, parent, consent
  src/lib/firebase/     the only code that imports Firebase SDKs
  src/lib/sync/         local-first queue and merge logic
packages/shared/        Zod schemas, types, limits, used by client and functions
packages/content/       question packs, generators, curriculum map, badges
functions/              callable functions and scheduled jobs
firebase/               firestore.rules, firestore.indexes.json, rules tests
.github/workflows/      lint, typecheck, test, build, deploy
docs/                   threat model, runbooks, retention policy
```

### Firestore data model

Each family needs one profile document and one document per child. All topic progress sits in the child document as a map, so opening the app costs a few reads rather than hundreds.

| Current Postgres item | Firestore location | Notes |
| --- | --- | --- |
| `User` | `users/{uid}` | Keep `createdAt`, `lastActiveDate`, `schemaVersion`, `locale`, `resetEpoch`. Drop email, name and photo; read them from Auth. |
| `KidProfile` | `users/{uid}/kids/{kidId}` | `kidId` is `k1` to `k6`, which caps children per family with no extra read. One document per child, so two children on two devices never write the same document. Store the onboarding fields below, plus avatar emoji, age band, track, stats, badges. |
| `TopicProgress` | `topics` map in the kid document | Key is `topicId`. Fields shortened to `p`, `c`, `b`, `m`. Exempt `topics` from indexing. |
| `CurriculumSubject`, `CurriculumTopic`, `QuestionBankItem` | `packages/content` JSON | Empty tables. See D2. |
| None (new) | `pinSecrets/{uid}` | Server only. Clients are denied all access. |
| None (new) | `consents/{uid}/records/{id}` | Written only by functions. Parents can read their own. |

Add this to `firestore.indexes.json`:

```json
{
  "indexes": [],
  "fieldOverrides": [
    { "collectionGroup": "kids", "fieldPath": "topics", "indexes": [] }
  ]
}
```

A kid document stays far under the 1 MiB limit, even at several hundred topics.

#### Onboarding profile fields

The onboarding form collects six fields and no email, phone, address, school, photo or birthdate. Treat them as personal information anyway, not as "non-PII". See D8.

| Field | Stored as | Limits and purpose |
| --- | --- | --- |
| Name | `name`, string | First name only, 1 to 30 characters. Shown only in the parent area. Optional if counsel prefers (D8). |
| Nickname | `nickname`, string | 1 to 20 characters. The only name the child sees, on the picker and leaderboard. |
| Age | `age`, whole number | 2 to 13 years. `ageBand` is computed from it and must agree. No birthdate is ever stored. |
| Country | `country`, string | Two-letter ISO code from a fixed list. Sets locale and content defaults. |
| State | `state`, string | Region name or code from the chosen country's list, or empty. Never a city, postcode or address. |
| Favourite colour | `favColor`, string | One of 8 fixed keys, such as `blue` or `rose`. Each maps to a theme whose contrast has been checked (task 5.7). Not free text. |

The form is entered by the parent, never by the child, and sits behind the PIN. Names, nicknames and ages are never written to logs, URLs, analytics or error reports.

#### Profiles, devices and the active child

- One parent account has up to 6 child profiles, `k1` to `k6`. A new profile takes the lowest free slot.
- The active child is chosen per device. It is saved in local storage under `activeKid:{uid}` and is never written to Firestore, so one child switching profile cannot move another child's device.
- A device that is not signed in, or whose unlock has expired, shows the parent sign-in and PIN first. Once unlocked, it shows the "Who's learning?" picker.
- Switching profile needs no PIN, so the children can swap on a shared tablet. Creating, editing or deleting a profile, and resetting progress, need a PIN entered in the last 5 minutes.
- Every device keeps its own offline queue, keyed by `kidId`.

#### Syncing one child across devices

Nothing listens for changes. Each device reads its active child's document at start, on returning to the foreground, and before each flush.

- A flush is a transaction on that one kid document: read it, merge, write. That is 1 read and 1 write.
- Merge rules: take the larger of `stars`, `bestStreak`, `totalCorrect` and `totalWrong`. Per topic, keep the higher `p`, `c` and `b`. Union `badges`. Take the newer value for profile fields.
- A higher `resetEpoch` always wins over local progress, as in Phase 1.
- Children on different profiles never touch the same document, so they cannot overwrite each other.
- Two devices on the same child can only lose a few seconds of unflushed play. A dropped write is retried after the 5-second spacing rule.

### Operation mapping

| SQL Connect operation | Firestore replacement | Reads and writes |
| --- | --- | --- |
| `UpsertParentProfile` | `setDoc(users/{uid}, ..., {merge:true})`, at most once per day | 1 write |
| `UpsertKidProgress` plus every `UpsertTopicProgress` | One `setDoc` on the kid document | 1 write per finished topic |
| `GetKidProgress` | Not needed separately; the family load returns it | 0 |
| `GetMyFamilyDashboard` | `getDoc(users/{uid})` plus `getDocs(kids)`. Also fills the "Who's learning?" picker. | 1 + children |
| None (new): create or edit a profile | `setDoc` on the kid document, PIN under 5 minutes old | 1 write |
| None (new): delete a profile | `deleteDoc` on the kid document, PIN under 5 minutes old | 1 delete |
| None (new): switch profile | Local only. Then read that child's document if it is not cached. | 0 to 1 |
| `ResetMyKidsProgress` | Batch zeroing kid documents and incrementing `resetEpoch` | 1 + children |
| `GetCurriculumByTrack`, `GetTopicQuestions` | Import from `packages/content` | 0 |

Do not use real-time listeners. Nothing in this app needs them, and one-time reads keep costs predictable.

## Rules for the executing agent

Follow these in every phase. A task is done only when its acceptance check has been run and the output recorded.

1. Work from `C:\Kiyuv\kiyuv-learning`, on one branch per phase, with one commit per task.
2. Stop at every human gate. Never delete a cloud resource, deploy to production, or change billing without written approval for that specific action.
3. Never run a bare `firebase deploy`. Always pass `--only` with named targets.
4. Never log, store or send a PIN, PIN hash, token, email, or any child profile field (name, nickname, age, country, state, colour) outside the paths this plan defines.
5. Never add analytics, ads, crash reporting or other third-party SDKs without an approved decision.
6. Develop against the Firebase emulators. Do not touch production data.
7. Check prices, CLI commands and store rules against current official pages when you reach them, because they change.
8. If a spike fails or the plan conflicts with the code, stop and report it. Do not improvise around a security control.

## Phase 1: Firestore only

This phase changes the existing `public/index.html` directly and leaves restructuring for Phase 2. Deploy the new client first, then delete the Postgres resources, because deletion cannot be undone.

**State on 2026-11-10:** tasks 1.2 to 1.10 are merged into `main` but nothing is deployed. Because nothing is live, the kid schema can still change at no migration cost. Task 1.12 does that before the first deploy.

### Tasks

- [ ] **1.1 Set safety nets.** In Google Cloud Billing, create budget alerts at $1, $5, $10 and $25. Turn on Firestore delete protection.
- [x] **1.2 Resolve D1.** Resolved as a fresh start. No export or import is needed.
- [x] **1.3 Replace the data adapter** in the `window.__fb` block. Remove the `firebase/data-connect` and `@kiyuv-learning/dataconnect` imports, the import map entries, `getDataConnect`, the emulator connection and all SQL Connect calls.
- [x] **1.4 Use the new model.** Write to `users/{uid}` and `users/{uid}/kids/{kidId}` as defined in the data model. Map `yuvin` to `k1` and `kiki` to `k2` in one constant. Stop copying `email` into progress documents.
- [x] **1.5 Cut writes.** Replace the 1.5-second debounce with a flush when a topic finishes, when the page is hidden, and at most once every 30 seconds. Write `lastActiveDate` once per day. Keep local saves on every answer.
- [x] **1.6 Fix reset.** Zero the kid documents and increment `resetEpoch` in one batch. During merge, a higher cloud `resetEpoch` discards local progress on every device.
- [x] **1.7 Replace the deprecated cache call.** Use `initializeFirestore` with `persistentLocalCache` instead of `enableIndexedDbPersistence`.
- [x] **1.8 Remove SQL Connect from the repo.** Delete `dataconnect/` and `public/dataconnect-generated/`. Remove the `dataconnect` and `emulators.dataconnect` entries from `firebase.json`.
- [x] **1.9 Update the service worker in the same commit.** Remove `/dataconnect-generated/esm/index.esm.js` from the precache list and bump the cache to `kids-academy-v4`. A precached file that no longer exists can break service worker installation.
- [x] **1.10 Add rules and index exemption.** Use the rules in Phase 3 with `pinFresh()` temporarily returning `true`, and add the `topics` index exemption. Test them in the emulator.
- [x] **1.12 Extend the kid schema before the first deploy.** In the merged `firestore.rules`, add `name`, `age`, `country`, `state` and `favColor` to `validKid` as in Phase 3, update the header comment, and add emulator tests for each new field. In `index.html`, write these fields with safe defaults for the two existing profiles (`k1`, `k2`), so the schema is final on day one. The onboarding form itself is built in Phase 2.
- [x] **1.11 Deploy after approval.** Run `firebase deploy --only hosting,firestore`, after 1.12 is merged.

### Acceptance checks

- `git grep -iE "dataconnect|data-connect" -- public firebase.json` returns nothing.
- Signing in and finishing a 10-question topic produces one kid-document write in the browser network log.
- Progress appears on a second browser. Reset stays reset on both after reloading.
- No request goes to `firebasedataconnect.googleapis.com`.
- The emulator rules tests reject a kid document with a missing, oversized or out-of-list onboarding field, and an `age` that does not match `ageBand`.

### Decommission (human gate)

Do these only after the client has run cleanly for 24 hours.

1. Re-run the row count on all 6 tables and confirm they are still 0. If any are not, stop and report.
2. Delete service `kiyuv-learning-service` in `asia-south1`, in the Firebase console or through the [services delete API](https://firebase.google.com/docs/reference/sql-connect/rest/v1/projects.locations.services/delete). Check `firebase dataconnect --help` for a CLI equivalent; it was not confirmed.
3. Delete Cloud SQL instance `kiyuv-learning-fdc`. Deleting the service does not delete it. Turn off instance deletion protection first if it is on.
4. Check the billing report over the next 2 days and confirm Cloud SQL charges have stopped.

**Rollback:** before step 2, revert the commit and redeploy Hosting. After step 3 there is no rollback, which is acceptable only because the tables are empty.

## Phase 2: Production codebase

This phase moves the existing behavior into the target structure without adding features. Users should notice no change except a faster, more reliable app.

### Tasks

- [x] **2.1 Create the workspace** using the layout above, with strict TypeScript, ESLint and Prettier.
- [ ] **2.2 Resolve D6.** Make the repo private and scrub history if approved. Delete the empty inner `kiyuv-learning` folder (inner folder deleted).
- [x] **2.3 Set up environments.** Use the emulators locally, a new `kiyuv-learning-dev` project for testing, and `kiyuv-learning` for production. Add `.firebaserc` aliases and per-environment Vite config.
- [x] **2.4 Extract content.** Move `KIKI_*`, `YUVIN_*`, `mathGen`, `CURRICULUM` and `BADGES` into `packages/content`. Generators stay as code. Add a schema check for every question.
- [x] **2.5 Remove personal hard-coding.** Replace `yuvin` and `kiki` branches with a `track` of `early` or `primary` and data-driven star values. Remove children's names and ages from the README, manifest, code and comments.
- [x] **2.6 Build onboarding and the "Who's learning?" picker.**
  - Onboarding form: name, nickname, age, country, state and favourite colour, as defined in the data model. Use dropdowns and swatches, with no free text except name and nickname. Validate with the shared Zod schema, the same one the rules mirror. Compute `ageBand` and suggest a `track` from `age`.
  - The form is shown after the parent's PIN unlock. It is used for the first child during account setup and for every later "Add profile".
  - Picker: a Netflix-style grid of profile tiles, each showing the avatar, nickname and favourite-colour ring. Include "Add profile" while fewer than 6 exist and a parent-only "Manage profiles" action.
  - Choosing a tile saves `activeKid:{uid}` on that device only and applies the child's colour theme and track.
  - Add an "Switch profile" control in the play header, with no PIN. Return to the picker after 10 minutes idle or when the app resumes after a long pause.
  - Profile edit and delete need a PIN under 5 minutes old and warn that deleting removes the child's progress.
  - The family leaderboard reads from these profiles.
- [x] **2.7 Rebuild screens as components:** curriculum, play, finish, leaderboard, parent area. Remove all `innerHTML` and inline handlers.
- [x] **2.8 Isolate Firebase.** Only `src/lib/firebase` may import the SDK. Add an ESLint rule that forbids it elsewhere and forbids `onSnapshot`.
- [x] **2.9 Build the sync engine** in `src/lib/sync`: local-first, with Zod validation before every write, a queue per `kidId` that survives restarts, transactional merge on flush, and the `resetEpoch` logic from Phase 1. Reads of the active child happen at start, on foreground and before each flush. Never use listeners.
- [x] **2.10 Import local progress once.** On first sign-in, offer to import legacy `kidsAcad_*` data into a new profile through the onboarding form, then delete the old keys, including `kidsAcad_session`. There is no D1 export to import.
- [x] **2.11 Replace the service worker** with a generated Workbox precache of hashed assets. Never cache authentication or API responses.
- [x] **2.12 Retire `simple.html`** unless you choose to keep it. No quoted link to it was found in `index.html`, and it has no sign-in.
- [x] **2.13 Fix Hosting headers.** Serve hashed assets with `max-age=31536000, immutable`. Serve HTML and the service worker with `no-cache`, matching clean URLs as well as `*.html`.
- [x] **2.14 Add CI** that runs lint, typecheck, unit tests, emulator rules tests and the build on every pull request. Deploy with Workload Identity Federation, not stored JSON keys. Enable Dependabot and secret scanning.

### Acceptance checks

- Every existing topic renders and scores the same as before, covered by unit tests for content and scoring.
- CI passes from a clean clone.
- `git grep -E "Yuvin|Kiki"` returns nothing in the working tree.
- The app plays a full topic with the network turned off, and syncs on reconnect.
- Onboarding rejects an empty nickname, an age outside 2 to 13, an unknown country and a free-text colour.
- Two real devices (for example an iPad and an Android phone) signed into one account run different profiles at once. Each child's stars, topics and colour theme appear correctly on both devices after reload, and neither child's play changes the other's data.
- Two devices on the same child, played offline and then reconnected, merge with no lost topic and no decrease in any stat.
- Resetting a child on one device clears that child on the other device after its next read, and leaves other children untouched.
- Restarting the app returns to the same active profile on that device only.

## Phase 3: Sign-in, Parent PIN and security

The PIN must be checked on the server, and Firestore rules must refuse access without a recent check. A PIN stops a child or someone holding an unlocked device. It does not stop phishing, so it is not a replacement for strong sign-in.

### Sign-in flow

1. A parent signs in with Google, Apple, or a verified email and password. Children never sign in.
2. A first-time parent gives consent (Phase 4) and sets a PIN. There is no skip option.
3. A returning parent enters the PIN. The app calls `verifyPin`, then signs in with the short-lived token it returns.
4. The device stays unlocked for 12 hours. Parent-area actions ask for the PIN again if the last entry is over 5 minutes old.
5. Forgot PIN requires signing in with the provider again, then setting a new PIN.
6. After unlock, the device shows "Who's learning?". A first-time parent goes through onboarding to create the first profile. Picking a profile needs no PIN and is remembered on that device only.
7. Each device has its own sign-in session and PIN unlock, so one parent account can be signed in on several devices at once. A PIN change signs the other devices out (see below), and a child's profile then reappears after the parent unlocks that device again.

Use `signInWithPopup` on the web and the native Capacitor plugin in the apps. Set `Cross-Origin-Opener-Policy: same-origin-allow-popups` so web popups work.

### How the PIN reaches the rules

`verifyPin` mints a Firebase custom token containing a `pin_at` timestamp claim. The client signs in with it, and security rules compare `pin_at` to the current time. This enforces the PIN on every request with no extra Firestore read.

**Required spike before building (task 3.1).** The custom-token docs confirm developer claims reach Realtime Database and Storage rules. Firestore behavior must be proven.

- S1: `pin_at` is visible in Firestore rules, and survives a forced hourly token refresh.
- S2: after a custom-token sign-in, reauthenticating with Google or Apple yields a token that `setPin` can identify as a real provider sign-in.
- Fallback if either fails: store `pinSessions/{uid}_{deviceId}` written by the function, and check it with `get()` in rules. This adds one read per rule evaluation, so re-run the cost model.

### PIN handling

| Control | Requirement |
| --- | --- |
| Format | 6 digits. Reject repeated digits, sequences and the 50 most common PINs. |
| Storage | `pinSecrets/{uid}`: HMAC-SHA256 with a Secret Manager pepper, then scrypt (N=2^15, r=8, p=1) with a 16-byte random salt. Store parameters and pepper version. |
| Comparison | `crypto.timingSafeEqual`, on the server only. |
| Attempts | Record the attempt in a transaction before comparing, so parallel guesses cannot race. |
| Lockout | 5 failures: 15 minutes. 10 failures: provider sign-in and a new PIN required. |
| Reset and change | Need a real provider sign-in under 5 minutes old. Checking `auth_time` alone is not enough, because custom-token sign-in resets it; also check `firebase.sign_in_provider`. |
| After a change | Call `revokeRefreshTokens`, so other devices must sign in again. |
| Client | Never store or log the PIN. Clear the input right after sending. Purge any old `pin` value. |

### Cloud Functions

All are callable, in `asia-south1`, with `enforceAppCheck: true`, `maxInstances: 10`, Zod input validation and logs that exclude personal data.

| Function | Purpose | Extra requirement |
| --- | --- | --- |
| `setPin` | Create or change the PIN, and set `users/{uid}.pinConfigured`. | Provider sign-in under 5 minutes old, or no PIN set yet. |
| `verifyPin` | Check the PIN and return a custom token. | Verified email for password accounts. Token Creator role on the runtime service account. |
| `recordConsent` | Store consent evidence. | Phase 4. |
| `exportMyData` | Return a parent's data. | Phase 4. PIN under 5 minutes old. |
| `deleteAccount` | Delete all data and the Auth user. | Phase 4. PIN under 5 minutes old and a recent provider sign-in. |

### Firestore rules

These rules use no `get()` calls, so they add no read costs. Anything not matched, including `pinSecrets`, is denied by default.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(uid) { return request.auth != null && request.auth.uid == uid; }
    function pinFresh(seconds) {
      return request.auth.token.get('pin_at', 0) * 1000
        > request.time.toMillis() - seconds * 1000;
    }
    function count(v) { return v is int && v >= 0 && v <= 100000000; }
    function ageBandOk(age, band) {
      return (age <= 4 && band == '2-4') || (age >= 5 && age <= 7 && band == '5-7')
        || (age >= 8 && age <= 10 && band == '8-10') || (age >= 11 && band == '11-13');
    }
    function validKid(d) {
      return d.keys().hasAll(['name','nickname','age','country','state','favColor',
          'avatar','ageBand','track','stars','streak',
          'bestStreak','totalCorrect','totalWrong','badges','topics','resetEpoch','updatedAt'])
        && d.keys().hasOnly(['name','nickname','age','country','state','favColor',
          'avatar','ageBand','track','stars','streak',
          'bestStreak','totalCorrect','totalWrong','badges','topics','resetEpoch','updatedAt'])
        && d.name is string && d.name.size() <= 30
        && d.nickname is string && d.nickname.size() >= 1 && d.nickname.size() <= 20
        && d.age is int && d.age >= 2 && d.age <= 13
        && d.country is string && d.country.matches('^[A-Z]{2}$')
        && d.state is string && d.state.size() <= 40
        && d.favColor in ['blue','rose','green','orange','purple','teal','red','yellow']
        && d.avatar is string && d.avatar.size() <= 16
        && d.ageBand in ['2-4','5-7','8-10','11-13']
        && ageBandOk(d.age, d.ageBand)
        && d.track in ['early','primary']
        && count(d.stars) && count(d.streak) && count(d.bestStreak)
        && count(d.totalCorrect) && count(d.totalWrong) && count(d.resetEpoch)
        && d.badges is list && d.badges.size() <= 100
        && d.topics is map && d.topics.size() <= 1000
        && d.updatedAt == request.time;
    }
    match /users/{uid} {
      allow read: if isOwner(uid);
      allow create: if isOwner(uid) && request.resource.data.keys().hasOnly(
        ['createdAt','lastActiveDate','locale','resetEpoch','schemaVersion']);
      allow update: if isOwner(uid) && pinFresh(43200)
        && request.resource.data.diff(resource.data).affectedKeys()
           .hasOnly(['lastActiveDate','locale','resetEpoch']);
      match /kids/{kidId} {
        allow read: if isOwner(uid) && pinFresh(43200);
        allow create: if isOwner(uid) && pinFresh(300)
          && kidId.matches('^k[1-6]$') && validKid(request.resource.data);
        allow update: if isOwner(uid) && pinFresh(43200)
          && validKid(request.resource.data)
          && request.time > resource.data.updatedAt + duration.value(5, 's')
          && (request.resource.data.resetEpoch == resource.data.resetEpoch || pinFresh(300))
          && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(
              ['name','nickname','age','country','state','favColor','avatar','ageBand','track'])
              || pinFresh(300));
        allow delete: if isOwner(uid) && pinFresh(300);
      }
    }
    match /consents/{uid}/records/{id} {
      allow read: if isOwner(uid) && pinFresh(43200);
    }
  }
}
```

Rules cannot loop over the `topics` map, so per-topic numbers are bounded only by the client and the map size. That is acceptable while leaderboards stay within one family. A public leaderboard would need server-computed scores.

#### How the rules support profiles and several devices

- The profile lives entirely under the parent's `uid`. There is no child sign-in and no shared access, so another family can never read or write these documents.
- Profile fields (name, nickname, age, country, state, colour, avatar, age band, track) change only with a PIN under 5 minutes old. Progress changes need only the 12-hour unlock. A child on an unlocked device can therefore play and switch profile, but cannot edit or add a profile, or change another profile's data without the parent's recent PIN.
- The "active child" is not in Firestore, so there is nothing for two devices to contend over. Concurrent play on different children writes different documents. The 5-second spacing applies per child document.
- Two devices on one child both pass the same rules. The client transaction does the merge, and the rules still validate the final document. The rules cannot prove a merge was correct, which is acceptable while data stays within one family.
- `users/{uid}` still denies delete and list, and `list` on `kids` returns only that parent's children.
- Rules tests must show: a child on an unlocked device cannot edit a profile field, an `age` that disagrees with `ageBand` is refused, a seventh profile is refused, and two kid documents can be written back to back without the spacing rule firing across them.

### Tasks

- [x] **3.1 Run spikes S1 and S2** and record the result. Stop if both the design and the fallback fail.
- [ ] **3.2 Enable providers:** Google, Apple, and email with verification required (client UI & SDK wired; enable Apple & Email/Password in Firebase Console). Upgrade to Identity Platform if not already done. Turn on email enumeration protection and a strong password policy. **Decision 2026-11-10: Google only for now.** Apple and Email/Password (and the Identity Platform upgrade, enumeration protection and password policy that go with them) are deferred until the app is proven. The login screen hides them behind flags.
- [x] **3.3 Build `setPin` and `verifyPin`** with unit tests for lockout, parallel attempts, expiry, pepper rotation and blocked PINs.
- [x] **3.4 Build PIN screens** with idle lock and the 5-minute parent-area check. Make the "Who's learning?" picker the screen shown after unlock, and add the 5-minute PIN check in front of Add, Edit and Delete profile.
- [ ] **3.5 Deploy the rules** with real `pinFresh`, plus emulator tests for every allow and deny path. Include another user's data, a missing claim, an expired claim, oversized data, extra fields and direct `pinSecrets` access. Add the profile cases listed under "How the rules support profiles and several devices". **Code done on branch `phase-3/complete-pin-and-encryption`:** real `pinFresh()`, rules tests for every PIN case, browser-side PIN fallback and local PIN hash removed, no default pepper. **Still open:** deploy functions, hosting, then rules in that order (see `docs/PHASE3_CONSOLE_STEPS.md`), and run the rules tests in CI (Java 21 is not installed on this machine). **Functions are deployed (2026-11-10) but blocked by the organization policy `iam.allowedPolicyMemberDomains`; the organization owner must override it for this project. Do not deploy hosting or the new rules until that is done.**
- [ ] **3.6 Turn on App Check** in monitor mode (client SDK wired via `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`). Enforce it on Firestore and Functions once metrics show legitimate traffic is passing. Authentication enforcement is in Preview, so decide separately. **Decision 2026-11-10: backlog; do it before launching to the public.** It stays off until then (no key set, `enforceAppCheck: false`).
- [x] **3.7 Add a Content-Security-Policy** in report-only mode, then enforce it, with no `unsafe-inline` for scripts. Add `object-src 'none'`, `base-uri 'self'` and an allowlist for Firebase, reCAPTCHA and the auth domain.
- [ ] **3.8 Lock down the project.** Restrict API keys by referrer and app. Remove `localhost` from production authorized domains. Require 2-step verification on every account with project access, and grant least-privilege IAM roles.
- [x] **3.9 Write `docs/threat-model.md`** and an incident runbook covering breach notification timelines.
- [ ] **3.10 Get an independent security review or penetration test** before public launch.
- [x] **3.11 Encrypt the child's name.** The name is stored only as `nameEnc` (AES-256-GCM, key derived per family from the `NAME_KEY` secret, bound to the family and child), through the `encryptProfileName` and `decryptProfileNames` functions, both needing a PIN from the last 5 minutes. The plain name is never written to Firestore or to this device's storage. Nickname, age, country, state and colour stay readable because the app and rules need them. The PIN was already stored only as a salted scrypt hash with a secret pepper, on the server.

### Acceptance checks

- Clearing all browser storage never bypasses the PIN.
- A direct Firestore REST call using a token without a fresh `pin_at` is refused.
- Six rapid wrong guesses trigger lockout, even when sent in parallel.
- No PIN or hash appears in logs, client storage or Firestore client responses.
- With a 12-hour unlock but no recent PIN, creating, editing or deleting a profile is refused, while playing and switching profile still work.
- A second signed-in device cannot read or change this family's profiles after the parent's account is deleted or its refresh tokens are revoked.

Optional later: parent TOTP multi-factor, and biometric unlock on devices. SMS is excluded because each message is billed.

## Phase 4: Child privacy and compliance

A children's app needs consent, minimal data, deletion and a retention limit before release, even when it is free. Amended [COPPA](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule) obligations have applied since April 22, 2026. India's DPDP Rules were notified in November 2025, with most duties reported to start about 18 months later. Have a lawyer confirm both (D5).

### Tasks

- [ ] **4.1 Map the data** in `docs/data-inventory.md`: each field, purpose, location, retention and processor.
- [ ] **4.2 Minimize.** Keep to the six onboarding fields (first name, nickname, age in years, country, optional region, colour), an avatar and learning stats. Never collect a child's surname, photo, birthdate, school, city, address, email or phone. Record the purpose of each onboarding field in the inventory, and drop any field with no purpose (D8). Because name, age, country and state together can identify a child, treat the form as collecting personal information, and show the parent a plain-language notice next to it.
- [ ] **4.3 Remove tracking.** Delete `measurementId` from the config and confirm no Analytics link is active. No ads, advertising IDs, profiling or behavioral tracking of children.
- [ ] **4.4 Publish** a parent-readable privacy policy and terms, in the languages you launch in, including a children's data notice.
- [ ] **4.5 Build consent.** The parent reviews the notice and gives consent through the method counsel approves, before the first profile is created. `recordConsent` stores policy version, method, time and the `kidId`s covered. Adding a new profile asks the parent to confirm consent for that child. Bumping the policy version asks again.
- [ ] **4.6 Add a parent area** behind a fresh PIN, with a view of each child's stored data, export, reset, consent withdrawal, profile deletion, and account deletion.
- [ ] **4.7 Build `exportMyData` and `deleteAccount`.** Deletion removes `users/{uid}` recursively, `pinSecrets/{uid}`, consents as counsel directs, and the Auth user. Add `deleteKidProfile` (or the client rule in Phase 3 plus a consent-record note) so one child's data can be removed without ending the account. Export lists every profile separately.
- [ ] **4.8 Write and enforce a retention policy.** COPPA now requires a written one and forbids indefinite retention. Suggested: a scheduled job warns after 21 months of inactivity and deletes at 24. Apply it per child profile, using that profile's `updatedAt`, so an unused sibling profile is removed on its own.
- [ ] **4.9 Add a parental gate** in front of every external link, settings area and sign-in entry.

### Acceptance checks

- Deleting a test account leaves no document or Auth record, confirmed by an admin query.
- Deleting one child profile removes that child's document and leaves the siblings and the account intact.
- A data export lists each child's fields and progress separately, and includes no field outside the inventory.
- A network capture of a full session shows requests only to approved domains, and no child profile field appears in any URL, header or request to a third party.
- The lawyer has signed off the policy, consent flow and retention period.

## Phase 5: Phone and tablet experience

The layout must adapt to width and orientation, not device type, so one set of components serves phones, iPads and Android tablets.

### Tasks

- [ ] **5.1 Remove `user-scalable=no`** and set the manifest `orientation` to `any`. Keep `viewport-fit=cover` and honor safe-area insets.
- [ ] **5.2 Add breakpoints** at 600, 840 and 1200 CSS pixels, using container queries for game boards and answer grids.
- [ ] **5.3 Use tablet space.** Show curriculum as a multi-column grid, and place question and answers side by side in landscape.
- [ ] **5.4 Design for small hands.** Targets are at least 64px for children and 48px for parent controls, with 8px spacing.
- [ ] **5.5 Support resizing:** iPad Split View and Slide Over, Android multi-window, foldables and rotation mid-game without losing state.
- [ ] **5.6 Bundle an open-licensed rounded font**, because Comic Sans is not available on Android.
- [ ] **5.7 Meet WCAG 2.2 AA:** contrast, screen-reader labels, focus order and a reduced-motion setting that calms confetti and animation.
- [ ] **5.8 Keep the first load under 300 KB compressed** and add a bundle-size check to CI. This limit also controls Hosting costs.
- [ ] **5.9 Add Playwright visual tests** at the widths below, including the onboarding form and the "Who's learning?" picker.
- [ ] **5.10 Make the picker and form responsive.** Profile tiles are a 2-column grid on phones and up to 3 by 2 on tablets, at least 96px wide, with the nickname under each avatar. The onboarding form is a single column on phones and two columns in landscape on tablets. Use native selects for country and state, and large swatches for the colour.
- [ ] **5.11 Build the 8 colour themes** as design tokens that each pass WCAG 2.2 AA for text and controls on their background, in light and reduced-motion modes. Never rely on colour alone to show the active profile; add a ring and a label.

### Device matrix

| Class | Example | Width (CSS px) | Check |
| --- | --- | --- | --- |
| Small phone | iPhone SE, budget Android | 320 to 375 | No clipping or sideways scrolling. |
| Large phone | Recent iPhone or Pixel | 390 to 430 | Safe areas are respected. |
| Small tablet | iPad mini, 8-inch Android | 744 to 800 | Both orientations work. |
| Large tablet | iPad Pro, 11 to 13-inch Android | 1024 to 1366 | Space is used, with no stretched phone layout. |
| Foldable or split view | Galaxy Fold, iPad Split View | 320 to 900, changing | State survives each resize. |

Test on at least one low-end Android device, since many families in India will use one.

## Phase 6: Android and iOS apps

Capacitor packages the same web code, and the apps must feel native because both stores reject thin website wrappers. Apple expects apps to go beyond "a repackaged website", and Google Play says a children's app "must not merely provide a webview of a website".

### Tasks

- [ ] **6.1 Add Capacitor** to `apps/client`. Bundle all assets. Do not set `server.url` to a remote site.
- [ ] **6.2 Register Android and iOS apps** in Firebase, and add SHA-256 fingerprints and the iOS bundle ID.
- [ ] **6.3 Add native sign-in** with `@capacitor-firebase/authentication` for Google and Apple, then pass the credential to the Firebase JS SDK. Popup sign-in does not work reliably in the app web view.
- [ ] **6.4 Add native App Check** with `@capacitor-firebase/app-check`, using Play Integrity and App Attest. Pass tokens to the JS SDK through a `CustomProvider`, and test that they refresh. These plugins are community-maintained, so pin versions and review updates.
- [ ] **6.4a Support cross-device profiles in the apps.** Store `activeKid:{uid}` with Capacitor Preferences. Confirm the same parent account signs in on an iPad and an Android phone or tablet at once, each on a different child, with sign-in, App Check and PIN unlock working independently on each device. Test background and resume on both.
- [ ] **6.5 Add native behavior:** splash screen, app icons, haptics, audio that handles interruptions, Android back button, offline start and secure storage where needed.
- [ ] **6.6 Configure large screens.** iOS: all four orientations and multitasking on iPad, with `UIRequiresFullScreen` off. Android: resizable activity, tested on tablets and foldables.
- [ ] **6.7 Resolve D4 and apply store rules** from the table below.
- [ ] **6.8 Automate builds** in CI, with signing keys in the CI secret store.
- [ ] **6.9 Distribute internally** through TestFlight and Play internal testing. Check the current Play rules for new personal accounts, which may need a closed test first.
- [ ] **6.10 Submit** with screenshots for phone and tablet, App Privacy answers, Data safety form and target audience declaration, all matching Phase 4.

### Store requirements

| Rule | Requirement | Where this plan covers it |
| --- | --- | --- |
| [Apple 1.3](https://developer.apple.com/app-store/review/guidelines/) Kids Category | No links or purchases without a parental gate. No sending personal or device information to third parties. Third-party analytics and ads are heavily restricted. | 4.3, 4.9, D4 |
| Apple 4.8 | Social login needs an equivalent privacy-preserving login option. | Sign in with Apple, 3.2 |
| Apple 5.1.1(v) | Accounts must be deletable inside the app. | 4.7 |
| Apple 5.1.4 | A privacy policy and compliance with children's privacy laws. | 4.4 |
| [Google Play Families](https://support.google.com/googleplay/android-developer/answer/9893335) | No advertising ID, `AD_ID` permission or location for child-only apps. Only SDKs approved for child-directed services. | 4.3, Rule 5 |
| Google Play | Target audience must be declared before publishing. | 6.10 |

Apple and Google review results are outside your control, so allow extra time for at least one rejection and resubmission.

## Phase 7: Billing guardrails and launch

Firebase has no hard spending cap for Firestore, so the guardrails combine alerts, app limits and an automatic stop. [Budget alerts do not pause services](https://firebase.google.com/docs/projects/billing/budget-alerts). [Spend caps](https://firebase.google.com/docs/projects/billing/spend-caps) cover Cloud Functions but not Firestore or Authentication, are in Preview, and are not instant.

### Tasks

- [ ] **7.1 Tune budget alerts** at $1, $5, $10, $25, $50 and $100, sent to at least two people.
- [ ] **7.2 Set a Cloud Functions spend cap** of $10 a month, after confirming a paused PIN function shows a friendly maintenance message.
- [ ] **7.3 Add usage alerts** in Cloud Monitoring: more than 40,000 reads or 16,000 writes a day (80% of free quota), and any function error spike.
- [ ] **7.4 Build a tiered stop for D7.** Budget notifications go to Pub/Sub. A function deploys read-only rules at $25 and notifies you. Removing billing at $100 is optional, because it can take everything offline.
- [ ] **7.5 Test the stop** in `kiyuv-learning-dev` using a simulated budget message. Note that billing data can lag by hours, so spending can pass a threshold first.
- [ ] **7.6 Set App Check token lifetimes** to control costs. Web reCAPTCHA includes 10,000 assessments a month and each refresh uses one, so start at 72 hours on the web. Play Integrity's standard tier is 10,000 calls a day.
- [ ] **7.7 Keep cost limits in code:** no listeners, no unbounded queries, a 300 KB first load, 5-second write spacing and `maxInstances: 10`.
- [ ] **7.8 Back up.** Schedule daily Firestore backups with 7-day retention. Perform one restore into the dev project and record the steps.
- [ ] **7.9 Set up monitoring** without third-party SDKs: function logs with no personal data, uptime checks, and a parent-initiated bug report.
- [ ] **7.9a Run a multi-device soak test** in `kiyuv-learning-dev`: one account, three children, three devices, a day of simulated play with offline gaps. Confirm no lost progress, no write-spacing rejections beyond the retry, and that reads and writes per family stay inside the cost model below.
- [ ] **7.10 Roll out in stages:** family testers, then 100 families, then 1,000, reviewing costs and errors at each step.

### Launch checklist

- [ ] App Check is set up, monitored for 3 to 7 days, then enforced on Firestore and Functions (task 3.6, backlog).
- [ ] Apple and Email/Password sign-in are added only if wanted (task 3.2, backlog).
- [ ] All test accounts and test profiles are deleted.
- [ ] Phase 3 security review findings are closed.
- [ ] Lawyer sign-off is recorded.
- [ ] A restore and the spending stop have both been tested.
- [ ] Rules tests, CI and the device matrix all pass on the release build.
- [ ] The multi-device test passes on real hardware: two children on two platforms under one account.
- [ ] D8 is decided and every onboarding field has a written purpose in `docs/data-inventory.md`.
- [ ] `X-Robots-Tag: noindex` and `robots.txt` are changed for any public marketing page, and kept for app routes.

## Costs and scaling

Expect $0 a month up to about 4,000 daily users once writes are batched. Today's code would hit the free write limit at about 250 daily users. Above 50,000 monthly users, Authentication becomes the largest cost by far.

### Estimated monthly bill

These are estimates, not quotes. The model assumes each daily user makes 10 reads, 5 writes and 1.5 PIN checks a day. Multi-profile families change this: loading a family reads 1 + children documents (up to 7), and each flush adds 1 read for the merge transaction. A family with three active children may therefore use about 20 to 30 reads a day, so the 4,000-user figure should be re-checked against families rather than parents (task 7.9a). Monthly users are 2.5 to 3 times daily users. 10% of daily users download about 300 KB from the web each day.

| Daily users | Monthly users | Firestore | Hosting | Functions | Authentication | Total (USD) |
| --- | --- | --- | --- | --- | --- | --- |
| 1,000 | 3,000 | $0 | $0 | $0 | $0 | $0 |
| 4,000 | 12,000 | $0 | $0 | $0 | $0 | $0 |
| 25,000 | 75,000 | $5 to $10 | $2 | $2 | $138 | About $150 |
| 100,000 | 250,000 | $22 to $45 | $12 | $23 | $965 | About $1,050 |

**Verify these rates before relying on the top two rows.** Official pages for Firestore, Identity Platform and Cloud Run functions rates would not load. Firestore rates come from a search result that was not specific to Mumbai, so the range doubles them. The Authentication rates ($0.0055 then $0.0046 per user) and the $0.000024 CPU-second rate are from memory. App Check on the web is excluded, and reCAPTCHA charges above its free allowance.

Fixed costs are separate: the Apple Developer Program at about $99 a year, Google Play at about $25 once, and a domain. The lawyer and the security review are likely your largest launch costs.

### Free allowances

| Service | No-cost allowance | Beyond it |
| --- | --- | --- |
| Firestore | 50,000 reads, 20,000 writes, 20,000 deletes a day; 1 GiB stored; 10 GiB transfer a month | Google Cloud rates |
| Hosting | 10 GB stored; 360 MB transfer a day | $0.026/GB stored; $0.15/GB transfer |
| Cloud Functions | 2M invocations, 400K GB-seconds, 200K CPU-seconds, 5 GB networking a month | $0.40 per million invocations; $0.12/GB networking |
| Authentication | 50,000 monthly users, on Identity Platform | Google Cloud rates |
| App Check | Service is free; reCAPTCHA includes 10,000 assessments a month | Charged per assessment |

The free daily Firestore quota applies to one database in the project. Keep using `(default)`, which is flagged as the free-tier database.

### What keeps it cheap

| Lever | Effect |
| --- | --- |
| One write per finished topic | About 90% fewer writes than today. |
| Topics in one kid document | Loading a family costs a few reads, regardless of topics played. |
| Questions bundled in the app | No database reads during play. |
| Native apps with bundled assets | Almost no Hosting transfer. |
| No `get()` in rules | PIN enforcement adds no per-request reads. |
| 12-hour PIN unlock | Keeps function calls to about one or two per user per day. |
| Deleting Cloud SQL | Removes a recurring database charge, about $9.37 a month at minimum after any trial. |

### How it scales later

Firestore and Functions scale automatically, and per-family documents avoid write hotspots. Nothing needs re-architecting until the triggers below.

| Trigger | Action |
| --- | --- |
| Over 16,000 writes a day | Review the budget. Consider less frequent syncing. |
| Function `maxInstances` is being reached | Raise the limit and the spend cap together. |
| Over 40,000 monthly users | Decide on a no-account, device-only mode to reduce Authentication cost. |
| Slow first PIN check at high traffic | Set `minInstances: 1`, which adds a fixed monthly charge. |
| Parents want reporting or aggregate insights | Add a scheduled, de-identified BigQuery export, after legal review. |
| Schools want access | Add Identity Platform multi-tenancy and a school role model. |
| Public leaderboards are wanted | Move scoring to Cloud Functions first, as the rules cannot validate it. |
| Users outside India report slow sync | Accept it, or plan a new-region project. Firestore location cannot be changed after creation. |

`schemaVersion` on each user document lets future data changes roll out gradually.

## Sources

Pages opened and read:

- [Firebase pricing](https://firebase.google.com/pricing)
- [Firebase spend caps](https://firebase.google.com/docs/projects/billing/spend-caps)
- [SQL Connect pricing](https://firebase.google.com/docs/sql-connect/pricing)
- [Firebase App Check](https://firebase.google.com/docs/app-check) and its [reCAPTCHA Enterprise provider](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [Create custom tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/). Guideline 1.3 was read directly; 4.2, 4.8, 5.1.1(v) and 5.1.4 came from a page summary.
- [Google Play Families policy](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Capacitor App Check plugin](https://github.com/capawesome-team/capacitor-firebase/tree/main/packages/app-check) and its [JS SDK guide](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/app-check/docs/firebase-js-sdk.md)

From search results only, so confirm before relying on them:

- [Firebase budget alerts](https://firebase.google.com/docs/projects/billing/budget-alerts)
- [Firestore pricing](https://cloud.google.com/firestore/pricing)
- [SQL Connect service delete API](https://firebase.google.com/docs/reference/sql-connect/rest/v1/projects.locations.services/delete)
- [COPPA final rule](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule), [law-firm reminder of the compliance date](https://www.hunton.com/privacy-and-cybersecurity-law-blog/coppa-rule-amendment-compliance-deadline-approaches)
- [DPDP Rules notification coverage](https://www.biometricupdate.com/202511/india-notifies-its-sweeping-digital-personal-data-protection-rules)
- [Capacitor Firebase Authentication](https://capawesome.io/plugins/firebase/authentication)
