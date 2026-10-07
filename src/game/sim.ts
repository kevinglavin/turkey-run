import {
  BUCKET, COMBO_WINDOW, FENCE_GAPS, HALF_H, HALF_W, MAX_COMBO, MUD_PATCHES, MUD_TURKEY_SPEED_MULT,
  PEN, PEN_GATE, PENNY, PENNY_SPAWN, ROUND_SECONDS, SHOO_POINTS, SQUEEZE_SECONDS, START_HEARTS,
  TAG_POINTS, TIMEOUT_SECONDS, TREAT_COUNT, TREAT_POINTS, TURKEYS, BARN, type Personality, type TurkeyDef,
} from './config';

// All per-frame game state lives in this plain mutable object, not in React state,
// so the simulation can run every frame without re-rendering the UI.

export interface Vec { x: number; z: number }

export type TurkeyState =
  | 'wander' | 'alert' | 'chase' | 'escape' | 'squeeze' | 'flee' | 'gloat' | 'puff' | 'timeout' | 'charge';

export interface Turkey {
  def: TurkeyDef;
  pos: Vec;
  facing: number; // radians around y
  state: TurkeyState;
  stateTime: number; // seconds left in timed states
  target: Vec;
  gapIndex: number;
  squeeze: number; // 0..1 progress through a fence gap
  puffCooldown: number;
  chargeCooldown: number;
  decideIn: number; // seconds until the next behavior decision
  puffScale: number;
}

export interface Treat { id: number; pos: Vec; active: boolean }

export type GameEvent =
  | { type: 'treat'; points: number; combo: number; pos: Vec }
  | { type: 'shoo'; name: string; pos: Vec }
  | { type: 'tag'; name: string; pos: Vec }
  | { type: 'caught'; name: string }
  | { type: 'escaped'; name: string; gap: string }
  | { type: 'stunned' }
  | { type: 'puff'; name: string }
  | { type: 'escaping'; name: string; gap: string }
  | { type: 'bucketSpawn' }
  | { type: 'bucketGrab' }
  | { type: 'dash' }
  | { type: 'end'; won: boolean };

export interface World {
  running: boolean;
  elapsed: number;
  score: number;
  hearts: number;
  stamina: number;
  combo: number;
  lastTreatAt: number;
  penny: {
    pos: Vec;
    facing: number;
    moving: boolean;
    dashLeft: number;
    stunLeft: number;
    invulnLeft: number;
  };
  pointer: Vec;
  pointerActive: boolean;
  keys: { up: boolean; down: boolean; left: boolean; right: boolean };
  turkeys: Turkey[];
  treats: Treat[];
  bucket: { active: boolean; pos: Vec; life: number; nextSpawnAt: number };
  powerLeft: number;
  wallace: { pos: Vec; dir: number; facing: number };
  events: GameEvent[];
  stats: { treats: number; shoos: number; tags: number; escapes: number; caught: number };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.z - b.z);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function inPenOrBarn(p: Vec) {
  return p.z < -11 && (Math.abs(p.x - PEN.x) < 3.5 || Math.abs(p.x - BARN.x) < 4);
}

function randomFieldPoint(margin = 1.5): Vec {
  for (let i = 0; i < 20; i++) {
    const p = { x: rand(-HALF_W + margin, HALF_W - margin), z: rand(-HALF_H + margin + 4, HALF_H - margin) };
    if (!inPenOrBarn(p)) return p;
  }
  return { x: 0, z: 0 };
}

// Point just inside the fence at a gap, and just outside it.
export function gapInside(i: number): Vec {
  const g = FENCE_GAPS[i];
  if (g.x === -HALF_W) return { x: g.x + 0.8, z: g.z };
  if (g.x === HALF_W) return { x: g.x - 0.8, z: g.z };
  return { x: g.x, z: g.z - 0.8 };
}
export function gapOutside(i: number): Vec {
  const g = FENCE_GAPS[i];
  if (g.x === -HALF_W) return { x: g.x - 0.6, z: g.z };
  if (g.x === HALF_W) return { x: g.x + 0.6, z: g.z };
  return { x: g.x, z: g.z + 0.6 };
}

function makeTurkey(def: TurkeyDef, i: number): Turkey {
  const pos = { x: -6 + i * 3, z: -7 + (i % 2) * 2 };
  return {
    def, pos, facing: 0, state: 'wander', stateTime: 0, target: randomFieldPoint(), gapIndex: 0,
    squeeze: 0, puffCooldown: 3, chargeCooldown: rand(2, 4), decideIn: rand(1.5, 3), puffScale: 1,
  };
}

