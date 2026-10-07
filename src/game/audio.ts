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

export const sfx = {
  treat: (combo: number) => tone('sine', 600 + combo * 120, 1200 + combo * 160, 0.12, 0.12),
  bark: () => { tone('square', 180, 110, 0.12, 0.12); },
  gobble: () => {
    for (let i = 0; i < 4; i++) tone('sawtooth', 420 - i * 30, 260, 0.07, 0.07, i * 0.07);
  },
  ouch: () => tone('triangle', 500, 120, 0.35, 0.2),
  shoo: () => { tone('square', 220, 160, 0.08, 0.1); tone('square', 220, 160, 0.08, 0.1, 0.1); },
  tag: () => tone('sine', 900, 300, 0.2, 0.15),
  puff: () => tone('sawtooth', 120, 60, 0.5, 0.12),
  power: () => { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.12, 0.12, i * 0.08)); },
  bucket: () => tone('triangle', 880, 880, 0.15, 0.1),
  win: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone('triangle', f, f, 0.18, 0.14, i * 0.12)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, f * 0.98, 0.25, 0.14, i * 0.2)); },
};
