# 🧠 Kiyuv Learning Academy

A cross-platform, multi-profile gamified learning application for children aged 2 to 13 — spanning India CBSE, US Common Core, UK National Curriculum, Australia ACARA, and Olympiad preparation (IMO / NSO / IEO / NCO / Spelling Bee).

- **Live Web App (Firebase Hosting):** https://kiyuv-learning.web.app (also https://kiyuv-learning.firebaseapp.com)
- **Firebase Console:** https://console.firebase.google.com/project/kiyuv-learning/overview
- **Firestore Data Viewer:** https://console.firebase.google.com/project/kiyuv-learning/firestore/databases/-default-/data
- **GitHub Repository:** https://github.com/Shivangi25051992/kiyuv-learning

---

## ✨ Key Features

- **OTT-Style Multi-Profile ("Who's learning today?"):** Up to 6 child profiles (`k1`..`k6`, `MAX_KIDS_PER_FAMILY`) under one parent account, with per-device active profile selection (`localStorage["activeKid:{uid}"]`, never stored in Firestore) so siblings can learn simultaneously on different devices without overwriting each other.
- **Simple Onboarding Form:** Name (given name only, up to 30 characters, shown to the parent), nickname (shown to the child), age (`2–13`), country, state/region, favourite colour theme (8 accessible palettes), and preset emoji avatar. These are still personal information about a child, so treat them as such (see Decision D8 in the plan).
- **Two Curriculum Tracks (`early` & `primary`):**
  - **Early Years (Ages 2–4):** Counting, English alphabet, colors, shapes, animals, fruits, body parts, opposites, and Hindi Varnamala.
  - **Primary & Olympiad (Ages 5–13):** Infinite math generators (addition, subtraction, multiplication, division, word problems, place value, time, rounding) plus curated banks for spelling bee, vocabulary, grammar, science, GK, and logic.
- **6-Digit Parent PIN & Multi-Provider Auth:**
  - Google, Apple, and verified Email/Password sign-in, plus offline device mode.
  - 6-digit Parent PIN rejecting repeated digits, sequences, and top-50 common PINs, backed by 2nd-gen Cloud Functions (`setPin`, `verifyPin`) using `HMAC-SHA256` pepper + `scrypt` + `timingSafeEqual`.
  - The browser no longer stores or checks any PIN value. Every check happens in `verifyPin` on the server, and `firestore.rules` requires the `pin_at` claim. **Not live until the functions and rules are deployed** (see `docs/PHASE3_CONSOLE_STEPS.md`).
- **Encrypted child name:** the first name is stored only as `nameEnc`, encrypted on the server with the `NAME_KEY` secret. Nickname, age, country, state and colour are plain because the app needs them.
- **Local-First Cloud Sync (Cloud Firestore):** Transactional per-kid sync with 90% write reduction, 5.5-second per-document spacing, monotonic topic merges, and `resetEpoch` cross-device reset consistency.
- **Strict Security Boundary:** Firebase SDK isolated to `apps/client/src/lib/firebase`, zero real-time listeners (`onSnapshot` forbidden by ESLint), and owner-scoped Firestore Security Rules.

---

## 📁 Monorepo Structure

```text
C:\Kiyuv\kiyuv-learning
├── apps/client/                # React + TypeScript + Vite PWA client (@kiyuv/client)
│   ├── src/app/                # App shell, routing, error boundary, styles
│   ├── src/features/           # auth, onboarding, profiles, play, progress, parent
│   ├── src/lib/firebase/       # Isolated Firebase Auth, Firestore, Functions & App Check adapter
│   └── src/lib/sync/           # Local-first queue, transactional merge & legacy import
├── packages/shared/            # Zod schemas, constants, 6-digit PIN validator & colour themes (@kiyuv/shared)
├── packages/content/           # Curriculum map, question banks, math generators & badges (@kiyuv/content)
├── functions/                  # 2nd-gen Cloud Functions in asia-south1 (@kiyuv/functions: setPin, verifyPin)
├── firebase/                   # Firestore Security Rules emulator unit test suite (rules.test.ts)
├── docs/
│   ├── IMPLEMENTATION_PLAN.md  # Master 7-phase production engineering plan
│   └── threat-model.md         # STRIDE threat model, Spike S1/S2 record & incident runbook
├── firestore.rules             # Production Cloud Firestore Security Rules
├── firestore.indexes.json      # Firestore index definitions & topics map indexing exemption
└── firebase.json               # Hosting, CSP headers, Firestore & Functions configuration
```

