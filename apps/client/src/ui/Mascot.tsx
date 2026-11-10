import React, { useId } from 'react';

export type MascotMood = 'happy' | 'cheer' | 'oops' | 'think' | 'sleepy';

interface MascotProps {
  mood?: MascotMood;
  /** Pixel size (width and height). */
  size?: number;
  className?: string;
}

/**
 * "Kiyu", the friendly round helper. Pure SVG, so it stays sharp on every
 * screen, themes with the child's colour, and costs almost nothing to load.
 * It is decoration only, so it is hidden from screen readers.
 */
export const Mascot: React.FC<MascotProps> = ({ mood = 'happy', size = 120, className = '' }) => {
  // Each mascot needs its own gradient id. A shared id breaks when one copy is hidden.
  const gradientId = `mascot-body-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const eyesClosed = mood === 'cheer' || mood === 'sleepy';
  const lookUp = mood === 'think';
  const wide = mood === 'oops';

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

      <g className="mascot-bob">
        {/* Learning sprout */}
        <g className="mascot-sprout">
          <path d="M60 22 C60 14 60 10 60 6" stroke="#2f9e6e" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M60 10 C52 4 44 8 44 14 C52 16 58 14 60 10Z" fill="#3ddc97" />
          <path d="M60 8 C68 2 77 6 77 12 C69 14 63 12 60 8Z" fill="#6ee7b7" />
        </g>

        {/* Arms (raised when cheering) */}
        <g className="mascot-arms">
          <ellipse cx="20" cy={mood === 'cheer' ? 54 : 72} rx="9" ry="12" fill={`url(#${gradientId})`} transform={mood === 'cheer' ? 'rotate(-28 20 54)' : 'rotate(18 20 72)'} />
          <ellipse cx="100" cy={mood === 'cheer' ? 54 : 72} rx="9" ry="12" fill={`url(#${gradientId})`} transform={mood === 'cheer' ? 'rotate(28 100 54)' : 'rotate(-18 100 72)'} />
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
        {eyesClosed ? (
          <g stroke="#27305e" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M38 56 Q44 48 50 56" />
            <path d="M70 56 Q76 48 82 56" />
          </g>
        ) : (
          <g className="mascot-eyes">
            <ellipse cx="44" cy="56" rx={wide ? 9 : 7.5} ry={wide ? 11 : 9} fill="#ffffff" />
            <ellipse cx="76" cy="56" rx={wide ? 9 : 7.5} ry={wide ? 11 : 9} fill="#ffffff" />
            <circle cx={lookUp ? 46 : 45} cy={lookUp ? 53 : 57} r="4.6" fill="#27305e" />
            <circle cx={lookUp ? 78 : 77} cy={lookUp ? 53 : 57} r="4.6" fill="#27305e" />
            <circle cx="46.8" cy={lookUp ? 51 : 55} r="1.6" fill="#ffffff" />
            <circle cx="78.8" cy={lookUp ? 51 : 55} r="1.6" fill="#ffffff" />
          </g>
        )}

        {/* Cheeks */}
        <ellipse cx="32" cy="72" rx="6.5" ry="4.5" fill="#ff9fc6" opacity="0.75" />
        <ellipse cx="88" cy="72" rx="6.5" ry="4.5" fill="#ff9fc6" opacity="0.75" />

        {/* Mouth */}
        {mood === 'cheer' && (
          <path d="M46 70 Q60 92 74 70 Q60 76 46 70Z" fill="#27305e" stroke="#27305e" strokeWidth="2" strokeLinejoin="round" />
        )}
        {mood === 'happy' && (
          <path d="M48 72 Q60 84 72 72" stroke="#27305e" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}
        {mood === 'oops' && (
          <path d="M50 80 Q60 72 70 80" stroke="#27305e" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}
        {mood === 'think' && <ellipse cx="60" cy="77" rx="5" ry="6" fill="#27305e" />}
        {mood === 'sleepy' && (
          <path d="M52 76 Q60 80 68 76" stroke="#27305e" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        )}
      </g>
    </svg>
  );
};
