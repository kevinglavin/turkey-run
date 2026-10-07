import type { AmmoType } from './engine';

export type Material = 'wood' | 'crate' | 'stone' | 'hay' | 'rock';

export interface BlockDef { m: Material; x: number; y: number; w: number; h: number; a?: number }
export interface TurkeySpot { name: string; x: number; y: number; boss?: boolean }

export interface LevelDef {
  id: number;
  name: string;
  intro: string;
  ammo: AmmoType[];
  width: number; // rightmost x of the fort, used for camera framing and bounds
  blocks: BlockDef[];
  turkeys: TurkeySpot[];
  stars: [number, number, number]; // score for 1, 2, 3 stars (1 star is just winning); set from npm run solve
}

// Small builder so levels read like "put a post here, a beam on top".
// Every y passed in is the height of the surface the piece sits on.
class B {
  blocks: BlockDef[] = [];
  turkeys: TurkeySpot[] = [];
  static T = 0.35; // thickness of posts and beams

  post(x: number, base: number, h = 2, m: Material = 'wood') {
    this.blocks.push({ m, x, y: base + h / 2, w: B.T, h });
    return base + h;
  }
  beam(x: number, base: number, w = 3, m: Material = 'wood') {
    this.blocks.push({ m, x, y: base + B.T / 2, w, h: B.T });
    return base + B.T;
  }
  box(x: number, base: number, s = 1, m: Material = 'crate') {
    this.blocks.push({ m, x, y: base + s / 2, w: s, h: s });
    return base + s;
  }
  slab(x: number, base: number, w: number, h: number, m: Material = 'stone') {
    this.blocks.push({ m, x, y: base + h / 2, w, h });
    return base + h;
  }
  // Square hay bale.
  bale(x: number, base: number, w = 1.3, h = 0.8) {
    this.blocks.push({ m: 'hay', x, y: base + h / 2, w, h });
    return base + h;
  }
  hill(x: number, w: number, h: number) {
    this.blocks.push({ m: 'rock', x, y: h / 2, w, h });
    return h;
  }
  // Two posts with a beam across the top. Returns the height of the top.
  frame(x: number, base: number, w = 3, h = 2, m: Material = 'wood') {
    this.post(x - w / 2 + B.T / 2, base, h, m);
    this.post(x + w / 2 - B.T / 2, base, h, m);
    return this.beam(x, base + h, w + 0.3, m);
  }
  turkey(name: string, x: number, base: number, boss = false) {
    this.turkeys.push({ name, x, y: base + (boss ? 0.72 : 0.5) + 0.02, boss });
  }
}

type Spec = Omit<LevelDef, 'blocks' | 'turkeys'> & { build: (b: B) => void };

