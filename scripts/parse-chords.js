import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = process.argv[2] || "/tmp/j6-chords-page.html";
const outputPath = resolve(__dirname, "..", "j6-chords.json");

const html = readFileSync(inputPath, "utf-8");

// Extract <tbody> content
const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
if (!tbodyMatch) {
  console.error("Could not find <tbody> in HTML");
  process.exit(1);
}

// Extract all <tr> rows
const rows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(
  (m) => m[1]
);

// Skip first 2 header rows
const dataRows = rows.slice(2);

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    .replace(/\u00a0/g, " ");
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "");
}

function cleanGenre(thContent) {
  return decodeEntities(stripTags(thContent)).trim();
}

function cleanChordName(tdContent) {
  const text = decodeEntities(stripTags(tdContent)).trim();
  return text;
}

function extractNotes(tdContent) {
  const matches = [...tdContent.matchAll(/<p>([^<]+)<\/p>/g)];
  return matches
    .map((m) => m[1].trim())
    .filter((n) => /^[A-G][#b]?\d+$/.test(n));
}

const chordSets = [];

for (let i = 0; i < dataRows.length; i += 2) {
  const nameRow = dataRows[i];
  const noteRow = dataRows[i + 1];

  if (!noteRow) {
    console.error(`Missing note row at pair index ${i}`);
    break;
  }

  // Extract <th> cells for number and genre
  const thCells = [...nameRow.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)];
  if (thCells.length < 2) {
    console.error(`Expected 2 <th> cells at row pair ${i}, got ${thCells.length}`);
    continue;
  }

  const number = parseInt(stripTags(thCells[0][1]).trim(), 10);
  const genre = cleanGenre(thCells[1][1]);

  if (isNaN(number)) {
    console.error(`Could not parse set number at row pair ${i}`);
    continue;
  }

  // Extract <td> cells from name row for chord names
  const nameTds = [...nameRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
  const chordNames = nameTds.map((m) => cleanChordName(m[1]));

  // Extract <td> cells from note row for notes
  const noteTds = [...noteRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
  const noteArrays = noteTds.map((m) => extractNotes(m[1]));

  if (chordNames.length !== 12) {
    console.error(`Set ${number}: expected 12 chord names, got ${chordNames.length}`);
    continue;
  }
  if (noteArrays.length !== 12) {
    console.error(`Set ${number}: expected 12 note arrays, got ${noteArrays.length}`);
    continue;
  }

  const chords = KEYS.map((key, idx) => ({
    key,
    name: chordNames[idx],
    notes: noteArrays[idx],
  }));

  chordSets.push({ number, genre, chords });
}

// --- Validation ---
let errors = 0;

if (chordSets.length !== 100) {
  console.error(`VALIDATION FAILED: Expected 100 chord sets, got ${chordSets.length}`);
  errors++;
}

for (const cs of chordSets) {
  if (cs.chords.length !== 12) {
    console.error(`Set ${cs.number}: expected 12 chords, got ${cs.chords.length}`);
    errors++;
  }
  for (const chord of cs.chords) {
    if (!KEYS.includes(chord.key)) {
      console.error(`Set ${cs.number}: invalid key "${chord.key}"`);
      errors++;
    }
    if (chord.notes.length < 2 || chord.notes.length > 4) {
      console.error(
        `Set ${cs.number}, key ${chord.key}: unexpected note count ${chord.notes.length} (notes: ${chord.notes})`
      );
      errors++;
    }
    for (const note of chord.notes) {
      if (!/^[A-G][#b]?\d+$/.test(note)) {
        console.error(`Set ${cs.number}, key ${chord.key}: invalid note "${note}"`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} validation error(s) found.`);
  process.exit(1);
}

// --- Output ---
const output = { chordSets };
writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
console.log(`Wrote ${chordSets.length} chord sets to ${outputPath}`);
console.log(`Total chords: ${chordSets.length * 12}`);
console.log(`All chords have key field populated.`);

// Summary stats
const noteCounts = {};
for (const cs of chordSets) {
  for (const c of cs.chords) {
    noteCounts[c.notes.length] = (noteCounts[c.notes.length] || 0) + 1;
  }
}
console.log(`Note count distribution: ${JSON.stringify(noteCounts)}`);

const genres = [...new Set(chordSets.map((cs) => cs.genre))].sort();
console.log(`Genres (${genres.length}): ${genres.join(", ")}`);
