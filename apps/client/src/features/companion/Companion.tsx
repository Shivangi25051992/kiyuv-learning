import React from 'react';
import { Mascot, type MascotMood } from '../../ui/Mascot.js';
import type { CompanionMove } from './lines.js';
import './companion.css';

export interface CompanionShown {
  /** Changes every time so the animation starts afresh. */
  seq: number;
  mood: MascotMood;
  line: string | null;
  move: CompanionMove;
  ms: number;
  /** Where to run to, for "to". */
  at?: { x: number; y: number };
  aboveTabbar: boolean;
  leaving: boolean;
}

const SIZE = 76;

/**
 * Kiyu on top of the screen. It never takes a tap: taps go straight through to whatever
 * is underneath, so it can never get in the way. It is decoration, so the words it says
 * are also given (politely) to screen readers in a hidden line.
 */
export const Companion: React.FC<{ shown: CompanionShown | null }> = ({ shown }) => {
  const style: Record<string, string> = {};
  if (shown) {
    style['--hold'] = `${shown.ms}ms`;
    if (shown.move === 'to' && shown.at) {
      // Start in the bottom-left corner and run to the spot that was tapped.
      const homeX = 48;
      const homeY = (typeof window === 'undefined' ? 600 : window.innerHeight) - 24;
      style['--tx'] = String(Math.round(shown.at.x));
      style['--ty'] = String(Math.round(shown.at.y));
      style['--dx'] = `${Math.round(homeX - shown.at.x)}px`;
      style['--dy'] = `${Math.round(homeY - shown.at.y)}px`;
    }
  }
  return (
    <div className="companion">
      <p className="sr-only" role="status">
        {shown?.line ?? ''}
      </p>
      {shown && (
        <div
          key={shown.seq}
          className={`companion-actor move-${shown.move}${shown.aboveTabbar ? ' above-tabbar' : ''}${shown.leaving ? ' leaving' : ''}`}
          style={style}
          aria-hidden="true"
        >
          {shown.line && <p className="companion-bubble">{shown.line}</p>}
          <span className="companion-body">
            <Mascot mood={shown.mood} size={SIZE} />
          </span>
        </div>
      )}
    </div>
  );
};
