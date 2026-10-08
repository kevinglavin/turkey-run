import { create } from 'zustand';
import type { AmmoType, Phase } from './engine';
import { LEVELS } from './levels';

export type Screen = 'title' | 'levels' | 'play';

export interface Result { won: boolean; score: number; stars: number; newBest: boolean }

const KEY = 'angryTurkeys_progress';
type Progress = Record<number, { stars: number; best: number }>;

const load = (): Progress => {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
};
const save = (p: Progress) => {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage blocked */ }
};
const readSound = () => {
  try { return localStorage.getItem('angryTurkeys_sound') !== 'off'; } catch { return true; }
};

const isTouch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

interface State {
  screen: Screen;
  levelIndex: number;
  attempt: number; // bumps on every (re)start so the scene rebuilds
  progress: Progress;
  // HUD, mirrored from the engine
  score: number;
  ammo: AmmoType[];
  phase: Phase;
  ready: boolean;
  turkeysLeft: number;
  helperUsed: boolean;
  pawUsed: boolean;
  result: Result | null;
  sound: boolean;
  lowGraphics: boolean;

  goTitle: () => void;
  goLevels: () => void;
  play: (index: number) => void;
  restart: () => void;
  next: () => void;
  finish: (won: boolean, score: number, stars: number) => void;
  sync: (h: Partial<Pick<State, 'score' | 'ammo' | 'phase' | 'ready' | 'turkeysLeft' | 'helperUsed' | 'pawUsed'>>) => void;
  toggleSound: () => void;
  toggleGraphics: () => void;
}

export const useStore = create<State>((set, get) => ({
  screen: 'title',
  levelIndex: 0,
  attempt: 0,
  progress: load(),
  score: 0,
  ammo: [],
  phase: 'aiming',
  ready: false,
  turkeysLeft: 0,
  helperUsed: false,
  pawUsed: false,
  result: null,
  sound: readSound(),
  // Phones start without shadows; the WebGL view stays light on mobile GPUs.
  lowGraphics: isTouch,

  goTitle: () => set({ screen: 'title', result: null }),
  goLevels: () => set({ screen: 'levels', result: null }),
  play: (index) => set(s => ({ screen: 'play', levelIndex: index, attempt: s.attempt + 1, result: null, score: 0 })),
  restart: () => set(s => ({ attempt: s.attempt + 1, result: null, score: 0 })),
  next: () => {
    const i = get().levelIndex + 1;
    if (i < LEVELS.length) get().play(i); else set({ screen: 'levels', result: null });
  },
  finish: (won, score, stars) => {
    const id = LEVELS[get().levelIndex].id;
    const progress = { ...get().progress };
    const prev = progress[id];
    const newBest = won && (!prev || score > prev.best);
    if (won) progress[id] = { stars: Math.max(stars, prev?.stars ?? 0), best: Math.max(score, prev?.best ?? 0) };
    save(progress);
    set({ progress, result: { won, score, stars, newBest } });
  },
  sync: (h) => {
    const s = get();
    const changed = (Object.keys(h) as (keyof typeof h)[]).some(k => {
      const a = h[k], b = s[k];
      return Array.isArray(a) && Array.isArray(b) ? a.join() !== b.join() : a !== b;
    });
    if (changed) set(h);
  },
  toggleSound: () => {
    const sound = !get().sound;
    try { localStorage.setItem('angryTurkeys_sound', sound ? 'on' : 'off'); } catch { /* ignore */ }
    set({ sound });
  },
  toggleGraphics: () => set(s => ({ lowGraphics: !s.lowGraphics })),
}));

// A level is unlocked once the previous one has been beaten.
export const isUnlocked = (progress: Progress, index: number) => index === 0 || !!progress[LEVELS[index - 1].id];