export function createWorld(): World {
  return {
    running: false,
    elapsed: 0,
    score: 0,
    hearts: START_HEARTS,
    stamina: 100,
    combo: 0,
    lastTreatAt: -99,
    penny: { pos: { ...PENNY_SPAWN }, facing: Math.PI, moving: false, dashLeft: 0, stunLeft: 0, invulnLeft: 0 },
    pointer: { ...PENNY_SPAWN },
    pointerActive: false,
    keys: { up: false, down: false, left: false, right: false },
    turkeys: TURKEYS.map(makeTurkey),
    treats: Array.from({ length: TREAT_COUNT }, (_, id) => ({ id, pos: randomFieldPoint(), active: true })),
    bucket: { active: false, pos: { x: 0, z: 0 }, life: 0, nextSpawnAt: BUCKET.firstSpawnAt },
    powerLeft: 0,
    wallace: { pos: { x: BARN.x + 2.5, z: -11.5 }, dir: 1, facing: 0 },
    events: [],
    stats: { treats: 0, shoos: 0, tags: 0, escapes: 0, caught: 0 },
  };
}

// The single shared world. Replaced on every new round.
export let world: World = createWorld();
export function resetWorld() {
  world = createWorld();
  world.running = true;
  return world;
}

export function tryDash(w: World) {
  if (!w.running || w.stamina < PENNY.dashCost || w.penny.dashLeft > 0) return false;
  w.stamina -= PENNY.dashCost;
  w.penny.dashLeft = PENNY.dashSeconds;
  w.events.push({ type: 'dash' });
  return true;
}

function difficulty(w: World) {
  // Turkeys start a bit slow and get faster and bolder as the round goes on.
  return 0.85 + 0.4 * clamp(w.elapsed / ROUND_SECONDS, 0, 1);
}

function moveToward(p: Vec, target: Vec, speed: number, dt: number) {
  const dx = target.x - p.x;
  const dz = target.z - p.z;
  const d = Math.hypot(dx, dz);
  if (d < 1e-4) return 0;
  const step = Math.min(d, speed * dt);
  p.x += (dx / d) * step;
  p.z += (dz / d) * step;
  return Math.atan2(dx, dz);
}

function inMud(p: Vec) {
  return MUD_PATCHES.some(m => Math.hypot(p.x - m.x, p.z - m.z) < m.r);
}

function clampToField(p: Vec, margin = 0.6) {
  p.x = clamp(p.x, -HALF_W + margin, HALF_W - margin);
  p.z = clamp(p.z, -HALF_H + margin, HALF_H - margin);
}

function sendToPen(t: Turkey) {
  t.state = 'timeout';
  t.stateTime = TIMEOUT_SECONDS;
  t.squeeze = 0;
  t.pos = { x: PEN.x + rand(-1.2, 1.2), z: PEN.z + rand(-1, 1) };
}

function chooseGap(w: World): number {
  // Pick the gap farthest from Penny.
  let best = 0;
  let bestD = -1;
  FENCE_GAPS.forEach((_, i) => {
    const d = dist(gapInside(i), w.penny.pos);
    if (d > bestD) { bestD = d; best = i; }
  });
  return best;
}

function escapingCount(w: World) {
  return w.turkeys.filter(t => t.state === 'escape' || t.state === 'squeeze').length;
}

function chasingCount(w: World) {
  return w.turkeys.filter(t => t.state === 'chase' || t.state === 'charge' || t.state === 'puff' || t.state === 'alert').length;
}

const GRACE_SECONDS = 4; // nobody hunts at the start of a round
const FIRST_ESCAPE_AT = 10;
// Only one turkey hunts Penny at a time for the first 30 seconds, then two.
const maxChasers = (w: World) => (w.elapsed < 30 ? 1 : 2);

