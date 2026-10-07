import { create } from 'zustand';
import { ROUND_SECONDS, START_HEARTS } from './config';

export type Status = 'menu' | 'playing' | 'paused' | 'over';

export interface Toast { id: number; text: string; tone: 'good' | 'bad' | 'info' }

export interface RoundResult {
  won: boolean;
  score: number;
  finalScore: number;
  heartsLeft: number;
  treats: number;
  shoos: number;
  tags: number;
  escapes: number;
  caught: number;
  newBest: boolean;
}

const readBest = () => {
  try { return parseInt(localStorage.getItem('turkeyRun_best') || '0', 10) || 0; } catch { return 0; }
};
const readSound = () => {
  try { return localStorage.getItem('turkeyRun_sound') !== 'off'; } catch { return true; }
};

interface UIState {
  status: Status;
  roundId: number;
  // HUD values, synced from the simulation a few times per second.
  score: number;
  hearts: number;
  timeLeft: number;
  stamina: number;
  powerLeft: number;
  combo: number;
  escaping: string[];
  toasts: Toast[];
  wallaceSays: string | null;
  bestScore: number;
  result: RoundResult | null;
  sound: boolean;
  lowGraphics: boolean;

  start: () => void;
  pause: () => void;
  resume: () => void;
  toMenu: () => void;
  finish: (r: Omit<RoundResult, 'newBest'>) => void;
  syncHud: (h: Partial<Pick<UIState, 'score' | 'hearts' | 'timeLeft' | 'stamina' | 'powerLeft' | 'combo' | 'escaping'>>) => void;
  toast: (text: string, tone?: Toast['tone']) => void;
  say: (text: string) => void;
  toggleSound: () => void;
  toggleGraphics: () => void;
}

let toastId = 0;
let sayTimer: ReturnType<typeof setTimeout> | undefined;

const isTouch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

export const useUI = create<UIState>((set, get) => ({
  status: 'menu',
  roundId: 0,
  score: 0,
  hearts: START_HEARTS,
  timeLeft: ROUND_SECONDS,
  stamina: 100,
  powerLeft: 0,
  combo: 0,
  escaping: [],
  toasts: [],
  wallaceSays: null,
  bestScore: readBest(),
  result: null,
  sound: readSound(),
  // Phone GPUs struggle with shadows, so they start with low graphics.
  lowGraphics: isTouch,

  start: () => set(s => ({
    status: 'playing', roundId: s.roundId + 1, score: 0, hearts: START_HEARTS, timeLeft: ROUND_SECONDS,
    stamina: 100, powerLeft: 0, combo: 0, escaping: [], toasts: [], wallaceSays: null, result: null,
  })),
  pause: () => { if (get().status === 'playing') set({ status: 'paused' }); },
  resume: () => { if (get().status === 'paused') set({ status: 'playing' }); },
  toMenu: () => set({ status: 'menu' }),
  finish: (r) => {
    const best = get().bestScore;
    const newBest = r.finalScore > best;
    if (newBest) { try { localStorage.setItem('turkeyRun_best', String(r.finalScore)); } catch { /* ignore */ } }
    set({ status: 'over', result: { ...r, newBest }, bestScore: Math.max(best, r.finalScore) });
  },
  syncHud: (h) => {
    const s = get();
    const changed = (Object.keys(h) as (keyof typeof h)[]).some(k => {
      const a = h[k], b = s[k];
      return Array.isArray(a) && Array.isArray(b) ? a.join('|') !== b.join('|') : a !== b;
    });
    if (changed) set(h);
  },
  toast: (text, tone = 'info') => {
    const id = ++toastId;
    set(s => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 1800);
  },
  say: (text) => {
    set({ wallaceSays: text });
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => set({ wallaceSays: null }), 2500);
  },
  toggleSound: () => {
    const sound = !get().sound;
    try { localStorage.setItem('turkeyRun_sound', sound ? 'on' : 'off'); } catch { /* ignore */ }
    set({ sound });
  },
  toggleGraphics: () => set(s => ({ lowGraphics: !s.lowGraphics })),
}));
