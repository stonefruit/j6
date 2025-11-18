import './Keyboard.css';

interface KeyboardProps {
  notes: string[];
}

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', '', 'F#', 'G#', 'A#', '']; // Empty strings for gaps (E-F, B-C)

// Map enharmonic equivalents
const normalizeNote = (note: string): string => {
  const enharmonics: { [key: string]: string } = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#'
  };
  return enharmonics[note] || note;
};

const parseNote = (noteStr: string): { note: string; octave: number } | null => {
  const match = noteStr.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return null;

  return {
    note: normalizeNote(match[1]),
    octave: parseInt(match[2])
  };
};

export default function Keyboard({ notes }: KeyboardProps) {
  // Parse all notes and find the range
  const parsedNotes = notes.map(parseNote).filter(n => n !== null) as Array<{ note: string; octave: number }>;

  if (parsedNotes.length === 0) return null;

  const octaves = parsedNotes.map(n => n.octave);
  const minOctave = Math.min(...octaves);
  const maxOctave = Math.max(...octaves);

  // Create a set of active note-octave combinations for quick lookup
  const activeNotes = new Set(parsedNotes.map(n => `${n.note}${n.octave}`));

  // Generate all octaves we need to show
  const octaveRange = [];
  for (let i = minOctave; i <= maxOctave; i++) {
    octaveRange.push(i);
  }

  const isKeyActive = (key: string, octave: number): boolean => {
    return activeNotes.has(`${key}${octave}`);
  };

  return (
    <div className="keyboard-container">
      <div className="keyboard">
        {/* Black keys row */}
        <div className="keyboard-row black-keys-row">
          {octaveRange.map(octave => (
            <div key={`black-${octave}`} className="octave-group">
              {BLACK_KEYS.map((key, idx) => (
                <div
                  key={`${key}-${octave}-${idx}`}
                  className={`key black-key ${key === '' ? 'gap' : ''} ${key && isKeyActive(key, octave) ? 'active' : ''}`}
                >
                  {key && <span className="key-label">{key}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* White keys row */}
        <div className="keyboard-row white-keys-row">
          {octaveRange.map(octave => (
            <div key={`white-${octave}`} className="octave-group">
              {WHITE_KEYS.map(key => (
                <div
                  key={`${key}-${octave}`}
                  className={`key white-key ${isKeyActive(key, octave) ? 'active' : ''}`}
                >
                  <span className="key-label">{key}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
