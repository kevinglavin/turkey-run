# Angry Turkeys

Dave, Martin, Kevin, Elliot and Bob have built forts on Wallace's farm. Load the catapult and knock them down.

## How to play

- **Aim:** grab the catapult, pull back, and let go. White dots show where the shot will go.
- **Look around:** drag anywhere away from the catapult.
- **Ammo:**
  - Tennis ball: bouncy and quick.
  - Pumpkin: heavy, and the only thing that really cracks stone.
  - Water balloon: tap while it flies to split it into three.
  - Penny: tap while she flies and she zooms forward.
- **Farm helpers (one per level):** tap Helpers and pick one.
  - Donkey: trots up to the fort, turns around, and bucks it.
  - Longhorn: bulldozes everything along the ground until a hill stops her.
  - Sloth: goes in the catapult. She grabs whatever she hits, yawns, and nearby turkeys nod off.
- **Radio:** tap the radio button. Three stations of real recordings: Gobble FM (country and bluegrass),
  Turkey Trot 80s (synth) and Radio Free Farmyard (easy listening). Tuning in drops you partway into a song,
  like GTA. A DJ chats and reads fake ads between songs, out loud if the device has a speech voice
  (the microphone button turns the voice off). Music by Kevin MacLeod, see `public/radio/CREDITS.txt`.
- **Top Gun Radio (86.0 FM):** streams the official Top Gun soundtrack videos from the artists' and labels'
  YouTube channels. Nothing is hosted by the game. YouTube requires its player to stay visible (at least
  200 x 200), so a small video window shows in the bottom-left while it plays. Videos that will not play are skipped.
- **My Music (101.1 FM):** tune to it and tap Add songs to pick music files from your own phone. They are
  saved only in that browser on that device (never uploaded), so they are there next time. The bin button removes them.
- **Ranger** the Great Pyrenees lives between the catapult and the fort. He lies about, rolls over,
  and now and then wanders to a new spot for a sniff.
- **Ranger's Sky Paw (once per level):** tap the Ranger button, then tap the farm. He howls, and a giant
  magic paw stomps down from the sky on that spot.
- Knock out every turkey to clear the level. Unused ammo is worth 10,000 points each.
- Ten levels, up to three stars each. Each level unlocks when you beat the one before it.

Phones work best held sideways.

## Running it

```
npm install
npm run dev     # local dev server on http://localhost:3000
npm run build   # production build into dist/
npm run lint    # typecheck
npm run solve   # bot checks every level: stable, and beatable with its ammo
```

## Making levels

Levels are in `src/game/levels.ts`, built with small helpers (`frame`, `post`, `beam`, `box`, `slab`, `bale`, `hill`, `turkey`).
After changing a level, run `npm run solve`. It reports whether the fort stands on its own, whether a bot can clear it,
and the best score it found. Set the level's 2-star and 3-star scores to about 55% and 80% of that score.

## Code layout

- `src/game/engine.ts` game rules on top of the planck (Box2D) physics engine: launching, damage, knockouts, scoring, and the farm helpers. No graphics, so the bot can run it.
- `src/game/levels.ts` the ten levels.
- `src/game/radio.ts` the radio: stations and playlists, tuning static, DJ lines and speech. The MP3s are in `public/radio/`.
- `src/game/store.ts` menus, saved stars and best scores (stored on the device).
- `src/components/Stage.tsx` the 3D scene: camera, catapult controls, particles. One canvas is kept for the whole session, because rebuilding it crashes phone GPUs.
- `src/components/models.tsx` the clay-style characters, ammo and blocks.
- `src/components/Screens.tsx` title, level select, in-game buttons, and the results card.

## Credits

Music by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution 4.0
(https://creativecommons.org/licenses/by/4.0/). Track list in `public/radio/CREDITS.txt`.
