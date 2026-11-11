import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

/**
 * Field-level encryption for a child's first name.
 *
 * - AES-256-GCM, a fresh 12-byte random nonce per value.
 * - The key is derived with HKDF-SHA256 from the NAME_KEY secret and the
 *   parent uid, so every family has a different key and a leaked ciphertext
 *   from one family cannot be decrypted with another family's key.
 * - The uid and kidId are bound in as additional authenticated data, so a
 *   ciphertext copied onto another child or family fails to decrypt.
 * - Stored format: "v1.<nonce>.<tag>.<ciphertext>", all base64url.
 */

const VERSION = 'v1';
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
export const MAX_NAME_LENGTH = 30;
export const MAX_ENCRYPTED_LENGTH = 200;

function deriveKey(masterSecret: string, uid: string): Buffer {
  if (!masterSecret || masterSecret.length < 32) {
    throw new Error('NAME_KEY secret is missing or too short.');
  }
  return Buffer.from(
    hkdfSync(
      'sha256',
      Buffer.from(masterSecret, 'utf8'),
      Buffer.from(uid, 'utf8'),
      Buffer.from('kiyuv-kid-name-v1', 'utf8'),
      KEY_BYTES,
    ),
  );
}

function aad(uid: string, kidId: string): Buffer {
  return Buffer.from(`${uid}:${kidId}`, 'utf8');
}

export function encryptKidName(
  masterSecret: string,
  uid: string,
  kidId: string,
  name: string,
): string {
  const clean = name.trim();
  if (clean.length === 0) return '';
  if (clean.length > MAX_NAME_LENGTH) {
    throw new Error(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }
  const key = deriveKey(masterSecret, uid);
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(aad(uid, kidId));
  const ciphertext = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    nonce.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

export function decryptKidName(
  masterSecret: string,
  uid: string,
  kidId: string,
  stored: string,
): string {
  if (!stored) return '';
  const parts = stored.split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Unsupported encrypted name format.');
  }
  const [, nonceB64, tagB64, ctB64] = parts as [string, string, string, string];
  const key = deriveKey(masterSecret, uid);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(nonceB64, 'base64url'),
  );
  decipher.setAAD(aad(uid, kidId));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
