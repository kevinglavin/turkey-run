import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Mic, MicOff, Plus, Radio as RadioIcon, Trash2 } from 'lucide-react';
import { radio, MUSIC_CREDIT } from '../game/radio';

const btn = 'pointer-events-auto active:scale-95 transition-transform';

function useRadio() {
  const [, setTick] = useState(0);
  useEffect(() => radio.subscribe(() => setTick(t => t + 1)), []);
  return radio;
}

// Load saved My Music songs once, when the app starts.
let loaded = false;
function useMyMusicLoaded() {
  useEffect(() => {
    if (!loaded) { loaded = true; radio.loadMyMusic(); }
  }, []);
}

// A little car-radio style dial: on/off, change station, DJ voice on/off.
export default function RadioDial({ compact = false }: { compact?: boolean }) {
  const r = useRadio();
  useMyMusicLoaded();
  const st = r.station;
  const picker = useRef<HTMLInputElement>(null);
  const mine = st.id === 'mine';
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1">
      <input ref={picker} type="file" accept="audio/*" multiple className="hidden"
        onChange={e => { if (e.target.files?.length) r.addMyMusic(e.target.files); e.target.value = ''; }} />
      <div className="flex items-center gap-1 bg-black/55 rounded-full pl-1 pr-1 py-1">
        <button onClick={() => r.toggle()} aria-label="Radio on or off"
          className={`${btn} w-9 h-9 rounded-full flex items-center justify-center ${r.on ? 'bg-orange-500' : 'bg-white/10'}`}>
          <RadioIcon size={18} />
        </button>
        {r.on && (
          <>
            <button onClick={() => r.next(-1)} aria-label="Previous station" className={`${btn} w-8 h-8 rounded-full flex items-center justify-center`}>
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-[96px] text-center leading-tight px-1">
              <div className="text-[10px] font-black text-orange-300 tracking-widest">{st.freq} FM</div>
              <div className="text-xs font-black whitespace-nowrap">{st.name}</div>
            </div>
            <button onClick={() => r.next(1)} aria-label="Next station" className={`${btn} w-8 h-8 rounded-full flex items-center justify-center`}>
              <ChevronRight size={18} />
            </button>
            <button onClick={() => r.setVoice(!r.voice)} aria-label="DJ voice on or off"
              className={`${btn} w-8 h-8 rounded-full flex items-center justify-center ${r.voice ? '' : 'opacity-50'}`}>
              {r.voice ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          </>
        )}
      </div>
      {r.on && !compact && (
        <div className="max-w-[300px] text-right text-[11px] font-bold bg-black/45 rounded-xl px-3 py-1.5">
          {r.djText ? <span>DJ: {r.djText}</span>
            : mine && st.tracks.length === 0 ? <span>Add songs from your phone. They stay on this device.</span>
            : <span className="opacity-80">Now playing: "{r.nowPlaying}"{mine ? '' : ' by Kevin MacLeod'}</span>}
          {mine && (
            <div className="mt-1 flex justify-end gap-1">
              <button onClick={() => picker.current?.click()} className={`${btn} flex items-center gap-1 bg-orange-500 rounded-full px-2 py-0.5 text-[11px] font-black`}>
                <Plus size={12} /> Add songs
              </button>
              {st.tracks.length > 0 && (
                <button onClick={() => { if (confirm('Remove all your songs from the game?')) r.clearMyMusic(); }} aria-label="Remove my songs"
                  className={`${btn} flex items-center bg-white/15 rounded-full px-2 py-0.5`}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
