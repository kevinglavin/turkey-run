// Farmyard radio, Grand Theft Auto style: a few stations of music generated live
// with Web Audio (no music files), static between stations, and a DJ who chats
// between songs. The DJ can talk out loud using the device's built-in voice.

export interface Station {
  id: string;
  name: string;
  freq: string;
  tagline: string;
  bpm: number;
  swing: number; // 0 = straight, 0.33 = shuffle
  root: number; // MIDI note of the key
  scale: number[];
  chords: number[][]; // scale degrees per bar
  lead: OscillatorType;
  bass: OscillatorType;
  pluck: boolean; // short banjo-like notes
  beat: 'boomchick' | 'lofi' | 'synth' | 'waltz';
  beatsPerBar: number;
  djLines: string[];
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const PENT = [0, 2, 4, 7, 9];

// Shared jokes and fake adverts, mixed into every station.
const ADS = [
  "This hour is brought to you by Ranger's Nap Mattresses. Tested for fourteen hours a day by a professional.",
  'Sloth Express Delivery. We will get there. Eventually.',
  "Wallace's Wee Incident Insurance. Because they started it.",
  'Donkey Kick Self Defence. First lesson free. Second lesson, you will not need.',
  'Longhorn Removals. If it is in the way, it will not be for long.',
  'Penny Biscuits. Now with extra biscuit.',
  'Turkey lawyers are standing by. Dave says he was framed.',
];

export const STATIONS: Station[] = [
  {
    id: 'gobble', name: 'Gobble FM', freq: '98.6', tagline: 'Country and bluegrass for the barnyard',
    bpm: 128, swing: 0, root: 55, scale: MAJOR, chords: [[0], [3], [4], [0]], lead: 'triangle', bass: 'triangle',
    pluck: true, beat: 'boomchick', beatsPerBar: 4,
    djLines: [
      "Howdy, farm folk! You are listening to Gobble FM. That was 'Stand By Your Pan'.",
      "Coming up: Kevin's request, 'I Walk The Fence Line'.",
      'Traffic update: a longhorn is blocking the east paddock. Plan your waddle accordingly.',
      "Weather: sunny, with a high chance of pumpkins.",
    ],
  },
  {
    id: 'lofi', name: 'Radio Free Farmyard', freq: '88.1', tagline: 'Lo-fi beats to nap like Ranger to',
    bpm: 78, swing: 0.3, root: 50, scale: MINOR, chords: [[0], [5], [2], [6]], lead: 'sine', bass: 'sine',
    pluck: false, beat: 'lofi', beatsPerBar: 4,
    djLines: [
      'Radio Free Farmyard. Ranger has been listening for six hours. He has not moved.',
      'Breathe in. Breathe out. Ignore the turkeys. They cannot hurt you. Probably.',
      'This next one goes out to the sloth, who called in to request it last Tuesday.',
    ],
  },
  {
    id: 'synth', name: 'Turkey Trot 80s', freq: '104.5', tagline: 'Neon gobbles from the decade of big hair',
    bpm: 112, swing: 0, root: 45, scale: MINOR, chords: [[0], [5], [3], [4]], lead: 'sawtooth', bass: 'sawtooth',
    pluck: false, beat: 'synth', beatsPerBar: 4,
    djLines: [
      "You're locked into Turkey Trot 80s! That was 'Don't You Forget About Feed'.",
      "Up next, the power ballad 'Total Eclipse of the Barn'.",
      'Dave called in. He says the crown is real gold. It is not.',
    ],
  },
  {
    id: 'classical', name: 'Classic Cluck', freq: '91.3', tagline: 'Fine music for the discerning bird',
    bpm: 140, swing: 0, root: 60, scale: MAJOR, chords: [[0], [4], [4], [0], [3], [0], [4], [0]], lead: 'sine', bass: 'triangle',
    pluck: false, beat: 'waltz', beatsPerBar: 3,
    djLines: [
      "Good evening. You are listening to Classic Cluck. That was Vivaldi's 'Four Seasonings'.",
      "Next, Tchaikovsky's 'Swan Lake', performed entirely by turkeys. Reviews were mixed.",
      'A reminder that the pumpkin is not a musical instrument. Please stop firing it at the orchestra.',
    ],
  },
];

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

class Radio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private stepIndex = 0;
  private melodyNote = 0;
  private songStartedAt = 0;
  private listeners = new Set<() => void>();

