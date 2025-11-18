export interface Chord {
  key?: string;
  name: string;
  notes: string[];
}

export interface ChordSet {
  number: number;
  genre: string;
  chords: Chord[];
}

export interface ChordData {
  chordSets: ChordSet[];
}