function decide(w: World, t: Turkey) {
  const p = t.def.personality as Personality;
  const dPenny = dist(t.pos, w.penny.pos);
  const boldness = difficulty(w);
  // One escape attempt at a time early on, two at once in the last half of the round.
  const maxEscaping = w.elapsed > ROUND_SECONDS / 2 ? 2 : 1;
  const canEscape = escapingCount(w) < maxEscaping && w.elapsed > FIRST_ESCAPE_AT;
  const canChase = chasingCount(w) < maxChasers(w) && w.elapsed > GRACE_SECONDS;
  const wander = () => { t.state = 'wander'; t.target = randomFieldPoint(); };
  const chase = () => { t.state = 'chase'; t.stateTime = rand(2.5, 4); };

  const startEscape = () => {
    t.state = 'escape';
    t.gapIndex = chooseGap(w);
    w.events.push({ type: 'escaping', name: t.def.name, gap: FENCE_GAPS[t.gapIndex].label });
  };

  switch (p) {
    case 'escaper':
      if (canEscape && Math.random() < 0.6 * boldness) startEscape();
      else wander();
      t.decideIn = rand(3, 5);
      break;
    case 'boss':
    case 'charger':
    case 'sneaky':
      if (canEscape && Math.random() < 0.12 * boldness) startEscape();
      else if (canChase && Math.random() < 0.55 * boldness) chase();
      else wander();
      t.decideIn = rand(2.5, 4);
      break;
    case 'scatter':
      if (canEscape && Math.random() < 0.18 * boldness) startEscape();
      else if (canChase && dPenny < 5) chase();
      else wander();
      t.decideIn = rand(2, 3.5);
      break;
  }
}

function stepPenny(w: World, dt: number) {
  const pn = w.penny;
  pn.dashLeft = Math.max(0, pn.dashLeft - dt);
  pn.stunLeft = Math.max(0, pn.stunLeft - dt);
  pn.invulnLeft = Math.max(0, pn.invulnLeft - dt);
  w.stamina = Math.min(100, w.stamina + PENNY.staminaRegen * dt);

  let speed = pn.dashLeft > 0 ? PENNY.dashSpeed : PENNY.speed;
  if (pn.stunLeft > 0) speed *= PENNY.stunSpeedMult;

  const k = w.keys;
  let mx = (k.right ? 1 : 0) - (k.left ? 1 : 0);
  let mz = (k.down ? 1 : 0) - (k.up ? 1 : 0);
  pn.moving = false;
  if (mx !== 0 || mz !== 0) {
    const len = Math.hypot(mx, mz);
    mx /= len; mz /= len;
    pn.pos.x += mx * speed * dt;
    pn.pos.z += mz * speed * dt;
    pn.facing = Math.atan2(mx, mz);
    pn.moving = true;
    w.pointer.x = pn.pos.x; w.pointer.z = pn.pos.z;
  } else {
    const d = dist(pn.pos, w.pointer);
    if (d > 0.3) {
      pn.facing = moveToward(pn.pos, w.pointer, Math.min(speed, Math.max(d * 6, 2)), dt);
      pn.moving = true;
    } else if (pn.dashLeft > 0) {
      // Dash with no target: lunge forward.
      pn.pos.x += Math.sin(pn.facing) * speed * dt;
      pn.pos.z += Math.cos(pn.facing) * speed * dt;
      pn.moving = true;
    }
  }
  clampToField(pn.pos);
  // Keep Penny out of the pen and barn.
  if (pn.pos.z < -11.5 && Math.abs(pn.pos.x - PEN.x) < PEN.size / 2 + 0.4) pn.pos.z = -11.5;
  if (pn.pos.z < -12 && Math.abs(pn.pos.x - BARN.x) < 3) pn.pos.z = -12;
}

