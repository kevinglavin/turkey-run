// Farmyard radio, Grand Theft Auto style. Each station plays real recordings
// (Kevin MacLeod, incompetech.com, CC BY 4.0; see public/radio/CREDITS.txt),
// tuning in drops you partway into a song, the dial hisses with static, and a DJ
// chats between songs, out loud if the device has a speech voice.

export interface Track { title: string; file: string }

export interface Station {
  id: string;
  name: string;
  freq: string;
  tagline: string;
  tracks: Track[];
  djLines: string[];
}

export const MUSIC_CREDIT = 'Music by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution 4.0';

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

const t = (title: string, file: string): Track => ({ title, file: `/radio/${file}.mp3` });

export const STATIONS: Station[] = [
  {
    id: 'gobble', name: 'Gobble FM', freq: '98.6', tagline: 'Country and bluegrass for the barnyard',
    tracks: [t('Hillbilly Swing', 'hillbilly-swing'), t('Bama Country', 'bama-country'), t('Guts and Bourbon', 'guts-and-bourbon'), t('Corncob', 'corncob')],
    djLines: [
      'Howdy, farm folk! You are listening to Gobble FM, where every song is about a truck, a dog, or a turkey that did you wrong.',
      'Traffic update: a longhorn is blocking the east paddock. Plan your waddle accordingly.',
      'Weather: sunny, with a high chance of pumpkins.',
      "That one goes out to Kevin the turkey, who requested it, then pecked the phone.",
    ],
  },
  {
    id: 'synth', name: 'Turkey Trot 80s', freq: '104.5', tagline: 'Neon gobbles from the decade of big hair',
    tracks: [t('Eighties Action', 'eighties-action'), t('Newer Wave', 'newer-wave'), t('Voltaic', 'voltaic'), t('Nowhere Land', 'nowhere-land')],
    djLines: [
      "You're locked into Turkey Trot 80s! Coming up, the power ballad 'Total Eclipse of the Barn'.",
      'Dave called in. He says the crown is real gold. It is not.',
      'Big hair, big shoulder pads, big trouble in the turkey pen. Turkey Trot 80s.',
    ],
  },
  {
    id: 'chill', name: 'Radio Free Farmyard', freq: '88.1', tagline: 'Easy listening to nap like Ranger to',
    tracks: [t('Cattails', 'cattails'), t('Anamalie', 'anamalie')],
    djLines: [
      'Radio Free Farmyard. Ranger has been listening for six hours. He has not moved.',
      'Breathe in. Breathe out. Ignore the turkeys. They cannot hurt you. Probably.',
      'This next one goes out to the sloth, who called in to request it last Tuesday.',
    ],
  },
];

class Radio {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private listeners = new Set<() => void>();
  private trackIndex = new Map<string, number>();
  private volume = 0.8;

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

  private ensureAudio() {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.audio.volume = this.volume;
      this.audio.addEventListener('ended', () => this.songEnded());
    }
    return this.audio;
  }

  // Call from a tap so phones allow playback.
  toggle() {
    if (this.on) this.stop(); else this.start();
  }

  start() {
    this.on = true;
    this.tuneStatic();
    this.playCurrent(true);
    this.dj(`${this.station.freq}, ${this.station.name}. ${this.station.tagline}.`);
    this.emit();
  }

  stop() {
    this.on = false;
    this.audio?.pause();
    window.speechSynthesis?.cancel();
    this.djText = '';
    this.emit();
  }

  next(dir = 1) {
    this.stationIndex = (this.stationIndex + dir + STATIONS.length) % STATIONS.length;
    if (this.on) {
      window.speechSynthesis?.cancel();
      this.tuneStatic();
      this.playCurrent(true);
      this.dj(`${this.station.freq}, ${this.station.name}.`);
    }
    this.emit();
  }

  setVoice(on: boolean) {
    this.voice = on;
    if (!on) { window.speechSynthesis?.cancel(); this.duck(false); }
    this.emit();
  }

  // Play the station's current song. Tuning in joins it partway through, like real radio.
  private playCurrent(midSong: boolean) {
    const st = this.station;
    const i = this.trackIndex.get(st.id) ?? Math.floor(Math.random() * st.tracks.length);
    this.trackIndex.set(st.id, i);
    const track = st.tracks[i];
    const a = this.ensureAudio();
    a.src = track.file;
    this.nowPlaying = track.title;
    if (midSong) {
      a.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(a.duration)) a.currentTime = a.duration * (0.1 + Math.random() * 0.5);
      }, { once: true });
    }
    a.play().catch(() => { /* blocked until the next tap; the dial stays on */ });
    this.emit();
  }

  private songEnded() {
    if (!this.on) return;
    const st = this.station;
    this.trackIndex.set(st.id, ((this.trackIndex.get(st.id) ?? 0) + 1) % st.tracks.length);
    const pool = Math.random() < 0.45 ? ADS : st.djLines;
    this.dj(pool[Math.floor(Math.random() * pool.length)]);
    // Let the DJ get a few words in before the next song.
    setTimeout(() => { if (this.on && this.station === st) this.playCurrent(false); }, 1500);
  }

  // A short burst of hiss, like turning the dial.
  private tuneStatic() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const len = Math.floor(ctx.sampleRate * 0.4);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(400, ctx.currentTime);
      bp.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.35);
      const g = ctx.createGain();
      g.gain.value = 0.2;
      src.connect(bp); bp.connect(g); g.connect(ctx.destination);
      src.start();
    } catch { /* no Web Audio: skip the hiss */ }
  }

  private duck(on: boolean) {
    if (this.audio) this.audio.volume = on ? this.volume * 0.3 : this.volume;
  }

  private dj(text: string) {
    this.djText = text;
    this.emit();
    setTimeout(() => { if (this.djText === text) { this.djText = ''; this.emit(); } }, 8000);
    const synth = window.speechSynthesis;
    if (!this.voice || !synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // Prefer a British or Scottish voice if the device has one.
    const voices = synth.getVoices();
    u.voice = voices.find(v => /en-GB|Scot/i.test(v.lang + v.name)) ?? voices.find(v => v.lang.startsWith('en')) ?? null;
    u.rate = 1.05;
    // Turn the music down while the DJ talks.
    this.duck(true);
    u.onend = () => this.duck(false);
    u.onerror = () => this.duck(false);
    synth.speak(u);
  }
}

export const radio = new Radio();
