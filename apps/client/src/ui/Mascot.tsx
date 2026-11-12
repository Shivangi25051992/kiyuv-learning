import React, { useId } from 'react';
import { useActiveLook, type AccessoryKey } from '../features/wardrobe/lookStore.js';

export type MascotMood =
  | 'happy'
  | 'cheer'
  | 'oops'
  | 'think'
  | 'sleepy'
  | 'excited'
  | 'proud'
  | 'wave'
  | 'surprised'
  | 'love'
  | 'wink'
  | 'laugh';

interface MascotProps {
  mood?: MascotMood;
  /** Pixel size (width and height). */
  size?: number;
  className?: string;
  /** What Kiyu wears. Leave out to wear what the child chose. Pass null to wear nothing. */
  accessory?: AccessoryKey | null;
}

/**
 * "Kiyu", the friendly round helper. Pure SVG, so it stays sharp on every
 * screen, themes with the child's colour, and costs almost nothing to load.
 * It is decoration only, so it is hidden from screen readers.
 */
export const Mascot: React.FC<MascotProps> = ({ mood = 'happy', size = 120, className = '', accessory }) => {
  const activeLook = useActiveLook();
  const look = accessory === undefined ? activeLook : accessory;
  // Each mascot needs its own gradient id. A shared id breaks when one copy is hidden.
  const gradientId = `mascot-body-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const eyesClosed = mood === 'cheer' || mood === 'sleepy' || mood === 'proud' || mood === 'laugh';
  const lookUp = mood === 'think';
  const wide = mood === 'oops' || mood === 'surprised';
  const heartEyes = mood === 'love';
  const winking = mood === 'wink';
  // Both arms up for big happy moods; one arm up and waving for "wave".
  const armsUp = mood === 'cheer' || mood === 'excited' || mood === 'laugh';
  const waving = mood === 'wave';

  return (
    <svg
      className={`mascot mascot-${mood} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={gradientId} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="var(--mascot-light, #8fb4ff)" />
          <stop offset="100%" stopColor="var(--mascot-main, #4f7bff)" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse className="mascot-shadow" cx="60" cy="112" rx="30" ry="5" fill="rgba(40,50,100,0.16)" />

      <g className="mascot-bob" data-accessory={look ?? undefined}>
        {look === 'cape' && (
          <path className="mascot-cape" d="M30 52 Q6 92 24 114 L96 114 Q114 92 90 52 Z" fill="#e53935" stroke="#b3201f" strokeWidth="2" />
        )}
        {look === 'jetpack' && (
          <g className="mascot-jetpack">
            <rect x="10" y="60" width="16" height="38" rx="8" fill="#9aa5c8" stroke="#6b77a0" strokeWidth="2" />
            <rect x="94" y="60" width="16" height="38" rx="8" fill="#9aa5c8" stroke="#6b77a0" strokeWidth="2" />
            <ellipse className="mascot-flame" cx="18" cy="104" rx="5" ry="8" fill="#ffb02e" />
            <ellipse className="mascot-flame" cx="102" cy="104" rx="5" ry="8" fill="#ffb02e" />
          </g>
        )}
        {/* Learning sprout */}
        <g className="mascot-sprout">
          <path d="M60 22 C60 14 60 10 60 6" stroke="#2f9e6e" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M60 10 C52 4 44 8 44 14 C52 16 58 14 60 10Z" fill="#3ddc97" />
          <path d="M60 8 C68 2 77 6 77 12 C69 14 63 12 60 8Z" fill="#6ee7b7" />
        </g>

        {/* Arms (raised when cheering) */}
        <g className="mascot-arms">
          <ellipse cx="20" cy={armsUp ? 54 : 72} rx="9" ry="12" fill={`url(#${gradientId})`} transform={armsUp ? 'rotate(-28 20 54)' : 'rotate(18 20 72)'} />
          <ellipse
            className={waving ? 'mascot-wave-arm' : undefined}
            cx="100"
            cy={armsUp || waving ? 54 : 72}
            rx="9"
            ry="12"
            fill={`url(#${gradientId})`}
            transform={armsUp || waving ? 'rotate(28 100 54)' : 'rotate(-18 100 72)'}
          />
        </g>

        {/* Ears */}
        <circle cx="30" cy="32" r="11" fill={`url(#${gradientId})`} />
        <circle cx="90" cy="32" r="11" fill={`url(#${gradientId})`} />
        <circle cx="30" cy="32" r="5.5" fill="#ffc4de" />
        <circle cx="90" cy="32" r="5.5" fill="#ffc4de" />

        {/* Body */}
        <ellipse cx="60" cy="66" rx="42" ry="42" fill={`url(#${gradientId})`} />
        <ellipse cx="60" cy="78" rx="26" ry="24" fill="#ffffff" opacity="0.92" />

        {/* Eyes */}
        {heartEyes ? (
          <g fill="#ff4f8b">
            <path d="M44 62 C34 55 34 46 41 46 C44 46 44 49 44 49 C44 49 44 46 47 46 C54 46 54 55 44 62Z" />
            <path d="M76 62 C66 55 66 46 73 46 C76 46 76 49 76 49 C76 49 76 46 79 46 C86 46 86 55 76 62Z" />
          </g>
        ) : eyesClosed ? (
          <g stroke="#27305e" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M38 56 Q44 48 50 56" />
            <path d="M70 56 Q76 48 82 56" />
          </g>
        ) : (
          <g className="mascot-eyes">
            <ellipse cx="44" cy="56" rx={wide ? 9 : 7.5} ry={wide ? 11 : 9} fill="#ffffff" />
            {winking ? (
              <path d="M70 56 Q76 48 82 56" stroke="#27305e" strokeWidth="4" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <ellipse cx="76" cy="56" rx={wide ? 9 : 7.5} ry={wide ? 11 : 9} fill="#ffffff" />
                <circle cx={lookUp ? 78 : 77} cy={lookUp ? 53 : 57} r="4.6" fill="#27305e" />
              </>
            )}
            <circle cx={lookUp ? 46 : 45} cy={lookUp ? 53 : 57} r="4.6" fill="#27305e" />
            <circle cx="46.8" cy={lookUp ? 51 : 55} r="1.6" fill="#ffffff" />
            {!winking && <circle cx="78.8" cy={lookUp ? 51 : 55} r="1.6" fill="#ffffff" />}
          </g>
        )}

        {/* Cheeks */}
        <ellipse cx="32" cy="72" rx="6.5" ry="4.5" fill="#ff9fc6" opacity="0.75" />
        <ellipse cx="88" cy="72" rx="6.5" ry="4.5" fill="#ff9fc6" opacity="0.75" />

        {/* Mouth */}
        {(mood === 'cheer' || mood === 'excited' || mood === 'laugh') && (
          <path d="M46 70 Q60 92 74 70 Q60 76 46 70Z" fill="#27305e" stroke="#27305e" strokeWidth="2" strokeLinejoin="round" />
        )}
        {mood === 'surprised' && <ellipse cx="60" cy="78" rx="6.5" ry="8" fill="#27305e" />}
        {mood === 'proud' && (
          <path d="M46 72 Q60 90 74 72" stroke="#27305e" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}
        {(mood === 'happy' || mood === 'wave' || mood === 'love' || mood === 'wink') && (
          <path d="M48 72 Q60 84 72 72" stroke="#27305e" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}
        {mood === 'oops' && (
          <path d="M50 80 Q60 72 70 80" stroke="#27305e" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}
        {mood === 'think' && <ellipse cx="60" cy="77" rx="5" ry="6" fill="#27305e" />}
        {mood === 'sleepy' && (
          <path d="M52 76 Q60 80 68 76" stroke="#27305e" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        )}
        {look === 'butterfly' && (
          <g className="mascot-butterfly" transform="translate(100 16)">
            <ellipse cx="-7" cy="-3" rx="8" ry="6" fill="#ff8fc7" stroke="#d9559d" strokeWidth="1.5" transform="rotate(-25 -7 -3)" />
            <ellipse cx="7" cy="-3" rx="8" ry="6" fill="#b28cff" stroke="#7d58d6" strokeWidth="1.5" transform="rotate(25 7 -3)" />
            <ellipse cx="-5" cy="5" rx="6" ry="4.5" fill="#ffb3da" stroke="#d9559d" strokeWidth="1.5" transform="rotate(20 -5 5)" />
            <ellipse cx="5" cy="5" rx="6" ry="4.5" fill="#cdb4ff" stroke="#7d58d6" strokeWidth="1.5" transform="rotate(-20 5 5)" />
            <rect x="-1.2" y="-6" width="2.4" height="15" rx="1.2" fill="#27305e" />
          </g>
        )}
        {look === 'star' && (
          <path d="M26 6 L29.5 14.5 L38.5 15.2 L31.6 21 L33.8 29.8 L26 25 L18.2 29.8 L20.4 21 L13.5 15.2 L22.5 14.5 Z" fill="#ffc83d" stroke="#d99a00" strokeWidth="2" strokeLinejoin="round" />
        )}
        {look === 'medal' && (
          <g>
            <path d="M48 82 L60 104 L72 82" stroke="#e53935" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <circle cx="60" cy="106" r="8.5" fill="#ffc83d" stroke="#d99a00" strokeWidth="2.5" />
            <path d="M60 101 L61.8 105 L66 105.4 L62.9 108.2 L63.8 112.3 L60 110 L56.2 112.3 L57.1 108.2 L54 105.4 L58.2 105 Z" fill="#fff4c2" />
          </g>
        )}
        {look === 'crown' && (
          <g>
            <path d="M40 30 L45 11 L54 23 L60 6 L66 23 L75 11 L80 30 Z" fill="#ffc83d" stroke="#d99a00" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="60" cy="24" r="3" fill="#e53935" />
            <circle cx="47" cy="26" r="2.2" fill="#3b7bff" />
            <circle cx="73" cy="26" r="2.2" fill="#1faa72" />
          </g>
        )}
      </g>
    </svg>
  );
};
