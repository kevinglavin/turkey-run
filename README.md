# Turkey Run

Five scheming turkeys are plotting a Great Escape from Wallace's farm. Only Penny the Corgi can stop them.

## How to play

- **Move Penny:** touch and drag on the farm. On a computer, use WASD or the arrow keys.
- **Dash:** the Dash button, or Space on a computer. It uses stamina.
- **Treats:** grab dog biscuits for points. Grab them quickly in a row for a combo.
- **Escapes:** turkeys sneak to the orange gaps in the fence. Run close to shoo them back before they squeeze through.
- **Feed bucket:** when Wallace calls, grab it. For 7 seconds the turkeys are scared, and touching one sends it to the pen.
- **Hearts:** you lose one when a turkey pecks Penny or a turkey escapes. Survive the 90-second round until sunset to win.

## Changing the turkeys

Names, speeds, colors, and descriptions are in `src/game/config.ts` under `TURKEYS`. Most other tuning numbers (round length, Penny's speed, gaps, treats) are in the same file.

## Running it

```
npm install
npm run dev       # local dev server on http://localhost:3000
npm run build     # production build into dist/
npm run lint      # typecheck
npm run balance   # bot plays 900 rounds and prints win rates by skill level
```

## Deploying

Netlify reads `netlify.toml`: it runs `npm run build` and publishes `dist/`.

## Code layout

- `src/game/sim.ts` all game rules: Penny, turkey behavior, treats, the bucket, scoring. Plain TypeScript with no React, so it runs every frame without re-rendering the UI.
- `src/game/store.ts` UI state (menus, HUD values, best score).
- `src/components/game/` the 3D farm and characters (React Three Fiber).
- `src/components/ui/Overlay.tsx` menus, HUD, Dash button, pause, and results screens.
