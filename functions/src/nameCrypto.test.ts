import { describe, expect, it } from 'vitest';
import {
  decryptKidName,
  encryptKidName,
  MAX_ENCRYPTED_LENGTH,
  MAX_NAME_LENGTH,
} from './nameCrypto.js';

const SECRET = 'a'.repeat(48);

describe('kid name encryption', () => {
  it('round-trips a name and never stores it in plain text', () => {
    const stored = encryptKidName(SECRET, 'uid1', 'k1', 'Aarav');
    expect(stored.startsWith('v1.')).toBe(true);
    expect(stored).not.toContain('Aarav');
    expect(decryptKidName(SECRET, 'uid1', 'k1', stored)).toBe('Aarav');
  });

  it('uses a fresh nonce so the same name encrypts differently each time', () => {
    const a = encryptKidName(SECRET, 'uid1', 'k1', 'Aarav');
    const b = encryptKidName(SECRET, 'uid1', 'k1', 'Aarav');
    expect(a).not.toBe(b);
  });

  it('keeps stored values inside the length the rules allow', () => {
    const stored = encryptKidName(SECRET, 'uid1', 'k1', 'A'.repeat(MAX_NAME_LENGTH));
    expect(stored.length).toBeLessThanOrEqual(MAX_ENCRYPTED_LENGTH);
  });

  it('returns an empty string for an empty name', () => {
    expect(encryptKidName(SECRET, 'uid1', 'k1', '   ')).toBe('');
    expect(decryptKidName(SECRET, 'uid1', 'k1', '')).toBe('');
  });

  it('fails for a different family, a different child, or a different secret', () => {
    const stored = encryptKidName(SECRET, 'uid1', 'k1', 'Aarav');
    expect(() => decryptKidName(SECRET, 'uid2', 'k1', stored)).toThrow();
    expect(() => decryptKidName(SECRET, 'uid1', 'k2', stored)).toThrow();
    expect(() => decryptKidName('b'.repeat(48), 'uid1', 'k1', stored)).toThrow();
  });

  it('detects tampering', () => {
    const stored = encryptKidName(SECRET, 'uid1', 'k1', 'Aarav');
    const parts = stored.split('.');
    parts[3] = 'AAAA' + (parts[3] ?? '').slice(4);
    expect(() => decryptKidName(SECRET, 'uid1', 'k1', parts.join('.'))).toThrow();
  });

  it('rejects names that are too long and weak secrets', () => {
    expect(() =>
      encryptKidName(SECRET, 'uid1', 'k1', 'A'.repeat(MAX_NAME_LENGTH + 1)),
    ).toThrow();
    expect(() => encryptKidName('short', 'uid1', 'k1', 'Aarav')).toThrow();
  });
});
