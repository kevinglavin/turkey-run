import React, { useMemo } from 'react';
import { BARN, FENCE_GAPS, GAP_WIDTH, HALF_H, HALF_W, MUD_PATCHES, PEN, WORLD_HEIGHT, WORLD_WIDTH } from '../../game/config';

const WOOD = '#8b5a2b';

type Seg = [number, number, number, number]; // x1, z1, x2, z2

// Split a straight fence line around any gaps that sit on it.
function fenceSegments(): Seg[] {
  const sides: Seg[] = [
    [-HALF_W, -HALF_H, -HALF_W, HALF_H],
    [HALF_W, -HALF_H, HALF_W, HALF_H],
    [-HALF_W, -HALF_H, HALF_W, -HALF_H],
    [-HALF_W, HALF_H, HALF_W, HALF_H],
  ];
  const out: Seg[] = [];
  for (const [x1, z1, x2, z2] of sides) {
    const vertical = x1 === x2;
    const gaps = FENCE_GAPS
      .filter(g => (vertical ? g.x === x1 : g.z === z1))
      .map(g => (vertical ? g.z : g.x))
      .sort((a, b) => a - b);
    let start = vertical ? z1 : x1;
    const end = vertical ? z2 : x2;
    for (const c of gaps) {
      const a = c - GAP_WIDTH / 2;
      out.push(vertical ? [x1, start, x1, a] : [start, z1, a, z1]);
      start = c + GAP_WIDTH / 2;
    }
    out.push(vertical ? [x1, start, x1, end] : [start, z1, end, z1]);
  }
  return out;
}

function FenceRun({ seg }: { seg: Seg }) {
  const [x1, z1, x2, z2] = seg;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const posts = Math.max(1, Math.round(len / 2));
  const angle = Math.atan2(dx, dz);
  return (
    <group>
      {Array.from({ length: posts + 1 }, (_, i) => (
        <mesh key={i} position={[x1 + (dx * i) / posts, 0.5, z1 + (dz * i) / posts]} castShadow>
          <boxGeometry args={[0.22, 1, 0.22]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
      {[0.4, 0.8].map(y => (
        <mesh key={y} position={[x1 + dx / 2, y, z1 + dz / 2]} rotation={[0, angle, 0]} castShadow>
          <boxGeometry args={[0.1, 0.12, len]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
    </group>
  );
}

function GapMarker({ x, z }: { x: number; z: number }) {
  // Broken boards lying in the gap, so players can see where turkeys will head.
  const vertical = Math.abs(x) === HALF_W;
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[1.4, 24]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.5} />
      </mesh>
      <mesh position={[vertical ? 0.5 : -0.4, 0.08, vertical ? -0.4 : 0.5]} rotation={[0, 0.6, 0.1]}>
        <boxGeometry args={[0.12, 0.1, 1.1]} />
        <meshStandardMaterial color="#6b4423" />
      </mesh>
    </group>
  );
}

function Barn() {
  return (
    <group position={[BARN.x, 0, BARN.z]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 3, 3.5]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      {/* Roof: a triangular prism running front to back */}
      <mesh position={[0, 4.45, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[2.9, 2.9, 3.8, 3]} />
        <meshStandardMaterial color="#57534e" flatShading />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.1, 1.76]}>
        <boxGeometry args={[1.8, 2.2, 0.05]} />
        <meshStandardMaterial color="#f5f5f4" />
      </mesh>
      <mesh position={[0, 1.1, 1.8]}>
        <boxGeometry args={[1.4, 1.8, 0.05]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
    </group>
  );
}

function Pen() {
  const h = PEN.size / 2;
  const segs: Seg[] = [
    [PEN.x - h, PEN.z - h, PEN.x + h, PEN.z - h],
    [PEN.x - h, PEN.z - h, PEN.x - h, PEN.z + h],
    [PEN.x + h, PEN.z - h, PEN.x + h, PEN.z + h],
    [PEN.x - h, PEN.z + h, PEN.x - 0.6, PEN.z + h],
    [PEN.x + 0.6, PEN.z + h, PEN.x + h, PEN.z + h],
  ];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PEN.x, 0.02, PEN.z]} receiveShadow>
        <planeGeometry args={[PEN.size, PEN.size]} />
        <meshStandardMaterial color="#c9a66b" />
      </mesh>
      {segs.map((s, i) => <FenceRun key={i} seg={s} />)}
    </group>
  );
}

export default function Farm() {
  const segs = useMemo(fenceSegments, []);

  const trees = useMemo(() => {
    const list: [number, number][] = [];
    for (const x of [-HALF_W - 2, HALF_W + 2]) {
      for (const z of [-HALF_H + 3, -6, 6, HALF_H - 3]) list.push([x + (Math.random() - 0.5), z + (Math.random() - 0.5) * 2]);
    }
    return list;
  }, []);

  const hay: [number, number, number][] = [[-7, 11, 0.4], [7.5, -2, 1.2], [-2, 4, 2.1]];

  return (
    <group>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH + 14, WORLD_HEIGHT + 14]} />
        <meshStandardMaterial color="#6B8E23" roughness={1} />
      </mesh>
      {/* Dirt yard */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH, WORLD_HEIGHT]} />
        <meshStandardMaterial color="#9c7a52" roughness={0.9} />
      </mesh>

      {MUD_PATCHES.map((m, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[m.x, 0.015, m.z]} receiveShadow>
          <circleGeometry args={[m.r, 28]} />
          <meshStandardMaterial color="#5c4027" roughness={0.4} />
        </mesh>
      ))}

      {segs.map((s, i) => <FenceRun key={i} seg={s} />)}
      {FENCE_GAPS.map(g => <GapMarker key={g.id} x={g.x} z={g.z} />)}

      <Barn />
      <Pen />

      {trees.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 2, 6]} />
            <meshStandardMaterial color="#4A3B2C" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow>
            <dodecahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial color="#228b22" roughness={0.8} />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow>
            <dodecahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial color="#2e8b57" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {hay.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.45, z]} rotation={[0, r, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.6, 0.6, 1.2, 10]} />
          <meshStandardMaterial color="#e8c351" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
