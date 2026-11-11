import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check';
import {
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  signInWithCustomToken,
  signInWithEmailAndPassword,
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
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
  type Functions,
} from 'firebase/functions';
import {
  KID_IDS,
  KidProfileSchema,
  type KidId,
  type KidProfile,
  type KidProfileData,
  type VerifyPinResponse,
} from '@kiyuv/shared';

export interface AuthParentUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerId: string;
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
let fnInstance: Functions | null = null;
let emulatorsConnected = false;

function ensureFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  functions: Functions;
} {
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
    fnInstance = getFunctions(appInstance, 'asia-south1');
    void setPersistence(authInstance, browserLocalPersistence).catch(() => {});

    // Task 3.6: Initialize App Check when reCAPTCHA Enterprise key is configured
    const recaptchaKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as
      | string
      | undefined;
    if (recaptchaKey && typeof window !== 'undefined') {
      try {
        initializeAppCheck(appInstance, {
          provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch {
        // Ignore duplicate AppCheck init
      }
    }

    if (import.meta.env.VITE_USE_EMULATORS === 'true' && !emulatorsConnected) {
      emulatorsConnected = true;
      connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
      connectFunctionsEmulator(fnInstance, '127.0.0.1', 5001);
    }
  }
  return {
    app: appInstance,
    auth: authInstance!,
    db: dbInstance!,
    functions: fnInstance!,
  };
}

function toAuthParentUser(u: User | null): AuthParentUser | null {
  if (!u) return null;
  const primaryProvider = u.providerData[0]?.providerId ?? 'custom';
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    emailVerified: u.emailVerified || primaryProvider !== 'password',
    providerId: primaryProvider,
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
  return toAuthParentUser(res.user)!;
}

export async function signInWithApple(): Promise<AuthParentUser> {
  const { auth } = ensureFirebase();
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const res = await signInWithPopup(auth, provider);
  return toAuthParentUser(res.user)!;
}

export async function signInOrRegisterWithEmail(
  email: string,
  password: string,
  isRegister: boolean,
): Promise<{ user: AuthParentUser; verificationSent: boolean }> {
  const { auth } = ensureFirebase();
  if (isRegister) {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(res.user);
    return { user: toAuthParentUser(res.user)!, verificationSent: true };
  }
  const res = await signInWithEmailAndPassword(auth, email, password);
  if (!res.user.emailVerified) {
    await sendEmailVerification(res.user);
    return { user: toAuthParentUser(res.user)!, verificationSent: true };
  }
  return { user: toAuthParentUser(res.user)!, verificationSent: false };
}

export async function callSetParentPinServer(
  pin: string,
): Promise<{ ok: boolean; pinAt?: number }> {
  const { auth, functions } = ensureFirebase();
  const fn = httpsCallable<
    { pin: string },
    { ok: boolean; customToken?: string; pinAt?: number }
  >(functions, 'setPin');
  const res = await fn({ pin });
  if (res.data.ok) {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    } else if (res.data.customToken) {
      await signInWithCustomToken(auth, res.data.customToken);
    }
  }
  return { ok: res.data.ok, pinAt: res.data.pinAt };
}

export async function callVerifyParentPinServer(
  pin: string,
): Promise<VerifyPinResponse> {
  const { auth, functions } = ensureFirebase();
  const fn = httpsCallable<{ pin: string }, VerifyPinResponse>(functions, 'verifyPin');
  const res = await fn({ pin });
  if (res.data.ok) {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    } else if (res.data.customToken) {
      await signInWithCustomToken(auth, res.data.customToken);
    }
  }
  return res.data;
}

export async function signOutParent(): Promise<void> {
  clearNameCaches();
  const { auth } = ensureFirebase();
  await signOut(auth);
}

function getBrowserLocale(): string {
  const raw = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 16);
  return raw.length >= 2 ? raw : 'en';
}

let userDocKnownExistsForUid: string | null = null;

