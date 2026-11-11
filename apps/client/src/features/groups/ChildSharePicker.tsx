import React from 'react';
import { isBoardNameAllowed, presetBoardNames, type KidProfile } from '@kiyuv/shared';

/** kidId -> board name. A child who is not in the map is not shared. */
export type ShareChoice = Record<string, string>;

interface ChildSharePickerProps {
  profiles: readonly KidProfile[];
  value: ShareChoice;
  onChange: (next: ShareChoice) => void;
  idPrefix: string;
}

const PRESETS = presetBoardNames();
const randomPreset = (): string => PRESETS[Math.floor(Math.random() * PRESETS.length)]!;

export function shareChoiceIsValid(choice: ShareChoice): boolean {
  return Object.values(choice).every((name) => isBoardNameAllowed(name));
}

/** Pick which children appear on a group's board, and the name each one uses there. */
export const ChildSharePicker: React.FC<ChildSharePickerProps> = ({
  profiles,
  value,
  onChange,
  idPrefix,
}) => (
  <div className="share-picker">
    {profiles.map((p) => {
      const shared = p.kidId in value;
      const inputId = `${idPrefix}-${p.kidId}`;
      const name = value[p.kidId] ?? '';
      const invalid = shared && name.trim().length > 0 && !isBoardNameAllowed(name);
      return (
        <div key={p.kidId} className={`share-row ${shared ? 'on' : ''}`}>
          <label className="share-check">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => {
                const next = { ...value };
                if (e.target.checked) next[p.kidId] = randomPreset();
                else delete next[p.kidId];
                onChange(next);
              }}
            />
            <span className="share-avatar" aria-hidden="true">
              {p.avatar}
            </span>
            <span>Share {p.nickname}</span>
          </label>
          {shared && (
            <div className="share-name">
              <label htmlFor={inputId}>Name on the board</label>
              <div className="share-name-row">
                <input
                  id={inputId}
                  className="text-input"
                  value={name}
                  maxLength={20}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `${inputId}-err` : undefined}
                  onChange={(e) => onChange({ ...value, [p.kidId]: e.target.value })}
                />
                <button
                  type="button"
                  className="secondary-btn small"
                  onClick={() => onChange({ ...value, [p.kidId]: randomPreset() })}
                >
                  Surprise me
                </button>
              </div>
              {invalid && (
                <p id={`${inputId}-err`} className="field-error">
                  Use 2 to 20 English letters or numbers. Please keep it kind, and not a real name.
                </p>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export const SHARING_NOTE =
  'The group will see only this child’s board name, picture, colour and stars for the week. ' +
  'No real name, nickname, age or place is shared. You can stop sharing at any time, and everyone in the group can see the board name.';
