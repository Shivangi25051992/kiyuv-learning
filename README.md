# 🧠 Kiyuv Learning Academy

A gamified learning PWA for young kids — curriculum spans CBSE (India), US Common Core, UK National Curriculum, Australia ACARA + Olympiad prep (IMO / NSO / IEO / NCO / Spelling Bee).

**Live:** https://kiyuv-learning.web.app

Built for two kids initially — Yuvin (6, targeting Gr 3-4) and Kiki (2, targeting Pre-K/K) — but the architecture generalises to any family.

---

## ✨ What's inside

- **9 subjects per kid × 20+ topics** with difficulty levels (Easy / Medium / Hard)
- **Infinite math** via generators + hand-crafted content for spelling, vocabulary, GK, science, grammar, logic
- **Gamification:** stars, streaks, mastery, 14 badges, cross-kid leaderboard
- **Audio feedback:** Web Audio API chimes (no audio files needed), muteable
- **Celebrations:** confetti bursts, star showers, floating emojis, trophy pops
- **Google Sign-In + 4-digit PIN** for daily unlock (no OTP cost)
- **Firestore cloud sync** — progress follows across tablet / phone / laptop
- **Offline-first PWA** — install to home screen, works without network
- **Security rules:** each authenticated user only reads/writes their own data tree

---

## 🏗️ Tech stack

- **Pure static HTML/CSS/JS** — no build step, no framework
- **Firebase Hosting** — global CDN
- **Firebase Auth** — Google sign-in
- **Firestore** — progress persistence (region: `asia-south1` Mumbai)
- **Service Worker** — offline shell cache

Single-file app at `public/index.html` (~80 KB uncompressed). Everything else is static assets.

---

## 📁 Repo layout

```
.
├── public/                     # Everything Firebase Hosting serves
│   ├── index.html              # The whole app
│   ├── simple.html             # Lighter alternative playground
│   ├── manifest.webmanifest    # PWA manifest
│   ├── sw.js                   # Service Worker
│   ├── robots.txt              # Disallow indexing
│   └── icons/                  # PWA icons (192/512/1024/maskable + Apple sizes)
├── firebase.json               # Hosting + Firestore config
├── .firebaserc                 # Default project binding
├── firestore.rules             # Security: users read/write only their own data
└── firestore.indexes.json      # (empty — app doesn't need composite indexes yet)
```

---

## 🚀 Deploy

Prereqs: Firebase CLI (`npm i -g firebase-tools`), authenticated (`firebase login`), and this project either linked to `kiyuv-learning` (via `.firebaserc`) or any Firebase project you own.

```bash
# One-time: install Firebase CLI
npm install -g firebase-tools
firebase login

# Deploy everything (hosting + firestore rules)
firebase deploy

# Or just hosting
firebase deploy --only hosting
```

---

## 🔑 Firebase client config

The web SDK config (apiKey, authDomain, projectId etc.) is **embedded in `public/index.html`**. This is **safe for public repos** — Firebase API keys identify the project, they aren't secret. Security is enforced by:

1. **Firebase Authentication** — only signed-in users can do anything
2. **Firestore security rules** (in `firestore.rules`) — users can only access their own `/users/{uid}/...` tree
3. **Authorized domains** (configured in Firebase Console → Auth → Settings) — only whitelisted domains can use Google Sign-In

If you fork this and want to use **your own Firebase project**, replace the `firebaseConfig` object in `public/index.html` with yours.

---

## 🧪 Local dev

Since it's pure static, any HTTP server works:

```bash
# Using Firebase emulators (recommended — mimics production headers)
firebase emulators:start --only hosting

# Or Python
cd public && python3 -m http.server 8080
```

Service worker + PWA install only work over HTTPS (or `localhost`).

---

## 📚 Adding content

Question banks live directly in the `<script>` block of `public/index.html`:

- `KIKI_*` constants — Kiki's content (animals, shapes, colors, Hindi alphabet, …)
- `YUVIN_*` constants — Yuvin's content (spelling, vocab, science, GK, grammar, Olympiad logic)
- `mathGen` object — math generators (infinite questions)
- `CURRICULUM` object — the curriculum map (subjects × topics × grade alignment)

To add a new topic: drop entries into the relevant bank, then reference the topic ID in `CURRICULUM.yuvin.subjects[*].topics` (or `kiki`), plus (if needed) a `nextQuestion()` branch.

---

## 🛣️ Roadmap

- [ ] Daily parent email summary (Cloud Function + SendGrid)
- [ ] WhatsApp notification (Twilio)
- [ ] Multi-child profiles per family (support > 2 kids)
- [ ] Hindi full alphabet + Hindi words
- [ ] Reading comprehension passages
- [ ] Kids' voice-based answers (speech recognition)

---

## 🙏 Credits

Built by Papa for the family. Open to share — fork freely.
