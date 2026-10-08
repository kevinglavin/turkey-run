import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { Color, InstancedMesh, Object3D, OrthographicCamera, type Group } from 'three';
import { AMMO, GRAVITY, Game, MAX_PULL, SLING, type Ent } from '../game/engine';
import { LEVELS } from '../game/levels';
import { useStore } from '../game/store';
import { sfx } from '../game/audio';
import { AmmoModel, BlockModel, CatapultModel, CowModel, DonkeyModel, PennyModel, PRONG_BACK, PRONG_FRONT, RangerModel, SlothModel, TurkeyModel, WallaceModel, type RangerPose } from './models';

// The current game, so the HUD can read it (for example to know whether Penny is next).
// targeting: the next tap on the farm picks where Ranger's Sky Paw lands.
export const live: { game: Game | null; targeting: boolean } = { game: null, targeting: false };
// Wallace cheers until this clock time (set when a turkey is knocked out).
const crewState = { cheerUntil: 0, howlUntil: 0 };

const LEFT_EDGE = -8.6; // leftmost world x the camera shows (room for Ranger)

// ---------- Particles (feathers, splinters, splashes) ----------

interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; size: number; color: Color; spin: number }
const particles: Particle[] = [];
const MAX_PARTICLES = 260;

function burst(x: number, y: number, colors: string[], n: number, speed = 5, size = 0.18) {
  for (let i = 0; i < n; i++) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.8);
    particles.push({
      x, y, z: (Math.random() - 0.5) * 0.8,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s + 2, vz: (Math.random() - 0.5) * 2,
      life: 0, max: 0.7 + Math.random() * 0.8, size: size * (0.6 + Math.random() * 0.8),
      color: new Color(colors[i % colors.length]), spin: Math.random() * 6,
    });
  }
}

