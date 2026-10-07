// Plays hundreds of rounds with a simple bot at three skill levels and prints win rates.
// Run with: npm run balance
import { resetWorld, step, tryDash, gapInside, type World } from '../src/game/sim';
import { HEART_BONUS } from '../src/game/config';

const d = (a: any, b: any) => Math.hypot(a.x - b.x, a.z - b.z);

// skill: 0 = clumsy, 1 = sharp
function think(w: World, skill: number) {
  const p = w.penny.pos;
  const danger = w.powerLeft > 0 ? [] : w.turkeys.filter(t => ['chase', 'charge', 'alert', 'puff'].includes(t.state));
  const radius = 2.5 + skill * 2.5;
  const near = danger.filter(t => d(t.pos, p) < radius);
  let target: any = null;
  if (near.length && Math.random() < 0.5 + skill * 0.5) {
    let fx = 0, fz = 0;
    for (const t of near) { const dd = Math.max(0.3, d(t.pos, p)); fx += (p.x - t.pos.x) / (dd * dd); fz += (p.z - t.pos.z) / (dd * dd); }
    // Avoid getting pinned against the fence.
    fx += -p.x / 30; fz += -p.z / 50;
    const len = Math.hypot(fx, fz) || 1;
    target = { x: p.x + (fx / len) * 4, z: p.z + (fz / len) * 4 };
    if (near.some(t => d(t.pos, p) < 1.8)) tryDash(w);
  } else {
    const esc = w.turkeys.filter(t => t.state === 'escape' || t.state === 'squeeze');
    if (esc.length && Math.random() < 0.6 + skill * 0.4) target = esc.sort((a, b) => b.squeeze - a.squeeze)[0].pos;
    else if (w.bucket.active) target = w.bucket.pos;
    else if (w.powerLeft > 0) target = w.turkeys.filter(t => t.state !== 'timeout').sort((a, b) => d(a.pos, p) - d(b.pos, p))[0]?.pos;
    if (!target) {
      const cost = (tr: any) => d(tr.pos, p) + skill * 10 * danger.filter(t => d(t.pos, tr.pos) < 4).length;
      target = w.treats.slice().sort((a, b) => cost(a) - cost(b))[0].pos;
    }
    if (esc.length && d(target, p) > 8 && w.stamina > 60) tryDash(w);
  }
  w.pointer.x = target.x; w.pointer.z = target.z;
}

function run(skill: number, n: number) {
  let wins = 0, score = 0, esc = 0, pecks = 0, dur = 0;
  for (let i = 0; i < n; i++) {
    const w = resetWorld();
    // Human reaction: re-decide every ~0.25s (sharp) to 0.6s (clumsy).
    const react = 0.6 - skill * 0.35;
    let next = 0;
    while (w.running) {
      if (w.elapsed >= next) { think(w, skill); next = w.elapsed + react; }
      step(w, 1 / 60);
    }
    const won = w.hearts > 0;
    wins += won ? 1 : 0; score += w.score + (won ? w.hearts * HEART_BONUS : 0);
    esc += w.stats.escapes; pecks += w.stats.caught; dur += w.elapsed;
  }
  console.log(`skill ${skill}: win ${(100 * wins / n).toFixed(0)}%  avgScore ${(score / n).toFixed(0)}  escapes ${(esc / n).toFixed(2)}  pecks ${(pecks / n).toFixed(2)}  avgLen ${(dur / n).toFixed(0)}s`);
}
for (const s of [0, 0.5, 1]) run(s, 300);
