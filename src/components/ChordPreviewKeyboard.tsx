import type { Chord } from '../types';
import './ChordPreviewKeyboard.css';

interface ChordPreviewKeyboardProps {
  chords: Chord[]; // Array of 12 chords
}

const WHITE_KEY_INDICES = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
const BLACK_KEY_SLOTS = [
  { index: 1, note: 'C#' },
  { index: 3, note: 'D#' },
  { index: -1, note: '' }, // Gap between E-F
  { index: 6, note: 'F#' },
  { index: 8, note: 'G#' },
  { index: 10, note: 'A#' },
  { index: -1, note: '' }, // Gap after B
];

export default function ChordPreviewKeyboard({ chords }: ChordPreviewKeyboardProps) {
  return (
    <div className="chord-preview-keyboard-container">
      <div className="chord-preview-keyboard">
        {/* Black keys row */}
        <div className="preview-keyboard-row preview-black-keys-row">
          {BLACK_KEY_SLOTS.map((slot, idx) => {
            if (slot.index === -1) {
              return <div key={`gap-${idx}`} className="preview-key preview-black-key gap"></div>;
            }
            return (
              <div key={`black-${slot.index}`} className="preview-key preview-black-key">
                <span className="preview-key-label">{chords[slot.index]?.name || ''}</span>
              </div>
            );
          })}
        </div>

        {/* White keys row */}
        <div className="preview-keyboard-row preview-white-keys-row">
          {WHITE_KEY_INDICES.map((index) => (
            <div key={`white-${index}`} className="preview-key preview-white-key">
              <span className="preview-key-label">{chords[index]?.name || ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
