import React, { useEffect, useState } from 'react';
import { Lock, Play, RotateCcw, Star, Volume2, VolumeX, ChevronRight, LayoutGrid, Smartphone } from 'lucide-react';
import { useStore, isUnlocked } from '../game/store';
import { LEVELS } from '../game/levels';
import { AMMO, HELPERS, type AmmoType, type HelperType } from '../game/engine';
import { setSoundEnabled, sfx, unlockAudio } from '../game/audio';
import { live } from './Stage';
import RadioDial from './Radio';
import YouTubeRadio from './YouTubeRadio';
import { MUSIC_CREDIT } from '../game/radio';

const btn = 'pointer-events-auto active:scale-95 transition-transform';

const AMMO_ICON: Record<AmmoType, React.ReactNode> = {
  // Some phones draw the tennis emoji as a racket, so the ball is a plain yellow circle.
  ball: <span className="inline-block w-[0.8em] h-[0.8em] rounded-full bg-lime-300 border-2 border-white/80 align-middle" />,
  pumpkin: '🎃',
  balloon: '💧',
  penny: '🐕',
  sloth: '🦥',
  paw: '🐾',
};

const HELPER_ICON: Record<HelperType, string> = { donkey: '🫏', cow: '🐂', sloth: '🦥' };

function Stars({ n, size = 22 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map(i => (
        <Star key={i} size={size} className={i < n ? 'text-yellow-300' : 'text-black/30'} fill="currentColor" strokeWidth={1.5} />
      ))}
    </div>
  );
}

