import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import chordData from "../../j6-chords.json";
import type { ChordData, ChordSet } from "../types";
import {
  getOutputs,
  getInputs,
  sendNoteOn,
  sendNoteOff,
  parseMidiMessage,
} from "../midi";
import type { MidiPortInfo } from "../midi";
import Keyboard from "./Keyboard";
import TriggerKey from "./TriggerKey";
import ChordPreviewKeyboard from "./ChordPreviewKeyboard";
import "./ChordSets.css";

const data: ChordData = chordData as ChordData;

const KEY_MAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5,
  t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
};

const CHANNELS = Array.from({ length: 16 }, (_, i) => i);
const NOTE_NAMES_FROM_C = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export default function ChordSets() {
  const [searchNumber, setSearchNumber] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  // MIDI state
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [midiOutputs, setMidiOutputs] = useState<MidiPortInfo[]>([]);
  const [midiInputs, setMidiInputs] = useState<MidiPortInfo[]>([]);
  const [midiOutputId, setMidiOutputId] = useState("");
  const [midiInputId, setMidiInputId] = useState("");
  const [inputChannel, setInputChannel] = useState(() => {
    const saved = localStorage.getItem("j6-input-channel");
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [outputChannel, setOutputChannel] = useState(() => {
    const saved = localStorage.getItem("j6-output-channel");
    return saved !== null ? parseInt(saved, 10) : 1;
  });
  const [showMidiHelp, setShowMidiHelp] = useState(false);
  const [octave, setOctave] = useState(() => {
    const saved = localStorage.getItem("j6-octave");
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [transpose, setTranspose] = useState(() => {
    const saved = localStorage.getItem("j6-transpose");
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const totalTranspose = octave * 12 + transpose;

  const midiOutputRef = useRef<MIDIOutput | null>(null);
  const inputChannelRef = useRef(inputChannel);
  const outputChannelRef = useRef(outputChannel);
  const totalTransposeRef = useRef(totalTranspose);

  // Keep refs and localStorage in sync
  useEffect(() => { inputChannelRef.current = inputChannel; localStorage.setItem("j6-input-channel", String(inputChannel)); }, [inputChannel]);
  useEffect(() => { outputChannelRef.current = outputChannel; localStorage.setItem("j6-output-channel", String(outputChannel)); }, [outputChannel]);
  useEffect(() => { totalTransposeRef.current = totalTranspose; }, [totalTranspose]);
  useEffect(() => { localStorage.setItem("j6-octave", String(octave)); }, [octave]);
  useEffect(() => { localStorage.setItem("j6-transpose", String(transpose)); }, [transpose]);

  // Callback for MIDI input triggering chords on the selected card
  const selectedCardRef = useRef(selectedCard);
  useEffect(() => { selectedCardRef.current = selectedCard; }, [selectedCard]);

  const activeInputNotesRef = useRef<Map<number, string[]>>(new Map());
  const [midiActiveKeyIndex, setMidiActiveKeyIndex] = useState<number | null>(null);

  const handleMidiMessage = useCallback((e: MIDIMessageEvent) => {
    if (!e.data) return;
    const event = parseMidiMessage(e.data);
    if (!event) return;
    if (event.channel !== inputChannelRef.current) return;

    const cardNum = selectedCardRef.current;
    if (cardNum === null) return;

    const chordSet = data.chordSets.find((s) => s.number === cardNum);
    if (!chordSet) return;

    const chordIndex = event.note % 12;
    const chord = chordSet.chords[chordIndex];
    if (!chord) return;

    if (event.type === "noteon") {
      if (midiOutputRef.current) {
        sendNoteOn(midiOutputRef.current, chord.notes, event.velocity, outputChannelRef.current, totalTransposeRef.current);
      }
      activeInputNotesRef.current.set(event.note, chord.notes);
      setMidiActiveKeyIndex(chordIndex);
    } else {
      const notes = activeInputNotesRef.current.get(event.note);
      if (notes && midiOutputRef.current) {
        sendNoteOff(midiOutputRef.current, notes, outputChannelRef.current, totalTransposeRef.current);
      }
      activeInputNotesRef.current.delete(event.note);
      setMidiActiveKeyIndex(
        activeInputNotesRef.current.size > 0
          ? [...activeInputNotesRef.current.keys()].pop()! % 12
          : null
      );
    }
  }, []);

  // Request MIDI access on mount
  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;
    navigator.requestMIDIAccess().then((access) => {
      setMidiAccess(access);
      const outputs = getOutputs(access);
      const inputs = getInputs(access);
      setMidiOutputs(outputs);
      setMidiInputs(inputs);
      if (outputs.length > 0) setMidiOutputId(outputs[0].id);
      if (inputs.length > 0) setMidiInputId(inputs[0].id);
      access.onstatechange = () => {
        setMidiOutputs(getOutputs(access));
        setMidiInputs(getInputs(access));
      };
    }).catch(() => {
      // MIDI not available
    });
  }, []);

  // Update output ref when selection changes
  useEffect(() => {
    if (!midiAccess || !midiOutputId) {
      midiOutputRef.current = null;
      return;
    }
    midiOutputRef.current = midiAccess.outputs.get(midiOutputId) || null;
  }, [midiAccess, midiOutputId]);

  // Attach/detach MIDI input listener
  useEffect(() => {
    if (!midiAccess || !midiInputId) return;
    const input = midiAccess.inputs.get(midiInputId);
    if (!input) return;

    input.onmidimessage = handleMidiMessage;
    return () => {
      input.onmidimessage = null;
      // Note off for any held notes
      activeInputNotesRef.current.forEach((notes) => {
        if (midiOutputRef.current) {
          sendNoteOff(midiOutputRef.current, notes, outputChannelRef.current, totalTransposeRef.current);
        }
      });
      activeInputNotesRef.current.clear();
      setMidiActiveKeyIndex(null);
    };
  }, [midiAccess, midiInputId, handleMidiMessage]);

  // Get unique genres
  const genres = useMemo(() => {
    const uniqueGenres = new Set(data.chordSets.map((set) => set.genre));
    return Array.from(uniqueGenres).sort();
  }, []);

  // Filter chord sets
  const filteredChordSets = useMemo(() => {
    return data.chordSets.filter((set) => {
      const matchesNumber =
        searchNumber === "" || set.number.toString().includes(searchNumber);
      const matchesGenre = selectedGenre === "" || set.genre === selectedGenre;
      return matchesNumber && matchesGenre;
    });
  }, [searchNumber, selectedGenre]);

  return (
    <div className="chord-sets-container">
      <header className="app-header">
        <h1>J-6 Chord Sets</h1>
        <p className="subtitle">
          Browse and explore Roland J-6 chord sets
          {" | "}
          <a
            href="https://static.roland.com/manuals/J-6_manual_v102/eng/28645807.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Official Docs
          </a>
        </p>
      </header>

      <div className="filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="search-number">Chord Set #</label>
            <input
              id="search-number"
              type="number"
              placeholder="Search by number..."
              value={searchNumber}
              onChange={(e) => {
                setSearchNumber(e.target.value);
                if (e.target.value) setSelectedGenre("");
              }}
              min="1"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="genre-filter">Genre</label>
            <select
              id="genre-filter"
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                if (e.target.value) setSearchNumber("");
              }}
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="midi-input">MIDI Input</label>
            <div className="midi-row">
              <select
                id="midi-input"
                value={midiInputId}
                onChange={(e) => setMidiInputId(e.target.value)}
              >
                <option value="">
                  {midiAccess ? "None" : "MIDI not available"}
                </option>
                {midiInputs.map((inp) => (
                  <option key={inp.id} value={inp.id}>
                    {inp.name}
                  </option>
                ))}
              </select>
              <select
                className="channel-select"
                value={inputChannel}
                onChange={(e) => setInputChannel(parseInt(e.target.value, 10))}
                title="Input MIDI channel"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>Ch {ch + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="midi-output">
              MIDI Output
              <button
                className="midi-help-btn"
                onClick={() => setShowMidiHelp((v) => !v)}
                title="MIDI setup help"
              >
                ?
              </button>
            </label>
            <div className="midi-row">
              <select
                id="midi-output"
                value={midiOutputId}
                onChange={(e) => setMidiOutputId(e.target.value)}
              >
                <option value="">
                  {midiAccess ? "None" : "MIDI not available"}
                </option>
                {midiOutputs.map((out) => (
                  <option key={out.id} value={out.id}>
                    {out.name}
                  </option>
                ))}
              </select>
              <select
                className="channel-select"
                value={outputChannel}
                onChange={(e) => setOutputChannel(parseInt(e.target.value, 10))}
                title="Output MIDI channel"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>Ch {ch + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group filter-group-compact">
            <label>Octave</label>
            <div className="transpose-control">
              <button onClick={() => setOctave((v) => Math.max(-3, v - 1))} disabled={octave <= -3}>-</button>
              <span className="transpose-value">{octave >= 0 ? `+${octave}` : octave}</span>
              <button onClick={() => setOctave((v) => Math.min(3, v + 1))} disabled={octave >= 3}>+</button>
            </div>
          </div>

          <div className="filter-group filter-group-compact">
            <label>Transpose ({NOTE_NAMES_FROM_C[((totalTranspose % 12) + 12) % 12]})</label>
            <div className="transpose-control">
              <button onClick={() => setTranspose((v) => Math.max(-11, v - 1))} disabled={transpose <= -11}>-</button>
              <span className="transpose-value">{transpose >= 0 ? `+${transpose}` : transpose}</span>
              <button onClick={() => setTranspose((v) => Math.min(11, v + 1))} disabled={transpose >= 11}>+</button>
            </div>
          </div>
        </div>

        {showMidiHelp && (
          <div className="midi-help">
            <p><strong>macOS setup (IAC Driver):</strong></p>
            <ol>
              <li>Open <strong>Audio MIDI Setup</strong> (Spotlight search)</li>
              <li>Window &rarr; Show MIDI Studio</li>
              <li>Double-click <strong>IAC Driver</strong></li>
              <li>Check <strong>Device is online</strong>, click Apply</li>
              <li>Refresh this page &mdash; select IAC Driver for both input and output</li>
            </ol>
            <p><strong>With Ableton:</strong></p>
            <ol>
              <li>Set MIDI Input to IAC Driver, choose an input channel (e.g. Ch 1)</li>
              <li>Set MIDI Output to IAC Driver, choose a different output channel (e.g. Ch 2)</li>
              <li>In Ableton, send notes on Ch 1 to trigger chords &mdash; chords return on Ch 2</li>
            </ol>
            <p><strong>Keyboard:</strong> Click a card, then use <kbd>a</kbd><kbd>w</kbd><kbd>s</kbd><kbd>e</kbd><kbd>d</kbd><kbd>f</kbd><kbd>t</kbd><kbd>g</kbd><kbd>y</kbd><kbd>h</kbd><kbd>u</kbd><kbd>j</kbd> to play chords.</p>
          </div>
        )}
      </div>

      {/* Now Playing indicator */}
      <div className="now-playing">
        {selectedCard !== null ? (() => {
          const set = data.chordSets.find((s) => s.number === selectedCard);
          return set ? (
            <>
              <span className="now-playing-label">Now Playing</span>
              <span className="now-playing-set">#{set.number}</span>
              <span className="now-playing-genre">{set.genre}</span>
            </>
          ) : null;
        })() : (
          <span className="now-playing-empty">Click a chord set to start playing</span>
        )}
      </div>

      <div className="results-info">
        Showing {filteredChordSets.length} of {data.chordSets.length} chord sets
      </div>

      <div
        className={`chord-sets-grid ${
          filteredChordSets.length === 1 ? "single-item" : ""
        }`}
      >
        {filteredChordSets.map((set) => (
          <ChordSetCard
            key={set.number}
            chordSet={set}
            isSelected={selectedCard === set.number}
            onSelect={() => setSelectedCard(
              selectedCard === set.number ? null : set.number
            )}
            midiOutput={midiOutputRef}
            outputChannel={outputChannel}
            midiActiveKeyIndex={
              selectedCard === set.number ? midiActiveKeyIndex : null
            }
            totalTranspose={totalTranspose}
          />
        ))}
      </div>

      {filteredChordSets.length === 0 && (
        <div className="no-results">
          <p>No chord sets found matching your criteria.</p>
        </div>
      )}

      <footer className="app-footer">
        <p>
          <a
            href="https://github.com/stonefruit/j6"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            View on GitHub
          </a>
          {" · "}
          <a
            href="https://github.com/stonefruit/j6/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            Report Issues
          </a>
        </p>
      </footer>
    </div>
  );
}

interface ChordSetCardProps {
  chordSet: ChordSet;
  isSelected: boolean;
  onSelect: () => void;
  midiOutput: React.RefObject<MIDIOutput | null>;
  outputChannel: number;
  midiActiveKeyIndex: number | null;
  totalTranspose: number;
}

function ChordSetCard({
  chordSet,
  isSelected,
  onSelect,
  midiOutput,
  outputChannel,
  midiActiveKeyIndex,
  totalTranspose,
}: ChordSetCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [kbActiveKeyIndex, setKbActiveKeyIndex] = useState<number | null>(null);
  const activeNotesRef = useRef<Map<number, string[]>>(new Map());
  const outputChannelRef = useRef(outputChannel);
  const totalTransposeRef = useRef(totalTranspose);
  useEffect(() => { outputChannelRef.current = outputChannel; }, [outputChannel]);
  useEffect(() => { totalTransposeRef.current = totalTranspose; }, [totalTranspose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;
      const index = KEY_MAP[e.key];
      if (index === undefined) return;

      const chord = chordSet.chords[index];
      if (!chord) return;

      if (midiOutput.current) {
        sendNoteOn(midiOutput.current, chord.notes, 100, outputChannelRef.current, totalTransposeRef.current);
      }
      activeNotesRef.current.set(index, chord.notes);
      setKbActiveKeyIndex(index);
    },
    [chordSet.chords, midiOutput]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const index = KEY_MAP[e.key];
      if (index === undefined) return;

      const notes = activeNotesRef.current.get(index);
      if (notes && midiOutput.current) {
        sendNoteOff(midiOutput.current, notes, outputChannelRef.current, totalTransposeRef.current);
      }
      activeNotesRef.current.delete(index);

      setKbActiveKeyIndex((prev) =>
        prev === index
          ? activeNotesRef.current.size > 0
            ? [...activeNotesRef.current.keys()].pop()!
            : null
          : prev
      );
    },
    [midiOutput]
  );

  useEffect(() => {
    if (!isSelected) return;
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      activeNotesRef.current.forEach((notes) => {
        if (midiOutput.current) {
          sendNoteOff(midiOutput.current, notes, outputChannelRef.current, totalTransposeRef.current);
        }
      });
      activeNotesRef.current.clear();
      setKbActiveKeyIndex(null);
    };
  }, [isSelected, handleKeyDown, handleKeyUp, midiOutput]);

  // Merge keyboard and MIDI input active key (either can light up the key)
  const activeKeyIndex = kbActiveKeyIndex ?? midiActiveKeyIndex;


  return (
    <div
      className={`chord-set-card${isSelected ? " selected" : ""}`}
      onClick={onSelect}
    >
      <div className="card-header">
        <div className="card-title">
          <span className="set-number">#{chordSet.number}</span>
          <span className="genre-badge">{chordSet.genre}</span>
        </div>
      </div>

      <ChordPreviewKeyboard
        chords={chordSet.chords}
        activeKeyIndex={activeKeyIndex}
      />

      <button
        className="details-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(!showDetails);
        }}
      >
        {showDetails ? "Hide Details" : "Show Details"}
      </button>

      {showDetails && (
        <div className="card-content" onClick={(e) => e.stopPropagation()}>
          <div className="chords-list">
            {chordSet.chords.map((chord, idx) => (
              <div key={idx} className="chord-item">
                <div className="chord-item-top">
                  <div className="chord-info">
                    <div className="chord-header">
                      {chord.key && (
                        <span className="chord-key">{chord.key}</span>
                      )}
                      <span className="chord-name">{chord.name}</span>
                    </div>
                    <div className="chord-notes">
                      {[...chord.notes].reverse().join(" - ")}
                    </div>
                  </div>
                  <TriggerKey noteIndex={idx} />
                </div>
                <Keyboard notes={chord.notes} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
