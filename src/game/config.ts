// Farm layout. x runs -10..10 (left to right), z runs -18..18 (top to bottom of the screen).
export const WORLD_WIDTH = 20;
export const WORLD_HEIGHT = 36;
export const HALF_W = WORLD_WIDTH / 2;
export const HALF_H = WORLD_HEIGHT / 2;

export const ROUND_SECONDS = 90;
export const START_HEARTS = 3;

export const PENNY_SPAWN = { x: 0, z: 10 };

export const PENNY = {
  speed: 7.0,
  dashSpeed: 15.0,
  dashSeconds: 0.3,
  dashCost: 30,
  staminaRegen: 18, // per second
  stunSpeedMult: 0.4,
  invulnSeconds: 2.0,
  catchRadius: 0.9,
  shooRadius: 2.4,
};

// Gaps in the fence the turkeys try to squeeze through.
export const GAP_WIDTH = 2.6;
export const FENCE_GAPS = [
  { id: 'west', x: -HALF_W, z: 2, label: 'West gap' },
  { id: 'east', x: HALF_W, z: -5, label: 'East gap' },
  { id: 'south', x: 0, z: HALF_H, label: 'South gap' },
] as const;
export const SQUEEZE_SECONDS = 3.8;

// Wallace's barn and the turkey time-out pen along the top of the farm.
export const BARN = { x: -4, z: -14.5 };
export const PEN = { x: 6, z: -14.5, size: 4 };
export const PEN_GATE = { x: 6, z: -11.5 };

export const MUD_PATCHES = [
  { x: -5, z: -3, r: 2.2 },
  { x: 5, z: 9, r: 2.0 },
];
export const MUD_TURKEY_SPEED_MULT = 0.45;

export const TREAT_COUNT = 5;
export const TREAT_POINTS = 10;
export const COMBO_WINDOW = 2.5; // seconds between treats to keep a combo going
export const MAX_COMBO = 5;
export const SHOO_POINTS = 25;
export const TAG_POINTS = 50;
export const HEART_BONUS = 100;

export const BUCKET = {
  firstSpawnAt: 18, // seconds into the round
  respawnEvery: 22,
  lifetime: 10,
  powerSeconds: 7,
};

export const TIMEOUT_SECONDS = 5;

export type Personality = 'boss' | 'charger' | 'sneaky' | 'escaper' | 'scatter';

export interface TurkeyDef {
  id: string;
  name: string;
  personality: Personality;
  speed: number;
  color: string;
  blurb: string;
}

// Rename these to match the real turkeys.
export const TURKEYS: TurkeyDef[] = [
  { id: 't1', name: 'Big Tom', personality: 'boss', speed: 3.2, color: '#5b3a24', blurb: 'Slow, but puffs up and stuns Penny if she gets too close.' },
  { id: 't2', name: 'Rocket', personality: 'charger', speed: 4.0, color: '#7a4a2a', blurb: 'Charges straight at Penny in sudden bursts.' },
  { id: 't3', name: 'Sly', personality: 'sneaky', speed: 4.1, color: '#4a3b30', blurb: 'Cuts Penny off by running to where she is going.' },
  { id: 't4', name: 'Houdini', personality: 'escaper', speed: 4.0, color: '#8a6a4a', blurb: 'Ignores Penny and goes for the fence gaps.' },
  { id: 't5', name: 'Noodle', personality: 'scatter', speed: 3.9, color: '#6b5444', blurb: 'Wanders randomly, then chases when Penny is near.' },
];
