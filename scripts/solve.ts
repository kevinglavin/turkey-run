// Checks every level: the fort must stand on its own, and a bot must be able to
// clear it with the ammo given. Prints the best scores found, for star targets.
// Run with: npm run solve        (or: npm run solve -- 3   for one level)
import { Game, MAX_SPEED, type AmmoType } from '../src/game/engine';
import { LEVELS, type LevelDef } from '../src/game/levels';

interface Shot { angle: number; power: number; abilityAt: number | null }

function runTo(g: Game, pred: () => boolean, maxSeconds: number) {
  const end = g.time + maxSeconds;
  while (!pred() && g.time < end) g.fixedStep();
}

function play(level: LevelDef, shots: Shot[]) {
  const g = new Game(level);
  runTo(g, () => g.ready, 5);
  for (const s of shots) {
    if (g.phase !== 'aiming') break;
    const a = (s.angle * Math.PI) / 180;
    g.launch(Math.cos(a) * s.power * MAX_SPEED, Math.sin(a) * s.power * MAX_SPEED);
    const t0 = g.time;
    if (s.abilityAt !== null) {
      runTo(g, () => g.time - t0 >= s.abilityAt!, 5);
      g.useAbility();
    }
    runTo(g, () => g.phase !== 'flying', 15);
  }
  return g;
}

const value = (g: Game) => (g.level.turkeys.length - g.turkeysLeft) * 1e6 + g.score;

function solve(level: LevelDef) {
  // 1. Stability: with no shots, nothing should fall or break.
  const idle = new Game(level);
  runTo(idle, () => false, 6);
  const broke = idle.score > 0 || idle.turkeysLeft !== level.turkeys.length;

  // 2. Greedy search, one shot at a time.
  const chosen: Shot[] = [];
  let firstHitRate = 0;
  let g = play(level, chosen);
  for (let i = 0; i < level.ammo.length && g.phase === 'aiming'; i++) {
    const ammo: AmmoType = g.ammo[0];
    const timings = ammo === 'balloon' || ammo === 'penny' ? [null, 0.5, 0.8, 1.1] : [null];
    let best: { shot: Shot; v: number; g: Game } | null = null;
    let tried = 0, scored = 0;
    const before = g.turkeysLeft;
    for (let angle = 5; angle <= 75; angle += 2.5) {
      for (let power = 0.5; power <= 1.001; power += 0.05) {
        for (const abilityAt of timings) {
          const shot = { angle, power, abilityAt };
          const r = play(level, [...chosen, shot]);
          const v = value(r);
          tried++;
          if (r.turkeysLeft < before) scored++;
          if (!best || v > best.v) best = { shot, v, g: r };
        }
      }
    }
    if (i === 0) firstHitRate = scored / tried;
    chosen.push(best!.shot);
    g = best!.g;
  }
  const fmt = (s: Shot) => `${s.angle}deg@${s.power.toFixed(2)}${s.abilityAt !== null ? `+tap${s.abilityAt}s` : ''}`;
  console.log(
    `L${level.id} ${level.name.padEnd(16)} ${broke ? 'UNSTABLE ' : 'stable   '}` +
    `${g.won ? 'CLEARED' : `FAILED (${g.turkeysLeft} left)`} in ${g.shotsFired}/${level.ammo.length} shots, ` +
    `first-shot KO rate ${(firstHitRate * 100).toFixed(0)}%, score ${g.score}, stars set ${level.stars.join('/')}  [${chosen.map(fmt).join(', ')}]`,
  );
}

const only = Number(process.argv[2]);
for (const level of LEVELS) if (!only || level.id === only) solve(level);
