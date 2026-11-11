import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * One consistent icon set for the app's controls (rounded 2.2px strokes).
 * The learning content (subject pictures, avatars, badges) keeps using emoji,
 * because children recognise them instantly; the controls use these.
 * All icons are decorative: the button around them carries the label.
 */
const Svg: React.FC<IconProps & { children: React.ReactNode; fill?: string }> = ({
  size = 22,
  className = '',
  fill = 'none',
  children,
}) => (
  <svg
    className={`icon ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const IconSoundOn: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </Svg>
);

export const IconSoundOff: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
    <path d="M17 9l5 6M22 9l-5 6" />
  </Svg>
);

export const IconParent: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.4 2.7-5.6 6-5.6s6 2.2 6 5.6" />
    <circle cx="17.5" cy="9.5" r="2.4" />
    <path d="M17 14.6c2.5.2 4 1.9 4 4.4" />
  </Svg>
);

export const IconLogout: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
    <path d="M15 8l4 4-4 4M19 12H9" />
  </Svg>
);

export const IconBack: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);

export const IconSwitch: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 8h13l-3-3M20 16H7l3 3" />
  </Svg>
);

export const IconStar: React.FC<IconProps> = (p) => (
  <Svg {...p} fill="currentColor">
    <path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8L12 3.2z" />
  </Svg>
);

export const IconFlame: React.FC<IconProps> = (p) => (
  <Svg {...p} fill="currentColor">
    <path d="M12 2.5c.6 3 3.9 4.6 3.9 8.4a3.9 3.9 0 0 1-7.8 0c0-1.4.5-2.4 1.3-3.4-.1 1.2.4 2 1.1 2.4-.4-3.2.4-5.4 1.5-7.4z" />
    <path d="M12 21a5.5 5.5 0 0 0 5.5-5.5c0-1.3-.4-2.3-1-3.2.2 3.1-2.2 4.3-3.3 3.6-1-.6-1.2-2-.8-3.3-2.4 1.6-5.4 2.6-5.4 5 0 2.2 2.2 3.4 5 3.4z" opacity=".55" stroke="none" />
  </Svg>
);

export const IconBook: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5v-15z" />
    <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5v-15z" />
  </Svg>
);

export const IconGame: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="11" rx="5" />
    <path d="M8 10.5v4M6 12.5h4" />
    <circle cx="15.5" cy="11.5" r=".9" fill="currentColor" />
    <circle cx="18" cy="13.5" r=".9" fill="currentColor" />
  </Svg>
);

export const IconTrophy: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
    <path d="M8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11" />
    <path d="M12 13v4M8.5 20h7M10 17h4" />
  </Svg>
);

export const IconPlus: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconPencil: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z" />
  </Svg>
);

export const IconClose: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const IconCheck: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const IconSpeaker: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
  </Svg>
);

export const IconPlay: React.FC<IconProps> = (p) => (
  <Svg {...p} fill="currentColor">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.8l-10-6.5A1 1 0 0 0 8 5.5z" stroke="none" />
  </Svg>
);

export const IconLock: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const IconRefresh: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7" />
    <path d="M20 4v7h-7" />
  </Svg>
);

export const IconMusic: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M9 18V6.5l10-2V16" />
    <circle cx="6.5" cy="18" r="2.6" fill="currentColor" />
    <circle cx="16.5" cy="16" r="2.6" fill="currentColor" />
  </Svg>
);

export const IconMusicOff: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M9 18V6.5l10-2V16" />
    <circle cx="6.5" cy="18" r="2.6" fill="currentColor" />
    <circle cx="16.5" cy="16" r="2.6" fill="currentColor" />
    <path d="M3 3l18 18" />
  </Svg>
);

export const IconGroup: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.4-3.2 2.6-5 5.5-5s5.1 1.8 5.5 5" />
    <circle cx="17" cy="9.5" r="2.5" />
    <path d="M16.5 14.2c2.4.1 3.8 1.6 4.2 4.3" />
  </Svg>
);
