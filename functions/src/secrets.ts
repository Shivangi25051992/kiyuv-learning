import { defineSecret } from 'firebase-functions/params';

type Secret = ReturnType<typeof defineSecret>;

/** Secrets live in Google Secret Manager. Each is declared once, here. */
export const pinPepperSecret: Secret = defineSecret('PIN_PEPPER');
export const nameKeySecret: Secret = defineSecret('NAME_KEY');
