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

// ---------- Turkey ----------

const FAN = ['#6b3f1f', '#a4642c', '#6b3f1f', '#a4642c', '#6b3f1f', '#a4642c', '#6b3f1f'];

export function TurkeyModel({ hurt = false, boss = false }: { hurt?: boolean; boss?: boolean }) {
  // Built for a body radius of 0.5, facing left (toward the catapult).
  return (
    <group>
      {/* Tail fan, behind the body */}
      <group position={[0.22, 0.12, -0.25]}>
        {FAN.map((c, i) => {
          const a = ((i - 3) / 3) * 1.05;
          return (
            <group key={i} rotation={[0, 0, -a]}>
              <Pill p={[0, 0.42, 0]} r={0.11} len={0.5} c={c} />
              <Ball p={[0, 0.78, 0]} r={0.1} c="#f3e7cf" />
            </group>
          );
        })}
      </group>
      {/* Legs */}
      <Pill p={[-0.1, -0.38, 0.12]} r={0.05} len={0.2} c="#e08a2c" />
      <Pill p={[0.1, -0.38, -0.08]} r={0.05} len={0.2} c="#e08a2c" />
      <Ball p={[-0.15, -0.5, 0.12]} r={0.08} c="#e08a2c" s={[1.6, 0.5, 1]} />
      <Ball p={[0.05, -0.5, -0.08]} r={0.08} c="#e08a2c" s={[1.6, 0.5, 1]} />
      {/* Plump body and lighter chest */}
      <Ball p={[0.02, -0.02, 0]} r={0.42} c={boss ? '#4a2a14' : '#5c3519'} s={[1.12, 1, 0.95]} />
      <Ball p={[-0.2, 0.0, 0.18]} r={0.26} c="#8a5a32" s={[1, 1.15, 0.9]} />
      {/* Wing */}
      <Ball p={[0.08, 0.0, 0.33]} r={0.22} c="#3f2410" s={[1.3, 0.8, 0.5]} />
      {/* Neck and head */}
      <Pill p={[-0.26, 0.38, 0.05]} r={0.11} len={0.22} c="#c8b6b0" rot={[0, 0, 0.35]} />
      <Ball p={[-0.36, 0.62, 0.06]} r={0.23} c="#a9c0dc" />
      {/* Big googly eyes and angry brows */}
      <Eye p={[-0.45, 0.72, 0.2]} r={0.085} squint={hurt} />
      <Eye p={[-0.3, 0.73, 0.24]} r={0.085} squint={hurt} />
      <mesh position={[-0.45, 0.83, 0.27]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.14, 0.035, 0.03]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[-0.3, 0.84, 0.3]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.14, 0.035, 0.03]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      {/* Wide beak with a toothy grin */}
      <Ball p={[-0.52, 0.57, 0.12]} r={0.13} c="#f2b232" s={[1.2, 0.55, 1]} />
      <Ball p={[-0.5, 0.49, 0.12]} r={0.12} c="#d9951f" s={[1.15, 0.45, 1]} />
      <Teeth p={[-0.53, 0.53, 0.24]} w={0.18} n={4} h={0.05} />
      {/* Snood over the beak and wattle under the chin */}
      <Pill p={[-0.58, 0.66, 0.16]} r={0.035} len={0.16} c="#d8262c" rot={[0, 0, -0.5]} />
      <Ball p={[-0.36, 0.4, 0.12]} r={0.08} c="#d8262c" s={[1, 1.4, 1]} />
      {boss && (
        // Dave's little crown
        <group position={[-0.34, 0.86, 0.06]}>
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

// ---------- Penny the Corgi ----------

export function PennyModel({ flying = false, wag = 0 }: { flying?: boolean; wag?: number }) {
  // Faces right, sized to fit a radius of about 0.5.
  const fur = '#d98a3d';
  return (
    <group>
      {/* Stubby legs */}
      {[[-0.22, 0.1], [-0.1, -0.1], [0.2, 0.1], [0.3, -0.1]].map(([x, z], i) => (
        <Pill key={i} p={[x, flying ? -0.22 : -0.3, z]} r={0.07} len={0.08} c="#fff4e6" rot={flying ? [0, 0, (i < 2 ? -1 : 1) * 1.1] : undefined} />
      ))}
      {/* Long loaf body with a white chest */}
      <Pill p={[0, -0.05, 0]} r={0.25} len={0.4} c={fur} rot={[0, 0, Math.PI / 2]} />
      <Ball p={[0.18, -0.12, 0.12]} r={0.2} c="#fff4e6" s={[1.2, 0.9, 1]} />
      {/* Nub tail */}
      <Ball p={[-0.46, 0.05, 0]} r={0.08} c={fur} />
      {/* Head */}
      <group position={[0.38, 0.2, 0]} rotation={[0, 0, flying ? -0.2 : wag * 0.1]}>
        <Ball p={[0, 0, 0]} r={0.24} c={fur} />
        <Ball p={[0.16, -0.06, 0.04]} r={0.13} c="#fff4e6" s={[1.3, 0.8, 1]} />
        <Ball p={[0.31, -0.03, 0.05]} r={0.045} c="#1c1917" />
        <Eye p={[0.1, 0.07, 0.19]} r={0.055} look={[1, 0]} />
        <Eye p={[0.17, 0.08, 0.1]} r={0.05} look={[1, 0]} />
        {/* Huge corgi ears */}
        <mesh position={[-0.06, 0.3, 0.1]} rotation={[0.15, 0, 0.25]} castShadow>
          <coneGeometry args={[0.1, 0.3, 10]} />
          <Clay color={fur} />
        </mesh>
        <mesh position={[0.08, 0.3, -0.08]} rotation={[-0.15, 0, -0.15]} castShadow>
          <coneGeometry args={[0.1, 0.3, 10]} />
          <Clay color={fur} />
        </mesh>
        {flying && (
          // Aviator cap and goggles
          <group>
            <Ball p={[-0.02, 0.1, 0]} r={0.25} c="#6b3f1f" s={[1, 0.6, 1]} />
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