---

## 🔥 How to Access & Manage Cloud Firestore

### 1. Access Firestore in the Browser (Firebase Console)
- **Database Details:**
  - **Project ID:** `kiyuv-learning`
  - **Database ID:** `(default)`
  - **Edition / Mode:** Standard Edition, Native Mode
  - **Location:** `asia-south1` (Mumbai)
- **Direct Console Links:**
  - **Browse Collections & Documents:** https://console.firebase.google.com/project/kiyuv-learning/firestore/databases/-default-/data
  - **View Deployed Security Rules:** https://console.firebase.google.com/project/kiyuv-learning/firestore/databases/-default-/rules
  - **View Indexes:** https://console.firebase.google.com/project/kiyuv-learning/firestore/databases/-default-/indexes
  - **Usage & Quota Monitor:** https://console.firebase.google.com/project/kiyuv-learning/firestore/databases/-default-/usage

### 2. Firestore Data Model (Collections & Paths)
All application data is keyed by the parent's Firebase Auth UID (`{uid}`). The source of truth is `firestore.rules`; if this table and the rules disagree, the rules win.

| Firestore Path | Access | Purpose |
|---|---|---|
| `users/{uid}` | Owner read; owner create/update of a few fields only; no delete or list | Family document: `createdAt`, `lastActiveDate`, `locale`, `resetEpoch`, `schemaVersion`. |
| `users/{uid}/kids/{kidId}` | Owner only (`kidId` matches `^k[1-6]$`), validated by `validKid` | Child profile and progress: `nameEnc`, `nickname`, `age`, `country`, `state`, `favColor`, `avatar`, `ageBand`, `track`, `stars`, `streak`, `bestStreak`, `totalCorrect`, `totalWrong`, `badges`, `topics`, `resetEpoch`, `updatedAt`. |
| `pinSecrets/{uid}` | **Server-only** (denied to all clients) | Read and written only by `functions/` through the Admin SDK: PIN hash (scrypt with a secret pepper), salt, pepper version, failed attempts, lock state. |
| `consents/{uid}/records/{id}` | Owner read; writes denied to clients | Reserved for Phase 4 consent records, written only by Cloud Functions. |

`pinFresh(seconds)` in `firestore.rules` checks the `pin_at` claim that only the Cloud Functions can set.

### 3. Access Firestore from Code
All client-side Firestore calls are strictly isolated inside [`apps/client/src/lib/firebase/index.ts`](./apps/client/src/lib/firebase/index.ts):
The functions below are in that file and use the `users/{uid}` paths. Check the file for current names and signatures, since they may change:
- **Read family and all kid profiles:** `getDoc` on `users/{uid}` plus `getDocs` on `users/{uid}/kids`.
- **Create, update or delete a kid profile:** writes to `users/{uid}/kids/{kidId}`.
- **Sync learning progress (stars, streaks, topics, badges):** a transaction on one kid document that merges counters upward and respects `resetEpoch`.

> **Important ESLint Rule:** Importing `firebase/*` outside `apps/client/src/lib/firebase/**` or using `onSnapshot` anywhere in the codebase is blocked by `eslint.config.js`.

### 4. Deploy Firestore Security Rules & Indexes via CLI
Always run commands from `C:\Kiyuv\kiyuv-learning`:

```powershell
cd C:\Kiyuv\kiyuv-learning

# Deploy ONLY Firestore Security Rules and Indexes
npx -y firebase-tools@latest deploy --only firestore --project kiyuv-learning

# Deploy ONLY Firestore Security Rules
npx -y firebase-tools@latest deploy --only firestore:rules --project kiyuv-learning

# Deploy ONLY Firestore Indexes
npx -y firebase-tools@latest deploy --only firestore:indexes --project kiyuv-learning
```

---

## 🧰 Prerequisites & Configuration

| Need | Version / value | Used for |
|---|---|---|
| Node.js | 22 (matches CI and `functions/package.json`) | Everything |
| Java | 21 or newer | Firestore emulator and rules tests only |
| Firebase projects | `.firebaserc` aliases: `dev` = `kiyuv-learning-dev`, `prod` and `default` = `kiyuv-learning` | Test against `dev`, release to `prod` |