function Particles() {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const d = Math.min(dt, 0.05);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += d;
      if (p.life > p.max) { particles.splice(i, 1); continue; }
      p.vy -= 9 * d;
      p.vx *= 0.98;
      p.x += p.vx * d; p.y += p.vy * d; p.z += p.vz * d;
      if (p.y < 0.05) { p.y = 0.05; p.vy *= -0.3; p.vx *= 0.7; }
    }
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (p) {
        const k = 1 - p.life / p.max;
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.life * p.spin, p.life * p.spin * 0.7, 0);
        dummy.scale.setScalar(p.size * Math.min(1, k * 2));
        m.setColorAt(i, p.color);
      } else {
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX_PARTICLES]} frustumCulled={false}>
      <boxGeometry args={[1, 0.5, 0.15]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

// ---------- Scenery ----------

function Scenery() {
  const clouds = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!clouds.current) return;
    clouds.current.position.x += dt * 0.4;
    if (clouds.current.position.x > 30) clouds.current.position.x = -30;
  });
  return (
    <group>
      {/* Ground: grass on top of dirt */}
      <mesh position={[50, -0.15, 0]} receiveShadow>
        <boxGeometry args={[200, 0.3, 8]} />
        <meshStandardMaterial color="#6aa53a" roughness={0.9} />
      </mesh>
      <mesh position={[50, -20.3, 0]}>
        <boxGeometry args={[200, 40, 80]} />
        <meshStandardMaterial color="#8a6a45" roughness={1} />
      </mesh>
      {/* Rolling hills far behind */}
      {[[-10, 9, '#7fb95a'], [8, 12, '#8cc36a'], [28, 10, '#7fb95a'], [46, 13, '#8cc36a'], [64, 9, '#7fb95a']].map(([x, r, c], i) => (
        <mesh key={i} position={[x as number, -(r as number) * 0.45, -30]} scale={[1.6, 1, 1]}>
          <sphereGeometry args={[r as number, 24, 16]} />
          <meshStandardMaterial color={c as string} roughness={1} />
        </mesh>
      ))}
      {/* Wallace's red barn in the distance */}
      <group position={[-12, 0, -18]}>
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[5, 4, 3]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 4.6, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <cylinderGeometry args={[2.9, 2.9, 3.1, 3]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 1.2, 1.52]}>
          <boxGeometry args={[1.6, 2.4, 0.05]} />
          <meshStandardMaterial color="#f5f5f4" />
        </mesh>
      </group>
      {/* Clouds */}
      <group ref={clouds}>
        {[[-8, 13], [6, 15], [20, 12.5], [34, 14.5], [48, 13]].map(([x, y], i) => (
          <group key={i} position={[x, y, -20]}>
            {[[-1.1, 0, 1], [0, 0.4, 1.4], [1.2, 0, 1.1]].map(([dx, dy, r], j) => (
              <mesh key={j} position={[dx, dy, 0]}>
                <sphereGeometry args={[r, 16, 12]} />
                <meshStandardMaterial color="#ffffff" roughness={1} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {/* Sun */}
      <mesh position={[40, 16, -40]}>
        <sphereGeometry args={[2.2, 24, 16]} />
        <meshBasicMaterial color="#fde68a" />
      </mesh>
    </group>
  );
}

function Lights() {
  const low = useStore(s => s.lowGraphics);
  return (
    <>
      <hemisphereLight args={['#dff3ff', '#6aa53a', 0.9]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[-12, 22, 18]}
        intensity={1.9}
        castShadow={!low}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={42}
        shadow-camera-top={16}
        shadow-camera-bottom={-4}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0005}
      />
    </>
  );
}

// ---------- Entities ----------

function EntView({ ent, game, labels }: { ent: Ent; game: Game; labels: boolean }) {
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const [hurt, setHurt] = useState(false);
  const [health, setHealth] = useState(1);
  const [pose, setPose] = useState('');
  const legs = useRef<Group>(null);

  useFrame(() => {
    if (ent.dead || !outer.current || !inner.current) return;
    const p = ent.body.getPosition();
    outer.current.position.set(p.x, p.y, 0);
    if (ent.kind === 'shot' && ent.ammo === 'penny') {
      // Penny points the way she is flying.
      const v = ent.body.getLinearVelocity();
      if (Math.hypot(v.x, v.y) > 1) inner.current.rotation.z = Math.atan2(v.y, v.x);
    } else {
      inner.current.rotation.z = ent.body.getAngle();
    }
    if (ent.kind === 'helper') {
      inner.current.rotation.z = 0;
      inner.current.scale.x = ent.facing ?? 1;
      const p2 = `${ent.act}`;
      if (p2 !== pose) setPose(p2);
      // Trot: bob up and down while moving.
      const moving = ent.act === 'run' || ent.act === 'leave';
      inner.current.position.y = moving ? Math.abs(Math.sin(game.time * 12)) * 0.08 : 0;
    }
    if (ent.ammo === 'sloth') {
      const yawning = ent.grabbedAt !== undefined && game.time - ent.grabbedAt > 1.0 && game.time - ent.grabbedAt < 2.6;
      const p2 = `${ent.grabbedAt !== undefined ? 'grab' : ''}${yawning ? 'yawn' : ''}`;
      if (p2 !== pose) setPose(p2);
    }
    if (ent.kind === 'turkey') {
      const h = game.time - ent.hurtAt < 0.8;
      if (h !== hurt) setHurt(h);
    }
    if (ent.kind === 'block' && Number.isFinite(ent.maxHp)) {
      const hp = Math.max(0, ent.hp / ent.maxHp);
      if (Math.abs(hp - health) > 0.15) setHealth(hp);
    }
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        {ent.kind === 'block' && <BlockModel material={ent.material!} w={ent.w} h={ent.h} health={health} />}
        {ent.kind === 'turkey' && (
          <group scale={ent.r / 0.5}>
            <TurkeyModel hurt={hurt} boss={ent.boss} />
          </group>
        )}
        {ent.kind === 'shot' && ent.ammo === 'sloth' && (
          <group scale={ent.r / 0.5}><SlothModel grabbing={pose.includes('grab')} yawning={pose.includes('yawn')} /></group>
        )}
        {ent.kind === 'shot' && ent.ammo !== 'sloth' && <AmmoModel type={ent.ammo!} r={ent.r} />}
        {ent.kind === 'helper' && (
          <group ref={legs} position={[0, -ent.h / 2, 0]}>
            <HelperLegs ent={ent} game={game} pose={pose} />
          </group>
        )}
      </group>
      {ent.kind === 'turkey' && labels && (
        <Html position={[0, ent.r + 0.95 * (ent.r / 0.5), 0]} center wrapperClass="pointer-events-none" zIndexRange={[10, 0]}>
          <div className="text-[11px] font-black text-white uppercase tracking-wide [text-shadow:0_1px_3px_#000,0_0_2px_#000] whitespace-nowrap">{ent.name}</div>
        </Html>
      )}
    </group>
  );
}

// ---------- Sling, aiming and the level ----------

interface Aim { active: boolean; x: number; y: number }

function Trajectory({ aim, game }: { aim: React.MutableRefObject<Aim>; game: Game }) {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const N = 22;
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const a = aim.current;
    const v = a.active ? Game.launchVelocity(a.x, a.y) : null;
    for (let i = 0; i < N; i++) {
      if (v && game.phase === 'aiming') {
        const t = (i + 1) * 0.07;
        dummy.position.set(SLING.x + v.vx * t, SLING.y + v.vy * t + 0.5 * GRAVITY * t * t, 0.6);
        dummy.scale.setScalar(dummy.position.y > 0 ? 0.13 - i * 0.003 : 0);
      } else {
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
    </instancedMesh>
  );
}

function SlingLoad({ aim, game }: { aim: React.MutableRefObject<Aim>; game: Game }) {
  const pouch = useRef<Group>(null);
  const back = useRef<any>(null);
  const front = useRef<any>(null);
  const [loaded, setLoaded] = useState(game.ammo[0] ?? null);
  const [visible, setVisible] = useState(true);

  useFrame(() => {
    const a = aim.current;
    const show = game.phase === 'aiming' && game.ammo.length > 0;
    if (show !== visible) setVisible(show);
    if ((game.ammo[0] ?? null) !== loaded) setLoaded(game.ammo[0] ?? null);
    let px = SLING.x, py = SLING.y;
    if (a.active && show) {
      const len = Math.hypot(a.x, a.y);
      const k = len > MAX_PULL ? MAX_PULL / len : 1;
      px += a.x * k; py += a.y * k;
    }
    pouch.current?.position.set(px, py, 0);
    for (const [line, tip] of [[back.current, PRONG_BACK], [front.current, PRONG_FRONT]] as const) {
      if (!line?.geometry) continue;
      const end = show ? [px, py, 0] : [0, 2.3, 0];
      line.geometry.setPositions([tip[0], tip[1], tip[2], end[0], end[1], end[2]]);
    }
  });

  return (
    <>
      <Line ref={back} points={[PRONG_BACK, [SLING.x, SLING.y, 0]]} color="#4a2c17" lineWidth={5} />
      <group ref={pouch} position={[SLING.x, SLING.y, 0]}>
        {visible && loaded && <AmmoModel type={loaded} r={AMMO[loaded].r} />}
      </group>
      <Line ref={front} points={[PRONG_FRONT, [SLING.x, SLING.y, 0]]} color="#4a2c17" lineWidth={5} />
    </>
  );
}

function Crew({ game }: { game: Game }) {
  const [state, setState] = useState({ queue: game.ammo.slice(1).join(), pennyBusy: game.ammo.includes('penny'), cheer: false });
  const penny = useRef<Group>(null);

  useFrame((s) => {
    const shotPenny = [...game.ents.values()].some(e => e.kind === 'shot' && e.ammo === 'penny');
    const queue = game.phase === 'aiming' ? game.ammo.slice(1).join() : game.ammo.join();
    const pennyBusy = shotPenny || game.ammo.includes('penny');
    const cheer = s.clock.elapsedTime < crewState.cheerUntil || (game.phase === 'over' && game.won);
    if (queue !== state.queue || pennyBusy !== state.pennyBusy || cheer !== state.cheer) setState({ queue, pennyBusy, cheer });
    if (penny.current) penny.current.position.y = 0.5 + Math.abs(Math.sin(s.clock.elapsedTime * (cheer ? 14 : 3))) * (cheer ? 0.4 : 0.05);
  });

  const queue = state.queue ? state.queue.split(',') as Ent['ammo'][] : [];
  return (
    <group>
      <group position={[-3.2, 0, -0.4]}>
        <WallaceModel cheer={state.cheer} />
      </group>
      {!state.pennyBusy && (
        <group ref={penny} position={[-1.7, 0.5, 0.6]}>
          <PennyModel />
        </group>
      )}
      {queue.map((t, i) => (
        <group key={i} position={[-4.6 - i * 1.0, AMMO[t!].r + 0.02, 0.4]}>
          <AmmoModel type={t!} r={AMMO[t!].r * 0.85} />
        </group>
      ))}
    </group>
  );
}

// Ranger the Pyrenees lives between the catapult and the fort. He mostly lies about,
// sometimes rolls onto his back, now and then gets up and wanders to a new spot,
// and howls when his magic Sky Paw is used.
type RangerAct = 'lie' | 'roll' | 'stand' | 'walk' | 'sniff' | 'howl';

function Ranger({ game }: { game: Game }) {
  const group = useRef<Group>(null);
  // Keep clear of the catapult and of the fort.
  const fortLeft = Math.min(...game.level.blocks.map(b => b.x - b.w / 2), ...game.level.turkeys.map(t => t.x - 0.6));
  const minX = 2.5;
  const maxX = Math.max(minX + 1, Math.min(13, fortLeft - 3));
  const st = useRef({ act: 'lie' as RangerAct, until: 4 + Math.random() * 4, x: (minX + maxX) / 2, target: 0, facing: 1, howlSeen: 0 });
  const [view, setView] = useState({ pose: 'lie' as RangerPose, step: 0, belly: 0, facing: 1, say: '' });

  useFrame((s, dt) => {
    const k = st.current;
    const t = s.clock.elapsedTime;
    // Howl when the Sky Paw is called, whatever he was doing.
    if (crewState.howlUntil > t && k.act !== 'howl') { k.act = 'howl'; k.until = crewState.howlUntil; }
    if (t > k.until) {
      const roll = Math.random();
      switch (k.act) {
        case 'lie':
          if (roll < 0.35) { k.act = 'roll'; k.until = t + 3.2; }
          else if (roll < 0.75) { k.act = 'stand'; k.until = t + 0.8; }
          else k.until = t + 4 + Math.random() * 5;
          break;
        case 'roll': k.act = 'lie'; k.until = t + 5 + Math.random() * 6; break;
        case 'stand':
          k.act = 'walk';
          k.target = minX + Math.random() * (maxX - minX);
          k.until = t + 20;
          break;
        case 'sniff': k.act = 'lie'; k.until = t + 6 + Math.random() * 8; break;
        case 'howl': k.act = 'lie'; k.until = t + 4 + Math.random() * 4; break;
        case 'walk': k.act = 'sniff'; k.until = t + 1.5; break;
      }
    }
    if (k.act === 'walk') {
      const d = k.target - k.x;
      k.facing = d >= 0 ? 1 : -1;
      const stepLen = Math.min(Math.abs(d), 1.3 * dt);
      k.x += Math.sign(d) * stepLen;
      if (Math.abs(d) < 0.05) { k.act = 'sniff'; k.until = t + 1.5; }
    }
    if (group.current) group.current.position.x = k.x;

    const pose: RangerPose = k.act === 'walk' ? 'walk' : k.act === 'howl' ? 'howl' : k.act === 'stand' || k.act === 'sniff' ? 'stand' : 'lie';
    const step = k.act === 'walk' ? Math.round(t * 7 * 4) / 4 : 0;
    let belly = 0;
    if (k.act === 'roll') {
      const into = 3.2 - (k.until - t);
      belly = into < 0.6 ? into / 0.6 : into < 2.6 ? 1 : Math.max(0, 1 - (into - 2.6) / 0.6);
      belly = Math.round(belly * 10) / 10;
    }
    const say = k.act === 'howl' ? 'AROOOOO!' : k.act === 'roll' && belly > 0.8 ? 'belly rub?' : k.act === 'sniff' ? 'sniff sniff' : '';
    if (pose !== view.pose || step !== view.step || belly !== view.belly || k.facing !== view.facing || say !== view.say) {
      setView({ pose, step, belly, facing: k.facing, say });
    }
  });

  return (
    <group ref={group} position={[st.current.x, 0, -0.9]}>
      <group scale={[view.facing * 0.95, 0.95, 0.95]}>
        <RangerModel pose={view.pose} step={view.step} belly={view.belly} />
      </group>
      {view.say && (
        <Html position={[0, 2.5, 0]} center wrapperClass="pointer-events-none" zIndexRange={[5, 0]}>
          <div className="text-xs font-black text-white [text-shadow:0_1px_3px_#000] whitespace-nowrap">{view.say}</div>
        </Html>
      )}
    </group>
  );
}

// Donkey and cow bodies, with trotting legs and the donkey's kick pose.
function HelperLegs({ ent, game, pose }: { ent: Ent; game: Game; pose: string }) {
  const [step, setStep] = useState(0);
  useFrame(() => {
    const moving = ent.act === 'run' || ent.act === 'leave';
    const s = moving ? Math.round(game.time * 12 * 4) / 4 : 0;
    if (s !== step) setStep(s);
  });
  if (ent.helper === 'cow') return <CowModel step={step} />;
  return <DonkeyModel step={step} kick={pose === 'kick'} />;
}

interface Popup { id: number; x: number; y: number; text: string; color: string }

function LevelView({ index, interactive }: { index: number; interactive: boolean }) {
  const game = useMemo(() => new Game(LEVELS[index]), [index]);
  const [version, setVersion] = useState(-1);
  const [popups, setPopups] = useState<Popup[]>([]);
  const aim = useRef<Aim>({ active: false, x: 0, y: 0 });
  const cam = useRef({ x: 9999, pan: 0, introUntil: 0, returnAt: 0, mode: 'intro' as 'intro' | 'aim' | 'follow' });
  const { camera, size, gl } = useThree();
  const popupId = useRef(0);
  const ended = useRef(false);

  useEffect(() => {
    live.game = game;
    live.targeting = false;
    particles.length = 0;
    return () => { if (live.game === game) live.game = null; };
  }, [game]);

  // ---- camera framing ----
  const levelRight = game.level.width + 3;
  // Big screens fit the whole level. Phones zoom in and pan instead, or everything gets tiny:
  // at most 30 m across when held sideways, 17 m when upright.
  const zoomFor = (w: number, h: number) => {
    const fit = Math.min(w / (levelRight - LEFT_EDGE), h / 14);
    if (h > w) return w / 17;
    return w < 1000 ? Math.max(fit, w / 30) : fit;
  };

  // ---- input ----
  useEffect(() => {
    if (!interactive) return;
    const el = gl.domElement;
    let mode: 'none' | 'aim' | 'pan' = 'none';
    let lastX = 0;
    const toWorld = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const c = camera as OrthographicCamera;
      return { x: c.position.x + (cx - r.left - r.width / 2) / c.zoom, y: c.position.y - (cy - r.top - r.height / 2) / c.zoom };
    };
    const down = (e: PointerEvent) => {
      const w = toWorld(e.clientX, e.clientY);
      if (game.phase === 'flying') { game.useAbility(); return; }
      if (live.targeting && game.phase === 'aiming') {
        live.targeting = false;
        game.magicPaw(Math.max(3, Math.min(game.level.width + 2, w.x)));
        return;
      }
      const nearSling = Math.hypot(w.x - SLING.x, w.y - SLING.y) < 2.6;
      if (game.phase === 'aiming' && game.ready && nearSling) {
        mode = 'aim';
        aim.current = { active: true, x: w.x - SLING.x, y: w.y - SLING.y };
        sfx.stretch();
      } else {
        mode = 'pan';
        lastX = e.clientX;
      }
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (mode === 'aim') {
        const w = toWorld(e.clientX, e.clientY);
        aim.current.x = w.x - SLING.x;
        aim.current.y = w.y - SLING.y;
      } else if (mode === 'pan') {
        cam.current.pan -= (e.clientX - lastX) / (camera as OrthographicCamera).zoom;
        lastX = e.clientX;
      }
    };
    const up = () => {
      if (mode === 'aim') {
        const v = Game.launchVelocity(aim.current.x, aim.current.y);
        if (v && Math.hypot(aim.current.x, aim.current.y) > 0.5) game.launch(v.vx, v.vy);
        aim.current.active = false;
      }
      mode = 'none';
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [game, interactive, camera, gl]);

  useFrame((state, dt) => {
    game.update(dt);
    const store = useStore.getState();

    // ---- events: sound, effects, results ----
    const pops: Popup[] = [];
    for (const e of game.events) {
      if (!interactive) continue;
      switch (e.type) {
        case 'launch': sfx.launch(); cam.current.mode = 'follow'; cam.current.pan = 0; break;
        case 'ability':
          if (e.ammo === 'penny') sfx.bark(); else { sfx.splash(); const s = game.activeShot?.body.getPosition(); if (s) burst(s.x, s.y, ['#38bdf8', '#bae6fd'], 14, 4, 0.12); }
          break;
        case 'hit': if (e.strength > 12) sfx.thud(e.strength); break;
        case 'break': {
          sfx.crack();
          const colors = { wood: ['#b07a43', '#8a5a2b'], crate: ['#c99a5b', '#8a6234'], stone: ['#9aa3ad', '#6b7280'], hay: ['#e3c262', '#c9a43c'], rock: ['#7a6a4f'] }[e.material];
          burst(e.x, e.y, colors, 10, 4, 0.22);
          pops.push({ id: ++popupId.current, x: e.x, y: e.y, text: `+${e.points}`, color: '#fde68a' });
          break;
        }
        case 'ko':
          sfx.gobble(); sfx.poof();
          crewState.cheerUntil = state.clock.elapsedTime + 1.5;
          burst(e.x, e.y, ['#5c3519', '#a4642c', '#f3e7cf', '#d8262c'], 26, 6, 0.25);
          pops.push({ id: ++popupId.current, x: e.x, y: e.y + 0.6, text: `${e.name}! +${e.points}`, color: '#ffffff' });
          break;
        case 'turnEnd': cam.current.returnAt = state.clock.elapsedTime + 0.9; break;
        case 'helper':
          cam.current.mode = 'follow'; cam.current.pan = 0;
          if (e.helper === 'donkey') sfx.heehaw();
          break;
        case 'moo':
          sfx.moo();
          pops.push({ id: ++popupId.current, x: 0, y: 3.2, text: 'MOOOOO!', color: '#fecaca' });
          break;
        case 'kick':
          sfx.kick(); sfx.heehaw();
          burst(e.x, e.y, ['#c2a27a', '#a08060'], 22, 6, 0.3);
          pops.push({ id: ++popupId.current, x: e.x, y: e.y + 2.2, text: 'BUCK!', color: '#fde68a' });
          break;
        case 'paw':
          sfx.bark(); sfx.yawn();
          crewState.howlUntil = state.clock.elapsedTime + 2.2;
          cam.current.mode = 'follow'; cam.current.pan = 0;
          pops.push({ id: ++popupId.current, x: e.x, y: 3.5, text: "Ranger's Sky Paw!", color: '#bfdbfe' });
          break;
        case 'grab':
          sfx.grab();
          pops.push({ id: ++popupId.current, x: e.x, y: e.y + 1, text: 'Gotcha.', color: '#e7e5e4' });
          break;
        case 'yawn':
          sfx.yawn();
          burst(e.x, e.y + 0.5, ['#dbeafe', '#bfdbfe', '#ffffff'], 30, 3, 0.35);
          pops.push({ id: ++popupId.current, x: e.x, y: e.y + 1.4, text: 'Yaaaawn... Zzz', color: '#bfdbfe' });
          break;
        case 'end':
          if (!ended.current) {
            ended.current = true;
            if (e.won) sfx.win(); else sfx.lose();
            setTimeout(() => store.finish(e.won, game.score, game.stars()), 1300);
          }
          break;
      }
    }
    game.events.length = 0;
    if (pops.length) {
      setPopups(p => [...p, ...pops]);
      const ids = new Set(pops.map(p => p.id));
      setTimeout(() => setPopups(p => p.filter(x => !ids.has(x.id))), 1200);
    }

    if (game.version !== version) setVersion(game.version);
    if (interactive) store.sync({ score: game.score, ammo: [...game.ammo], phase: game.phase, ready: game.ready, turkeysLeft: game.turkeysLeft, helperUsed: game.helperUsed, pawUsed: game.pawUsed });

    // ---- camera ----
    const c = camera as OrthographicCamera;
    const zoom = zoomFor(size.width, size.height);
    const W = size.width / zoom;
    const H = size.height / zoom;
    const minX = LEFT_EDGE + W / 2;
    const maxX = Math.max(minX, levelRight - W / 2);
    const k = cam.current;
    const t = state.clock.elapsedTime;
    if (k.x === 9999) { k.x = maxX; k.introUntil = t + (maxX > minX + 1 ? 1.4 : 0); }
    let target = minX;
    if (!interactive) target = (minX + maxX) / 2;
    else if (t < k.introUntil) target = maxX; // show the fort first, then pan back
    else if (k.mode === 'follow' && game.activeHelper && !game.activeHelper.dead) target = game.activeHelper.body.getPosition().x + W * 0.15;
    else if (k.mode === 'follow' && game.activeShot && !game.activeShot.dead) target = game.activeShot.body.getPosition().x + W * 0.1;
    else if (k.mode === 'follow' && t < k.returnAt) target = k.x;
    else { k.mode = 'aim'; target = minX + k.pan; }
    if (k.mode === 'aim') k.pan = Math.max(0, Math.min(maxX - minX, k.pan));
    target = Math.max(minX, Math.min(maxX, target));
    k.x += (target - k.x) * Math.min(1, dt * (k.mode === 'follow' ? 6 : 3));
    // Upright phones put the ground higher up, so there is less empty sky.
    const y = H / 2 - H * (size.height > size.width ? 0.3 : 0.16);
    if (c.zoom !== zoom) { c.zoom = zoom; c.updateProjectionMatrix(); }
    // Straight side view. The library aims new cameras at the origin, which would tilt this one.
    if (c.rotation.x !== 0 || c.rotation.y !== 0 || c.rotation.z !== 0) c.rotation.set(0, 0, 0);
    c.position.set(k.x, y, 50);
  });

  const ents = [...game.ents.values()].filter(e => e.kind !== 'ground' && !e.dead);
  return (
    <group>
      <group position={[SLING.x, 0, -0.2]}>
        <CatapultModel />
      </group>
      <SlingLoad aim={aim} game={game} />
      <Crew game={game} />
      <Ranger game={game} />
      <Trajectory aim={aim} game={game} />
      {ents.map(e => <EntView key={e.id} ent={e} game={game} labels={interactive} />)}
      <Particles />
      {popups.map(p => (
        <Html key={p.id} position={[p.x, p.y, 1]} center wrapperClass="pointer-events-none" zIndexRange={[30, 0]}>
          <div className="popup text-lg font-black whitespace-nowrap [text-shadow:0_2px_4px_#000]" style={{ color: p.color }}>{p.text}</div>
        </Html>
      ))}
    </group>
  );
}

export default function Stage() {
  const screen = useStore(s => s.screen);
  const levelIndex = useStore(s => s.levelIndex);
  const attempt = useStore(s => s.attempt);
  const playing = screen === 'play';
  const index = playing ? levelIndex : 9; // the title screen shows Dave's Castle
  return (
    // One canvas for the whole session; rebuilding the WebGL context per level crashes phone GPUs.
    <Canvas
      shadows
      dpr={[1, 1.5]}
      orthographic
      camera={{ position: [0, 6, 50], zoom: 30, near: 0.1, far: 200 }}
      onCreated={({ scene }) => { scene.background = new Color('#9fd3f5'); }}
      style={{ touchAction: 'none' }}
    >
      <Lights />
      <Scenery />
      <LevelView key={`${index}-${playing ? attempt : 'demo'}`} index={index} interactive={playing} />
    </Canvas>
  );
}