  on = false;
  stationIndex = 0;
  voice = true;
  nowPlaying = '';
  djText = '';

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
  private emit() { this.listeners.forEach(f => f()); }

  get station() { return STATIONS[this.stationIndex]; }

  private ensure() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.gain.value = 1;
      this.music.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // Must be called from a tap so phones allow the sound.
  toggle() {
    if (this.on) this.stop(); else this.start();
  }

  start() {
    const ctx = this.ensure();
    if (!ctx) return;
    this.on = true;
    this.tuneStatic();
    this.beginSong();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), 25);
    this.dj(`${this.station.freq}, ${this.station.name}. ${this.station.tagline}.`);
    this.emit();
  }

  stop() {
    this.on = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    window.speechSynthesis?.cancel();
    this.djText = '';
    this.emit();
  }

  next(dir = 1) {
    this.stationIndex = (this.stationIndex + dir + STATIONS.length) % STATIONS.length;
    if (this.on) {
      window.speechSynthesis?.cancel();
      this.tuneStatic();
      this.beginSong();
      this.dj(`${this.station.freq}, ${this.station.name}. ${this.station.tagline}.`);
    }
    this.emit();
  }

  setVoice(on: boolean) {
    this.voice = on;
    if (!on) window.speechSynthesis?.cancel();
    this.emit();
  }

  private beginSong() {
    const ctx = this.ctx!;
    this.nextNoteTime = ctx.currentTime + 0.35;
    this.stepIndex = 0;
    this.melodyNote = 0;
    this.songStartedAt = ctx.currentTime;
    const titles = ['Barn Again', 'Hay Is For Horses', 'Pumpkin Spice Mayhem', 'Wee Incident', 'They Started It', 'Sloth Motion', 'Fence Post Blues', 'Gobble Til Dawn'];
    this.nowPlaying = titles[Math.floor(Math.random() * titles.length)];
    this.emit();
  }

  // White noise sweep, like turning the dial.
  private tuneStatic() {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * 0.35);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(400, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.3);
    const g = ctx.createGain();
    g.gain.value = 0.25;
    src.connect(bp); bp.connect(g); g.connect(this.master!);
    src.start();
  }

  private note(freq: number, at: number, dur: number, type: OscillatorType, vol: number, pluck = false) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    const peak = vol;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + (pluck ? Math.min(dur, 0.25) : dur));
    let out: AudioNode = g;
    if (type === 'sawtooth' || type === 'square') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1800;
      g.connect(lp);
      out = lp;
    }
    osc.connect(g);
    out.connect(this.music!);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  private drum(kind: 'kick' | 'snare' | 'hat', at: number, vol = 1) {
    const ctx = this.ctx!;
    if (kind === 'kick') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(140, at);
      osc.frequency.exponentialRampToValueAtTime(45, at + 0.15);
      g.gain.setValueAtTime(0.5 * vol, at);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.2);
      osc.connect(g); g.connect(this.music!);
      osc.start(at); osc.stop(at + 0.25);
      return;
    }
    const len = Math.floor(ctx.sampleRate * (kind === 'hat' ? 0.05 : 0.15));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = kind === 'hat' ? 'highpass' : 'bandpass';
    f.frequency.value = kind === 'hat' ? 7000 : 1800;
    const g = ctx.createGain();
    g.gain.value = (kind === 'hat' ? 0.08 : 0.22) * vol;
    src.connect(f); f.connect(g); g.connect(this.music!);
    src.start(at);
  }

  // Look-ahead scheduler: queue the next ~0.12 s of eighth notes.
  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.on) return;
    const st = this.station;
    const eighth = 60 / st.bpm / 2;
    const stepsPerBar = st.beatsPerBar * 2;
    while (this.nextNoteTime < ctx.currentTime + 0.12) {
      const i = this.stepIndex;
      const bar = Math.floor(i / stepsPerBar);
      const pos = i % stepsPerBar;
      const swingDelay = pos % 2 === 1 ? st.swing * eighth : 0;
      const t = this.nextNoteTime + swingDelay;
      const degree = st.chords[bar % st.chords.length][0];
      const chordRoot = st.root + st.scale[degree % st.scale.length] + (degree >= st.scale.length ? 12 : 0);
      const third = st.root + st.scale[(degree + 2) % st.scale.length] + (degree + 2 >= st.scale.length ? 12 : 0);
      const fifth = st.root + st.scale[(degree + 4) % st.scale.length] + (degree + 4 >= st.scale.length ? 12 : 0);

      // Drums
      if (st.beat === 'boomchick') {
        if (pos % 4 === 0) this.drum('kick', t);
        if (pos % 4 === 2) this.drum('snare', t, 0.7);
        this.drum('hat', t, 0.6);
      } else if (st.beat === 'lofi') {
        if (pos === 0 || pos === 5) this.drum('kick', t, 0.8);
        if (pos === 2 || pos === 6) this.drum('snare', t, 0.5);
        if (pos % 2 === 0) this.drum('hat', t, 0.5);
      } else if (st.beat === 'synth') {
        if (pos % 2 === 0) this.drum('kick', t, 0.8);
        if (pos === 2 || pos === 6) this.drum('snare', t);
        this.drum('hat', t, 0.7);
      } else if (st.beat === 'waltz') {
        if (pos === 0) this.drum('kick', t, 0.4);
      }

      // Bass
      if (st.beat === 'boomchick') {
        if (pos % 4 === 0) this.note(midi(chordRoot - 24), t, eighth * 1.5, st.bass, 0.22);
        if (pos % 4 === 2) this.note(midi(fifth - 24), t, eighth * 1.5, st.bass, 0.18);
      } else if (st.beat === 'synth') {
        this.note(midi(chordRoot - 24 + (pos % 2 ? 12 : 0)), t, eighth * 0.9, st.bass, 0.12);
      } else if (pos === 0) {
        this.note(midi(chordRoot - 24), t, eighth * stepsPerBar * 0.9, st.bass, 0.2);
      }

      // Chords
      if (st.beat === 'waltz' && pos % 2 === 0 && pos > 0) {
        for (const n of [third, fifth]) this.note(midi(n), t, eighth * 1.6, 'triangle', 0.05);
      } else if ((st.beat === 'lofi' || st.beat === 'synth') && pos === 0) {
        for (const n of [chordRoot, third, fifth]) this.note(midi(n), t, eighth * stepsPerBar, st.beat === 'synth' ? 'square' : 'triangle', 0.035);
      } else if (st.beat === 'boomchick' && pos % 2 === 1) {
        for (const n of [third, fifth]) this.note(midi(n + 12), t, eighth * 0.6, 'triangle', 0.04, true);
      }

      // Melody: a wandering line that leans toward chord tones.
      const play = st.pluck ? true : st.beat === 'lofi' ? pos % 2 === 0 && Math.random() < 0.6 : Math.random() < 0.75;
      if (play) {
        this.melodyNote += Math.floor(Math.random() * 5) - 2;
        this.melodyNote = Math.max(0, Math.min(9, this.melodyNote));
        const scale = st.pluck ? PENT : st.scale;
        const n = st.root + 12 + scale[this.melodyNote % scale.length] + 12 * Math.floor(this.melodyNote / scale.length);
        const dur = st.pluck ? eighth : eighth * (Math.random() < 0.3 ? 2 : 1);
        this.note(midi(n), t, dur, st.lead, st.lead === 'sawtooth' ? 0.05 : 0.08, st.pluck);
      }

      this.nextNoteTime += eighth;
      this.stepIndex++;
    }

    // Every ~40 seconds, the DJ chats and a new song starts.
    if (ctx.currentTime - this.songStartedAt > 40) {
      const pool = Math.random() < 0.45 ? ADS : st.djLines;
      this.dj(pool[Math.floor(Math.random() * pool.length)]);
      this.beginSong();
    }
  }

  private dj(text: string) {
    this.djText = text;
    this.emit();
    const shown = text;
    setTimeout(() => { if (this.djText === shown) { this.djText = ''; this.emit(); } }, 7000);
    const synth = window.speechSynthesis;
    if (!this.voice || !synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // Prefer a British or Scottish voice if the device has one.
    const voices = synth.getVoices();
    u.voice = voices.find(v => /en-GB|Scot/i.test(v.lang + v.name)) ?? voices.find(v => v.lang.startsWith('en')) ?? null;
    u.rate = 1.05;
    u.pitch = 1;
    // Turn the music down while the DJ talks.
    const g = this.music!.gain;
    const now = this.ctx!.currentTime;
    g.setTargetAtTime(0.35, now, 0.2);
    u.onend = () => g.setTargetAtTime(1, this.ctx!.currentTime, 0.3);
    u.onerror = () => g.setTargetAtTime(1, this.ctx!.currentTime, 0.3);
    synth.speak(u);
  }
}

export const radio = new Radio();
