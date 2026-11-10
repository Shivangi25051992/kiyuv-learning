# 🧠 Kiyuv Learning Academy

A cross-platform, multi-profile gamified learning application for children aged 2 to 13 — spanning India CBSE, US Common Core, UK National Curriculum, Australia ACARA, and Olympiad preparation (IMO / NSO / IEO / NCO / Spelling Bee).

- **Live Web App (Firebase Hosting):** https://kiyuv-learning.web.app (also https://kiyuv-learning.firebaseapp.com)
- **Firebase Console:** https://console.firebase.google.com/project/kiyuv-learning/overview
- **Firestore Data Viewer:** https://console.firebase.google.com/project/kiyuv-learning/firestore/databases/-default-/data
- **GitHub Repository:** https://github.com/Shivangi25051992/kiyuv-learning

---

## ✨ Key Features

- **OTT-Style Multi-Profile ("Who's learning today?"):** Up to 5 child profiles (`k1`..`k5`) under one parent account, with per-device active profile selection (`localStorage["activeKid:{uid}"]`) so siblings can learn simultaneously on different devices without overwriting each other.
- **Simple Onboarding Form:** Full name, nickname, age (`2–13`), country, state/region, favourite colour theme (8 accessible palettes), and preset emoji avatar.
- **Two Curriculum Tracks (`early` & `primary`):**
  - **Early Years (Ages 2–4):** Counting, English alphabet, colors, shapes, animals, fruits, body parts, opposites, and Hindi Varnamala.
  - **Primary & Olympiad (Ages 5–13):** Infinite math generators (addition, subtraction, multiplication, division, word problems, place value, time, rounding) plus curated banks for spelling bee, vocabulary, grammar, science, GK, and logic.
- **6-Digit Parent PIN & Multi-Provider Auth:**
  - Google, Apple, and verified Email/Password sign-in, plus offline device mode.
  - 6-digit Parent PIN rejecting repeated digits, sequences, and top-50 common PINs, backed by 2nd-gen Cloud Functions (`setPin`, `verifyPin`) using `HMAC-SHA256` pepper + `scrypt` + `timingSafeEqual` (with automatic client SHA-256 fallback when Cloud Functions are not yet active).
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
All application data lives under `/families/{uid}` where `{uid}` is the parent's Firebase Auth UID:

| Firestore Path | Access | Purpose |
|---|---|---|
| `/families/{uid}` | Read/Write by owner (`request.auth.uid == uid`) | Family metadata document (`kidCount: 0..5`, `schemaVersion: 2`, `updatedAt`, plus legacy `pinHash` fallback field). |
| `/families/{uid}/kids/{kidId}` | Read/Write by owner (`kidId` in `k1`..`k5`) | Child profile & learning progress (`name`, `nickname`, `age`, `country`, `state`, `favColor`, `avatar`, `ageBand`, `track`, `stars`, `streak`, `bestStreak`, `totalCorrect`, `totalWrong`, `badges`, `topics`, `resetEpoch`, `updatedAt`). |
| `/families/{uid}/private/pin` | **Server-only** (`allow read, write: if false;`) | Accessed exclusively by `functions/` via Firebase Admin SDK. Stores `hash` (`scrypt`), `salt`, `pepperVersion`, `failedAttempts`, `lockUntil`, and `hardLocked`. |
| `/families/{uid}/consents/{consentId}` | Read by owner; Write via Admin SDK | Reserved for Phase 4 verifiable parental consent records. |

### 3. Access Firestore from Code
All client-side Firestore calls are strictly isolated inside [`apps/client/src/lib/firebase/index.ts`](./apps/client/src/lib/firebase/index.ts):
- **Read family & all kid profiles:** `fetchCloudFamily(uid)` (`getDoc` on `/families/{uid}` + `getDocs` on `/families/{uid}/kids`)
- **Create or update a kid profile:** `saveKidProfileToCloud(uid, kidId, kid, isNewKid)` (`runTransaction` updating `/families/{uid}` and `/families/{uid}/kids/{kidId}`)
- **Sync learning progress (stars/streaks/topics/badges):** `syncKidProgressTransaction(uid, kidId, localKid)` (`runTransaction` merging monotonic max counters and respecting `resetEpoch`)

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

*(Once `setPin` and `verifyPin` are live in production, update `pinFresh(seconds)` in `firestore.rules` to enforce `request.auth.token.get('pin_at', 0) * 1000 > request.time.toMillis() - seconds * 1000` per Task 3.5 of `docs/IMPLEMENTATION_PLAN.md`.)*

---

## 🤝 Agent Handover Summary

### Completed & Deployed (`main` branch)
- **Phase 1 (Stop the Bleed & Lock Data):** Completed & deployed. Switched exclusively to Cloud Firestore (`asia-south1`), removed SQL Connect config, batched topic sync at end-of-round (90% write reduction), added `resetEpoch`, hardened `firestore.rules` (18-key `validKid(d)` schema, `ageBandOk`, 5-kid cap), and added `topics` map index exemption in `firestore.indexes.json`.
- **Phase 2 (Modular TypeScript + React + Vite PWA Architecture):** Completed, CI-verified, and deployed. Split into `@kiyuv/shared`, `@kiyuv/content`, `@kiyuv/client`, and `@kiyuv/functions`. Implemented the Simple Onboarding Form, Netflix/YouTube **"Who's learning today?"** Profile Picker, Curriculum Map, 10-question Topic Runner, Family Leaderboard, Parent Area, Workbox PWA precache, and GitHub Actions CI (`.github/workflows/ci.yml`).
- **Phase 3 (Server-Side 6-Digit PIN & Security):** Completed, tested (17 unit tests passing), pushed to `origin/main`, and web/Firestore targets deployed to `https://kiyuv-learning.web.app`. Includes 6-digit PIN strength validation, `@kiyuv/functions` (`setPin` / `verifyPin` with `HMAC-SHA256` pepper + `scrypt` + `timingSafeEqual` + 5/10-attempt lockout + Spike S1/S2 token claims), Google/Apple/Email auth UI, App Check hook, strict CSP headers in `firebase.json`, and `docs/threat-model.md`.

### Next Steps for Incoming Agent (See [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md))
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
   - Enable Cloud Functions API + set `PIN_PEPPER` secret to deploy `functions` (`setPin`, `verifyPin`) and activate `pinFresh(300)` enforcement in `firestore.rules`.
