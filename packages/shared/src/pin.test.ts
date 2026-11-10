import { describe, expect, it } from 'vitest';
import { StrongPinSchema, validateStrongPin } from './pin.js';

describe('6-digit Parent PIN validation (Phase 3 Task 3.3)', () => {
  it('rejects non-6-digit, repeated, sequential, and common PINs', () => {
    expect(validateStrongPin('1234').valid).toBe(false);
    expect(validateStrongPin('111111').valid).toBe(false);
    expect(validateStrongPin('123456').valid).toBe(false);
    expect(validateStrongPin('654321').valid).toBe(false);
    expect(validateStrongPin('234567').valid).toBe(false);
    expect(validateStrongPin('112233').valid).toBe(false);
    expect(validateStrongPin('121212').valid).toBe(false);
  });

  it('accepts strong non-sequential 6-digit PINs', () => {
    expect(validateStrongPin('482917').valid).toBe(true);
    expect(StrongPinSchema.safeParse('739204').success).toBe(true);
  });
});
