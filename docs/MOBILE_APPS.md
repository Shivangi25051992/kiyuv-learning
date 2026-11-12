# Android and iPhone/iPad apps

The apps are the web app wrapped with Capacitor 7 (`apps/client/android`, `apps/client/ios`). The same code runs everywhere. `isNativeApp()` in `src/lib/native.ts` is the one switch for phone-only behaviour.

## What is done

| Area | State |
|---|---|
| Capacitor shell, Android and iOS projects | Added. App ID is a placeholder, `com.kiyuv.learning`, set in `capacitor.config.ts`, `android/app/build.gradle` and the Xcode project. Change it before the first store upload, never after. |
| Phone build | `npm run cap:sync -w @kiyuv/client` builds with `--mode native` (no service worker) and copies it into both projects. |
| Icons and splash screens | Generated from `apps/client/assets/` with `npx capacitor-assets generate`. Replace the source images to restyle. |
| Sign-in | Google and Apple use the phone's own sign-in (`@capacitor-firebase/authentication`, `skipNativeAuth`) and hand the token to Firebase. Sign in with Apple is shown on iPhone/iPad because the App Store requires it next to Google. |
| Account deletion and data download | In the Parent area (PIN needed). Download opens the share sheet on phones. |
| Privacy, terms, credits | `public/privacy.html`, `public/terms.html` (drafts for the lawyer), and About and credits in the Parent area and on the sign-in screen. |
| Android test build in CI | `.github/workflows/android.yml` builds a debug APK on every app change and keeps it for 14 days. |
| Backups | Android `allowBackup` is off, so a child's data is not copied to Google Drive. |

## What needs an account, a Mac or a decision

1. **Developer accounts (company).** Google Play Console ($25, once) and Apple Developer Program ($99/year). Both ask for the company's legal details; Apple needs a D-U-N-S number for a company. A new Play account for an organisation skips the "12 testers for 14 days" rule that personal accounts have.
2. **Firebase apps.** In the Firebase console add an Android app (package ID, plus the debug and release SHA-1 and SHA-256) and an iOS app (bundle ID). Put `google-services.json` in `apps/client/android/app/` and `GoogleService-Info.plist` in `apps/client/ios/App/App/`. Both are safe to commit. Turn on the Apple sign-in provider in Firebase Authentication.
3. **iOS build.** Needs a Mac or a cloud Mac service. On the Mac: `npm ci`, `npm run cap:sync -w @kiyuv/client`, `npx cap open ios`, then in Xcode turn on the Sign in with Apple capability, add the `REVERSED_CLIENT_ID` from `GoogleService-Info.plist` as a URL scheme, set the team and bundle ID, and archive.
4. **Release signing (Android).** Create an upload keystore, keep it (and its password) outside the repo, and let Play App Signing hold the real key.
5. **Store listings.** Screenshots (phone and iPad), description, privacy policy URL (`https://kiyuv-learning.web.app/privacy.html`), support email, age rating, and the data-safety / privacy-label forms (see below).
6. **Kids-category rules.** Google Play "Designed for Families" and the App Store Kids Category forbid advertising, third-party analytics and links out of the app that a child can reach. The app has none of these. The only outward links (privacy, terms) sit behind the Parent area or the sign-in screen, which children do not see once a parent is signed in.
7. **Lawyer review** (decision D5): the privacy policy and terms, parental consent, groups, the feelings check-in and encrypted first names.

## Store form answers (to check against the policy)

- Data collected: email (account), child nickname, age, country/region, optional first name (encrypted), learning progress. Used for app functionality only. Not sold, not shared for advertising. Deletable in the app.
- No ads, no analytics, no location, no camera/microphone, no contacts, no purchases yet.
- Target audience: ages 2 to 13, so the apps go in the children's/family categories.

## Known gaps

- The Android build has been verified in CI only, not on a phone, and the iOS project has not been opened in Xcode yet.
- Native Google and Apple sign-in cannot be tested until step 2 above is done.
- Play's required target API level moves every year. Check `targetSdkVersion` in `android/variables.gradle` before each submission.