function SoundButton() {
  const sound = useStore(s => s.sound);
  const toggle = useStore(s => s.toggleSound);
  return (
    <button onClick={toggle} aria-label="Sound" className={`${btn} w-11 h-11 rounded-full bg-black/40 flex items-center justify-center`}>
      {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
  );
}

function usePortrait() {
  const get = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
  const [portrait, setPortrait] = useState(get);
  useEffect(() => {
    const on = () => setPortrait(get());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return portrait;
}

function Title() {
  const goLevels = useStore(s => s.goLevels);
  const portrait = usePortrait();
  return (
    <div className="absolute inset-0 pointer-events-auto flex flex-col items-center justify-center bg-gradient-to-b from-black/10 via-black/30 to-black/60 p-6 text-center">
      <h1 className="title-wobble text-6xl sm:text-7xl font-black italic tracking-tighter leading-none text-orange-400 [text-shadow:0_4px_0_#7c2d12,0_8px_20px_rgba(0,0,0,0.5)]">
        ANGRY<br />TURKEYS
      </h1>
      <p className="mt-4 max-w-sm text-base font-bold [text-shadow:0_2px_4px_#000]">
        Dave, Martin, Kevin, Elliot and Bob have built forts on Wallace's farm. Knock them down!
      </p>
      <button
        onClick={() => { unlockAudio(); sfx.click(); goLevels(); }}
        className={`${btn} mt-6 px-10 py-4 rounded-full bg-orange-500 border-4 border-orange-200 text-2xl font-black uppercase flex items-center gap-2 shadow-xl`}
      >
        <Play size={26} fill="currentColor" /> Play
      </button>
      {portrait && (
        <p className="mt-5 flex items-center gap-2 text-sm font-bold bg-black/40 rounded-full px-4 py-2">
          <Smartphone size={18} className="rotate-90" /> Turn your phone sideways for the best view
        </p>
      )}
      <div className="absolute top-4 right-4 flex items-start gap-2"><RadioDial compact /><SoundButton /></div>
    </div>
  );
}

function Levels() {
  const progress = useStore(s => s.progress);
  const play = useStore(s => s.play);
  const goTitle = useStore(s => s.goTitle);
  const total = LEVELS.reduce((n, l) => n + (progress[l.id]?.stars ?? 0), 0);
  return (
    <div className="absolute inset-0 pointer-events-auto bg-black/50 backdrop-blur-[2px] flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <button onClick={goTitle} className={`${btn} px-4 py-2 rounded-full bg-black/40 font-bold`}>Back</button>
        <div className="flex items-center gap-2 font-black text-lg"><Star size={22} className="text-yellow-300" fill="currentColor" /> {total} / {LEVELS.length * 3}</div>
        <SoundButton />
      </div>
      <h2 className="mt-3 text-3xl font-black italic text-orange-400 [text-shadow:0_3px_0_#7c2d12]">CHOOSE A LEVEL</h2>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 w-full max-w-3xl">
        {LEVELS.map((l, i) => {
          const open = isUnlocked(progress, i);
          const p = progress[l.id];
          return (
            <button
              key={l.id}
              disabled={!open}
              onClick={() => { sfx.click(); play(i); }}
              className={`${btn} rounded-2xl p-3 flex flex-col items-center gap-1 border-4 ${
                open ? 'bg-orange-500 border-orange-200' : 'bg-stone-600/80 border-stone-500 opacity-70'
              }`}
            >
              <div className="text-3xl font-black leading-none">{open ? l.id : <Lock size={28} />}</div>
              <div className="text-[11px] font-bold leading-tight text-center min-h-[2.2em]">{l.name}</div>
              <Stars n={p?.stars ?? 0} size={16} />
            </button>
          );
        })}
      </div>
      <p className="mt-auto pt-4 text-[10px] opacity-70 text-center">{MUSIC_CREDIT}.</p>
    </div>
  );
}

function Hud() {
  const levelIndex = useStore(s => s.levelIndex);
  const score = useStore(s => s.score);
  const ammo = useStore(s => s.ammo);
  const phase = useStore(s => s.phase);
  const ready = useStore(s => s.ready);
  const restart = useStore(s => s.restart);
  const goLevels = useStore(s => s.goLevels);
  const result = useStore(s => s.result);
  const attempt = useStore(s => s.attempt);
  const helperUsed = useStore(s => s.helperUsed);
  const [picking, setPicking] = useState(false);
  const pawUsed = useStore(s => s.pawUsed);
  const [targeting, setTargeting] = useState(false);
  const level = LEVELS[levelIndex];
  const [introDone, setIntroDone] = useState(false);
  const [aimedOnce, setAimedOnce] = useState(false);

  useEffect(() => {
    setIntroDone(false);
    const t = setTimeout(() => setIntroDone(true), 3200);
    return () => clearTimeout(t);
  }, [level, attempt]);
  useEffect(() => { if (phase === 'flying') setAimedOnce(true); }, [phase]);
  useEffect(() => { setPicking(false); setTargeting(false); live.targeting = false; }, [attempt, levelIndex]);
  // The stage clears live.targeting once the paw is placed; mirror that here.
  useEffect(() => { if (pawUsed || phase !== 'aiming') { setTargeting(false); live.targeting = false; } }, [pawUsed, phase]);
  const canPaw = phase === 'aiming' && ready && !pawUsed && !result;
  const aimPaw = () => {
    sfx.click();
    const on = !targeting;
    setTargeting(on);
    live.targeting = on;
    setPicking(false);
  };
  const canCall = phase === 'aiming' && ready && !helperUsed && !result;
  const outOfAmmo = phase === 'aiming' && ammo.length === 0 && !result;
  const call = (h: HelperType) => { sfx.click(); live.game?.callHelper(h); setPicking(false); };

  const canTap = phase === 'flying';

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="flex items-start justify-between p-3 gap-2">
        <div className="flex gap-2">
          <button onClick={() => { sfx.click(); goLevels(); }} aria-label="Levels" className={`${btn} w-11 h-11 rounded-full bg-black/40 flex items-center justify-center`}>
            <LayoutGrid size={20} />
          </button>
          <button onClick={() => { sfx.click(); restart(); }} aria-label="Restart" className={`${btn} w-11 h-11 rounded-full bg-black/40 flex items-center justify-center`}>
            <RotateCcw size={20} />
          </button>
          <SoundButton />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right [text-shadow:0_2px_3px_#000]">
            <div className="text-3xl font-black leading-none">{score.toLocaleString()}</div>
            <div className="text-xs font-bold opacity-90">Level {level.id}: {level.name}</div>
          </div>
          <RadioDial />
        </div>
      </div>

      {!result && (
        <div className="absolute left-3 top-16 flex flex-col items-start gap-2 w-[min(55vw,380px)]">
          {!introDone && (
            <div className="bg-black/55 rounded-2xl px-4 py-2 text-center text-sm font-bold">{level.intro}</div>
          )}
          {introDone && ready && phase === 'aiming' && !aimedOnce && (
            <div className="bg-black/55 rounded-2xl px-4 py-2 text-center text-sm font-bold">
              Grab the catapult, pull back, and let go. Drag anywhere else to look around.
            </div>
          )}
          {canTap && <SpecialHint />}
          {targeting && (
            <div className="bg-sky-600/90 rounded-full px-5 py-2 text-sm font-black uppercase animate-pulse text-center">
              Tap the farm where Ranger's magic paw should land
            </div>
          )}
          {outOfAmmo && (
            <div className="pointer-events-auto bg-black/65 rounded-2xl px-4 py-3 text-center flex flex-col gap-2 items-center">
              <div className="text-sm font-bold">Out of ammo, but a farm helper is still free.</div>
              <div className="flex gap-2">
                <button onClick={() => setPicking(true)} className={`${btn} px-4 py-2 rounded-full bg-orange-500 font-black uppercase text-sm`}>Call a helper</button>
                <button onClick={() => live.game?.forfeit()} className={`${btn} px-4 py-2 rounded-full bg-white/15 font-bold text-sm`}>Give up</button>
              </div>
            </div>
          )}
        </div>
      )}

      {(canCall || picking || canPaw) && (
        <div className="absolute right-3 bottom-3 flex flex-col items-end gap-2">
          {picking && (
            <div className="pointer-events-auto pop-in bg-[#3b2a1e]/95 border-2 border-orange-300 rounded-2xl p-2 flex flex-col gap-1.5 w-[250px]">
              <div className="text-xs font-black uppercase text-orange-200 px-1">One helper per level</div>
              {(Object.keys(HELPERS) as HelperType[]).map(h => (
                <button key={h} onClick={() => call(h)} className={`${btn} flex items-center gap-2 text-left bg-white/10 hover:bg-white/20 rounded-xl px-2 py-1.5`}>
                  <span className="text-2xl">{HELPER_ICON[h]}</span>
                  <span className="leading-tight">
                    <span className="block text-sm font-black">{HELPERS[h].label}</span>
                    <span className="block text-[11px] opacity-85">{HELPERS[h].tip}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {canPaw && (
              <button onClick={aimPaw} title="Ranger's Sky Paw: once per level, a giant magic paw stomps where you tap"
                className={`${btn} pointer-events-auto h-12 px-4 rounded-full border-4 font-black uppercase text-sm flex items-center gap-1 shadow-lg ${
                  targeting ? 'bg-sky-500 border-white' : 'bg-sky-700 border-sky-200'}`}>
                <span className="text-lg">🐾</span> {targeting ? 'Cancel' : 'Ranger'}
              </button>
            )}
            {canCall && (
              <button onClick={() => { sfx.click(); setPicking(p => !p); setTargeting(false); live.targeting = false; }}
                className={`${btn} pointer-events-auto h-12 px-4 rounded-full bg-orange-500 border-4 border-orange-200 font-black uppercase text-sm flex items-center gap-1 shadow-lg ${outOfAmmo ? 'animate-bounce' : ''}`}>
                <span className="text-lg">🫏🐂🦥</span> Helpers
              </button>
            )}
          </div>
        </div>
      )}

      <div className="absolute left-3 bottom-3 flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-1.5">
        {ammo.length === 0 && <span className="text-xs font-bold opacity-80">No ammo left</span>}
        {ammo.map((a, i) => (
          <span key={i} title={AMMO[a].label} className={`text-xl leading-none ${i === 0 && phase === 'aiming' ? 'scale-125' : 'opacity-80'}`}>{AMMO_ICON[a]}</span>
        ))}
      </div>
    </div>
  );
}

// "Tap now" for ammo with a special move, shown while it is in the air.
function SpecialHint() {
  const [type, setType] = useState<AmmoType | null>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const s = live.game?.activeShot;
      const t = s && !s.dead && !live.game?.abilityUsed && (s.ammo === 'penny' || s.ammo === 'balloon') ? s.ammo : null;
      setType(t ?? null);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!type) return null;
  return (
    <div className="bg-orange-500/90 rounded-full px-5 py-2 text-base font-black uppercase animate-pulse">
      {type === 'penny' ? 'Tap to zoom, Penny!' : 'Tap to split!'}
    </div>
  );
}

function ResultCard() {
  const result = useStore(s => s.result);
  const levelIndex = useStore(s => s.levelIndex);
  const restart = useStore(s => s.restart);
  const next = useStore(s => s.next);
  const goLevels = useStore(s => s.goLevels);
  if (!result) return null;
  const last = levelIndex === LEVELS.length - 1;
  return (
    <div className="absolute inset-0 pointer-events-auto bg-black/50 flex items-center justify-center p-4">
      <div className="pop-in w-full max-w-sm rounded-3xl bg-[#3b2a1e] border-4 border-orange-300 p-5 text-center shadow-2xl">
        <h2 className={`text-4xl font-black italic leading-none ${result.won ? 'text-yellow-300' : 'text-red-300'}`}>
          {result.won ? (last ? 'CASTLE CRUSHED!' : 'LEVEL CLEARED!') : 'THE TURKEYS WIN'}
        </h2>
        <p className="mt-2 text-sm font-bold text-orange-100">
          {result.won
            ? last ? 'Dave has been dethroned. Wallace is putting the kettle on.' : 'Wallace gives Penny a biscuit.'
            : 'Out of ammo. The turkeys are gobbling with glee.'}
        </p>
        {result.won && <div className="mt-3 flex justify-center"><Stars n={result.stars} size={40} /></div>}
        <div className="mt-3 text-3xl font-black">{result.score.toLocaleString()}</div>
        {result.newBest && <div className="text-xs font-bold text-yellow-300">New best!</div>}
        <div className="mt-4 flex gap-2 justify-center">
          <button onClick={() => { sfx.click(); goLevels(); }} aria-label="Levels" className={`${btn} w-14 h-14 rounded-full bg-black/40 flex items-center justify-center`}>
            <LayoutGrid size={24} />
          </button>
          <button onClick={() => { sfx.click(); restart(); }} aria-label="Retry" className={`${btn} w-14 h-14 rounded-full bg-black/40 flex items-center justify-center`}>
            <RotateCcw size={24} />
          </button>
          {result.won && !last && (
            <button onClick={() => { sfx.click(); next(); }} className={`${btn} h-14 px-6 rounded-full bg-orange-500 border-4 border-orange-200 font-black uppercase flex items-center gap-1`}>
              Next <ChevronRight size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Screens() {
  const screen = useStore(s => s.screen);
  const sound = useStore(s => s.sound);
  useEffect(() => { setSoundEnabled(sound); }, [sound]);
  return (
    // z-30 keeps menus above the turkey name labels, which the 3D scene also draws as HTML.
    <div className="absolute inset-0 pointer-events-none z-30">
      <YouTubeRadio />
      {screen === 'title' && <Title />}
      {screen === 'levels' && <Levels />}
      {screen === 'play' && (
        <>
          <Hud />
          <ResultCard />
        </>
      )}
    </div>
  );
}
