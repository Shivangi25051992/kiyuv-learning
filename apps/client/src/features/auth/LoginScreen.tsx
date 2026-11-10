import React, { useState } from 'react';
import { PIN_LENGTH, validateStrongPin } from '@kiyuv/shared';
import {
  signInOrRegisterWithEmail,
  signInWithApple,
  signInWithGoogle,
  type AuthParentUser,
} from '../../lib/firebase/index.js';
import {
  checkParentPin,
  clearParentPin,
  hasConfiguredPin,
  saveParentPin,
} from './PinModal.js';
import { Mascot } from '../../ui/Mascot.js';

// Sign-in options shown to parents. Only Google is turned on for now. Switch the
// others on here once they are enabled in the Firebase console and tested.
const ENABLE_APPLE_SIGN_IN = false;
const ENABLE_EMAIL_SIGN_IN = false;

interface LoginScreenProps {
  user: AuthParentUser | null;
  onUnlocked: (user: AuthParentUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ user, onUnlocked }) => {
  const [step, setStep] = useState<'provider' | 'setpin' | 'verifypin'>(() => {
    if (!user) return 'provider';
    return hasConfiguredPin(user.uid) ? 'verifypin' : 'setpin';
  });
  const [activeUser, setActiveUser] = useState<AuthParentUser | null>(user);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [resettingHint, setResettingHint] = useState(false);

  React.useEffect(() => {
    setActiveUser(user);
    if (!user) {
      setStep('provider');
    } else if (hasConfiguredPin(user.uid)) {
      setStep('verifypin');
    } else {
      setStep('setpin');
    }
  }, [user]);

  const handleProviderAuth = async (fn: () => Promise<AuthParentUser>) => {
    setError('');
    setInfoMsg('');
    setBusy(true);
    try {
      const signedIn = await fn();
      setActiveUser(signedIn);
      if (hasConfiguredPin(signedIn.uid)) {
        setStep('verifypin');
      } else {
        setStep('setpin');
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled — please try again.');
      } else {
        setError((err as Error)?.message || 'Sign-in failed. Check your connection.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    if (!email.trim() || password.length < 8) {
      setError('Enter a valid email and a password of at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const res = await signInOrRegisterWithEmail(email.trim(), password, isRegister);
      setPassword('');
      if (res.verificationSent && !res.user.emailVerified) {
        setInfoMsg(
          'A verification link has been sent to your email. Please verify your email, then sign in.',
        );
        return;
      }
      setActiveUser(res.user);
      if (hasConfiguredPin(res.user.uid)) {
        setStep('verifypin');
      } else {
        setStep('setpin');
      }
    } catch (err) {
      setError((err as Error)?.message || 'Email sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    const entered = pin.trim();
    setPin('');
    const check = validateStrongPin(entered);
    if (!check.valid) {
      setError(check.reason ?? 'Invalid 6-digit PIN');
      return;
    }
    setBusy(true);
    try {
      await saveParentPin(activeUser.uid, entered);
      onUnlocked(activeUser);
    } catch (err) {
      setError((err as Error)?.message || 'Failed to save PIN');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    const entered = pin.trim();
    setPin('');
    if (!/^[0-9]{6}$/.test(entered)) {
      setError('Enter your 6-digit Parent PIN');
      return;
    }
    setBusy(true);
    try {
      const res = await checkParentPin(activeUser.uid, entered);
      if (!res.ok) {
        setError(res.message || 'Wrong PIN. Try again.');
        return;
      }
      onUnlocked(activeUser);
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPin = () => {
    if (activeUser) {
      clearParentPin(activeUser.uid);
    }
    setPin('');
    setError('');
    setResettingHint(true);
    setStep('provider');
  };

  const firstName =
    activeUser?.displayName?.split(' ')[0] ||
    activeUser?.email?.split('@')[0] ||
    'Parent';

  return (
    <div className="login-screen">
      <div className="bg-floaties" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="login-card pop-in">
        <Mascot
          mood={step === 'provider' ? 'cheer' : step === 'verifypin' ? 'happy' : 'think'}
          size={132}
          className="login-mascot"
        />
        <h1 className="login-title">Kiyuv Learning</h1>
        <p className="login-sub">A happy place to learn and play</p>

        {step === 'provider' && (
          <div className="login-body">
            {resettingHint && <p className="login-hint">Sign in again to choose a new PIN.</p>}

            <button
              type="button"
              className="google-btn"
              onClick={() => void handleProviderAuth(signInWithGoogle)}
              disabled={busy}
            >
              <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              Continue with Google
            </button>

            {ENABLE_APPLE_SIGN_IN && (
              <button
                type="button"
                className="google-btn apple-btn"
                onClick={() => void handleProviderAuth(signInWithApple)}
                disabled={busy}
              >
                Continue with Apple
              </button>
            )}

            {ENABLE_EMAIL_SIGN_IN && (
              <div className="login-more">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowEmailForm((s) => !s)}
                >
                  {showEmailForm ? 'Hide email sign-in' : 'Or sign in with email'}
                </button>
              </div>
            )}

            {ENABLE_EMAIL_SIGN_IN && showEmailForm && (
              <form onSubmit={(e) => void handleEmailAuth(e)} className="login-email-form">
                <label className="sr-only" htmlFor="login-email">
                  Parent email
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Parent email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  autoComplete="email"
                  required
                />
                <label className="sr-only" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Password (8 or more characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                />
                <button type="submit" className="login-btn" disabled={busy}>
                  {isRegister ? 'Create parent account' : 'Sign in'}
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setIsRegister((r) => !r)}
                >
                  {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
                </button>
              </form>
            )}

            {infoMsg && (
              <div className="login-info" role="status">
                {infoMsg}
              </div>
            )}
            {error && (
              <div className="login-err" role="alert">
                {error}
              </div>
            )}
            <p className="login-note">
              Grown-ups sign in once and add the children. Kids never need an account.
            </p>
          </div>
        )}

        {step === 'setpin' && activeUser && (
          <form className="login-body" onSubmit={(e) => void handleSetPin(e)}>
            <p className="login-lead">
              Hi <b>{firstName}</b>! Choose a secret 6-digit PIN for grown-ups.
            </p>
            <label className="sr-only" htmlFor="set-pin">
              New 6-digit parent PIN
            </label>
            <input
              id="set-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              maxLength={PIN_LENGTH}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
              }}
              placeholder="······"
              className="pin-input"
            />
            <button type="submit" className="login-btn" disabled={busy}>
              {busy ? 'Saving…' : 'Save PIN and start'}
            </button>
            {error && (
              <div className="login-err" role="alert">
                {error}
              </div>
            )}
            <p className="login-note">
              Not 111111 or 123456. The PIN keeps kids out of the grown-up settings.
            </p>
          </form>
        )}

        {step === 'verifypin' && activeUser && (
          <form className="login-body" onSubmit={(e) => void handleVerifyPin(e)}>
            {activeUser.photoURL && (
              <img className="login-photo" src={activeUser.photoURL} alt="" />
            )}
            <p className="login-lead">
              Welcome back, <b>{firstName}</b>! Enter your PIN.
            </p>
            <label className="sr-only" htmlFor="verify-pin">
              6-digit parent PIN
            </label>
            <input
              id="verify-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="current-password"
              maxLength={PIN_LENGTH}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
              }}
              placeholder="······"
              className="pin-input"
            />
            <button type="submit" className="login-btn" disabled={busy}>
              {busy ? 'Checking…' : 'Unlock'}
            </button>
            {error && (
              <div className="login-err" role="alert">
                {error}
              </div>
            )}
            <button type="button" onClick={handleForgotPin} className="link-btn">
              Forgot your PIN? Sign in again
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