**Client environment variables** (set in `apps/client/.env.local`, which must stay out of git):

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Firebase web config. `apps/client/src/lib/firebase/index.ts` has the production values as fallbacks, so the app runs without them. |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | Turns on App Check. Unset means App Check is off. |
| `VITE_USE_EMULATORS=true` | Connects the client to local Firebase emulators. |

Firebase web API keys are not secret, but they must be restricted by referrer and app (plan task 3.8, still open). The `PIN_PEPPER` secret is different. It lives only in Secret Manager and must never appear in the repo, logs or chat.

---

## 💻 Local Development & Testing Commands

Always open PowerShell in the project folder (`C:\Kiyuv\kiyuv-learning`) before running `npm` commands:

```powershell
cd C:\Kiyuv\kiyuv-learning

# 1. Install all workspace dependencies
npm install

# 2. Start the local Vite development server (http://localhost:5173/)
npm run dev

# 3. Typecheck all workspaces (@kiyuv/shared, @kiyuv/content, @kiyuv/functions, @kiyuv/client)
npm run typecheck

# 4. Run ESLint across the monorepo
npm run lint

# 5. Run Vitest unit tests (shared schemas, 6-digit PIN validator, content generators, sync merge, PIN Cloud Functions)
npm test

# 6. Build all workspaces for production
npm run build
```

### Running Firestore Security Rules Emulator Tests
The Firestore emulator requires **Java 21+**. It runs automatically on every push/PR in GitHub Actions (`.github/workflows/ci.yml`), or locally if Java 21+ is installed:

```powershell
npx -y firebase-tools@latest emulators:exec --only firestore --project demo-kiyuv-learning "npm run test:rules"
```

---

## 🛠️ How to Make Changes

1. **Read first:** [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) is the source of truth for scope, decisions (D1–D8) and the agent rules. Update its task checkboxes when you finish a task, and say plainly when a task is only partly done.
2. **Branch and commit:** one branch per phase (for example `phase-4/privacy`) and one commit per task. Do not push straight to `main`.
3. **Check before committing:** run `npm run lint`, `npm run typecheck` and `npm test`. For changes to `firestore.rules`, also run the rules tests (see below). CI runs the same checks.
4. **Respect the boundaries:**
   - Only `apps/client/src/lib/firebase/` may import Firebase. Never use `onSnapshot`.
   - Never log or store a PIN, PIN hash, token, email, or any child profile field outside the paths the plan defines.
   - Do not add analytics, ads, crash reporting or other third-party SDKs without an approved decision.
5. **Develop against the emulators or the `dev` project, not production data.**
6. **Stop at human gates.** Never delete a cloud resource, deploy to production, change billing, or run a bare `firebase deploy` without written approval for that exact action.
7. **Keep local AI tooling out of git.** Folders such as `.claude/` and `.mcp.json` (UI UX Pro Max, ECC and similar) are for one machine only. They are listed in `.git/info/exclude`, not in a tracked file. Never commit, merge or push them, and check `git status` before using `git add`.

---

## 🚀 Production Deployment Guide

> **Safety Rule:** Never run a bare `firebase deploy`. Always pass `--only <targets>` and `--project kiyuv-learning`.

### 1. Deploy Web App (Hosting) + Firestore
```powershell
cd C:\Kiyuv\kiyuv-learning
npm run build
npx -y firebase-tools@latest deploy --only hosting,firestore --project kiyuv-learning
```

### 2. Enable & Deploy Cloud Functions (`setPin` & `verifyPin`)
When Cloud Functions (2nd-gen) are enabled on the `kiyuv-learning` project (requires Blaze plan):

```powershell
cd C:\Kiyuv\kiyuv-learning

# Step 1: Set the 32-byte hex PIN_PEPPER secret in Google Cloud Secret Manager
npx -y firebase-tools@latest functions:secrets:set PIN_PEPPER --project kiyuv-learning

# Step 2: Deploy the functions
npm --workspace @kiyuv/functions run build
npx -y firebase-tools@latest deploy --only functions --project kiyuv-learning
```

