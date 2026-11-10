import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import {
  KID_IDS,
  KidProfileSchema,
  type KidId,
  type KidProfile,
  type KidProfileData,
} from '@kiyuv/shared';

export interface AuthParentUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBS8PdHxWs5MkiZGco0Z6njbeq-C98GUOo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'kiyuv-learning.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'kiyuv-learning',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'kiyuv-learning.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '312015583553',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:312015583553:web:a04711e9523a2e90b409c0',
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let emulatorsConnected = false;

function ensureFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    try {
      dbInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      dbInstance = getFirestore(appInstance);
    }
    void setPersistence(authInstance, browserLocalPersistence).catch(() => {});

    if (import.meta.env.VITE_USE_EMULATORS === 'true' && !emulatorsConnected) {
      emulatorsConnected = true;
      connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
    }
  }
  return {
    app: appInstance,
    auth: authInstance!,
    db: dbInstance!,
  };
}

function toAuthParentUser(u: User | null): AuthParentUser | null {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  };
}

export function getCurrentAuthUser(): AuthParentUser | null {
  const { auth } = ensureFirebase();
  return toAuthParentUser(auth.currentUser);
}

export function subscribeAuthState(cb: (user: AuthParentUser | null) => void): () => void {
  const { auth } = ensureFirebase();
  return onAuthStateChanged(auth, (u) => cb(toAuthParentUser(u)));
}

export async function signInWithGoogle(): Promise<AuthParentUser> {
  const { auth } = ensureFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const res = await signInWithPopup(auth, provider);
  return {
    uid: res.user.uid,
    email: res.user.email,
    displayName: res.user.displayName,
    photoURL: res.user.photoURL,
  };
}

export async function signOutParent(): Promise<void> {
  const { auth } = ensureFirebase();
  await signOut(auth);
}

function getBrowserLocale(): string {
  const raw = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 16);
  return raw.length >= 2 ? raw : 'en';
}

let userDocKnownExistsForUid: string | null = null;

export async function ensureParentUserDocToday(uid: string, localResetEpoch: number): Promise<number> {
  const { db } = ensureFirebase();
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `kiyuv_lastActive_${uid}`;
  if (
    userDocKnownExistsForUid === uid &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(cacheKey) === today
  ) {
    return localResetEpoch;
  }

  const userRef = doc(db, 'users', uid);
  let effectiveEpoch = localResetEpoch;

  if (userDocKnownExistsForUid !== uid) {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      userDocKnownExistsForUid = uid;
      const d = snap.data();
      if (typeof d['resetEpoch'] === 'number' && d['resetEpoch'] > effectiveEpoch) {
        effectiveEpoch = d['resetEpoch'];
      }
      if (d['lastActiveDate'] === today) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(cacheKey, today);
        }
        return effectiveEpoch;
      }
    }
  }

  if (userDocKnownExistsForUid !== uid) {
    await setDoc(userRef, {
      createdAt: serverTimestamp(),
      lastActiveDate: today,
      locale: getBrowserLocale(),
      resetEpoch: effectiveEpoch,
      schemaVersion: 1,
    });
    userDocKnownExistsForUid = uid;
  } else {
    await updateDoc(userRef, {
      lastActiveDate: today,
      locale: getBrowserLocale(),
    });
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(cacheKey, today);
  }
  return effectiveEpoch;
}

export interface FamilyCloudSnapshot {
  resetEpoch: number;
  kids: KidProfile[];
}

function parseCloudKidDoc(kidId: string, raw: Record<string, unknown>): KidProfile | null {
  if (!KID_IDS.includes(kidId as KidId)) return null;
  const candidate: KidProfileData = {
    name: typeof raw['name'] === 'string' ? raw['name'] : '',
    nickname: typeof raw['nickname'] === 'string' && raw['nickname'].length > 0 ? raw['nickname'] : 'Learner',
    age: typeof raw['age'] === 'number' ? raw['age'] : raw['ageBand'] === '2-4' ? 3 : 6,
    country: typeof raw['country'] === 'string' && /^[A-Z]{2}$/.test(raw['country']) ? raw['country'] : 'IN',
    state: typeof raw['state'] === 'string' ? raw['state'] : '',
    favColor: (raw['favColor'] as KidProfileData['favColor']) ?? 'blue',
    avatar: typeof raw['avatar'] === 'string' && raw['avatar'].length > 0 ? raw['avatar'] : '🧒',
    ageBand: (raw['ageBand'] as KidProfileData['ageBand']) ?? '5-7',
    track: (raw['track'] as KidProfileData['track']) ?? 'primary',
    stars: typeof raw['stars'] === 'number' ? raw['stars'] : 0,
    streak: typeof raw['streak'] === 'number' ? raw['streak'] : 0,
    bestStreak: typeof raw['bestStreak'] === 'number' ? raw['bestStreak'] : 0,
    totalCorrect: typeof raw['totalCorrect'] === 'number' ? raw['totalCorrect'] : 0,
    totalWrong: typeof raw['totalWrong'] === 'number' ? raw['totalWrong'] : 0,
    badges: Array.isArray(raw['badges']) ? (raw['badges'] as string[]) : [],
    topics:
      raw['topics'] && typeof raw['topics'] === 'object'
        ? (raw['topics'] as KidProfileData['topics'])
        : {},
    resetEpoch: typeof raw['resetEpoch'] === 'number' ? raw['resetEpoch'] : 0,
  };
  const parsed = KidProfileSchema.safeParse(candidate);
  if (!parsed.success) return null;
  return {
    kidId: kidId as KidId,
    ...parsed.data,
  };
}

