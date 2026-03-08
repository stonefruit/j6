import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import chordData from "../../j6-chords.json";
import type { ChordData, ChordSet } from "../types";
import { getOutputs, sendNoteOn, sendNoteOff } from "../midi";
import type { MidiOutputInfo } from "../midi";
import Keyboard from "./Keyboard";
import TriggerKey from "./TriggerKey";
import ChordPreviewKeyboard from "./ChordPreviewKeyboard";
import "./ChordSets.css";

const data: ChordData = chordData as ChordData;

const KEY_MAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5,
  t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
};

export default function ChordSets() {
  const [searchNumber, setSearchNumber] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  // MIDI state
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [midiOutputs, setMidiOutputs] = useState<MidiOutputInfo[]>([]);
  const [midiOutputId, setMidiOutputId] = useState("");
  const [showMidiHelp, setShowMidiHelp] = useState(false);

  const midiOutputRef = useRef<MIDIOutput | null>(null);

  // Request MIDI access on mount
  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;
    navigator.requestMIDIAccess().then((access) => {
      setMidiAccess(access);
      setMidiOutputs(getOutputs(access));
      access.onstatechange = () => {
        setMidiOutputs(getOutputs(access));
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
          {showMidiHelp && (
            <div className="midi-help">
              <p><strong>macOS setup (IAC Driver):</strong></p>
              <ol>
                <li>Open <strong>Audio MIDI Setup</strong> (Spotlight search)</li>
                <li>Window &rarr; Show MIDI Studio</li>
                <li>Double-click <strong>IAC Driver</strong></li>
                <li>Check <strong>Device is online</strong>, click Apply</li>
                <li>Refresh this page &mdash; select IAC Driver above</li>
                <li>In Ableton, set a MIDI track input to &ldquo;IAC Driver Bus 1&rdquo;</li>
              </ol>
              <p>Click a chord set card, then use keys <kbd>a</kbd><kbd>w</kbd><kbd>s</kbd><kbd>e</kbd><kbd>d</kbd><kbd>f</kbd><kbd>t</kbd><kbd>g</kbd><kbd>y</kbd><kbd>h</kbd><kbd>u</kbd><kbd>j</kbd> to play chords.</p>
            </div>
          )}
        </div>
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
}

function ChordSetCard({ chordSet, isSelected, onSelect, midiOutput }: ChordSetCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeKeyIndex, setActiveKeyIndex] = useState<number | null>(null);
  const activeNotesRef = useRef<Map<number, string[]>>(new Map());

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;
      const index = KEY_MAP[e.key];
      if (index === undefined) return;

      const chord = chordSet.chords[index];
      if (!chord) return;

      // Send note on
      if (midiOutput.current) {
        sendNoteOn(midiOutput.current, chord.notes);
      }
      activeNotesRef.current.set(index, chord.notes);
      setActiveKeyIndex(index);
    },
    [chordSet.chords, midiOutput]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const index = KEY_MAP[e.key];
      if (index === undefined) return;

      const notes = activeNotesRef.current.get(index);
      if (notes && midiOutput.current) {
        sendNoteOff(midiOutput.current, notes);
      }
      activeNotesRef.current.delete(index);

      setActiveKeyIndex((prev) =>
        prev === index ? (activeNotesRef.current.size > 0
          ? [...activeNotesRef.current.keys()].pop()!
          : null) : prev
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
      // Send note off for any held notes
      activeNotesRef.current.forEach((notes) => {
        if (midiOutput.current) {
          sendNoteOff(midiOutput.current, notes);
        }
      });
      activeNotesRef.current.clear();
      setActiveKeyIndex(null);
    };
  }, [isSelected, handleKeyDown, handleKeyUp, midiOutput]);

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