*(The rules already enforce the `pin_at` claim on this branch. Deploy order matters: functions, then hosting, then rules. See `docs/PHASE3_CONSOLE_STEPS.md`.)*

---

## 🤝 Agent Handover Summary

### Completed & Deployed (`main` branch)
- **Phase 1 (Stop the Bleed & Lock Data):** Completed & deployed. Switched exclusively to Cloud Firestore (`asia-south1`), removed SQL Connect config, batched topic sync at end-of-round (90% write reduction), added `resetEpoch`, hardened `firestore.rules` (18-key `validKid(d)` schema, `ageBandOk`, 5-kid cap), and added `topics` map index exemption in `firestore.indexes.json`.
- **Phase 2 (Modular TypeScript + React + Vite PWA Architecture):** Completed, CI-verified, and deployed. Split into `@kiyuv/shared`, `@kiyuv/content`, `@kiyuv/client`, and `@kiyuv/functions`. Implemented the Simple Onboarding Form, Netflix/YouTube **"Who's learning today?"** Profile Picker, Curriculum Map, 10-question Topic Runner, Family Leaderboard, Parent Area, Workbox PWA precache, and GitHub Actions CI (`.github/workflows/ci.yml`).
- **Phase 3 (Server-Side 6-Digit PIN & Security): partly done, not finished.**
  - **Built and merged:** 6-digit PIN strength validation; the `setPin` and `verifyPin` functions in `functions/` with unit tests (the README previously counted 17 passing; re-run `npm test` to confirm); Google, Apple and Email sign-in UI; App Check hook in the client; CSP headers in `firebase.json`; `docs/threat-model.md`. Web and Firestore targets are deployed to https://kiyuv-learning.web.app.
  - **Code done, not deployed:** real PIN rules and rules tests, server-only PIN checks, encrypted child name (`nameEnc`). **Still open:** deploy functions, hosting and rules (task 3.5); enable Apple and Email providers (3.2); App Check (3.6); project lockdown (3.8); independent security review (3.10). Step-by-step instructions are in `docs/PHASE3_CONSOLE_STEPS.md`.

### Next Steps for Incoming Agent (See [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md))
0. **Finish Phase 3 before starting Phase 4.** The plan requires the PIN to be checked on the server before other features are added. Task numbers in the list below may not match the plan exactly (for example, plan task 4.5 is consent and 4.7 is export and delete), so follow the plan's numbering.
1. **Phase 4 — Child Privacy & Compliance (COPPA, GDPR-K, India DPDPA):**
   - Create `docs/data-inventory.md` & remove `measurementId` from Firebase config (Tasks 4.1–4.2).
   - Add `/privacy` and `/terms` views (Task 4.3).
   - Add verifiable parental consent step (`recordConsent`) before first kid creation (Task 4.4).
   - Add `exportMyData` (JSON download) and `deleteAccount` (full family + Auth deletion) in Parent Area (Tasks 4.5–4.6).
   - Add 24-month inactive cleanup scheduled function & parental gate before external links (Tasks 4.7–4.8).
2. **Phase 5 — Phone & Tablet Experience (Android & iPad):**
   - Responsive breakpoints (`600px`, `840px`, `1200px`), landscape side-by-side play layout, 64px child touch targets, self-hosted rounded font (`Fredoka`/`Nunito`), WCAG 2.2 AA contrast & `prefers-reduced-motion`, and Playwright viewport tests.
3. **Phase 6 — Android & iOS Native Packaging (Capacitor):**
   - Capacitor project setup in `apps/client`, native Google/Apple Auth & App Check plugins, iPad multitasking, and store metadata.
4. **Phase 7 — Billing Guardrails & Production Launch:**
   - Spend caps, Cloud Monitoring alerts, Pub/Sub billing kill-switch function, daily Firestore backups, and multi-device soak test.
5. **Pending Cloud Console / Human Gates:**
   - Delete unused SQL Connect service (`kiyuv-learning-service`) and Cloud SQL instance (`kiyuv-learning-fdc`) in `asia-south1` when ready.
   - Follow `docs/PHASE3_CONSOLE_STEPS.md`: create the `PIN_PEPPER` and `NAME_KEY` secrets, enable the Cloud Functions APIs, then deploy functions, hosting and rules in that order.
