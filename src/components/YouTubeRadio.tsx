import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { radio } from '../game/radio';

// Plays the Top Gun station's official videos through YouTube's own embedded player.
// Nothing is hosted by the game. YouTube requires the player to stay visible and at
// least 200 x 200 pixels, so it sits in a small window in the bottom-left corner.

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

let apiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise(resolve => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
  }
  return apiPromise;
}

export default function YouTubeRadio() {
  const [active, setActive] = useState(radio.youtubeActive);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);

  useEffect(() => radio.subscribe(() => setActive(radio.youtubeActive)), []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const tracks = radio.station.youtube ?? [];
    loadYouTubeApi().then(YT => {
      if (cancelled || !host.current) return;
      const mount = document.createElement('div');
      host.current.appendChild(mount);
      const start = Math.floor(Math.random() * tracks.length);
      const ids = [...tracks.slice(start), ...tracks.slice(0, start)].map(t => t.id);
      // Our own queue, so a video that will not play is skipped and the list loops forever.
      let i = 0;
      let failures = 0;
      const show = (id: string) => { const t = tracks.find(x => x.id === id); if (t) radio.setNowPlaying(t.title); };
      const next = (p: any) => { i = (i + 1) % ids.length; p.loadVideoById(ids[i]); show(ids[i]); };
      player.current = new YT.Player(mount, {
        width: 200,
        height: 200,
        videoId: ids[0],
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, controls: 1 },
        events: {
          onReady: (e: any) => { show(ids[0]); e.target.playVideo(); },
          onStateChange: (e: any) => {
            if (e.data === 1) failures = 0; // playing
            if (e.data === 0) next(e.target); // ended
          },
          // Removed, blocked in this country, or not allowed here: try the next one.
          onError: (e: any) => {
            console.warn('Top Gun Radio: video', ids[i], 'would not play, code', e.data);
            if (++failures < ids.length) next(e.target);
            else radio.setNowPlaying('YouTube would not play any of these here');
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try { player.current?.destroy(); } catch { /* already gone */ }
      player.current = null;
      if (host.current) host.current.innerHTML = '';
    };
  }, [active]);

  if (!active) return null;
  return (
    <div className="absolute left-2 bottom-14 z-40 pointer-events-auto rounded-xl overflow-hidden shadow-2xl border-2 border-orange-300 bg-black">
      <div className="flex items-center justify-between bg-[#3b2a1e] px-2 py-0.5">
        <span className="text-[10px] font-black text-orange-200 tracking-widest">TOP GUN RADIO 86.0</span>
        <button onClick={() => radio.stop()} aria-label="Turn the radio off" className="active:scale-95">
          <X size={14} />
        </button>
      </div>
      <div ref={host} className="w-[200px] h-[200px]" />
    </div>
  );
}
