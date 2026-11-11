import { HttpsError } from 'firebase-functions/v2/https';

/** Requires a PIN verified in the last 5 minutes (the `pin_at` claim). */
export function requireFreshPin(request: {
  auth?: { uid: string; token: Record<string, unknown> };
}): string {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Parent authentication is required.');
  }
  const pinAt = request.auth.token['pin_at'];
  const ageSec =
    typeof pinAt === 'number' ? Math.floor(Date.now() / 1000) - pinAt : Infinity;
  if (ageSec > 300) {
    throw new HttpsError('permission-denied', 'Enter your Parent PIN again.');
  }
  return request.auth.uid;
}
