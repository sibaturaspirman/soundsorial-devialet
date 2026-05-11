export const VOCAL_RANGES = [
  { name: 'Bass', min: 82, max: 330, description: 'E2 - E4: The lowest male voice type.', color: 'bg-blue-600' },
  { name: 'Baritone', min: 98, max: 392, description: 'G2 - G4: The most common male voice type.', color: 'bg-indigo-500' },
  { name: 'Tenor', min: 130, max: 523, description: 'C3 - C5: The highest male voice type.', color: 'bg-teal-500' },
  { name: 'Alto', min: 174, max: 698, description: 'F3 - F5: The lowest female voice type.', color: 'bg-orange-500' },
  { name: 'Soprano', min: 261, max: 1046, description: 'C4 - C6: The highest female voice type.', color: 'bg-rose-500' },
];

export function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  // Check for sufficient signal
  let rms = 0;
  for (let i = 0; i < buf.length; i++) {
    let val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.01) return -1; // Silence or very low volume

  // Find a range in the buffer where the values are below a given threshold.
  let r1 = 0,
    r2 = buf.length - 1,
    thres = 0.2;
  for (let i = 0; i < buf.length / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < buf.length / 2; i++) {
    if (Math.abs(buf[buf.length - i]) < thres) {
      r2 = buf.length - i;
      break;
    }
  }

  buf = buf.slice(r1, r2);
  let c = new Array(buf.length).fill(0);
  for (let i = 0; i < buf.length; i++) {
    for (let j = 0; j < buf.length - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1,
    maxpos = -1;
  for (let i = d; i < buf.length; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  let x1 = c[T0 - 1],
    x2 = c[T0],
    x3 = c[T0 + 1];
  let a = (x1 + x3 - 2 * x2) / 2;
  let b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export function frequencyToNote(frequency: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75); // ~16.35 Hz

  const halfStepsBelowMiddleC = Math.round(12 * Math.log2(frequency / c0));
  const octave = Math.floor(halfStepsBelowMiddleC / 12);
  const noteIndex = halfStepsBelowMiddleC % 12;

  // Handle case where math gives a slightly negative index
  const safeIndex = (noteIndex + 12) % 12;
  return `${notes[safeIndex]}${octave}`;
}

export function classifyVocalRange(minFreq: number, maxFreq: number) {
  if (minFreq === 0 || maxFreq === 0) return VOCAL_RANGES[1]; // Default Baritone if failed

  let bestMatch = VOCAL_RANGES[0];
  let lowestScore = Infinity;

  for (const range of VOCAL_RANGES) {
    // Determine how well this range matches the recorded min/max.
    // Lower score is better.
    const minDiff = Math.abs(range.min - minFreq);
    const maxDiff = Math.abs(range.max - maxFreq);
    const score = minDiff * 1.5 + maxDiff; // Slightly more weight to bottom end of range

    if (score < lowestScore) {
      lowestScore = score;
      bestMatch = range;
    }
  }

  return bestMatch;
}
