import React, { useEffect } from 'react';
import { Heart, Pause, Play, Volume2, VolumeX, Zap } from 'lucide-react';
import { useUI } from '../../game/store';
import { tryDash, world } from '../../game/sim';
import { setSoundEnabled, unlockAudio } from '../../game/audio';
import { PENNY, START_HEARTS, TURKEYS } from '../../game/config';

const btn = 'pointer-events-auto active:scale-95 transition-transform';

function HowToPlay() {
  return (
    <div className="space-y-2 text-left text-[13px] text-stone-200">
      <p><b className="text-amber-300">Move Penny:</b> touch and drag on the farm. On a computer, use WASD or the arrow keys.</p>
      <p><b className="text-amber-300">Dash:</b> tap the Dash button (Space bar on a computer). It uses stamina.</p>
      <p><b className="text-amber-300">Treats:</b> grab dog biscuits for points. Grab them quickly in a row for a combo.</p>
      <p><b className="text-amber-300">Escapes:</b> turkeys sneak to the orange gaps in the fence. Run close to shoo them back before they squeeze through.</p>
      <p><b className="text-amber-300">Feed bucket:</b> when Wallace calls, grab it. For 7 seconds the turkeys are scared, and touching one sends it to the pen.</p>
      <p><b className="text-amber-300">Hearts:</b> you lose one when a turkey pecks Penny or a turkey escapes. Survive until sunset to win.</p>
    </div>
  );
}

function Menu() {
  const start = useUI(s => s.start);
  const best = useUI(s => s.bestScore);
  const [showHelp, setShowHelp] = React.useState(false);
  return (
    <div className="absolute inset-0 z-50 bg-[#0F170A]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      <h1 className="text-5xl font-black italic tracking-tighter text-amber-400 leading-none drop-shadow">TURKEY RUN</h1>
      <p className="mt-3 text-sm text-stone-200 max-w-[300px]">
        Five scheming turkeys are plotting a Great Escape from Wallace's farm. Only Penny the Corgi can stop them.
      </p>
      {best > 0 && <p className="mt-3 text-xs font-bold text-yellow-300">Best score: {best}</p>}
      {showHelp ? (
        <div className="mt-4 w-full max-w-[320px] bg-black/30 rounded-2xl p-4 border border-white/10">
          <HowToPlay />
        </div>
      ) : (
        <div className="mt-4 w-full max-w-[320px] grid grid-cols-1 gap-1 text-left">
          {TURKEYS.map(t => (
            <div key={t.id} className="text-[11px] text-stone-300 bg-black/20 rounded-lg px-3 py-1.5">
              <b className="text-white uppercase">{t.name}</b> {t.blurb}
            </div>
          ))}
        </div>
      )}
      <button
        className={`${btn} mt-5 w-full max-w-[320px] py-4 rounded-2xl bg-amber-500 text-[#0F170A] text-xl font-black uppercase flex items-center justify-center gap-2`}
        onClick={() => { unlockAudio(); start(); }}
      >
        <Play size={22} fill="currentColor" /> Start
      </button>
      <button
        className={`${btn} mt-3 w-full max-w-[320px] py-3 rounded-2xl border border-white/20 text-white font-bold uppercase`}
        onClick={() => setShowHelp(v => !v)}
      >
        {showHelp ? 'Meet the turkeys' : 'How to play'}
      </button>
    </div>
  );
}

