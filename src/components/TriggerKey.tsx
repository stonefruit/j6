import './TriggerKey.css';

interface TriggerKeyProps {
  noteIndex: number; // 0-11 for C, C#, D, D#, E, F, F#, G, G#, A, A#, B
}

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', '', 'F#', 'G#', 'A#', '']; // Empty strings for gaps
const ALL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function TriggerKey({ noteIndex }: TriggerKeyProps) {
  const activeNote = ALL_KEYS[noteIndex];

  return (
    <div className="trigger-key-container">
      <div className="trigger-keyboard">
        {/* Black keys row */}
        <div className="trigger-keyboard-row trigger-black-keys-row">
          {BLACK_KEYS.map((key, idx) => (
            <>
              <div
                key={`black-${idx}`}
                className={`trigger-key trigger-black-key ${key === '' ? 'gap' : ''} ${key === activeNote ? 'active' : ''}`}
              >
              </div>
              {idx === 1 && <div key="gap-black-ef" className="trigger-key-gap"></div>}
            </>
          ))}
        </div>

        {/* White keys row */}
        <div className="trigger-keyboard-row trigger-white-keys-row">
          {WHITE_KEYS.map((key) => (
            <>
              <div
                key={`white-${key}`}
                className={`trigger-key trigger-white-key ${key === activeNote ? 'active' : ''}`}
              >
              </div>
              {key === 'E' && <div key="gap-ef" className="trigger-key-gap"></div>}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
