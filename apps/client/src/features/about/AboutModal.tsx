import React, { useEffect, useState } from 'react';
import { useModalFocus } from '../../ui/useModalFocus.js';
import { PRIVACY_URL, TERMS_URL, openExternal } from './links.js';

const OTHER_CREDITS = [
  'Pictures: Noto Emoji by Google (github.com/googlefonts/noto-emoji), Apache License 2.0.',
  'Fonts: Fredoka and Nunito, SIL Open Font License 1.1.',
];

/** Privacy and terms links, and credits for the sounds and pictures. Shown to parents only. */
export const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const ref = useModalFocus<HTMLDivElement>(onClose);
  const [sounds, setSounds] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/sounds/CREDITS.txt')
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => {
        if (!cancelled) setSounds(t);
      })
      .catch(() => {
        // Credits for sounds stay hidden when offline and not yet cached.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="modal-backdrop">
      <div
        className="modal-card wide-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        ref={ref}
        tabIndex={-1}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="about-title" style={{ margin: 0, fontSize: 24 }}>About and credits</h2>
          <button type="button" onClick={onClose} className="close-icon-btn" aria-label="Close">
            ×
          </button>
        </div>
        <p style={{ margin: '12px 0' }}>
          <button type="button" className="secondary-btn" onClick={() => void openExternal(PRIVACY_URL)}>
            Privacy policy
          </button>{' '}
          <button type="button" className="secondary-btn" onClick={() => void openExternal(TERMS_URL)}>
            Terms of use
          </button>
        </p>
        <h3 style={{ margin: '14px 0 6px', fontSize: 16 }}>Credits</h3>
        <ul style={{ paddingLeft: 18, fontSize: 13, margin: '0 0 10px' }}>
          {OTHER_CREDITS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {sounds && (
          <pre
            aria-label="Sound credits"
            style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 260, overflow: 'auto', margin: 0 }}
          >
            {sounds}
          </pre>
        )}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button type="button" className="primary-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/** A small text button that opens the About screen. */
export const AboutLink: React.FC<{ className?: string }> = ({ className }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className ?? 'link-btn'} onClick={() => setOpen(true)}>
        About, privacy and credits
      </button>
      {open && <AboutModal onClose={() => setOpen(false)} />}
    </>
  );
};
