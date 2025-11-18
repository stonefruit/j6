import { useState, useMemo } from "react";
import chordData from "../../j6-chords.json";
import type { ChordData, ChordSet } from "../types";
import Keyboard from "./Keyboard";
import TriggerKey from "./TriggerKey";
import ChordPreviewKeyboard from "./ChordPreviewKeyboard";
import "./ChordSets.css";

const data: ChordData = chordData as ChordData;

export default function ChordSets() {
  const [searchNumber, setSearchNumber] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");

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

  const clearFilters = () => {
    setSearchNumber("");
    setSelectedGenre("");
  };

  return (
    <div className="chord-sets-container">
      <header className="app-header">
        <h1>J-6 Chord Sets</h1>
        <p className="subtitle">Browse and explore Roland J-6 chord sets</p>
        <div className="header-info">
          <span className="info-icon" title="Data accuracy disclaimer">
            ℹ️
          </span>
          <span className="info-text">
            Chord data may not be 100% accurate. Found an error?{" "}
            <a
              href="https://github.com/stonefruit/j6/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="issue-link"
            >
              Report it on GitHub
            </a>
          </span>
        </div>
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
          <ChordSetCard key={set.number} chordSet={set} />
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

function ChordSetCard({ chordSet }: { chordSet: ChordSet }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="chord-set-card">
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <div className="card-title">
          <span className="set-number">#{chordSet.number}</span>
          <span className="genre-badge">{chordSet.genre}</span>
        </div>
        <button
          className="expand-btn"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {expanded && <ChordPreviewKeyboard chords={chordSet.chords} />}

      {expanded && (
        <div className="card-content">
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