function Hud() {
  const hearts = useUI(s => s.hearts);
  const timeLeft = useUI(s => s.timeLeft);
  const score = useUI(s => s.score);
  const stamina = useUI(s => s.stamina);
  const powerLeft = useUI(s => s.powerLeft);
  const combo = useUI(s => s.combo);
  const escaping = useUI(s => s.escaping);
  const toasts = useUI(s => s.toasts);
  const wallaceSays = useUI(s => s.wallaceSays);
  const pause = useUI(s => s.pause);
  const canDash = stamina >= PENNY.dashCost;
  const mm = Math.floor(timeLeft / 60);
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-start gap-2">
        <div className="bg-[#0F170A]/80 rounded-2xl px-3 py-1.5 flex gap-1">
          {Array.from({ length: START_HEARTS }, (_, i) => (
            <Heart key={i} size={20} className={i < hearts ? 'text-red-500' : 'text-stone-600'} fill="currentColor" />
          ))}
        </div>
        <div className="flex-1 bg-[#0F170A]/80 rounded-2xl px-3 py-1 text-center">
          <div className="text-[9px] font-black tracking-widest text-orange-400">UNTIL SUNSET</div>
          <div className="text-lg font-black leading-tight">{mm}:{ss}</div>
        </div>
        <div className="bg-[#0F170A]/80 rounded-2xl px-3 py-1 text-center min-w-[64px]">
          <div className="text-[9px] font-black tracking-widest text-yellow-300">SCORE</div>
          <div className="text-lg font-black leading-tight">{score}</div>
        </div>
        <button onClick={pause} aria-label="Pause" className={`${btn} w-10 h-10 rounded-full bg-[#0F170A]/80 flex items-center justify-center`}>
          <Pause size={18} fill="currentColor" />
        </button>
      </div>

      <div className="mt-2 flex flex-col items-center gap-1">
        {escaping.map(name => (
          <div key={name} className="bg-red-600/90 text-white text-xs font-black uppercase px-3 py-1 rounded-full animate-pulse">
            {name} is escaping!
          </div>
        ))}
        {powerLeft > 0 && (
          <div className="bg-blue-600/90 text-white text-xs font-black uppercase px-3 py-1 rounded-full">
            Turkey Time! {powerLeft}s
          </div>
        )}
        {combo >= 2 && <div className="text-amber-300 text-sm font-black [text-shadow:0_1px_3px_#000]">COMBO x{combo}</div>}
      </div>

      <div className="mt-auto flex flex-col items-center gap-1 mb-32">
        {wallaceSays && (
          <div className="max-w-[300px] bg-white text-stone-900 text-sm font-bold px-3 py-1.5 rounded-2xl shadow-lg">
            <span className="text-green-700 font-black">Wallace:</span> {wallaceSays}
          </div>
        )}
        {toasts.map(t => (
          <div
            key={t.id}
            className={`text-sm font-black px-3 py-1 rounded-xl [text-shadow:0_1px_2px_#000] ${
              t.tone === 'good' ? 'text-green-300' : t.tone === 'bad' ? 'text-red-300' : 'text-white'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      <div className="absolute left-3 right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] flex items-end justify-between gap-3">
        <div className="bg-[#0F170A]/80 rounded-2xl px-3 py-2 w-40">
          <div className="text-[9px] font-black tracking-widest text-sky-300 mb-1">STAMINA</div>
          <div className="h-2.5 bg-black/60 rounded-full overflow-hidden">
            <div className={`h-full ${canDash ? 'bg-sky-400' : 'bg-stone-500'}`} style={{ width: `${stamina}%` }} />
          </div>
        </div>
        <button
          onPointerDown={(e) => { e.stopPropagation(); tryDash(world); }}
          className={`${btn} w-24 h-24 rounded-full font-black uppercase text-sm flex flex-col items-center justify-center border-4 ${
            canDash ? 'bg-amber-500 text-[#0F170A] border-amber-200' : 'bg-stone-700 text-stone-400 border-stone-500'
          }`}
        >
          <Zap size={26} fill="currentColor" />
          Dash
        </button>
      </div>
    </div>
  );
}

function SoundToggle() {
  const sound = useUI(s => s.sound);
  const toggle = useUI(s => s.toggleSound);
  return (
    <button onClick={toggle} className={`${btn} flex items-center gap-2 text-sm font-bold`}>
      {sound ? <Volume2 size={18} /> : <VolumeX size={18} />} Sound {sound ? 'on' : 'off'}
    </button>
  );
}

function Paused() {
  const resume = useUI(s => s.resume);
  const toMenu = useUI(s => s.toMenu);
  const low = useUI(s => s.lowGraphics);
  const toggleGraphics = useUI(s => s.toggleGraphics);
  return (
    <div className="absolute inset-0 z-50 bg-[#0F170A]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-4xl font-black italic text-amber-400">PAUSED</h2>
      <div className="w-full max-w-[300px] bg-black/30 rounded-2xl p-4 flex flex-col gap-3 items-start">
        <SoundToggle />
        <button onClick={toggleGraphics} className={`${btn} text-sm font-bold`}>
          Graphics: {low ? 'Fast (no shadows)' : 'Pretty (shadows)'}
        </button>
      </div>
      <button onClick={resume} className={`${btn} w-full max-w-[300px] py-4 rounded-2xl bg-amber-500 text-[#0F170A] text-lg font-black uppercase`}>
        Resume
      </button>
      <button onClick={toMenu} className={`${btn} w-full max-w-[300px] py-3 rounded-2xl border border-white/20 font-bold uppercase`}>
        Quit to menu
      </button>
    </div>
  );
}

function GameOver() {
  const r = useUI(s => s.result);
  const start = useUI(s => s.start);
  const toMenu = useUI(s => s.toMenu);
  const best = useUI(s => s.bestScore);
  if (!r) return null;
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between text-sm"><span className="text-stone-300">{label}</span><b>{value}</b></div>
  );
  return (
    <div className="absolute inset-0 z-50 bg-[#0F170A]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 text-center overflow-y-auto">
      <h2 className={`text-4xl font-black italic leading-none ${r.won ? 'text-green-400' : 'text-red-400'}`}>
        {r.won ? 'SUNSET!' : 'THE TURKEYS WIN'}
      </h2>
      <p className="text-sm text-stone-200 max-w-[280px]">
        {r.won
          ? 'Penny kept the turkeys on the farm until sunset. Wallace says good girl.'
          : 'Penny ran out of hearts. The turkeys are gobbling with glee.'}
      </p>
      <div className="w-full max-w-[300px] bg-black/30 rounded-2xl p-4 flex flex-col gap-1.5">
        {row('Treats grabbed', r.treats)}
        {row('Turkeys shooed back', r.shoos)}
        {row('Turkeys sent to the pen', r.tags)}
        {row('Times pecked', r.caught)}
        {row('Escapes', r.escapes)}
        {r.won && row(`Hearts bonus (${r.heartsLeft} x 100)`, `+${r.finalScore - r.score}`)}
        <div className="border-t border-white/10 mt-1 pt-2 flex justify-between text-lg">
          <span className="font-bold">Final score</span><b className="text-yellow-300">{r.finalScore}</b>
        </div>
        <div className="text-xs text-stone-400 text-right">{r.newBest ? 'New best score!' : `Best: ${best}`}</div>
      </div>
      <button onClick={start} className={`${btn} w-full max-w-[300px] py-4 rounded-2xl bg-amber-500 text-[#0F170A] text-lg font-black uppercase`}>
        Play again
      </button>
      <button onClick={toMenu} className={`${btn} w-full max-w-[300px] py-3 rounded-2xl border border-white/20 font-bold uppercase`}>
        Menu
      </button>
    </div>
  );
}

function useKeyboard() {
  useEffect(() => {
    const map: Record<string, keyof typeof world.keys> = {
      w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right',
    };
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ui = useUI.getState();
      if (map[k]) { world.keys[map[k]] = true; e.preventDefault(); }
      if (k === ' ') { e.preventDefault(); tryDash(world); }
      if (k === 'escape' || k === 'p') {
        if (ui.status === 'playing') ui.pause(); else if (ui.status === 'paused') ui.resume();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (map[k]) world.keys[map[k]] = false;
    };
    // Pause automatically when the player switches apps or tabs.
    const onHide = () => { if (document.hidden) useUI.getState().pause(); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);
}

export default function Overlay() {
  const status = useUI(s => s.status);
  const sound = useUI(s => s.sound);
  useKeyboard();
  useEffect(() => { setSoundEnabled(sound); }, [sound]);
  return (
    <>
      {status === 'menu' && <Menu />}
      {(status === 'playing' || status === 'paused') && <Hud />}
      {status === 'paused' && <Paused />}
      {status === 'over' && <GameOver />}
    </>
  );
}

export { HowToPlay };
