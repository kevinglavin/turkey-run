import React from 'react';
import Scene from './components/game/Scene';
import Overlay, { HowToPlay } from './components/ui/Overlay';
import { TURKEYS } from './game/config';

export default function App() {
  return (
    <div className="w-full h-[100dvh] bg-[#1B2712] text-white flex items-center justify-center font-sans overflow-hidden select-none touch-none">
      <div className="flex w-full max-w-5xl h-full lg:h-[720px] gap-8 items-stretch justify-center">
        {/* Desktop only: instructions */}
        <aside className="hidden lg:flex w-72 flex-col gap-4 bg-[#2A3A1E] rounded-3xl p-6 border border-[#3E522C] overflow-y-auto">
          <h2 className="text-2xl font-black italic text-amber-400 tracking-tighter">HOW TO PLAY</h2>
          <HowToPlay />
        </aside>

        {/* Game: full screen on phones, a phone-shaped frame on desktop */}
        <main className="relative w-full h-full lg:w-[400px] lg:h-[720px] lg:rounded-[2.5rem] lg:border-[8px] border-[#0F170A] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]">
          <Scene />
          <Overlay />
        </main>

        {/* Desktop only: the turkeys */}
        <aside className="hidden lg:flex w-72 flex-col gap-3 bg-[#2A3A1E] rounded-3xl p-6 border border-[#3E522C] overflow-y-auto">
          <h2 className="text-2xl font-black italic text-amber-400 tracking-tighter">THE TURKEYS</h2>
          {TURKEYS.map(t => (
            <div key={t.id} className="bg-black/20 rounded-xl p-3">
              <div className="font-black uppercase text-sm">{t.name}</div>
              <div className="text-xs text-stone-300">{t.blurb}</div>
            </div>
          ))}
          <p className="mt-auto text-xs text-stone-400">Penny the Corgi and Wallace the farmer vs. five very real, very mean turkeys.</p>
        </aside>
      </div>
    </div>
  );
}