function stepTurkey(w: World, t: Turkey, dt: number) {
  const pn = w.penny;
  const boldness = difficulty(w);
  let speed = t.def.speed * boldness;
  if (inMud(t.pos)) speed *= MUD_TURKEY_SPEED_MULT;
  const dPenny = dist(t.pos, pn.pos);
  const powered = w.powerLeft > 0;

  t.puffCooldown = Math.max(0, t.puffCooldown - dt);
  t.chargeCooldown = Math.max(0, t.chargeCooldown - dt);
  t.puffScale += ((t.state === 'puff' ? 1.6 : 1) - t.puffScale) * Math.min(1, dt * 8);

  if (t.state === 'timeout') {
    t.stateTime -= dt;
    if (t.stateTime <= 0) {
      t.pos = { ...PEN_GATE };
      t.state = 'wander';
      t.target = randomFieldPoint();
      t.decideIn = rand(2, 3);
    }
    return;
  }

  // Power mode: everyone runs from Penny, and touching a turkey sends it to the pen.
  if (powered) {
    if (dPenny < PENNY.catchRadius + 0.3) {
      w.score += TAG_POINTS;
      w.stats.tags++;
      w.events.push({ type: 'tag', name: t.def.name, pos: { ...t.pos } });
      sendToPen(t);
      return;
    }
    if (t.state !== 'squeeze') {
      const away = { x: t.pos.x + (t.pos.x - pn.pos.x), z: t.pos.z + (t.pos.z - pn.pos.z) };
      t.facing = moveToward(t.pos, away, speed * 0.85, dt);
      clampToField(t.pos);
      return;
    }
  }

  // Penny shoos escaping turkeys back by getting close.
  if ((t.state === 'escape' || t.state === 'squeeze') && dPenny < PENNY.shooRadius) {
    w.score += SHOO_POINTS;
    w.stats.shoos++;
    w.events.push({ type: 'shoo', name: t.def.name, pos: { ...t.pos } });
    t.state = 'flee';
    t.stateTime = 1.4;
    t.squeeze = 0;
    // A shooed turkey sulks for a while before trying again.
    t.decideIn = rand(5, 8);
    return;
  }

  t.decideIn -= dt;
  if (t.decideIn <= 0 && t.state === 'wander') decide(w, t);

  switch (t.state) {
    case 'wander': {
      if (dist(t.pos, t.target) < 0.5) t.target = randomFieldPoint();
      t.facing = moveToward(t.pos, t.target, speed * 0.6, dt);
      if (t.def.personality === 'scatter' && dPenny < 4 && w.elapsed > GRACE_SECONDS && chasingCount(w) < maxChasers(w)) {
        // Notice Penny first, so the player gets a warning.
        t.state = 'alert';
        t.stateTime = 0.6;
      }
      break;
    }
    case 'chase': {
      t.stateTime -= dt;
      if (t.stateTime <= 0) {
        // Tired of chasing: rest for a while.
        t.state = 'wander';
        t.target = randomFieldPoint();
        t.decideIn = rand(3.5, 6);
        break;
      }
      let target: Vec = pn.pos;
      if (t.def.personality === 'sneaky') {
        target = { x: pn.pos.x + Math.sin(pn.facing) * 3, z: pn.pos.z + Math.cos(pn.facing) * 3 };
      }
      if (t.def.personality === 'boss' && dPenny < 3 && t.puffCooldown <= 0) {
        t.state = 'puff';
        t.stateTime = 0.8;
        w.events.push({ type: 'puff', name: t.def.name });
        break;
      }
      if (t.def.personality === 'charger' && dPenny < 8 && dPenny > 2 && t.chargeCooldown <= 0) {
        t.state = 'charge';
        t.stateTime = 0.6;
        t.target = { x: pn.pos.x, z: pn.pos.z };
        break;
      }
      t.facing = moveToward(t.pos, target, speed, dt);
      break;
    }
    case 'alert': {
      t.stateTime -= dt;
      t.facing = Math.atan2(pn.pos.x - t.pos.x, pn.pos.z - t.pos.z);
      if (t.stateTime <= 0) { t.state = 'chase'; t.stateTime = 2.5; }
      break;
    }
    case 'charge': {
      t.stateTime -= dt;
      t.facing = moveToward(t.pos, t.target, speed * 2.0, dt);
      if (t.stateTime <= 0 || dist(t.pos, t.target) < 0.3) {
        t.state = 'chase';
        t.stateTime = Math.max(t.stateTime, 1);
        t.chargeCooldown = rand(3.5, 5.5);
      }
      break;
    }
    case 'puff': {
      t.stateTime -= dt;
      t.facing = Math.atan2(pn.pos.x - t.pos.x, pn.pos.z - t.pos.z);
      if (t.stateTime <= 0) {
        if (dPenny < 3.4 && pn.invulnLeft <= 0) {
          pn.stunLeft = 1.3;
          w.events.push({ type: 'stunned' });
        }
        t.state = 'chase';
        t.stateTime = Math.max(t.stateTime, 1);
        t.puffCooldown = 5;
      }
      break;
    }
    case 'escape': {
      const inside = gapInside(t.gapIndex);
      t.facing = moveToward(t.pos, inside, speed * 0.9, dt);
      if (dist(t.pos, inside) < 0.3) { t.state = 'squeeze'; t.squeeze = 0; }
      break;
    }
    case 'squeeze': {
      t.squeeze += dt / SQUEEZE_SECONDS;
      const inside = gapInside(t.gapIndex);
      const outside = gapOutside(t.gapIndex);
      t.pos.x = inside.x + (outside.x - inside.x) * t.squeeze;
      t.pos.z = inside.z + (outside.z - inside.z) * t.squeeze;
      t.facing = Math.atan2(outside.x - inside.x, outside.z - inside.z);
      if (t.squeeze >= 1) {
        w.hearts--;
        w.stats.escapes++;
        w.events.push({ type: 'escaped', name: t.def.name, gap: FENCE_GAPS[t.gapIndex].label });
        sendToPen(t);
      }
      return; // no clamping while squeezing through the fence
    }
    case 'flee': {
      t.stateTime -= dt;
      const away = { x: t.pos.x + (t.pos.x - pn.pos.x), z: t.pos.z + (t.pos.z - pn.pos.z) };
      t.facing = moveToward(t.pos, away, speed * 1.2, dt);
      if (t.stateTime <= 0) { t.state = 'wander'; t.target = randomFieldPoint(); t.decideIn = Math.max(t.decideIn, 2); }
      break;
    }
    case 'gloat': {
      t.stateTime -= dt;
      if (t.stateTime <= 0) { t.state = 'wander'; t.target = randomFieldPoint(); t.decideIn = rand(1, 2); }
      break;
    }
  }

  // Catching Penny.
  const hunting = t.state === 'chase' || t.state === 'charge';
  if (hunting && dPenny < PENNY.catchRadius && pn.invulnLeft <= 0) {
    w.hearts--;
    w.stats.caught++;
    pn.invulnLeft = PENNY.invulnSeconds;
    // Knock Penny away from the turkey.
    const dx = pn.pos.x - t.pos.x;
    const dz = pn.pos.z - t.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    pn.pos.x += (dx / d) * 2;
    pn.pos.z += (dz / d) * 2;
    clampToField(pn.pos);
    w.pointer.x = pn.pos.x; w.pointer.z = pn.pos.z;
    t.state = 'gloat';
    t.stateTime = 1.5;
    w.events.push({ type: 'caught', name: t.def.name });
  }

  clampToField(t.pos);
}