export async function fetchFamilyDashboard(uid: string): Promise<FamilyCloudSnapshot> {
  const { db } = ensureFirebase();
  const userRef = doc(db, 'users', uid);
  const [userSnap, kidsSnap] = await Promise.all([
    getDoc(userRef),
    getDocs(collection(db, 'users', uid, 'kids')),
  ]);

  let resetEpoch = 0;
  if (userSnap.exists()) {
    userDocKnownExistsForUid = uid;
    const ud = userSnap.data();
    if (typeof ud['resetEpoch'] === 'number') {
      resetEpoch = ud['resetEpoch'];
    }
    if (typeof ud['lastActiveDate'] === 'string' && typeof localStorage !== 'undefined') {
      localStorage.setItem(`kiyuv_lastActive_${uid}`, ud['lastActiveDate']);
    }
  }

  const kids: KidProfile[] = [];
  kidsSnap.forEach((docSnap) => {
    const k = parseCloudKidDoc(docSnap.id, docSnap.data());
    if (k) {
      if (k.resetEpoch > resetEpoch) resetEpoch = k.resetEpoch;
      kids.push(k);
    }
  });
  kids.sort((a, b) => a.kidId.localeCompare(b.kidId));
  return { resetEpoch, kids };
}

export async function fetchSingleKidProfile(uid: string, kidId: KidId): Promise<KidProfile | null> {
  const { db } = ensureFirebase();
  const snap = await getDoc(doc(db, 'users', uid, 'kids', kidId));
  if (!snap.exists()) return null;
  return parseCloudKidDoc(snap.id, snap.data());
}

export async function writeKidProfileDirect(
  uid: string,
  profile: KidProfile,
  localResetEpoch: number,
): Promise<void> {
  const { db } = ensureFirebase();
  const validated = KidProfileSchema.parse(profile);
  await ensureParentUserDocToday(uid, localResetEpoch);
  const kidRef = doc(db, 'users', uid, 'kids', profile.kidId);
  await setDoc(kidRef, {
    ...validated,
    updatedAt: serverTimestamp(),
  });
}

export async function flushKidProfileTransaction(
  uid: string,
  localProfile: KidProfile,
  mergeFn: (local: KidProfile, remote: KidProfile | null) => KidProfile,
): Promise<KidProfile> {
  const { db } = ensureFirebase();
  await ensureParentUserDocToday(uid, localProfile.resetEpoch);
  const kidRef = doc(db, 'users', uid, 'kids', localProfile.kidId);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(kidRef);
    const remote = snap.exists() ? parseCloudKidDoc(snap.id, snap.data()) : null;
    const merged = mergeFn(localProfile, remote);
    const validated = KidProfileSchema.parse(merged);
    tx.set(kidRef, {
      ...validated,
      updatedAt: serverTimestamp(),
    });
    return {
      kidId: localProfile.kidId,
      ...validated,
    };
  });
}

export async function removeKidProfileFromCloud(uid: string, kidId: KidId): Promise<void> {
  const { db } = ensureFirebase();
  await deleteDoc(doc(db, 'users', uid, 'kids', kidId));
}

export async function resetCloudKidsProgressBatch(
  uid: string,
  zeroedProfiles: readonly KidProfile[],
  nextResetEpoch: number,
): Promise<void> {
  const { db } = ensureFirebase();
  const today = new Date().toISOString().slice(0, 10);
  const userRef = doc(db, 'users', uid);

  if (userDocKnownExistsForUid !== uid) {
    const snap = await getDoc(userRef);
    if (snap.exists()) userDocKnownExistsForUid = uid;
  }

  const batch = writeBatch(db);
  if (userDocKnownExistsForUid === uid) {
    batch.update(userRef, {
      lastActiveDate: today,
      locale: getBrowserLocale(),
      resetEpoch: nextResetEpoch,
    });
  } else {
    batch.set(userRef, {
      createdAt: serverTimestamp(),
      lastActiveDate: today,
      locale: getBrowserLocale(),
      resetEpoch: nextResetEpoch,
      schemaVersion: 1,
    });
    userDocKnownExistsForUid = uid;
  }

  for (const profile of zeroedProfiles) {
    const validated = KidProfileSchema.parse({
      ...profile,
      resetEpoch: nextResetEpoch,
    });
    batch.set(doc(db, 'users', uid, 'kids', profile.kidId), {
      ...validated,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
