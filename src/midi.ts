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

export interface MidiPortInfo {
  id: string;
  name: string;
}

export function getOutputs(access: MIDIAccess): MidiPortInfo[] {
  const outputs: MidiPortInfo[] = [];
  access.outputs.forEach((output) => {
    outputs.push({ id: output.id, name: output.name || output.id });
  });
  return outputs;
}

export function getInputs(access: MIDIAccess): MidiPortInfo[] {
  const inputs: MidiPortInfo[] = [];
  access.inputs.forEach((input) => {
    inputs.push({ id: input.id, name: input.name || input.id });
  });
  return inputs;
}

/** channel: 0-15 (0 = MIDI channel 1) */
export function sendNoteOn(
  output: MIDIOutput,
  notes: string[],
  velocity = 100,
  channel = 0
): void {
  const status = 0x90 + channel;
  for (const note of notes) {
    const midi = noteToMidi(note);
    if (midi !== null) {
      output.send([status, midi, velocity]);
    }
  }
}

/** channel: 0-15 (0 = MIDI channel 1) */
export function sendNoteOff(
  output: MIDIOutput,
  notes: string[],
  channel = 0
): void {
  const status = 0x80 + channel;
  for (const note of notes) {
    const midi = noteToMidi(note);
    if (midi !== null) {
      output.send([status, midi, 0x40]);
    }
  }
}

export interface MidiNoteEvent {
  type: "noteon" | "noteoff";
  note: number;
  velocity: number;
  channel: number;
}

export function parseMidiMessage(data: Uint8Array): MidiNoteEvent | null {
  if (data.length < 3) return null;
  const status = data[0];
  const command = status & 0xf0;
  const channel = status & 0x0f;
  const note = data[1];
  const velocity = data[2];

  if (command === 0x90 && velocity > 0) {
    return { type: "noteon", note, velocity, channel };
  }
  if (command === 0x80 || (command === 0x90 && velocity === 0)) {
    return { type: "noteoff", note, velocity: 0, channel };
  }
  return null;
}