function separateTurkeys(w: World) {
  const ts = w.turkeys;
  for (let i = 0; i < ts.length; i++) {
    for (let j = i + 1; j < ts.length; j++) {
      const a = ts[i], b = ts[j];
      if (a.state === 'timeout' || b.state === 'timeout' || a.state === 'squeeze' || b.state === 'squeeze') continue;
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 0 && d < 1.2) {
        const push = (1.2 - d) / 2;
        a.pos.x -= (dx / d) * push; a.pos.z -= (dz / d) * push;
        b.pos.x += (dx / d) * push; b.pos.z += (dz / d) * push;
      }
    }
  }
}

function stepTreats(w: World) {
  for (const tr of w.treats) {
    if (!tr.active) continue;
    if (dist(tr.pos, w.penny.pos) < 1.0) {
      w.combo = w.elapsed - w.lastTreatAt <= COMBO_WINDOW ? Math.min(MAX_COMBO, w.combo + 1) : 1;
      w.lastTreatAt = w.elapsed;
      const points = TREAT_POINTS * w.combo;
      w.score += points;
      w.stats.treats++;
      w.events.push({ type: 'treat', points, combo: w.combo, pos: { ...tr.pos } });
      tr.pos = randomFieldPoint();
    }
  }
}

function stepBucket(w: World, dt: number) {
  const b = w.bucket;
  w.powerLeft = Math.max(0, w.powerLeft - dt);
  if (b.active) {
    b.life -= dt;
    if (dist(b.pos, w.penny.pos) < 1.2) {
      b.active = false;
      w.powerLeft = BUCKET.powerSeconds;
      b.nextSpawnAt = w.elapsed + BUCKET.respawnEvery;
      w.events.push({ type: 'bucketGrab' });
    } else if (b.life <= 0) {
      b.active = false;
      b.nextSpawnAt = w.elapsed + BUCKET.respawnEvery / 2;
    }
  } else if (w.elapsed >= b.nextSpawnAt && w.powerLeft <= 0) {
    b.active = true;
    b.life = BUCKET.lifetime;
    b.pos = randomFieldPoint(2.5);
    w.events.push({ type: 'bucketSpawn' });
  }
}

function stepWallace(w: World, dt: number) {
  const wl = w.wallace;
  wl.pos.x += wl.dir * 1.2 * dt;
  if (wl.pos.x > 2.5) wl.dir = -1;
  if (wl.pos.x < -7) wl.dir = 1;
  wl.facing = wl.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
}

export function step(w: World, rawDt: number) {
  if (!w.running) return;
  const dt = Math.min(rawDt, 0.05);
  w.elapsed += dt;

  stepPenny(w, dt);
  for (const t of w.turkeys) stepTurkey(w, t, dt);
  separateTurkeys(w);
  stepTreats(w);
  stepBucket(w, dt);
  stepWallace(w, dt);

  if (w.hearts <= 0) {
    w.hearts = 0;
    w.running = false;
    w.events.push({ type: 'end', won: false });
  } else if (w.elapsed >= ROUND_SECONDS) {
    w.running = false;
    w.events.push({ type: 'end', won: true });
  }
}
