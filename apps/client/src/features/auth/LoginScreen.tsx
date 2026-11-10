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
  refreshPinConfigured,
  saveParentPin,
} from './PinModal.js';

// Sign-in options shown to parents. Only Google is turned on for now. Switch the
// others on here once they are enabled in the Firebase console and tested.
const ENABLE_APPLE_SIGN_IN = false;
const ENABLE_EMAIL_SIGN_IN = false;

interface LoginScreenProps {
  user: AuthParentUser | null;
  onUnlocked: (user: AuthParentUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ user, onUnlocked }) => {
  const [step, setStep] = useState<'provider' | 'checking' | 'setpin' | 'verifypin'>(
    user ? 'checking' : 'provider',
  );
  // True after "Forgot PIN": the parent signs in again with a provider and then
  // chooses a new PIN instead of being asked for the old one.
  const [resetting, setResetting] = useState(false);
  const [activeUser, setActiveUser] = useState<AuthParentUser | null>(user);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const chooseStepFor = React.useCallback(async (uid: string, forceNewPin: boolean) => {
    if (forceNewPin) {
      setStep('setpin');
      return;
    }
    setStep('checking');
    try {
      setStep((await refreshPinConfigured(uid)) ? 'verifypin' : 'setpin');
    } catch {
      setError('Cannot reach the server. Check your connection and try again.');
      setStep('provider');
    }
  }, []);

  React.useEffect(() => {
    setActiveUser(user);
    if (!user) {
      setStep('provider');
    } else {
      void chooseStepFor(user.uid, false);
    }
  }, [user, chooseStepFor]);

  const handleProviderAuth = async (fn: () => Promise<AuthParentUser>) => {
    setError('');
    setInfoMsg('');
    setBusy(true);
    try {
      const signedIn = await fn();
      setActiveUser(signedIn);
      await chooseStepFor(signedIn.uid, resetting);
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
      await chooseStepFor(res.user.uid, resetting);
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
      setResetting(false);
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
    setResetting(true);
    setPin('');
    setError('');
    setStep('provider');
  };

  const firstName =
    activeUser?.displayName?.split(' ')[0] ||
    activeUser?.email?.split('@')[0] ||
    'Parent';

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="emoji">🌈</div>
        <h2>Kiyuv Learning Academy</h2>
        <p className="sub">Parent Sign-In · 6-Digit PIN Security</p>

        {step === 'checking' && <p className="sub">Checking your account…</p>}

        {step === 'provider' && (
          <div>
            {resetting && (
              <p className="sub">
                To choose a new PIN, sign in again with your Google account.
              </p>
            )}
            <button
              type="button"
              className="google-btn"
              onClick={() => void handleProviderAuth(signInWithGoogle)}
              disabled={busy}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                style={{ marginRight: 10 }}
                aria-hidden="true"
              >
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
                className="google-btn"
                style={{ marginTop: 8, background: '#111', color: '#fff', borderColor: '#111' }}
                onClick={() => void handleProviderAuth(signInWithApple)}
                disabled={busy}
              >
                🍎 Continue with Apple
              </button>
            )}

            {ENABLE_EMAIL_SIGN_IN && (
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowEmailForm((s) => !s)}
                >
                  {showEmailForm ? 'Hide Email Sign-In' : 'Or sign in with verified Email'}
                </button>
              </div>
            )}

            {ENABLE_EMAIL_SIGN_IN && showEmailForm && (
              <form onSubmit={(e) => void handleEmailAuth(e)} style={{ marginTop: 12 }}>
                <input
                  type="email"
                  placeholder="Parent email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  required
                />
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  required
                />
                <button type="submit" className="login-btn" disabled={busy}>
                  {isRegister ? 'Create Parent Account' : 'Sign In with Email'}
                </button>
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setIsRegister((r) => !r)}
                  >
                    {isRegister
                      ? 'Already have an account? Sign in'
                      : 'Need an email account? Register'}
                  </button>
                </div>
              </form>
            )}

            {infoMsg && (
              <div style={{ color: '#059669', fontSize: 12, marginTop: 8, fontWeight: 600 }}>
                {infoMsg}
              </div>
            )}
            {error && <div className="login-err">{error}</div>}
            <div className="login-note">
              Parents sign in once per device and create up to 6 child profiles.
              <br />
              Kids never sign in and can play simultaneously across devices.
            </div>
          </div>
        )}

        {step === 'setpin' && activeUser && (
          <form onSubmit={(e) => void handleSetPin(e)}>
            <p className="sub">
              👋 Hi <b>{firstName}</b>! Set a 6-digit Parent PIN
            </p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={PIN_LENGTH}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
              }}
              placeholder="• • • • • •"
              className="login-input pin"
            />
            <button type="submit" className="login-btn" disabled={busy}>
              {busy ? 'Saving PIN...' : 'Save 6-Digit PIN & Continue →'}
            </button>
            {error && <div className="login-err">{error}</div>}
            <div className="login-note">
              Avoid repeated digits (111111) or sequences (123456). Your PIN unlocks this
              device for 12 hours and protects profile &amp; parent settings.
            </div>
          </form>
        )}

        {step === 'verifypin' && activeUser && (
          <form onSubmit={(e) => void handleVerifyPin(e)}>
            {activeUser.photoURL && (
              <div style={{ marginBottom: 8 }}>
                <img
                  src={activeUser.photoURL}
                  alt=""
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    border: '3px solid var(--border)',
                  }}
                />
              </div>
            )}
            <p className="sub">
              Welcome back, <b>{firstName}</b>! Enter 6-digit Parent PIN
            </p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={PIN_LENGTH}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
              }}
              placeholder="• • • • • •"
              className="login-input pin"
            />
            <button type="submit" className="login-btn" disabled={busy}>
              {busy ? 'Verifying...' : 'Unlock 🔓'}
            </button>
            {error && <div className="login-err">{error}</div>}
            <div className="login-note">
              <button type="button" onClick={handleForgotPin} className="link-btn">
                Forgot or upgrading PIN? Re-authenticate with provider
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
