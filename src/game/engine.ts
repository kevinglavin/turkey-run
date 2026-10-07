import { World, Vec2, Box, Circle, Edge, Polygon, type Body, type Contact } from 'planck';
import type { LevelDef, Material } from './levels';

// Pure game logic for Angry Turkeys: a planck (Box2D) world plus the rules on top.
// No React or three.js here, so the level-checking bot can run it headlessly.

export const GRAVITY = -12;
export const SLING = { x: 0, y: 2.4 }; // where the shot sits before launch
export const MAX_PULL = 2.4;
export const MAX_SPEED = 26;
const STEP = 1 / 60;
const SETTLE_SECONDS = 1.2; // ignore damage while a fresh level settles
const MAX_TURN_SECONDS = 7;

export type AmmoType = 'ball' | 'pumpkin' | 'balloon' | 'penny';

export const AMMO: Record<AmmoType, { r: number; density: number; restitution: number; label: string; tip: string }> = {
  ball: { r: 0.32, density: 2.4, restitution: 0.55, label: 'Tennis ball', tip: 'Bouncy and quick.' },
  pumpkin: { r: 0.55, density: 4.0, restitution: 0.05, label: 'Pumpkin', tip: 'Heavy. Smashes stone.' },
  balloon: { r: 0.42, density: 2.0, restitution: 0.2, label: 'Water balloon', tip: 'Tap in the air to split it into three.' },
  penny: { r: 0.5, density: 2.6, restitution: 0.2, label: 'Penny', tip: 'Tap in the air and she zooms forward.' },
};

export const MATERIALS: Record<Material, { density: number; friction: number; restitution: number; hp: number; points: number }> = {
  wood: { density: 0.8, friction: 0.7, restitution: 0.05, hp: 70, points: 500 },
  crate: { density: 0.5, friction: 0.7, restitution: 0.05, hp: 45, points: 300 },
  stone: { density: 2.4, friction: 0.8, restitution: 0.02, hp: 220, points: 800 },
  hay: { density: 0.4, friction: 0.95, restitution: 0.1, hp: 50, points: 300 },
  rock: { density: 0, friction: 0.8, restitution: 0.05, hp: Infinity, points: 0 },
};

const TURKEY = { density: 0.9, friction: 0.8, restitution: 0.1, hp: 30, bossHp: 80, points: 5000 };
// Damage comes from how hard things smash together (approach speed times mass),
// never from resting weight, so tall towers do not crush themselves.
const DAMAGE_SCALE = 5.5;
const MIN_APPROACH_SPEED = 1.0;

export type EntKind = 'block' | 'turkey' | 'shot' | 'ground';

export interface Ent {
  id: number;
  kind: EntKind;
  material?: Material;
  ammo?: AmmoType;
  shape: 'box' | 'circle';
  w: number;
  h: number;
  r: number;
  hp: number;
  maxHp: number;
  name?: string;
  boss?: boolean;
  body: Body;
  dead: boolean;
  hurtAt: number; // game time of the last big hit, for the "ouch" face
}

export type GameEvent =
  | { type: 'ko'; name: string; x: number; y: number; points: number }
  | { type: 'break'; material: Material; x: number; y: number; points: number }
  | { type: 'hit'; strength: number; x: number; y: number }
  | { type: 'launch'; ammo: AmmoType }
  | { type: 'ability'; ammo: AmmoType }
  | { type: 'turnEnd' }
  | { type: 'end'; won: boolean };

export type Phase = 'aiming' | 'flying' | 'over';

export class Game {
  world: World;
  ents = new Map<number, Ent>();
  level: LevelDef;
  ammo: AmmoType[];
  score = 0;
  time = 0;
  phase: Phase = 'aiming';
  won = false;
  events: GameEvent[] = [];
  shotsFired = 0;
  version = 0; // bumps whenever entities are added or removed, so the renderer knows to refresh
  private nextId = 1;
  private accumulator = 0;
  private turnStart = 0;
  private quietFor = 0;
  activeShot: Ent | null = null;
  abilityUsed = false;

  constructor(level: LevelDef) {
    this.level = level;
    this.ammo = [...level.ammo];
    this.world = new World({ gravity: Vec2(0, GRAVITY) });

    const ground = this.world.createBody({ type: 'static' });
    ground.createFixture(new Edge(Vec2(-40, 0), Vec2(140, 0)), { friction: 0.9 });
    this.add({ kind: 'ground', shape: 'box', w: 0, h: 0, r: 0, hp: Infinity, body: ground });

    for (const b of level.blocks) this.addBlock(b.m, b.x, b.y, b.w, b.h, b.a ?? 0);
    for (const t of level.turkeys) this.addTurkey(t.name, t.x, t.y, !!t.boss);

    this.world.on('pre-solve', (c: Contact) => this.onImpact(c));
  }

