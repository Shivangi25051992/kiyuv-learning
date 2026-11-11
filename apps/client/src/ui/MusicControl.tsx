import React, { useEffect, useId, useRef, useState } from 'react';
import {
  getMusicVolume,
  initAudio,
  isMusicEnabled,
  setMusicVolume,
  startMusic,
  toggleMusic,
} from '../lib/sound.js';
import { IconMusic, IconMusicOff } from './Icons.js';

/** The music button. It opens a small panel with an on/off switch and a volume slider. */
export const MusicControl: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState<boolean>(() => isMusicEnabled());
  const [volume, setVolume] = useState<number>(() => getMusicVolume());
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();

  // Close when tapping elsewhere or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const percent = Math.round(volume * 100);

  return (
    <div className="popover-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`icon-btn ${on ? '' : 'is-off'}`}
        ref={triggerRef}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="Music settings"
        title="Music"
        data-silent
        onClick={() => setOpen((o) => !o)}
      >
        {on ? <IconMusic /> : <IconMusicOff />}
      </button>

      {open && (
        <div className="popover" id={panelId} role="group" aria-label="Music settings">
          <div className="popover-row">
            <span className="popover-title" id={titleId}>
              Music
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-labelledby={titleId}
              className={`switch ${on ? 'on' : ''}`}
              data-silent
              onClick={() => setOn(toggleMusic())}
            >
              <span className="switch-knob" />
            </button>
          </div>

          <label className="slider-label" htmlFor="music-volume">
            <span>Volume</span>
            <span aria-hidden="true">{percent}%</span>
          </label>
          <input
            id="music-volume"
            className="slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={percent}
            aria-valuetext={`${percent} percent`}
            style={{ ['--p' as string]: `${percent}%` }}
            onChange={(e) => {
              const next = Number(e.target.value) / 100;
              setVolume(next);
              setMusicVolume(next);
              initAudio();
              startMusic();
            }}
          />
        </div>
      )}
    </div>
  );
};
