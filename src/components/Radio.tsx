import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Mic, MicOff, Radio as RadioIcon } from 'lucide-react';
import { radio, MUSIC_CREDIT } from '../game/radio';

const btn = 'pointer-events-auto active:scale-95 transition-transform';

function useRadio() {
  const [, setTick] = useState(0);
  useEffect(() => radio.subscribe(() => setTick(t => t + 1)), []);
  return radio;
}

// A little car-radio style dial: on/off, change station, DJ voice on/off.
export default function RadioDial({ compact = false }: { compact?: boolean }) {
  const r = useRadio();
  const st = r.station;
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1">
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
          {r.djText ? <span>DJ: {r.djText}</span> : <span className="opacity-80">Now playing: "{r.nowPlaying}" by Kevin MacLeod</span>}
        </div>
      )}
    </div>
  );
}
