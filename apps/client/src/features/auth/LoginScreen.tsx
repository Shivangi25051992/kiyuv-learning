import React, { useState } from 'react';
import { signInWithGoogle, type AuthParentUser } from '../../lib/firebase/index.js';
import {
  checkParentPin,
  clearParentPin,
  hasConfiguredPin,
  saveParentPin,
} from './PinModal.js';

interface LoginScreenProps {
  user: AuthParentUser | null;
  onUnlocked: (user: AuthParentUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ user, onUnlocked }) => {
  const [step, setStep] = useState<'google' | 'setpin' | 'verifypin'>(() => {
    if (!user) return 'google';
    return hasConfiguredPin(user.uid) ? 'verifypin' : 'setpin';
  });
  const [activeUser, setActiveUser] = useState<AuthParentUser | null>(user);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    setActiveUser(user);
    if (!user) {
      setStep('google');
    } else if (hasConfiguredPin(user.uid)) {
      setStep('verifypin');
    } else {
      setStep('setpin');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setError('');
    setBusy(true);
    try {
      const signedIn = await signInWithGoogle();
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

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!/^[0-9]{4}$/.test(pin)) {
      setError('Enter a 4-digit PIN');
      return;
    }
    const entered = pin;
    setPin('');
    await saveParentPin(activeUser.uid, entered);
    onUnlocked(activeUser);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!/^[0-9]{4}$/.test(pin)) {
      setError('Enter your 4-digit PIN');
      return;
    }
    const entered = pin;
    setPin('');
    const ok = await checkParentPin(activeUser.uid, entered);
    if (!ok) {
      setError('Wrong PIN. Try again.');
      return;
    }
    onUnlocked(activeUser);
  };

  const handleForgotPin = async () => {
    if (activeUser) {
      clearParentPin(activeUser.uid);
    }
    setPin('');
    setError('');
    await handleGoogleSignIn();
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
        <p className="sub">Parent Sign-In · Multi-Profile Family Learning</p>

        {step === 'google' && (
          <div>
            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleSignIn}
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
              {busy ? 'Opening Google...' : 'Sign in with Google'}
            </button>
            {error && <div className="login-err">{error}</div>}
            <div className="login-note">
              Parents sign in once per device and create up to 6 child profiles.
              <br />
              Kids can play simultaneously on different devices under the same parent account.
            </div>
          </div>
        )}

        {step === 'setpin' && activeUser && (
          <form onSubmit={handleSetPin}>
            <p className="sub">
              👋 Hi <b>{firstName}</b>! Set a 4-digit Parent PIN
            </p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
              }}
              placeholder="• • • •"
              className="login-input pin"
            />
            <button type="submit" className="login-btn">
              Save PIN & Continue →
            </button>
            {error && <div className="login-err">{error}</div>}
            <div className="login-note">
              Your PIN protects adding/editing profiles and resetting progress.
            </div>
          </form>
        )}

        {step === 'verifypin' && activeUser && (
          <form onSubmit={handleVerifyPin}>
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
              Welcome back, <b>{firstName}</b>! Enter Parent PIN
            </p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
              }}
              placeholder="• • • •"
              className="login-input pin"
            />
            <button type="submit" className="login-btn">
              Unlock 🔓
            </button>
            {error && <div className="login-err">{error}</div>}
            <div className="login-note">
              <button
                type="button"
                onClick={handleForgotPin}
                className="link-btn"
              >
                Forgot PIN? Re-verify with Google
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