export async function ensureParentUserDocToday(
  uid: string,
  localResetEpoch: number,
): Promise<number> {
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

// A child's name is stored only as encrypted `nameEnc`. The plain name lives in
// memory (never localStorage) after a parent decrypts it with a fresh PIN.
const nameEncCache = new Map<string, string>();
const plainNameCache = new Map<string, string>();
const nameKey = (uid: string, kidId: string) => `${uid}:${kidId}`;

export function getCachedPlainName(uid: string, kidId: string): string {
  return plainNameCache.get(nameKey(uid, kidId)) ?? '';
}

export function clearNameCaches(): void {
  nameEncCache.clear();
  plainNameCache.clear();
  childIdCache.clear();
}

/**
 * Each child gets a random id once. Groups use it, so a profile deleted and
 * re-created in the same slot is a new child and does not inherit sharing.
 */
const childIdCache = new Map<string, string>();

function newChildId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function rememberChildId(uid: string, kidId: string, value: unknown): void {
  if (typeof value === 'string' && /^[0-9a-f]{32}$/.test(value)) {
    childIdCache.set(nameKey(uid, kidId), value);
  }
}

/** Replaces exactly the fields we send and leaves the rest (server-only `sharedIn`) alone. */
function replaceOnly(payload: Record<string, unknown>): { mergeFields: string[] } {
  return { mergeFields: Object.keys(payload) };
}

function parseCloudKidDoc(
  uid: string,
  kidId: string,
  raw: Record<string, unknown>,
): KidProfile | null {
  if (!KID_IDS.includes(kidId as KidId)) return null;
  rememberChildId(uid, kidId, raw['childId']);
  if (typeof raw['nameEnc'] === 'string') {
    nameEncCache.set(nameKey(uid, kidId), raw['nameEnc']);
  }
  const candidate: KidProfileData = {
    name: plainNameCache.get(nameKey(uid, kidId)) ?? '',
    nickname:
      typeof raw['nickname'] === 'string' && raw['nickname'].length > 0
        ? raw['nickname']
        : 'Learner',
    age: typeof raw['age'] === 'number' ? raw['age'] : raw['ageBand'] === '2-4' ? 3 : 6,
    country:
      typeof raw['country'] === 'string' && /^[A-Z]{2}$/.test(raw['country'])
        ? raw['country']
        : 'IN',
    state: typeof raw['state'] === 'string' ? raw['state'] : '',
    favColor: (raw['favColor'] as KidProfileData['favColor']) ?? 'blue',
    avatar:
      typeof raw['avatar'] === 'string' && raw['avatar'].length > 0 ? raw['avatar'] : '🧒',
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
    const k = parseCloudKidDoc(uid, docSnap.id, docSnap.data());
    if (k) {
      if (k.resetEpoch > resetEpoch) resetEpoch = k.resetEpoch;
      kids.push(k);
    }
  });
  kids.sort((a, b) => a.kidId.localeCompare(b.kidId));
  return { resetEpoch, kids };
}

export async function fetchSingleKidProfile(
  uid: string,
  kidId: KidId,
): Promise<KidProfile | null> {
  const { db } = ensureFirebase();
  const snap = await getDoc(doc(db, 'users', uid, 'kids', kidId));
  if (!snap.exists()) return null;
  return parseCloudKidDoc(uid, snap.id, snap.data());
}

/** Cloud document body: the plain name is replaced by its ciphertext. */
function toCloudKidPayload(uid: string, profile: KidProfile): Record<string, unknown> {
  const validated = KidProfileSchema.parse(profile);
  const { name: _plain, ...rest } = validated;
  const idKey = nameKey(uid, profile.kidId);
  const childId = childIdCache.get(idKey) ?? newChildId();
  childIdCache.set(idKey, childId);
  return {
    ...rest,
    nameEnc: nameEncCache.get(nameKey(uid, profile.kidId)) ?? '',
    childId,
    updatedAt: serverTimestamp(),
  };
}

/** Makes sure the cached ciphertext for this child is known before a full overwrite. */
async function ensureNameEncKnown(uid: string, kidId: string): Promise<void> {
  if (nameEncCache.has(nameKey(uid, kidId)) && childIdCache.has(nameKey(uid, kidId))) return;
  const { db } = ensureFirebase();
  const snap = await getDoc(doc(db, 'users', uid, 'kids', kidId));
  const enc = snap.exists() ? snap.data()['nameEnc'] : '';
  nameEncCache.set(nameKey(uid, kidId), typeof enc === 'string' ? enc : '');
  if (snap.exists()) rememberChildId(uid, kidId, snap.data()['childId']);
}

