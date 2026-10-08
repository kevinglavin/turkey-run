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
- **Radio:** tap the radio button for four stations of music made live in the browser (no music files):
  Gobble FM, Radio Free Farmyard, Turkey Trot 80s and Classic Cluck. A DJ chats and reads fake ads
  between songs, out loud if the device has a speech voice (the microphone button turns the voice off).
- Ranger the Pyrenees lies by the catapult and rolls over now and then. That is all he does.
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
- `src/game/radio.ts` the radio: generated music per station, tuning static, DJ lines and speech.
- `src/game/store.ts` menus, saved stars and best scores (stored on the device).
- `src/components/Stage.tsx` the 3D scene: camera, catapult controls, particles. One canvas is kept for the whole session, because rebuilding it crashes phone GPUs.
- `src/components/models.tsx` the clay-style characters, ammo and blocks.
- `src/components/Screens.tsx` title, level select, in-game buttons, and the results card.
