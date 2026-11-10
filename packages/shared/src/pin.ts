import { z } from 'zod';

export const PIN_LENGTH = 6;
export const MAX_PIN_ATTEMPTS_SOFT_LOCK = 5;
export const MAX_PIN_ATTEMPTS_HARD_LOCK = 10;
export const SOFT_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
export const PROVIDER_REAUTH_MAX_AGE_SEC = 300; // 5 minutes

export const BLOCKED_COMMON_PINS: ReadonlySet<string> = new Set([
  '000000', '111111', '222222', '333333', '444444',
  '555555', '666666', '777777', '888888', '999999',
  '123456', '654321', '012345', '543210', '234567',
  '345678', '456789', '987654', '876543', '765432',
  '123123', '112233', '121212', '111222', '123321',
  '696969', '131313', '202020', '101010', '102030',
  '159753', '789456', '456123', '147258', '258369',
  '147852', '369258', '111000', '000111', '123654',
  '321654', '654123', '112211', '212121', '313131',
  '414141', '515151', '616161', '717171', '818181',
  '919191', '010101', '232323', '454545', '565656',
  '787878', '898989', '909090', '200000', '100000',
]);

export function isSequentialPin(pin: string): boolean {
  if (pin.length < 3) return false;
  let asc = true;
  let desc = true;
  for (let i = 1; i < pin.length; i++) {
    const diff = pin.charCodeAt(i) - pin.charCodeAt(i - 1);
    if (diff !== 1) asc = false;
    if (diff !== -1) desc = false;
  }
  return asc || desc;
}

export function isRepeatedPin(pin: string): boolean {
  return pin.length > 0 && new Set(pin.split('')).size === 1;
}

export interface PinStrengthCheck {
  valid: boolean;
  reason?: string;
}

export function validateStrongPin(pin: string): PinStrengthCheck {
  if (!/^[0-9]{6}$/.test(pin)) {
    return { valid: false, reason: 'Enter a 6-digit numeric PIN.' };
  }
  if (isRepeatedPin(pin)) {
    return { valid: false, reason: 'Avoid repeating the same digit (e.g. 111111).' };
  }
  if (isSequentialPin(pin)) {
    return { valid: false, reason: 'Avoid sequential numbers (e.g. 123456 or 654321).' };
  }
  if (BLOCKED_COMMON_PINS.has(pin)) {
    return { valid: false, reason: 'This PIN is too common. Choose a harder-to-guess 6-digit PIN.' };
  }
  return { valid: true };
}

export const StrongPinSchema = z
  .string()
  .superRefine((val, ctx) => {
    const res = validateStrongPin(val);
    if (!res.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.reason ?? 'Invalid 6-digit PIN',
      });
    }
  });

export const SetPinRequestSchema = z.object({
  pin: StrongPinSchema,
});
export type SetPinRequest = z.infer<typeof SetPinRequestSchema>;

export const VerifyPinRequestSchema = z.object({
  pin: z.string().regex(/^[0-9]{6}$/, 'Enter your 6-digit PIN'),
});
export type VerifyPinRequest = z.infer<typeof VerifyPinRequestSchema>;

export interface VerifyPinResponse {
  ok: boolean;
  customToken?: string;
  pinAt?: number;
  lockedUntilMs?: number;
  requiresProviderSignIn?: boolean;
  remainingAttempts?: number;
  message?: string;
}