/**
 * Encrypts a changed name on the server (needs a PIN entered in the last 5 minutes).
 * Does nothing when the name has not changed.
 */
async function applyNameChange(uid: string, profile: KidProfile): Promise<void> {
  const key = nameKey(uid, profile.kidId);
  await ensureNameEncKnown(uid, profile.kidId);
  const known = plainNameCache.get(key);
  const wanted = profile.name.trim();
  if (known === wanted) return;
  // The name was never decrypted on this device, so an empty value means
  // "unchanged", not "clear it". Keep whatever is stored.
  if (known === undefined && wanted === '') return;
  const { functions } = ensureFirebase();
  const fn = httpsCallable<{ kidId: string; name: string }, { nameEnc: string }>(
    functions,
    'encryptProfileName',
  );
  const res = await fn({ kidId: profile.kidId, name: wanted });
  nameEncCache.set(key, res.data.nameEnc);
  plainNameCache.set(key, wanted);
}

/** Decrypts names for the parent area. Needs a PIN entered in the last 5 minutes. */
export async function loadChildNames(
  uid: string,
  kidIds: readonly string[],
): Promise<Record<string, string>> {
  const items: Array<{ kidId: string; nameEnc: string }> = [];
  for (const kidId of kidIds) {
    await ensureNameEncKnown(uid, kidId);
    const nameEnc = nameEncCache.get(nameKey(uid, kidId)) ?? '';
    if (nameEnc) items.push({ kidId, nameEnc });
  }
  if (items.length === 0) return {};
  const { functions } = ensureFirebase();
  const fn = httpsCallable<{ items: typeof items }, { names: Record<string, string> }>(
    functions,
    'decryptProfileNames',
  );
  const res = await fn({ items });
  for (const [kidId, plain] of Object.entries(res.data.names)) {
    plainNameCache.set(nameKey(uid, kidId), plain);
  }
  return res.data.names;
}

/** True when the server says this parent has set a PIN. */
export async function fetchPinConfigured(uid: string): Promise<boolean> {
  const { db } = ensureFirebase();
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() && snap.data()['pinConfigured'] === true;
}

export async function writeKidProfileDirect(
  uid: string,
  profile: KidProfile,
  localResetEpoch: number,
): Promise<void> {
  const { db } = ensureFirebase();
  KidProfileSchema.parse(profile);
  await ensureParentUserDocToday(uid, localResetEpoch);
  await applyNameChange(uid, profile);
  const kidRef = doc(db, 'users', uid, 'kids', profile.kidId);
  const payload = toCloudKidPayload(uid, profile);
  await setDoc(kidRef, payload, replaceOnly(payload));
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
    const remote = snap.exists() ? parseCloudKidDoc(uid, snap.id, snap.data()) : null;
    const merged = mergeFn(localProfile, remote);
    const validated = KidProfileSchema.parse(merged);
    const payload = toCloudKidPayload(uid, { kidId: localProfile.kidId, ...validated });
    tx.set(kidRef, payload, replaceOnly(payload));
    return {
      kidId: localProfile.kidId,
      ...validated,
    };
  });
}

export async function removeKidProfileFromCloud(
  uid: string,
  kidId: KidId,
): Promise<void> {
  const { db } = ensureFirebase();
  await deleteDoc(doc(db, 'users', uid, 'kids', kidId));
  // A profile created in this slot later is a new child with a new id.
  childIdCache.delete(nameKey(uid, kidId));
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
    await ensureNameEncKnown(uid, profile.kidId);
    const payload = toCloudKidPayload(uid, { ...profile, resetEpoch: nextResetEpoch });
    batch.set(doc(db, 'users', uid, 'kids', profile.kidId), payload, replaceOnly(payload));
  }

  await batch.commit();
}

// ---------------------------------------------------------------------------
// Family groups. Every change goes through a Cloud Function that needs a PIN
// entered in the last 5 minutes. Reads come straight from Firestore.
// ---------------------------------------------------------------------------

export interface MyGroup {
  groupId: string;
  name: string;
  role: 'owner' | 'member';
}

