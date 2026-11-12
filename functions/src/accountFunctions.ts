import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { deleteFamilyData, exportFamilyData } from './accountService.js';
import { requireFreshPin } from './authGuard.js';
import { REGION, makeContext } from './groupFunctions.js';
import { decryptKidName } from './nameCrypto.js';
import { nameKeySecret, pinPepperSecret } from './secrets.js';

const CALLABLE = {
  region: REGION,
  invoker: 'public' as const,
  maxInstances: 5,
  enforceAppCheck: false, // Turned on for public launch (see the groups design, G10).
  secrets: [pinPepperSecret, nameKeySecret],
};

/**
 * Deletes the signed-in family: groups, children, consent records, PIN record and the
 * sign-in account itself. Needs a PIN entered in the last 5 minutes. Safe to call again.
 */
export const deleteAccount = onCall(CALLABLE, async (request) => {
  const uid = requireFreshPin(request);
  try {
    await deleteFamilyData(makeContext(), uid);
    await getAuth().deleteUser(uid);
  } catch (err) {
    if ((err as { code?: string })?.code === 'auth/user-not-found') return { ok: true as const };
    logger.error('account deletion failed', { type: err instanceof Error ? err.name : 'unknown' });
    throw new HttpsError('internal', 'Could not delete the account. Please try again.');
  }
  return { ok: true as const };
});

/** Returns everything stored about the family, with the children's first names readable. */
export const exportMyData = onCall(CALLABLE, async (request) => {
  const uid = requireFreshPin(request);
  try {
    const email = (await getAuth().getUser(uid)).email ?? null;
    return await exportFamilyData(makeContext(), uid, email, (kidId, nameEnc) =>
      nameEnc ? decryptKidName(nameKeySecret.value(), uid, kidId, nameEnc) : '',
    );
  } catch (err) {
    logger.error('data export failed', { type: err instanceof Error ? err.name : 'unknown' });
    throw new HttpsError('internal', 'Could not prepare your data. Please try again.');
  }
});
