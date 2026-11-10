# Phase 3: steps only you can do

These are the Phase 3 tasks that need your Google, Firebase or Apple accounts. The code side is done on branch `phase-3/complete-pin-and-encryption`. Do the steps in the order below, because the order matters for step 4.

**Everything here targets the one project, `kiyuv-learning`.** The app is not live yet, so testing on it is fine. A separate `kiyuv-learning-dev` project does not exist yet (the `dev` alias in `.firebaserc` is a placeholder). Create it, and start testing there first, before the first real family joins.

While testing on this project, use made-up child names only, and delete every test account and profile before launch.

Run every command from `C:\Kiyuv\kiyuv-learning` in PowerShell. Never paste a secret value into chat, a file in the repo, or a commit.

## Progress (updated 2026-11-10)

| Step | Status |
| --- | --- |
| 1. Secrets `PIN_PEPPER` and `NAME_KEY` | Done. Offline backup copy is pending a password-manager decision (files still in `C:\Users\welcome\kiyuv-secrets-BACKUP\`). |
| 2. Google Cloud APIs | Done (enabled by the first deploy). |
| 3. Service account roles | Done: Cloud Build Service Account and Service Account Token Creator on the default compute service account. |
| 4a. Deploy functions | Done. All four are deployed, but **callers get 403** (see the blocker below). |
| 4b. Deploy hosting, then 4c. rules | **Do not do yet.** Rules that require the PIN would lock everyone out while the functions are unreachable. |
| 5. Checks | Blocked by the item below. |
| 6. Sign-in providers (3.2) | **Google only for now (decision 2026-11-10).** Apple and Email/Password are deferred until the app is proven. The login screen hides them (`ENABLE_APPLE_SIGN_IN` and `ENABLE_EMAIL_SIGN_IN` in `LoginScreen.tsx`). Only check that Google is enabled. |
| 7. App Check (3.6) | **Backlog (decision 2026-11-10): do before launching to the public.** Not needed while only the team uses the app. |
| 8. Project lockdown (3.8) | Open. |
| 9. Security review (3.10) | Open. |

## BLOCKER: organization policy (waiting on the organization owner)

The organization policy **Domain restricted sharing** (`iam.allowedPolicyMemberDomains`) stops `allUsers` from being granted the **Cloud Run Invoker** role on the four functions. Until it is overridden, every call to `setPin`, `verifyPin`, `encryptProfileName` and `decryptProfileNames` gets HTTP 403 before reaching our code.

Who: someone with the **Organization Policy Administrator** role on the `kiyuv.com` organization (the owner, based in the US, to be contacted).

What to do, for this project only:
1. Google Cloud console, project `kiyuv-learning`, IAM & Admin, Organization Policies.
2. Open **Domain restricted sharing**, Manage policy, Override parent's policy, add a rule **Allow all**, Set policy.
3. Then Cloud Run, tick `setpin`, `verifypin`, `encryptprofilename`, `decryptprofilenames`, open the Permissions panel, Add principal `allUsers` with role **Cloud Run Invoker**. Save.
4. Tell the developer. Then do steps 4b, 4c and 5.

Safe to do because: the functions reject anyone who is not a signed-in parent, and name functions also need a PIN entered in the last 5 minutes. Afterwards, only grant project roles to `kiyuv.com` accounts and grant `allUsers` to nothing else.

## Before you start

1. Sign in to the Firebase CLI: `npx -y firebase-tools@latest login`
2. Confirm you can see the project: `npx -y firebase-tools@latest projects:list`. It must list `kiyuv-learning`, which is already on the Blaze plan that Cloud Functions need.
3. Do the checks in step 5 right after each deploy. If one fails, stop and tell me.

## Step 1. Create the two secrets (needed for task 3.5)

There are two secrets. `PIN_PEPPER` is mixed into every PIN hash. `NAME_KEY` is the master key for the encrypted child names.

1. Generate a random value for each. Run this twice and keep the two outputs separate:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Store each one in Google Secret Manager through Firebase. The command asks you to paste the value:
   ```powershell
   npx -y firebase-tools@latest functions:secrets:set PIN_PEPPER --project kiyuv-learning
   npx -y firebase-tools@latest functions:secrets:set NAME_KEY --project kiyuv-learning
   ```
   When a dev project exists later, set its own secrets with different values.
3. Save a copy of each production value in a password manager. **If `NAME_KEY` is lost, every stored child name becomes unreadable and cannot be recovered.** If `PIN_PEPPER` is lost, every parent has to set a new PIN.

## Step 2. Turn on the Google Cloud services (task 3.5)

Cloud Functions need several APIs. The deploy command normally offers to enable them. If it fails, enable these in the Google Cloud console under APIs & Services, Library, for the project you are deploying to:

- Cloud Functions API
- Cloud Build API
- Artifact Registry API
- Cloud Run Admin API
- Secret Manager API

## Step 3. Let the PIN function sign tokens (task 3.5)

`verifyPin` creates a sign-in token. That needs permission for the function's service account to sign for itself.

1. Open the Google Cloud console, IAM & Admin, Service Accounts, for the project.
2. Open the account named like `<project number>-compute@developer.gserviceaccount.com`. This is the default account Cloud Functions 2nd gen run as.
3. Open the Permissions tab, choose Grant access.
4. In New principals, enter that same service account email.
5. Choose the role **Service Account Token Creator** and save.

If `verifyPin` later fails with `iam.serviceAccounts.signBlob` in the logs, this step is missing or applied to the wrong account.

## Step 4. Deploy in this order (task 3.5)

**The order matters.** The new Firestore rules require the PIN claim that only the functions create. If you deploy the rules first, nobody can sign in to the app until the functions exist.

1. Merge or check out the branch, then build and test locally:
   ```powershell
   git checkout phase-3/complete-pin-and-encryption
   npm ci
   npm run lint; npm run typecheck; npm test
   ```
2. Deploy the functions first:
   ```powershell
   npm --workspace @kiyuv/functions run build
   npx -y firebase-tools@latest deploy --only functions --project kiyuv-learning
   ```
3. Deploy the website next:
   ```powershell
   npm run build
   npx -y firebase-tools@latest deploy --only hosting --project kiyuv-learning
   ```
4. Deploy the rules last:
   ```powershell
   npx -y firebase-tools@latest deploy --only firestore --project kiyuv-learning
   ```
5. Never run a bare `firebase deploy`.

## Step 5. Check it works (tasks 3.1 and 3.5)

Open https://kiyuv-learning.web.app and check each line. If any fails, stop and tell me.

- [ ] A new account asks you to set a 6-digit PIN, and `111111` and `123456` are refused.
- [ ] After setting the PIN you reach the "Who's learning?" screen.
- [ ] Add a child with a first name. In the Firebase console, open Firestore, `users`, your account, `kids`. The document must have `nameEnc` starting with `v1.` and **no `name` field**.
- [ ] The Parent Area shows the child's first name.
- [ ] Reload the page and enter a wrong PIN 5 times. The sixth try is blocked for 15 minutes.
- [ ] Open the browser developer tools, Application, Local Storage. There must be no key containing `pinHash`, and no child name.
- [ ] Wait until the PIN is more than 5 minutes old, then try to edit a profile. It must ask for the PIN again.
- [ ] Spike S1 and S2 (task 3.1): in the Network tab, a Firestore read made after unlocking succeeds. Sign in with Google again from a second browser profile and set a new PIN; it must work only because you just signed in.

If S1 fails (the rules do not see the PIN claim even though the PIN was correct), the plan has a fallback design. Tell me and I will build it.

## Step 6. Sign-in providers (task 3.2)

**Google only for now.** Apple, Email/Password, Identity Platform, email enumeration protection and the password policy are deferred (backlog) until the app works and is secure. Do them when you add more providers.

Now: Firebase console, Authentication, Sign-in method. Confirm **Google** is **Enabled** and has a support email. Make sure **Email/Password** is **off** (the app does not offer it).

Backlog, for later:
1. Email/Password with verification, Identity Platform upgrade, email enumeration protection, password policy (8 or more characters with upper case, lower case and a number, enforced).
2. Apple: needs a paid Apple Developer Program membership (about $99 a year). Not required until the iOS app is published (Phase 6).
3. Then set `ENABLE_EMAIL_SIGN_IN` or `ENABLE_APPLE_SIGN_IN` to `true` in `LoginScreen.tsx`.

## Step 7. App Check (task 3.6): BACKLOG until just before public launch

Decision 2026-11-10: skip for now. The app is used only by the team, the client leaves App Check off when `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` is not set, and the functions have `enforceAppCheck: false`, so nothing breaks.

**Must be done before launching to the public.** Without it, anyone who finds the function addresses can send junk requests (rejected, but each counts as an invocation).

When you do it (the Google console now calls the product **Fraud Defense**, and Firebase still calls it reCAPTCHA Enterprise):
1. Enable the reCAPTCHA Enterprise API: https://console.cloud.google.com/apis/library/recaptchaenterprise.googleapis.com
2. Open https://console.cloud.google.com/security/recaptcha, Keys tab, Create key. Display name `Kiyuv web`, application type **Web**, domains `kiyuv-learning.web.app` and `kiyuv-learning.firebaseapp.com`. Keep **Disable domain verification** off, never add `localhost`, keep it **score-based** (no checkbox). Copy the key ID (starts with `6L`).
3. Firebase console, App Check, Apps tab: choose the web app, pick reCAPTCHA Enterprise, paste the key ID, set the token time-to-live to 3 days (range 30 minutes to 7 days; the library refreshes at about half the time), leave the risk threshold at 0.5, Save.
4. Put the key in `apps/client/.env.local` as `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`, rebuild and deploy hosting.
5. **Do not enforce yet.** Watch App Check metrics for 3 to 7 days of normal use. Enforce on Cloud Firestore and Cloud Functions only when nearly all requests show as verified.
6. Tell the developer so `enforceAppCheck: true` is set on the functions and they are redeployed.

Cost: the first 10,000 assessments a month are free (Google's billing page, unverified for the latest date). Above that it is a flat fee up to 100,000, then about $1 per 1,000. Keep the budget alerts on.

## Step 8. Lock down the project (task 3.8)

1. **API key restrictions.** Google Cloud console, APIs & Services, Credentials, open the Browser key used by the web app.
   - Application restrictions: Websites. Add `https://kiyuv-learning.web.app/*` and `https://kiyuv-learning.firebaseapp.com/*`.
   - API restrictions: Restrict key. Allow only Identity Toolkit API, Token Service API, Cloud Firestore API, Firebase Installations API, and Firebase App Check API.
   - Save, then test sign-in on the live site.
2. **Authorized domains.** Firebase console, Authentication, Settings, Authorized domains. Remove `localhost` from the production project. Local development then has to use the emulators or a dev project, so do this one only when you create the dev project.
3. **2-step verification.** Everyone with access to the project must turn it on in their Google account (myaccount.google.com, Security, 2-Step Verification). Use an authenticator app or a security key.
4. **Least-privilege access.** Google Cloud console, IAM & Admin, IAM. For each person, keep the smallest role that works (for example Firebase Viewer or Editor instead of Owner). Remove anyone who no longer needs access.
5. **Budget alerts** (if not done in Phase 1): Billing, Budgets & alerts, create alerts at $1, $5, $10 and $25.

## Step 9. Independent security review (task 3.10)

Hire an independent reviewer before public launch. Give them: `docs/threat-model.md`, `firestore.rules`, `functions/src`, and a test account on the project. Ask them to test PIN brute force and lockout bypass, token and claim tampering, cross-family data access, and the name-encryption design. Fix every high and medium finding, then record the result in the plan.

## When you are done

Tell me which steps passed. I will then tick the matching tasks in `docs/IMPLEMENTATION_PLAN.md` and set `enforceAppCheck` once step 7 is complete.

## Before the first real family joins

- [ ] Create `kiyuv-learning-dev` and use it for all testing from then on.
- [ ] Delete all test accounts and test profiles from `kiyuv-learning`.
- [ ] Rotate `PIN_PEPPER` and `NAME_KEY` if either was ever pasted anywhere outside Secret Manager and your password manager.