  private add(e: Omit<Ent, 'id' | 'dead' | 'hurtAt' | 'maxHp'> & { maxHp?: number }): Ent {
    const ent: Ent = { ...e, id: this.nextId++, dead: false, hurtAt: -99, maxHp: e.maxHp ?? e.hp };
    e.body.setUserData(ent);
    this.ents.set(ent.id, ent);
    this.version++;
    return ent;
  }

  private addBlock(m: Material, x: number, y: number, w: number, h: number, a: number) {
    const mat = MATERIALS[m];
    const isStatic = m === 'rock';
    const body = this.world.createBody({ type: isStatic ? 'static' : 'dynamic', position: Vec2(x, y), angle: a });
    body.createFixture(new Box(w / 2, h / 2), { density: mat.density, friction: mat.friction, restitution: mat.restitution });
    this.add({ kind: 'block', material: m, shape: 'box', w, h, r: 0, hp: mat.hp, body });
  }

  private addTurkey(name: string, x: number, y: number, boss: boolean) {
    const r = boss ? 0.72 : 0.5;
    const body = this.world.createBody({ type: 'dynamic', position: Vec2(x, y), angularDamping: 1.5 });
    // An octagon rather than a circle, so turkeys sit still on beams instead of rolling off.
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      return Vec2(Math.cos(a) * r, Math.sin(a) * r);
    });
    body.createFixture(new Polygon(pts), { density: TURKEY.density, friction: TURKEY.friction, restitution: TURKEY.restitution });
    const hp = boss ? TURKEY.bossHp : TURKEY.hp;
    this.add({ kind: 'turkey', shape: 'circle', w: r * 2, h: r * 2, r, hp, name, boss, body });
  }

  private onImpact(c: Contact) {
    if (this.time < SETTLE_SECONDS || !c.isTouching()) return;
    const wm = c.getWorldManifold(null);
    if (!wm || wm.points.length === 0) return;
    const bodyA = c.getFixtureA().getBody();
    const bodyB = c.getFixtureB().getBody();
    const p = wm.points[0];
    const va = bodyA.getLinearVelocityFromWorldPoint(p);
    const vb = bodyB.getLinearVelocityFromWorldPoint(p);
    // The normal points from A to B, so a negative relative speed means they are closing.
    const approach = -((vb.x - va.x) * wm.normal.x + (vb.y - va.y) * wm.normal.y);
    if (approach < MIN_APPROACH_SPEED) return;

    const ma = bodyA.getMass();
    const mb = bodyB.getMass();
    const mass = ma === 0 ? mb : mb === 0 ? ma : (ma * mb) / (ma + mb);
    const dmg = mass * (approach - MIN_APPROACH_SPEED) * DAMAGE_SCALE;
    if (dmg < 1) return;

    const a = bodyA.getUserData() as Ent;
    const b = bodyB.getUserData() as Ent;
    for (const e of [a, b]) {
      if (!e || e.dead || e.kind === 'ground' || e.kind === 'shot' || e.material === 'rock') continue;
      // Pumpkins hit harder than their mass alone, so they can crack stone.
      const other = e === a ? b : a;
      const mult = other?.ammo === 'pumpkin' ? 1.6 : 1;
      e.hp -= dmg * mult;
      if (dmg > 8) e.hurtAt = this.time;
    }
    if (dmg > 6) this.events.push({ type: 'hit', strength: dmg, x: p.x, y: p.y });
  }

  // The fort settles for a moment before the first shot is allowed.
  get ready() {
    return this.time >= SETTLE_SECONDS;
  }

  get turkeysLeft() {
    let n = 0;
    for (const e of this.ents.values()) if (e.kind === 'turkey' && !e.dead) n++;
    return n;
  }

  // Launch velocity for a pull vector (from the sling toward where the player dragged).
  static launchVelocity(pullX: number, pullY: number) {
    const len = Math.hypot(pullX, pullY);
    if (len < 0.15) return null;
    const speed = (Math.min(len, MAX_PULL) / MAX_PULL) * MAX_SPEED;
    return { vx: (-pullX / len) * speed, vy: (-pullY / len) * speed };
  }

  launch(vx: number, vy: number) {
    if (this.phase !== 'aiming' || this.ammo.length === 0 || !this.ready) return false;
    const type = this.ammo.shift()!;
    this.activeShot = this.spawnShot(type, SLING.x, SLING.y, vx, vy);
    this.phase = 'flying';
    this.turnStart = this.time;
    this.quietFor = 0;
    this.abilityUsed = false;
    this.shotsFired++;
    this.events.push({ type: 'launch', ammo: type });
    return true;
  }

  private spawnShot(type: AmmoType, x: number, y: number, vx: number, vy: number) {
    const a = AMMO[type];
    const body = this.world.createBody({ type: 'dynamic', position: Vec2(x, y), bullet: true, angularDamping: 0.3 });
    body.createFixture(new Circle(a.r), { density: a.density, friction: 0.5, restitution: a.restitution });
    body.setLinearVelocity(Vec2(vx, vy));
    return this.add({ kind: 'shot', ammo: type, shape: 'circle', w: a.r * 2, h: a.r * 2, r: a.r, hp: Infinity, body });
  }

  // Tap during flight.
  useAbility() {
    const s = this.activeShot;
    if (this.phase !== 'flying' || this.abilityUsed || !s || s.dead) return false;
    if (this.time - this.turnStart > 4) return false;
    const v = s.body.getLinearVelocity();
    const p = s.body.getPosition();
    if (s.ammo === 'balloon') {
      const speed = Math.hypot(v.x, v.y);
      const ang = Math.atan2(v.y, v.x);
      for (const d of [-0.22, 0.22]) {
        this.spawnShot('balloon', p.x, p.y + d, Math.cos(ang + d) * speed, Math.sin(ang + d) * speed);
      }
    } else if (s.ammo === 'penny') {
      const speed = Math.hypot(v.x, v.y);
      const boost = Math.min(32, speed * 1.9 + 6);
      s.body.setLinearVelocity(Vec2((v.x / (speed || 1)) * boost, (v.y / (speed || 1)) * boost));
    } else {
      return false;
    }
    this.abilityUsed = true;
    this.events.push({ type: 'ability', ammo: s.ammo! });
    return true;
  }

  // Advance by real elapsed time using fixed physics steps.
  update(dt: number) {
    this.accumulator += Math.min(dt, 0.1);
    while (this.accumulator >= STEP) {
      this.accumulator -= STEP;
      this.fixedStep();
    }
  }

  fixedStep() {
    if (this.phase === 'over') {
      this.world.step(STEP, 8, 3);
      this.time += STEP;
      return;
    }
    this.world.step(STEP, 8, 3);
    this.time += STEP;
    this.reap();

    if (this.phase === 'flying') {
      const moving = this.anythingMoving();
      this.quietFor = moving ? 0 : this.quietFor + STEP;
      const turnTime = this.time - this.turnStart;
      if (this.quietFor > 0.5 || turnTime > MAX_TURN_SECONDS || (this.turkeysLeft === 0 && turnTime > 2.5)) this.endTurn();
    }
  }

  private anythingMoving() {
    for (const e of this.ents.values()) {
      if (e.dead || e.kind === 'ground') continue;
      const b = e.body;
      if (!b.isAwake()) continue;
      const v = b.getLinearVelocity();
      if (Math.hypot(v.x, v.y) > 0.4 || Math.abs(b.getAngularVelocity()) > 0.6) return true;
    }
    return false;
  }

  private kill(e: Ent) {
    if (e.dead) return;
    e.dead = true;
    const p = e.body.getPosition();
    if (e.kind === 'turkey') {
      this.score += TURKEY.points;
      this.events.push({ type: 'ko', name: e.name!, x: p.x, y: p.y, points: TURKEY.points });
    } else if (e.kind === 'block' && e.material) {
      const pts = MATERIALS[e.material].points;
      this.score += pts;
      this.events.push({ type: 'break', material: e.material, x: p.x, y: p.y, points: pts });
    }
    this.world.destroyBody(e.body);
  }

  private reap() {
    for (const e of this.ents.values()) {
      if (e.dead || e.kind === 'ground') continue;
      const p = e.body.getPosition();
      const out = p.y < -4 || p.x < -25 || p.x > this.level.width + 25;
      if (e.hp <= 0 || out) {
        if (e.kind === 'shot') { e.dead = true; this.world.destroyBody(e.body); } else this.kill(e);
      }
    }
    this.sweep();
  }

  private sweep() {
    for (const [id, e] of this.ents) {
      if (e.dead) { this.ents.delete(id); this.version++; }
    }
  }

  private endTurn() {
    // Clear spent shots so the next one has a clean field.
    for (const e of this.ents.values()) {
      if (e.kind === 'shot' && !e.dead) { e.dead = true; this.world.destroyBody(e.body); }
    }
    this.sweep();
    this.activeShot = null;
    this.events.push({ type: 'turnEnd' });

    if (this.turkeysLeft === 0) {
      this.won = true;
      this.score += this.ammo.length * 10000;
      this.phase = 'over';
      this.events.push({ type: 'end', won: true });
    } else if (this.ammo.length === 0) {
      this.phase = 'over';
      this.events.push({ type: 'end', won: false });
    } else {
      this.phase = 'aiming';
    }
  }

  stars() {
    if (!this.won) return 0;
    const [, two, three] = this.level.stars;
    return this.score >= three ? 3 : this.score >= two ? 2 : 1;
  }
}