export interface BoardEntry {
  entryId: string;
  boardName: string;
  avatar: string;
  favColor: string;
  weekKey: string;
  weekStars: number;
}

export interface GroupBoard {
  groupId: string;
  name: string;
  ownerUid: string;
  memberCount: number;
  timezone: string;
  entries: BoardEntry[];
}

export interface GroupMemberInfo {
  uid: string;
  role: 'owner' | 'member';
  /** kidId -> what that child is called on the board. */
  shared: Record<string, { entryId: string; boardName: string }>;
}

export interface GroupJoinRequest {
  uid: string;
  children: Record<string, { boardName: string; avatar: string; favColor: string }>;
}

const asRecord = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const asString = (v: unknown): string => (typeof v === 'string' ? v : '');
const asNumber = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export async function callGroupFunction<T = { ok: true }>(
  name: string,
  data: Record<string, unknown>,
): Promise<T> {
  const { functions } = ensureFirebase();
  const res = await httpsCallable<Record<string, unknown>, T>(functions, name)(data);
  return res.data;
}

export async function fetchMyGroups(uid: string): Promise<MyGroup[]> {
  const { db } = ensureFirebase();
  const snap = await getDocs(collection(db, 'users', uid, 'groups'));
  return snap.docs
    .map((d) => ({
      groupId: d.id,
      name: asString(d.data()['name']),
      role: d.data()['role'] === 'owner' ? ('owner' as const) : ('member' as const),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** One read for the group and one for its board. */
export async function fetchGroupBoard(groupId: string): Promise<GroupBoard | null> {
  const { db } = ensureFirebase();
  const [groupSnap, boardSnap] = await Promise.all([
    getDoc(doc(db, 'groups', groupId)),
    getDoc(doc(db, 'groups', groupId, 'board', 'current')),
  ]);
  if (!groupSnap.exists()) return null;
  const g = groupSnap.data();
  const raw = asRecord(boardSnap.data()?.['entries']);
  const entries: BoardEntry[] = Object.entries(raw).map(([entryId, value]) => {
    const e = asRecord(value);
    return {
      entryId,
      boardName: asString(e['boardName']),
      avatar: asString(e['avatar']),
      favColor: asString(e['favColor']),
      weekKey: asString(e['weekKey']),
      weekStars: asNumber(e['weekStars']),
    };
  });
  return {
    groupId,
    name: asString(g['name']),
    ownerUid: asString(g['ownerUid']),
    memberCount: asNumber(g['memberCount']),
    timezone: asString(g['timezone']),
    entries,
  };
}

function parseMember(uid: string, data: Record<string, unknown>): GroupMemberInfo {
  const shared: GroupMemberInfo['shared'] = {};
  for (const [kidId, value] of Object.entries(asRecord(data['shared']))) {
    const e = asRecord(value);
    shared[kidId] = { entryId: asString(e['entryId']), boardName: asString(e['boardName']) };
  }
  return { uid, role: data['role'] === 'owner' ? 'owner' : 'member', shared };
}

export async function fetchMyMembership(
  groupId: string,
  uid: string,
): Promise<GroupMemberInfo | null> {
  const { db } = ensureFirebase();
  const snap = await getDoc(doc(db, 'groups', groupId, 'members', uid));
  return snap.exists() ? parseMember(uid, snap.data()) : null;
}

/** Owner only: every family in the group, and who is waiting to join. */
export async function fetchGroupAdmin(
  groupId: string,
): Promise<{ members: GroupMemberInfo[]; requests: GroupJoinRequest[] }> {
  const { db } = ensureFirebase();
  const [members, requests] = await Promise.all([
    getDocs(collection(db, 'groups', groupId, 'members')),
    getDocs(collection(db, 'groups', groupId, 'requests')),
  ]);
  return {
    members: members.docs.map((d) => parseMember(d.id, d.data())),
    requests: requests.docs.map((d) => {
      const children: GroupJoinRequest['children'] = {};
      for (const [kidId, value] of Object.entries(asRecord(d.data()['children']))) {
        const c = asRecord(value);
        children[kidId] = {
          boardName: asString(c['boardName']),
          avatar: asString(c['avatar']),
          favColor: asString(c['favColor']),
        };
      }
      return { uid: d.id, children };
    }),
  };
}
