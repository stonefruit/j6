const NOTE_NAMES: Record<string, number> = {
  C: 0, "C#": 1, Db: 1,
  D: 2, "D#": 3, Eb: 3,
  E: 4,
  F: 5, "F#": 6, Gb: 6,
  G: 7, "G#": 8, Ab: 8,
  A: 9, "A#": 10, Bb: 10,
  B: 11,
};

export function noteToMidi(noteStr: string): number | null {
  const match = noteStr.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return null;
  const semitone = NOTE_NAMES[match[1]];
  if (semitone === undefined) return null;
  const octave = parseInt(match[2], 10);
  return (octave + 1) * 12 + semitone;
}

export interface MidiOutputInfo {
  id: string;
  name: string;
}

export function getOutputs(access: MIDIAccess): MidiOutputInfo[] {
  const outputs: MidiOutputInfo[] = [];
  access.outputs.forEach((output) => {
    outputs.push({ id: output.id, name: output.name || output.id });
  });
  return outputs;
}

export function sendNoteOn(
  output: MIDIOutput,
  notes: string[],
  velocity = 100
): void {
  for (const note of notes) {
    const midi = noteToMidi(note);
    if (midi !== null) {
      output.send([0x90, midi, velocity]);
    }
  }
}

export function sendNoteOff(output: MIDIOutput, notes: string[]): void {
  for (const note of notes) {
    const midi = noteToMidi(note);
    if (midi !== null) {
      output.send([0x80, midi, 0x40]);
    }
  }
}
