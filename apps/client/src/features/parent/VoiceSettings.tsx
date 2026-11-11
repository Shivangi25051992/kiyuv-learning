import React, { useEffect, useState } from 'react';
import {
  canSpeak,
  getSavedVoiceName,
  initAudio,
  isSoundEnabled,
  listEnglishVoices,
  setVoiceName,
  speak,
} from '../../lib/sound.js';

/**
 * Lets a parent choose the voice that reads questions aloud. Which voices
 * exist depends on the device, so we list what is installed and let the
 * parent listen before choosing.
 */
export const VoiceSettings: React.FC = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => listEnglishVoices());
  const [selected, setSelected] = useState<string>(getSavedVoiceName() ?? '');

  useEffect(() => {
    if (!canSpeak()) return;
    const refresh = () => setVoices(listEnglishVoices());
    refresh();
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh);
  }, []);

  if (!canSpeak()) return null;

  const automatic = voices[0];
  const soundOn = isSoundEnabled();

  return (
    <div className="parent-section voice-settings">
      <h4 className="parent-heading">Reading voice</h4>
      <div className="voice-row">
        <label className="sr-only" htmlFor="voice-select">
          Voice that reads questions aloud
        </label>
        <select
          id="voice-select"
          className="text-input"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setVoiceName(e.target.value || null);
          }}
        >
          <option value="">
            Automatic{automatic ? ` (${automatic.name})` : ''}
          </option>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
        <button
          type="button"
          className="secondary-btn small"
          disabled={!soundOn}
          onClick={() => {
            initAudio();
            speak("Hello! Let's learn together.");
          }}
        >
          Hear it
        </button>
      </div>
      <p className="field-hint">
        {soundOn
          ? 'The voices come from this device. The “Natural” voices in Microsoft Edge and the “Enhanced” voices on iPhone sound the softest.'
          : 'Turn the sound on (speaker button at the top) to hear a voice.'}
      </p>
    </div>
  );
};
