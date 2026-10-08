import React from 'react';
import { RoundedBox } from '@react-three/drei';
import type { AmmoType } from '../game/engine';
import type { Material as BlockMaterial } from '../game/levels';

// Chunky, clay-style models built from rounded primitives.
// Side view: x is right, y is up, z points at the camera.

type V3 = [number, number, number];

export function Clay({ color, rough = 0.78 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} />;
}

function Ball({ p, r, c, s }: { p: V3; r: number; c: string; s?: V3 }) {
  return (
    <mesh position={p} scale={s} castShadow>
      <sphereGeometry args={[r, 20, 16]} />
      <Clay color={c} />
    </mesh>
  );
}

function Pill({ p, r, len, c, rot }: { p: V3; r: number; len: number; c: string; rot?: V3 }) {
  return (
    <mesh position={p} rotation={rot} castShadow>
      <capsuleGeometry args={[r, len, 6, 12]} />
      <Clay color={c} />
    </mesh>
  );
}

function Eye({ p, r, look = [-1, 0], squint = false }: { p: V3; r: number; look?: [number, number]; squint?: boolean }) {
  return (
    <group position={p} scale={[1, squint ? 0.25 : 1, 1]}>
      <mesh>
        <sphereGeometry args={[r, 16, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[look[0] * r * 0.45, look[1] * r * 0.35, r * 0.75]}>
        <sphereGeometry args={[r * 0.45, 12, 10]} />
        <meshStandardMaterial color="#111111" roughness={0.2} />
      </mesh>
    </group>
  );
}

function Teeth({ p, w, n, h = 0.07 }: { p: V3; w: number; n: number; h?: number }) {
  const tw = w / n;
  return (
    <group position={p}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-w / 2 + tw * (i + 0.5), 0, 0]}>
          <boxGeometry args={[tw * 0.86, h, 0.04]} />
          <meshStandardMaterial color="#fffdf5" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Turkey (white broad-breasted, like the real ones) ----------

const FEATHER = '#f7f4ee';
const FEATHER_SHADE = '#e4ded3';
const HEAD = '#e2788a';
const RED = '#d4202f';

export function TurkeyModel({ hurt = false, boss = false }: { hurt?: boolean; boss?: boolean }) {
  // Built for a body radius of 0.5, facing left (toward the catapult).
  return (
    <group>
      {/* White tail fan, behind the body */}
      <group position={[0.25, 0.1, -0.28]}>
        {[0, 1, 2, 3, 4, 5, 6].map(i => {
          const a = ((i - 3) / 3) * 1.1;
          return (
            <group key={i} rotation={[0, 0, -a]}>
              <Pill p={[0, 0.4, 0]} r={0.12} len={0.48} c={i % 2 ? FEATHER : FEATHER_SHADE} />
            </group>
          );
        })}
      </group>
      {/* Pinkish legs */}
      <Pill p={[-0.1, -0.38, 0.12]} r={0.05} len={0.2} c="#e9b4a8" />
      <Pill p={[0.1, -0.38, -0.08]} r={0.05} len={0.2} c="#e9b4a8" />
      <Ball p={[-0.15, -0.5, 0.12]} r={0.08} c="#e9b4a8" s={[1.6, 0.5, 1]} />
      <Ball p={[0.05, -0.5, -0.08]} r={0.08} c="#e9b4a8" s={[1.6, 0.5, 1]} />
      {/* Big fluffy white body, puffed-out chest, wing */}
      <Ball p={[0.04, -0.02, 0]} r={0.44} c={FEATHER} s={[1.12, 1, 0.95]} />
      <Ball p={[-0.22, 0.04, 0.12]} r={0.3} c={FEATHER} s={[1, 1.1, 0.9]} />
      <Ball p={[0.1, -0.02, 0.34]} r={0.24} c={FEATHER_SHADE} s={[1.4, 0.8, 0.45]} />
      <Ball p={[0.24, -0.2, 0.3]} r={0.12} c={FEATHER_SHADE} s={[1.6, 0.5, 0.5]} />
      {/* Bare neck with red wattles down the front */}
      <Pill p={[-0.28, 0.4, 0.05]} r={0.11} len={0.22} c={HEAD} rot={[0, 0, 0.3]} />
      {[[-0.38, 0.42], [-0.35, 0.33], [-0.4, 0.5]].map(([x, y], i) => (
        <Ball key={i} p={[x, y, 0.13]} r={0.065} c={RED} />
      ))}
      {/* Bare pink-red head */}
      <Ball p={[-0.36, 0.64, 0.06]} r={0.22} c={HEAD} s={[1, 1.05, 1]} />
      <Ball p={[-0.3, 0.74, 0.05]} r={0.12} c="#c9b3cf" />
      {/* Googly eyes and angry brows */}
      <Eye p={[-0.46, 0.72, 0.2]} r={0.08} squint={hurt} />
      <Eye p={[-0.31, 0.73, 0.24]} r={0.08} squint={hurt} />
      <mesh position={[-0.46, 0.83, 0.27]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.14, 0.035, 0.03]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[-0.31, 0.84, 0.3]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.14, 0.035, 0.03]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      {/* Pale beak with a toothy grin */}
      <Ball p={[-0.53, 0.6, 0.12]} r={0.11} c="#efe2c4" s={[1.3, 0.55, 1]} />
      <Ball p={[-0.5, 0.53, 0.12]} r={0.1} c="#d9c9a6" s={[1.2, 0.45, 1]} />
      <Teeth p={[-0.53, 0.565, 0.22]} w={0.16} n={4} h={0.045} />
      {/* Long red snood dangling over the beak */}
      <Pill p={[-0.6, 0.6, 0.17]} r={0.04} len={0.22} c={RED} rot={[0, 0, -0.25]} />
      {boss && (
        // Dave's little crown
        <group position={[-0.34, 0.87, 0.06]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.15, 0.1, 8]} />
            <meshStandardMaterial color="#facc15" metalness={0.4} roughness={0.3} />
          </mesh>
          {[0, 1, 2, 3, 4].map(i => (
            <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.12, 0.09, Math.sin((i / 5) * Math.PI * 2) * 0.12]}>
              <coneGeometry args={[0.035, 0.09, 6]} />
              <meshStandardMaterial color="#facc15" metalness={0.4} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// ---------- Penny (red Pembroke corgi) ----------

const PENNY_RED = '#c8722c';
const PENNY_DARK = '#9a5320';
const CREAM = '#fff7ec';

export function PennyModel({ flying = false, wag = 0 }: { flying?: boolean; wag?: number }) {
  // Faces right, sized to fit a radius of about 0.5.
  return (
    <group>
      {/* Short white legs */}
      {[[-0.22, 0.1], [-0.1, -0.1], [0.2, 0.1], [0.3, -0.1]].map(([x, z], i) => (
        <Pill key={i} p={[x, flying ? -0.22 : -0.3, z]} r={0.075} len={0.08} c={CREAM} rot={flying ? [0, 0, (i < 2 ? -1 : 1) * 1.1] : undefined} />
      ))}
      {/* Long loaf body, white chest and fluffy white ruff */}
      <Pill p={[0, -0.05, 0]} r={0.26} len={0.42} c={PENNY_RED} rot={[0, 0, Math.PI / 2]} />
      <Ball p={[0.2, -0.1, 0.1]} r={0.22} c={CREAM} s={[1.1, 1.1, 1]} />
      <Ball p={[0.28, 0.08, 0.06]} r={0.2} c={CREAM} s={[0.9, 1, 1]} />
      <Ball p={[-0.48, 0.02, 0]} r={0.09} c={PENNY_RED} />
      {/* Head */}
      <group position={[0.4, 0.26, 0]} rotation={[0, 0, flying ? -0.2 : wag * 0.1]}>
        <Ball p={[0, 0, 0]} r={0.23} c={PENNY_RED} />
        {/* Muzzle: white with a greyish tip, black nose */}
        <Ball p={[0.17, -0.07, 0.03]} r={0.12} c={CREAM} s={[1.35, 0.8, 1]} />
        <Ball p={[0.31, -0.03, 0.04]} r={0.05} c="#111111" />
        {/* Tongue out, of course */}
        <Pill p={[0.2, -0.2, 0.08]} r={0.045} len={0.12} c="#d8708a" rot={[0, 0, -0.15]} />
        <Eye p={[0.11, 0.06, 0.18]} r={0.05} look={[1, 0.2]} />
        <Eye p={[0.17, 0.07, 0.08]} r={0.045} look={[1, 0.2]} />
        {/* Big upright pointed ears with darker edges */}
        {[[-0.08, 0.1, 0.25], [0.06, -0.1, -0.2]].map(([x, z, tilt], i) => (
          <group key={i} position={[x, 0.3, z]} rotation={[0, 0, tilt]}>
            <mesh castShadow>
              <coneGeometry args={[0.12, 0.36, 12]} />
              <Clay color={PENNY_DARK} />
            </mesh>
            <mesh position={[0.02, -0.02, 0]} scale={[0.6, 0.8, 0.6]}>
              <coneGeometry args={[0.12, 0.36, 12]} />
              <Clay color="#e9b08a" />
            </mesh>
          </group>
        ))}
        {flying && (
          // Aviator cap and goggles
          <group>
            <Ball p={[-0.02, 0.11, 0]} r={0.24} c="#6b3f1f" s={[1, 0.55, 1]} />
            <mesh position={[0.08, 0.1, 0.13]} rotation={[0, 0.4, 0]}>
              <torusGeometry args={[0.06, 0.02, 8, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

// ---------- Ranger (great white Pyrenees) ----------

const RANGER = '#f6f3ec';
const RANGER_SHADE = '#e7e0d3';
const RANGER_EAR = '#ece2d0';

export type RangerPose = 'lie' | 'stand' | 'walk' | 'howl';

// A big, fluffy Pyrenees. Faces right. step drives the walking legs,
// belly (0..1) rolls him onto his back while lying down.
export function RangerModel({ pose = 'lie', step = 0, belly = 0 }: { pose?: RangerPose; step?: number; belly?: number }) {
  const lying = pose === 'lie';
  const walking = pose === 'walk';
  const swing = (phase: number) => (walking ? Math.sin(step + phase) * 0.32 : 0);
  const y = lying ? 0.5 : 1.05; // height of the body's center
  const head = pose === 'howl' ? 0.85 : lying ? -0.1 : 0.05;

  const standingLeg = (x: number, z: number, phase: number, hind: boolean) => (
    <group key={`${x}${z}`} position={[x, y - 0.15, z]} rotation={[0, 0, swing(phase)]}>
      {/* Fluffy upper leg ("trousers" on the hind legs) */}
      <Ball p={[hind ? -0.05 : 0, -0.12, 0]} r={hind ? 0.24 : 0.17} c={RANGER} s={[1, 1.3, 0.9]} />
      <Pill p={[0, -0.5, 0]} r={0.12} len={0.5} c={RANGER} />
      <Ball p={[0.06, -0.86, 0]} r={0.13} c={RANGER} s={[1.5, 0.6, 1.1]} />
    </group>
  );

  const body = (
    <group>
      {lying ? (
        <>
          {/* Front legs stretched forward, hind legs tucked */}
          {[0.2, -0.2].map(z => (
            <group key={z} position={[0.85, 0.16, z]}>
              <Pill p={[0, 0, 0]} r={0.13} len={0.55} c={RANGER} rot={[0, 0, Math.PI / 2]} />
              <Ball p={[0.42, -0.02, 0]} r={0.14} c={RANGER} s={[1.4, 0.7, 1.1]} />
            </group>
          ))}
          <Ball p={[-0.55, 0.3, 0.25]} r={0.3} c={RANGER_SHADE} s={[1.5, 0.85, 0.7]} />
        </>
      ) : (
        <>
          {standingLeg(0.5, 0.2, 0, false)}
          {standingLeg(0.5, -0.2, Math.PI, false)}
          {standingLeg(-0.55, 0.2, Math.PI, true)}
          {standingLeg(-0.55, -0.2, 0, true)}
        </>
      )}

      {/* One continuous fluffy body: chest, middle, rump, and a soft underside */}
      <Ball p={[0.48, y, 0]} r={0.46} c={RANGER} s={[1, 1.05, 0.95]} />
      <Ball p={[0, y + 0.02, 0]} r={0.44} c={RANGER} s={[1.25, 0.95, 0.95]} />
      <Ball p={[-0.55, y + 0.02, 0]} r={0.43} c={RANGER} s={[1, 1, 0.95]} />
      <Ball p={[0, y - 0.3, 0]} r={0.3} c={RANGER_SHADE} s={[2.6, 0.5, 1]} />
      {/* Thick mane around the neck */}
      <Ball p={[0.72, y + 0.28, 0]} r={0.38} c={RANGER} s={[0.85, 1.1, 1.05]} />

      {/* Tail: a big plume, carried low with a curl at the end, up over the back when excited */}
      {walking || pose === 'howl' ? (
        // Feathery plume arching up and over toward the back
        <group position={[-0.9, y + 0.1, 0]}>
          <Pill p={[-0.12, 0.25, 0]} r={0.15} len={0.35} c={RANGER} rot={[0, 0, 0.35]} />
          <Pill p={[-0.05, 0.55, 0]} r={0.16} len={0.25} c={RANGER_SHADE} rot={[0, 0, -0.6]} />
        </group>
      ) : (
        <group position={[-0.95, lying ? 0.35 : y - 0.05, 0.05]}>
          <Pill p={[-0.12, -0.25, 0]} r={0.15} len={0.45} c={RANGER} rot={[0, 0, lying ? 1.35 : 0.25]} />
          <Ball p={lying ? [-0.55, -0.15, 0] : [-0.15, -0.6, 0]} r={0.15} c={RANGER_SHADE} />
        </group>
      )}

      {/* Head: broad skull, longer muzzle, dark almond eyes, low floppy ears */}
      <group position={[lying ? 1.1 : 1.02, lying ? 0.66 : y + 0.55, 0]} rotation={[0, 0, head]}>
        <Ball p={[0, 0, 0]} r={0.3} c={RANGER} s={[1.05, 0.95, 1]} />
        <Pill p={[0.3, -0.1, 0]} r={0.13} len={0.22} c={RANGER} rot={[0, 0, Math.PI / 2]} />
        <Ball p={[0.53, -0.07, 0]} r={0.065} c="#16120f" />
        <mesh position={[0.36, -0.2, 0.06]}>
          <boxGeometry args={[0.24, 0.018, 0.02]} />
          <meshStandardMaterial color="#3b302a" />
        </mesh>
        {[[0.18, 0.07, 0.22], [0.2, 0.07, -0.22]].map(([ex, ey, ez], i) => (
          <group key={i} position={[ex, ey, ez]} scale={[1.3, lying ? 0.45 : 0.85, 1]}>
            <Ball p={[0, 0, 0]} r={0.05} c="#2b1d14" />
            <Ball p={[0.012, 0.012, ez > 0 ? 0.04 : -0.04]} r={0.013} c="#ffffff" />
          </group>
        ))}
        {[1, -1].map(side => (
          <Ball key={side} p={[-0.08, -0.1, 0.27 * side]} r={0.16} c={RANGER_EAR} s={[0.7, 1.35, 0.35]} />
        ))}
      </group>
    </group>
  );

  // Rolling over pivots around the middle of his body so he stays above the ground.
  if (!lying || belly === 0) return body;
  return (
    <group position={[0, 0.55, 0]} rotation={[belly * Math.PI * 0.9, 0, 0]}>
      <group position={[0, -0.55, 0]}>{body}</group>
    </group>
  );
}

// Ranger's magic: a giant glowing paw. Sized for radius 1.1.
export function PawModel() {
  const glow = '#dbeafe';
  return (
    <group rotation={[0, 0, Math.PI]}>
      <mesh>
        <sphereGeometry args={[0.75, 24, 16]} />
        <meshStandardMaterial color={glow} emissive="#93c5fd" emissiveIntensity={0.7} transparent opacity={0.9} />
      </mesh>
      {[[-0.6, 0.65], [-0.2, 0.9], [0.2, 0.9], [0.6, 0.65]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.1]}>
          <sphereGeometry args={[0.28, 16, 12]} />
          <meshStandardMaterial color={glow} emissive="#93c5fd" emissiveIntensity={0.7} transparent opacity={0.9} />
        </mesh>
      ))}
      {/* Pink toe beans */}
      <mesh position={[0, -0.05, 0.55]} scale={[1.2, 0.9, 0.4]}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color="#f9a8d4" emissive="#f472b6" emissiveIntensity={0.4} />
      </mesh>
      {[[-0.6, 0.65], [-0.2, 0.9], [0.2, 0.9], [0.6, 0.65]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.32]} scale={[1, 1, 0.4]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <meshStandardMaterial color="#f9a8d4" emissive="#f472b6" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Farm helpers ----------

export function DonkeyModel({ step = 0, kick = false }: { step?: number; kick?: boolean }) {
  // Faces right. Turned a little toward the camera so the ears show.
  const coat = '#4a3a33';
  const leg = (x: number, z: number, phase: number, back: boolean) => {
    const swing = kick && back ? -1.3 : Math.sin(step + phase) * 0.5;
    return (
      <group key={`${x}${z}`} position={[x, 0.85, z]} rotation={[0, 0, swing]}>
        <Pill p={[0, -0.4, 0]} r={0.08} len={0.55} c={coat} />
        <Ball p={[0, -0.78, 0]} r={0.08} c="#1c1917" />
      </group>
    );
  };
  return (
    <group rotation={[0, -0.35, 0]}>
      {leg(0.45, 0.2, 0, false)}
      {leg(0.45, -0.2, Math.PI, false)}
      {leg(-0.45, 0.2, Math.PI, true)}
      {leg(-0.45, -0.2, 0, true)}
      <Pill p={[0, 1.05, 0]} r={0.36} len={0.75} c={coat} rot={[0, 0, Math.PI / 2 + (kick ? -0.35 : 0)]} />
      <Ball p={[0, 0.85, 0]} r={0.28} c="#6b5a50" s={[1.6, 0.6, 1]} />
      {/* Neck, head, pale muzzle */}
      <Pill p={[0.62, 1.45, 0]} r={0.16} len={0.4} c={coat} rot={[0, 0, -0.7]} />
      <group position={[0.9, 1.7, 0]} rotation={[0, 0, -0.5]}>
        <Pill p={[0.15, 0, 0]} r={0.17} len={0.35} c={coat} rot={[0, 0, Math.PI / 2]} />
        <Ball p={[0.42, -0.02, 0]} r={0.18} c="#d9cfc4" s={[1, 0.95, 1]} />
        <Ball p={[0.56, 0.02, 0.1]} r={0.03} c="#1c1917" />
        <Eye p={[0.1, 0.1, 0.15]} r={0.05} look={[1, 0]} />
        {/* Tall ears with dark tips */}
        {[0.1, -0.1].map((z, i) => (
          <group key={i} position={[-0.05, 0.25, z]} rotation={[z, 0, 0.35]}>
            <Pill p={[0, 0.2, 0]} r={0.07} len={0.4} c={coat} />
            <Ball p={[0, 0.45, 0]} r={0.065} c="#1c1917" />
          </group>
        ))}
        {/* Spiky mane */}
        <Pill p={[-0.15, 0.18, 0]} r={0.05} len={0.2} c="#2a201c" rot={[0, 0, 1.2]} />
      </group>
      <Pill p={[-0.65, 1.0, 0]} r={0.04} len={0.4} c={coat} rot={[0, 0, kick ? -0.6 : 0.4]} />
    </group>
  );
}

export function CowModel({ step = 0 }: { step?: number }) {
  // Texas longhorn: rusty red, white speckled face, enormous horns. Faces right.
  const coat = '#a4512a';
  return (
    <group rotation={[0, -0.45, 0]}>
      {[[0.7, 0.28, 0], [0.7, -0.28, Math.PI], [-0.7, 0.28, Math.PI], [-0.7, -0.28, 0]].map(([x, z, ph], i) => (
        <group key={i} position={[x, 0.9, z]} rotation={[0, 0, Math.sin(step + ph) * 0.45]}>
          <Pill p={[0, -0.45, 0]} r={0.12} len={0.55} c={i % 2 ? coat : '#f3ece0'} />
          <Ball p={[0, -0.85, 0]} r={0.11} c="#2a201c" />
        </group>
      ))}
      <Pill p={[0, 1.15, 0]} r={0.5} len={1.2} c={coat} rot={[0, 0, Math.PI / 2]} />
      {/* White speckles */}
      {[[0.3, 1.4, 0.4], [-0.4, 1.0, 0.45], [0.6, 0.9, 0.4], [-0.1, 1.5, 0.35]].map(([x, y, z], i) => (
        <Ball key={i} p={[x, y, z]} r={0.13} c="#f3ece0" s={[1.3, 0.8, 0.4]} />
      ))}
      <Pill p={[-1.1, 1.0, 0]} r={0.05} len={0.6} c={coat} rot={[0, 0, 0.3]} />
      {/* Head */}
      <group position={[1.15, 1.3, 0]}>
        <Ball p={[0, 0, 0]} r={0.33} c="#f3ece0" s={[1.2, 1.1, 1]} />
        <Ball p={[0.18, 0.15, 0.2]} r={0.1} c={coat} />
        <Ball p={[-0.05, 0.2, -0.2]} r={0.12} c={coat} />
        <Ball p={[0.35, -0.15, 0]} r={0.2} c="#e6b6a6" s={[0.9, 0.8, 1.1]} />
        <Eye p={[0.15, 0.12, 0.27]} r={0.06} look={[1, 0]} />
        {/* Ears */}
        <Ball p={[-0.1, 0.05, 0.38]} r={0.12} c={coat} s={[1, 0.5, 1.4]} />
        <Ball p={[-0.1, 0.05, -0.38]} r={0.12} c={coat} s={[1, 0.5, 1.4]} />
        {/* Horns, sweeping far out and up */}
        {[1, -1].map(side => (
          <group key={side} position={[-0.05, 0.25, 0.25 * side]} rotation={[side * -0.95, 0, 0.35]}>
            <mesh position={[0, 0.85, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.09, 1.7, 10]} />
              <meshStandardMaterial color="#d8cdb6" roughness={0.6} />
            </mesh>
            <mesh position={[0.05, 1.75, 0]} rotation={[0, 0, -0.5]}>
              <coneGeometry args={[0.03, 0.25, 8]} />
              <meshStandardMaterial color="#6b6257" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function SlothModel({ grabbing = false, yawning = false }: { grabbing?: boolean; yawning?: boolean }) {
  // Curled into a ball when flying; arms out when hanging on. Sized for radius 0.5.
  const fur = '#9b8b74';
  return (
    <group>
      <Ball p={[0, 0, 0]} r={0.42} c={fur} />
      <Ball p={[0, -0.1, -0.1]} r={0.36} c="#8a7a63" s={[1.1, 0.9, 1]} />
      {/* Arms with long claws */}
      {[1, -1].map(side => (
        <group key={side} position={[0.1, 0.1, 0.25 * side]} rotation={[0, 0, grabbing ? 1.3 : 0.4]}>
          <Pill p={[0.25, 0, 0]} r={0.09} len={0.4} c={fur} rot={[0, 0, Math.PI / 2]} />
          {[-0.04, 0, 0.04].map((dz, i) => (
            <mesh key={i} position={[0.55, -0.03, dz]} rotation={[0, 0, -1.2]}>
              <coneGeometry args={[0.02, 0.14, 6]} />
              <meshStandardMaterial color="#3b3029" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Cream face with dark eye stripes and a little smile */}
      <group position={[0.18, 0.12, 0.28]}>
        <Ball p={[0, 0, 0]} r={0.2} c="#efe4cf" s={[1, 0.9, 0.6]} />
        <Ball p={[-0.08, 0.03, 0.08]} r={0.06} c="#3b3029" s={[1.6, 0.7, 0.5]} />
        <Ball p={[0.08, 0.03, 0.08]} r={0.06} c="#3b3029" s={[1.6, 0.7, 0.5]} />
        <Ball p={[-0.07, 0.035, 0.11]} r={0.022} c="#111111" />
        <Ball p={[0.07, 0.035, 0.11]} r={0.022} c="#111111" />
        <Ball p={[0, -0.04, 0.12]} r={0.03} c="#2a201c" />
        {yawning ? (
          <Ball p={[0, -0.11, 0.1]} r={0.06} c="#5b1a1a" s={[1, 1.4, 0.4]} />
        ) : (
          <mesh position={[0, -0.09, 0.11]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.04, 0.008, 6, 12, Math.PI]} />
            <meshStandardMaterial color="#2a201c" />
          </mesh>
        )}
      </group>
    </group>
  );
}

// ---------- Wallace ----------

export function WallaceModel({ cheer = false }: { cheer?: boolean }) {
  return (
    <group>
      {/* Brown trousers and shoes */}
      <Pill p={[-0.16, 0.45, 0]} r={0.14} len={0.55} c="#7a5236" />
      <Pill p={[0.16, 0.45, 0]} r={0.14} len={0.55} c="#7a5236" />
      <Ball p={[-0.12, 0.06, 0.06]} r={0.13} c="#3b2a1e" s={[1.5, 0.6, 1]} />
      <Ball p={[0.2, 0.06, 0.06]} r={0.13} c="#3b2a1e" s={[1.5, 0.6, 1]} />
      {/* White shirt, green knitted vest, red tie */}
      <Ball p={[0, 1.25, 0]} r={0.42} c="#f5f5f0" s={[1, 1.15, 0.8]} />
      <Ball p={[0, 1.2, 0.05]} r={0.41} c="#3f8f3a" s={[1.02, 1.05, 0.8]} />
      <mesh position={[0.02, 1.38, 0.33]} rotation={[0, 0, 0.05]}>
        <boxGeometry args={[0.09, 0.42, 0.04]} />
        <Clay color="#c81e1e" />
      </mesh>
      {/* Arms */}
      <Pill p={[-0.45, 1.2, 0]} r={0.1} len={0.45} c="#f5f5f0" rot={[0, 0, 0.25]} />
      <group position={[0.42, 1.45, 0]} rotation={[0, 0, cheer ? 2.6 : -0.3]}>
        <Pill p={[0, -0.25, 0]} r={0.1} len={0.45} c="#f5f5f0" />
        <Ball p={[0, -0.55, 0]} r={0.1} c="#f2c9a5" />
      </group>
      <Ball p={[-0.52, 0.92, 0]} r={0.1} c="#f2c9a5" />
      {/* Big head, wide grin, big ears, a little hair at the sides */}
      <group position={[0.02, 2.0, 0]}>
        <Ball p={[0, 0, 0]} r={0.36} c="#f2c9a5" s={[1, 1.05, 0.95]} />
        <Ball p={[-0.35, 0.02, 0]} r={0.09} c="#eab48c" s={[0.6, 1.2, 1]} />
        <Ball p={[0.35, 0.02, 0]} r={0.09} c="#eab48c" s={[0.6, 1.2, 1]} />
        <Ball p={[-0.3, 0.15, -0.05]} r={0.1} c="#8a5a3a" />
        <Ball p={[0.3, 0.15, -0.05]} r={0.1} c="#8a5a3a" />
        <Ball p={[0.02, 0.0, 0.33]} r={0.07} c="#e9a882" />
        <Eye p={[-0.1, 0.13, 0.3]} r={0.07} look={[0.6, 0]} />
        <Eye p={[0.12, 0.13, 0.3]} r={0.07} look={[0.6, 0]} />
        {/* The grin */}
        <Ball p={[0.01, -0.16, 0.24]} r={0.17} c="#7f1d1d" s={[1.25, 0.45, 0.6]} />
        <Teeth p={[0.01, -0.13, 0.33]} w={0.3} n={6} h={0.07} />
      </group>
    </group>
  );
}

// ---------- Catapult ----------

export function CatapultModel() {
  const wood = '#8a5a2b';
  return (
    <group>
      <Pill p={[0, 0.8, 0]} r={0.14} len={1.4} c={wood} />
      <Pill p={[-0.2, 2.2, -0.25]} r={0.1} len={0.75} c={wood} rot={[0.35, 0, 0.3]} />
      <Pill p={[0.2, 2.2, 0.25]} r={0.1} len={0.75} c={wood} rot={[-0.35, 0, -0.3]} />
      <Ball p={[0, 0.05, 0]} r={0.3} c="#5b3a1e" s={[1.6, 0.4, 1.2]} />
    </group>
  );
}

// Back and front prong tips, used for the rubber bands.
export const PRONG_BACK: V3 = [-0.32, 2.55, -0.4];
export const PRONG_FRONT: V3 = [0.32, 2.55, 0.4];

// ---------- Ammo ----------

export function AmmoModel({ type, r }: { type: AmmoType; r: number }) {
  if (type === 'penny') return <group scale={r / 0.5}><PennyModel flying /></group>;
  if (type === 'sloth') return <group scale={r / 0.5}><SlothModel /></group>;
  if (type === 'paw') return <group scale={r / 1.1}><PawModel /></group>;
  if (type === 'pumpkin') {
    return (
      <group scale={r / 0.55}>
        {[-0.24, -0.08, 0.08, 0.24].map((x, i) => (
          <Ball key={i} p={[x, 0, 0]} r={0.4} c={i % 2 ? '#ea7a1a' : '#f08a24'} s={[0.55, 1, 1]} />
        ))}
        <Pill p={[0.02, 0.42, 0]} r={0.05} len={0.1} c="#4d7c0f" rot={[0, 0, -0.3]} />
      </group>
    );
  }
  if (type === 'balloon') {
    return (
      <group scale={r / 0.42}>
        <mesh castShadow>
          <sphereGeometry args={[0.42, 20, 16]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.15} transparent opacity={0.85} />
        </mesh>
        <Ball p={[-0.42, 0, 0]} r={0.06} c="#0284c7" />
        <Ball p={[0.15, 0.2, 0.3]} r={0.07} c="#e0f2fe" />
      </group>
    );
  }
  return (
    <group scale={r / 0.32}>
      <Ball p={[0, 0, 0]} r={0.32} c="#d4e157" />
      <mesh rotation={[0.4, 0.3, 0]}>
        <torusGeometry args={[0.3, 0.025, 8, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ---------- Blocks ----------

const BLOCK_COLORS: Record<BlockMaterial, string> = {
  wood: '#b07a43',
  crate: '#c99a5b',
  stone: '#9aa3ad',
  hay: '#e3c262',
  rock: '#7a6a4f',
};

export function BlockModel({ material, w, h, health }: { material: BlockMaterial; w: number; h: number; health: number }) {
  const depth = material === 'rock' ? 3 : 1;
  const radius = Math.min(0.1, w / 3, h / 3);
  // Damaged blocks look darker and scuffed.
  const shade = 0.55 + 0.45 * Math.max(0, Math.min(1, health));
  const base = BLOCK_COLORS[material];
  return (
    <group>
      <RoundedBox args={[w, h, depth]} radius={radius} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={base} roughness={material === 'stone' ? 0.9 : 0.8} />
      </RoundedBox>
      {shade < 0.99 && (
        <RoundedBox args={[w + 0.01, h + 0.01, depth + 0.01]} radius={radius} smoothness={2}>
          <meshBasicMaterial color="#000000" transparent opacity={(1 - shade) * 0.8} depthWrite={false} />
        </RoundedBox>
      )}
      {material === 'crate' && (
        <group position={[0, 0, 0.51]}>
          <mesh rotation={[0, 0, Math.atan2(h, w)]}>
            <boxGeometry args={[Math.hypot(w, h) * 0.85, 0.1, 0.03]} />
            <Clay color="#8a6234" />
          </mesh>
        </group>
      )}
      {material === 'hay' && [-0.25, 0.25].map(f => (
        <mesh key={f} position={[w * f, 0, 0]}>
          <boxGeometry args={[0.05, h + 0.02, depth + 0.02]} />
          <Clay color="#9c7a2e" />
        </mesh>
      ))}
      {material === 'wood' && w > h * 3 && (
        <mesh position={[0, h * 0.15, 0.505]}>
          <boxGeometry args={[w * 0.8, 0.03, 0.01]} />
          <Clay color="#8a5a2b" />
        </mesh>
      )}
      {material === 'rock' && (
        <RoundedBox args={[w + 0.1, 0.3, depth + 0.1]} radius={0.12} position={[0, h / 2 - 0.1, 0]} receiveShadow>
          <Clay color="#6aa53a" />
        </RoundedBox>
      )}
    </group>
  );
}
