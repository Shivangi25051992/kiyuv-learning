import React from 'react';
import { useCompanion } from './CompanionProvider.js';
import { feelingsEnabled, setFeelingsEnabled } from '../feelings/feelingsState.js';

/**
 * Lets a parent turn Kiyu, the on-screen helper, off. Kiyu only appears for a few
 * seconds when something good happens, but some children and some families prefer a
 * calm screen, and that is fine.
 */
export const CompanionSettings: React.FC = () => {
  const { enabled, setEnabled } = useCompanion();
  const [feelings, setFeelings] = React.useState(feelingsEnabled);
  return (
    <div className="parent-section">
      <h4 className="parent-heading">Kiyu, the helper</h4>
      <label className="companion-toggle">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>Show Kiyu cheering and running across the screen</span>
      </label>
      <p className="companion-note">Kiyu appears for a few seconds, never covers a button, and never collects anything.</p>
      <label className="companion-toggle">
        <input
          type="checkbox"
          checked={feelings}
          onChange={(e) => {
            setFeelings(e.target.checked);
            setFeelingsEnabled(e.target.checked);
          }}
        />
        <span>Ask each day how the child is feeling</span>
      </label>
      <p className="companion-note">The answer stays on this device. It is not sent anywhere, saved online or shown to anyone. Kiyu only uses it to choose kind words.</p>
    </div>
  );
};
