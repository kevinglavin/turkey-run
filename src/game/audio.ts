// Tiny synthesized sound effects, so the game needs no audio files.
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac() {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Call from a tap or click so mobile browsers allow sound.
export function unlockAudio() {
  ac();
}

function tone(type: OscillatorType, from: number, to: number, seconds: number, volume = 0.15, delay = 0) {
  if (!enabled) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + seconds);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
  osc.connect(gain);
  gain.connect(a.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

function noise(seconds: number, volume: number, freq: number, delay = 0) {
  if (!enabled) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * seconds), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq;
  const gain = a.createGain();
  gain.gain.value = volume;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(a.destination);
  src.start(t);
}

export const sfx = {
  stretch: () => tone('triangle', 200, 320, 0.15, 0.05),
  launch: () => { noise(0.25, 0.25, 1800); tone('sine', 300, 700, 0.2, 0.08); },
  thud: (strength: number) => noise(0.12, Math.min(0.35, 0.05 + strength / 120), 400),
  crack: () => { noise(0.18, 0.3, 2500); tone('square', 180, 80, 0.1, 0.06); },
  gobble: () => {
    for (let i = 0; i < 5; i++) tone('sawtooth', 460 - i * 25, 280, 0.06, 0.08, i * 0.06);
  },
  poof: () => noise(0.3, 0.2, 900),
  bark: () => { tone('square', 200, 120, 0.1, 0.14); tone('square', 220, 130, 0.1, 0.12, 0.13); },
  splash: () => noise(0.35, 0.3, 3000),
  win: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone('triangle', f, f, 0.18, 0.14, i * 0.12)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, f * 0.98, 0.25, 0.14, i * 0.2)); },
  click: () => tone('sine', 660, 880, 0.06, 0.08),
  moo: () => { tone('sawtooth', 140, 110, 0.9, 0.12); tone('sawtooth', 70, 60, 0.9, 0.08); },
  heehaw: () => { tone('sawtooth', 700, 500, 0.25, 0.1); tone('sawtooth', 300, 220, 0.35, 0.1, 0.27); tone('sawtooth', 700, 500, 0.25, 0.1, 0.65); },
  kick: () => { noise(0.2, 0.4, 600); tone('sine', 120, 50, 0.2, 0.3); },
  yawn: () => { tone('sine', 520, 180, 1.4, 0.12); tone('triangle', 260, 90, 1.4, 0.06); },
  grab: () => tone('triangle', 300, 600, 0.12, 0.1),
  // Rattle of the Red Baron's machine guns, and the engine roar as he arrives.
  gun: () => { noise(0.05, 0.22, 2200); tone('square', 120, 70, 0.04, 0.06); },
  plane: () => { tone('sawtooth', 70, 140, 1.6, 0.12); tone('sawtooth', 72, 150, 1.6, 0.08); noise(1.6, 0.12, 500); },
};