const SPECS: Spec[] = [
  {
    id: 1, name: 'Morning Gobble', width: 24, stars: [0, 12000, 17000],
    intro: 'Bob and Kevin have built a shed. Pull back on the catapult and let go.',
    ammo: ['ball', 'ball', 'ball'],
    build: b => {
      const top = b.frame(20, 0, 3, 2);
      b.turkey('Bob', 20, 0);
      b.turkey('Kevin', 20, top);
    },
  },
  {
    id: 2, name: 'Stack Attack', width: 26, stars: [0, 18000, 26000],
    intro: 'Two floors this time. Knock the top down onto the bottom.',
    ammo: ['ball', 'ball', 'ball', 'ball'],
    build: b => {
      let top = b.frame(21, 0, 3.2, 2);
      b.turkey('Martin', 21, 0);
      top = b.frame(21, top, 3.2, 1.8);
      b.turkey('Elliot', 21, top - 1.8 - B.T);
      b.box(19, 0, 1);
      b.box(23, 0, 1);
      b.box(21, top, 0.9);
    },
  },
  {
    id: 3, name: 'Hay There', width: 26, stars: [0, 17000, 25000],
    intro: 'Meet the pumpkin. It is heavy, so lob it high.',
    ammo: ['pumpkin', 'ball', 'ball'],
    build: b => {
      // Two hay columns with a beam across; Dave hides underneath, Bob sits on top.
      for (const x of [19.4, 22.6]) b.bale(x, b.bale(x, 0));
      const top = b.beam(21, 1.6, 4.6);
      b.turkey('Dave', 21, 0, true);
      b.bale(19.6, top);
      b.bale(22.4, top);
      b.turkey('Bob', 21, top);
    },
  },
  {
    id: 4, name: 'Stone Wall', width: 28, stars: [0, 18000, 26000],
    intro: 'Stone only cracks under something heavy. Pumpkins time.',
    ammo: ['pumpkin', 'pumpkin', 'pumpkin'],
    build: b => {
      b.post(18, 0, 2.6, 'stone');
      b.post(18.6, 0, 2.6, 'stone');
      b.turkey('Kevin', 20.2, 0);
      b.frame(22, 0, 3, 2.2);
      b.turkey('Martin', 22, 0);
      b.slab(22, 2.55, 3.4, 0.5, 'stone');
    },
  },
  {
    id: 5, name: 'Splash Zone', width: 30, stars: [0, 15000, 22000],
    intro: 'Three huts, one turkey each. Tap a water balloon in the air to split it into three.',
    ammo: ['balloon', 'balloon', 'ball'],
    build: b => {
      for (const [x, n] of [[18, 'Elliot'], [22, 'Bob'], [26, 'Kevin']] as const) {
        b.frame(x, 0, 2.4, 1.7, 'crate');
        b.turkey(n, x, 0);
      }
    },
  },
  {
    id: 6, name: 'King of the Hill', width: 30, stars: [0, 17000, 25000],
    intro: 'Penny volunteers. Tap while she flies and she zooms forward.',
    ammo: ['penny', 'ball', 'ball'],
    build: b => {
      const g = b.hill(23, 7, 3);
      const top = b.frame(22, g, 3, 2);
      b.turkey('Martin', 22, g);
      b.turkey('Dave', 22, top, true);
      b.box(25, g, 1);
    },
  },
  {
    id: 7, name: "Dave's Tower", width: 28, stars: [0, 24000, 35000],
    intro: 'Dave climbed to the top of a very wobbly tower.',
    ammo: ['penny', 'pumpkin', 'ball', 'ball'],
    build: b => {
      let h = 0;
      for (let i = 0; i < 4; i++) h = b.frame(22, h, 2.6, 1.6, i % 2 ? 'crate' : 'wood');
      b.turkey('Dave', 22, h, true);
      b.turkey('Bob', 22, 0);
      b.box(24.5, 0, 1);
      b.box(19.5, 0, 1);
    },
  },
  {
    id: 8, name: 'Two Forts', width: 32, stars: [0, 21000, 31000],
    intro: 'The turkeys split up. One fort near, one far.',
    ammo: ['balloon', 'pumpkin', 'penny', 'ball'],
    build: b => {
      let top = b.frame(18, 0, 2.8, 1.8);
      b.turkey('Kevin', 18, 0);
      b.box(18, top, 0.9);
      const g = b.hill(28, 6, 1.5);
      top = b.frame(28, g, 3, 1.8, 'stone');
      b.turkey('Elliot', 28, g);
      top = b.frame(28, top, 3, 1.6);
      b.turkey('Martin', 28, top - 1.6 - B.T);
    },
  },
  {
    id: 9, name: 'The Bunker', width: 30, stars: [0, 26000, 38000],
    intro: 'A stone bunker with a crate roof. Find the weak spot.',
    ammo: ['pumpkin', 'pumpkin', 'penny', 'balloon'],
    build: b => {
      b.slab(20, 0, 0.6, 2.2, 'stone');
      b.slab(25.5, 0, 0.6, 2.2, 'stone');
      b.turkey('Bob', 21.8, 0);
      b.turkey('Martin', 23.6, 0);
      const r = b.beam(22.75, 2.2, 6.4, 'wood');
      b.box(21.2, r, 1);
      b.box(22.75, r, 1);
      b.box(24.3, r, 1);
      b.turkey('Kevin', 22.75, r + 1);
    },
  },
  {
    id: 10, name: "Dave's Castle", width: 34, stars: [0, 34000, 49000],
    intro: 'All five turkeys. Dave sits on his throne at the top. Good luck, Penny.',
    ammo: ['pumpkin', 'penny', 'balloon', 'pumpkin', 'ball'],
    build: b => {
      // Left keep
      let top = b.frame(19, 0, 2.6, 2, 'stone');
      b.turkey('Elliot', 19, 0);
      b.turkey('Bob', 19, top);
      // Middle hall, two floors
      top = b.frame(23.5, 0, 3.4, 2.2);
      b.turkey('Martin', 23.5, 0);
      top = b.frame(23.5, top, 3.4, 2);
      b.turkey('Dave', 23.5, top - 2 - B.T, true);
      b.box(22.6, top, 0.9, 'crate');
      b.box(24.4, top, 0.9, 'crate');
      // Right tower on a hill
      const g = b.hill(29.5, 4, 1.2);
      top = b.frame(29.5, g, 2.4, 2.2, 'stone');
      b.turkey('Kevin', 29.5, g);
      b.bale(29.5, top);
    },
  },
];

export const LEVELS: LevelDef[] = SPECS.map(({ build, ...rest }) => {
  const b = new B();
  build(b);
  return { ...rest, blocks: b.blocks, turkeys: b.turkeys };
});
