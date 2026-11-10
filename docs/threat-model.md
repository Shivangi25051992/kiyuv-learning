# Kiyuv Learning Academy — Threat Model & Incident Runbook

**Last Updated:** 2026-11-10  
**Scope:** Web PWA (`https://kiyuv-learning.web.app`), Cloud Firestore (`asia-south1`), Cloud Functions 2nd Gen (`asia-south1`), and Firebase Authentication.

---

## 1. System Architecture & Trust Boundaries

1. **Untrusted Client Boundary (Browser / Mobile WebView):**
   - A child holding an unlocked phone or tablet has physical access to the client UI.
   - Any state in `localStorage` or `sessionStorage` is untrusted for security enforcement and used only for local-first caching and per-device UX (`activeKid:{uid}`).
2. **Authentication & Session Boundary (Firebase Auth + Custom Claims):**
   - Only parents authenticate (Google, Apple, or verified Email/Password). Children have no accounts.
   - `verifyPin` and `setPin` Cloud Functions verify the parent's 6-digit PIN on the server and stamp `pin_at` (Unix epoch seconds) into both custom user claims (`setCustomUserClaims`) and a custom token (`createCustomToken`).
3. **Database Boundary (Cloud Firestore `asia-south1`):**
   - Enforces owner-only access (`request.auth.uid == uid`), strict 18-key schema validation (`validKid`), `ageBandOk(age, ageBand)` consistency, 5-second per-document write spacing, and `pinFresh(seconds)` checks (`43200s` for 12h play session, `300s` for 5m parent profile/reset actions) with **zero `get()` calls**.
   - `pinSecrets/{uid}` has no client rule match and is 100% denied to clients.

---

## 2. Spike S1 & S2 Verification Record (Task 3.1)

- **Spike S1 (`pin_at` visibility in Firestore Rules & token refresh survival):**
  - `mintPinTokenAndClaims` sets `pin_at` via `admin.auth().setCustomUserClaims(uid, { pin_at })` and mints a custom token with `{ pin_at }`.
  - Calling `auth.currentUser.getIdToken(true)` refreshes the ID token in-place with `request.auth.token.pin_at`, which persists across all subsequent hourly token refreshes and is verified in `firebase/rules.test.ts`.
- **Spike S2 (Provider re-authentication check in `setPin`):**
  - `isFreshProviderSignIn` inspects both `request.auth.token.firebase.sign_in_provider` (`google.com`, `apple.com`, `password`) and `request.auth.token.auth_time` (`<= 300s`).
  - A token minted via `custom` provider is rejected when attempting to change or reset an existing PIN (`functions/src/pin.test.ts`).

---

## 3. STRIDE Threat Analysis

| Threat | Category | Mitigation Implemented |
| --- | --- | --- |
| Child or holder of unlocked device edits/deletes sibling profile or resets stars | Elevation of Privilege | Profile creation, profile field edits (`name`, `nickname`, `age`, `country`, `state`, `favColor`, `avatar`, `ageBand`, `track`), profile deletion, and `resetEpoch` increments require `pinFresh(300)` (5-minute PIN). |
| Brute-force guessing of Parent PIN | Spoofing / Brute Force | 6-digit PIN rejecting repeated digits, sequences, and top-50 common PINs. `reserveAttemptTransaction` records each attempt in a Firestore transaction *before* running `scrypt` + `timingSafeEqual`. 5 failures = 15m lockout; 10 failures = hard lockout requiring fresh provider sign-in. |
| Offline database compromise of `pinSecrets/{uid}` | Information Disclosure | PIN is pre-hashed with `HMAC-SHA256(pepper, uid:pin)` using a Secret Manager secret (`PIN_PEPPER`) and derived with `scrypt(N=32768, r=8, p=1)` + 16-byte random salt. |
| Cross-family data read/write | Tampering / Disclosure | All profiles live under `users/{uid}/kids/{kidId}`. `isOwner(uid)` denies cross-tenant access; `users` listing is denied (`allow list: if false`). |
| Cost / denial-of-wallet attack via rapid Firestore writes | Denial of Service | Client batches writes to topic completion (`~90%` reduction); `firestore.rules` enforces `request.time > resource.data.updatedAt + duration.value(5, 's')` per kid document and caps kid IDs to `^k[1-6]$`. |
| Cross-Site Scripting (XSS) | Tampering / Elevation | All `innerHTML` and inline event handlers removed in Phase 2; strict `Content-Security-Policy` header with no `unsafe-inline` in `script-src` and `object-src 'none'`. |

---

## 4. Incident Response & Breach Notification Runbook

### Immediate Containment (Target: < 1 hour)
1. **Pause Writes / Lock Down Rules:** Deploy read-only `firestore.rules` if active abuse is detected.
2. **Rotate `PIN_PEPPER`:** Add a new secret version in Google Cloud Secret Manager, bump `currentVersion` in `functions/src/index.ts`, and redeploy `functions`.
3. **Revoke Sessions:** If token compromise is suspected, run `admin.auth().revokeRefreshTokens(uid)` for affected accounts.

### Regulatory Notification Timelines
- **India DPDP Act / Rules:** Notify the Data Protection Board of India and affected parents without undue delay (and within 72 hours for detailed filing).
- **GDPR / UK GDPR:** Notify the relevant supervisory authority within **72 hours** of becoming aware of a personal data breach.
- **US COPPA / State Breach Laws:** Notify affected parents directly if any child profile data (`name`, `nickname`, `age`, `country`, `state`) is exposed.
