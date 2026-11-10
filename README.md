# 🧠 Kiyuv Learning Academy

A cross-platform, multi-profile gamified learning application for children aged 2 to 13 — spanning India CBSE, US Common Core, UK National Curriculum, Australia ACARA, and Olympiad preparation (IMO / NSO / IEO / NCO / Spelling Bee).

**Live:** https://kiyuv-learning.web.app

---

## ✨ Key Features

- **OTT-Style Multi-Profile ("Who's learning?"):** Up to 6 child profiles (`k1`..`k6`) under one parent account, with per-device active profile selection so multiple children can learn simultaneously on different devices.
- **Simple Privacy-First Onboarding:** Nickname, optional first name, age (2–13), country, optional state/region, favourite colour theme (8 accessible palettes), and preset emoji avatar.
- **Two Curriculum Tracks (`early` & `primary`):**
  - **Early Years (Ages 2–4):** Counting, English alphabet, colors, shapes, animals, fruits, body parts, opposites, and Hindi Varnamala.
  - **Primary & Olympiad (Ages 5–13):** Infinite math generators (addition, subtraction, multiplication, division, word problems, place value, time, rounding) plus curated banks for spelling bee, vocabulary, grammar, science, GK, and logic.
- **Local-First Cloud Sync (Cloud Firestore):** Transactional per-kid sync with 90% write reduction, 5.5-second per-document spacing, monotonic topic merges, and `resetEpoch` cross-device reset consistency.
- **Strict Security Boundary:** Firebase SDK isolated to `apps/client/src/lib/firebase`, zero real-time listeners (`onSnapshot` forbidden by ESLint), and owner-scoped Firestore Security Rules.

---

## 📁 Monorepo Structure

```text
apps/client/            React + TypeScript + Vite PWA client
  src/app/              App shell, routing, error boundary, styles
  src/features/         auth, onboarding, profiles, play, progress, parent
  src/lib/firebase/     Isolated Firebase Auth & Firestore adapter
  src/lib/sync/         Local-first queue, transactional merge & legacy import
packages/shared/        Zod schemas, constants, colour themes & validators
packages/content/       Curriculum map, question banks, math generators & badges
firebase/               Firestore Security Rules emulator test suite
firestore.rules         Production Cloud Firestore Security Rules
firestore.indexes.json  Firestore index definitions & topics map exemption
```

---

## 🧪 Local Development & Verification

```bash
# Install workspace dependencies
npm install

# Start Vite dev server
npm run dev

# Run typecheck, lint, unit tests, and production build
npm run typecheck
npm run lint
npm test
npm run build
```
