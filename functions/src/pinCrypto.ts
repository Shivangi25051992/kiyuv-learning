import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
  keylen: number;
}

export const DEFAULT_SCRYPT_PARAMS: ScryptParams = {
  N: 32768, // 2^15 per Phase 3 specification
  r: 8,
  p: 1,
  keylen: 64,
};

export interface PinHashRecord {
  hashHex: string;
  saltHex: string;
  scryptParams: ScryptParams;
  pepperVersion: number;
}

function runScrypt(
  input: Buffer,
  salt: Buffer,
  params: ScryptParams,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      input,
      salt,
      params.keylen,
      {
        N: params.N,
        r: params.r,
        p: params.p,
        maxmem: 64 * 1024 * 1024,
      },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      },
    );
  });
}

export function computePepperedPin(uid: string, pin: string, pepper: string): Buffer {
  return createHmac('sha256', pepper).update(`${uid}:${pin}`).digest();
}

export async function hashParentPinServer(
  uid: string,
  pin: string,
  pepper: string,
  pepperVersion = 1,
  params: ScryptParams = DEFAULT_SCRYPT_PARAMS,
): Promise<PinHashRecord> {
  const salt = randomBytes(16);
  const peppered = computePepperedPin(uid, pin, pepper);
  const derived = await runScrypt(peppered, salt, params);
  return {
    hashHex: derived.toString('hex'),
    saltHex: salt.toString('hex'),
    scryptParams: params,
    pepperVersion,
  };
}

export async function verifyParentPinServer(
  uid: string,
  pin: string,
  record: PinHashRecord,
  pepper: string,
): Promise<boolean> {
  const salt = Buffer.from(record.saltHex, 'hex');
  const expected = Buffer.from(record.hashHex, 'hex');
  const peppered = computePepperedPin(uid, pin, pepper);
  const derived = await runScrypt(peppered, salt, record.scryptParams);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
