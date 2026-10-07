import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import { world } from '../../game/sim';
import { SQUEEZE_SECONDS, TURKEYS } from '../../game/config';

function Box({ p, s, c, r }: { p: [number, number, number]; s: [number, number, number]; c: string; r?: [number, number, number] }) {
  return (
    <mesh position={p} rotation={r} castShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.9} />
    </mesh>
  );
}

// Models face -z, so rotate by facing + PI to point them where they move.
const FACE_OFFSET = Math.PI;

function smoothAngle(current: number, target: number, k: number) {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return current + d * k;
}

export function Penny() {
  const ref = useRef<Group>(null);
  const body = useRef<Group>(null);
  const stars = useRef<Group>(null);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const p = world.penny;
    g.position.set(p.pos.x, 0, p.pos.z);
    g.rotation.y = smoothAngle(g.rotation.y, p.facing + FACE_OFFSET, Math.min(1, dt * 14));
    const t = state.clock.elapsedTime;
    if (body.current) {
      body.current.position.y = p.moving ? Math.abs(Math.sin(t * 18)) * 0.12 : 0;
      // Blink while invulnerable after being caught.
      body.current.visible = p.invulnLeft <= 0 || Math.floor(t * 12) % 2 === 0;
    }
    if (stars.current) {
      stars.current.visible = p.stunLeft > 0;
      stars.current.rotation.y = t * 6;
    }
  });

  const tan = '#d4a373';
  return (
    <group ref={ref}>
      <group ref={body} position={[0, 0, 0]}>
        <group position={[0, 0.45, 0]} scale={1.25}>
          <Box p={[0, 0, 0]} s={[0.6, 0.5, 1.3]} c={tan} />
          <Box p={[0, -0.2, 0]} s={[0.45, 0.15, 1.1]} c="#ffffff" />
          <Box p={[0, 0.45, -0.6]} s={[0.5, 0.45, 0.5]} c={tan} />
          <Box p={[0, 0.3, -0.85]} s={[0.3, 0.2, 0.3]} c="#ffffff" />
          <Box p={[0, 0.36, -1.0]} s={[0.12, 0.1, 0.06]} c="#111" />
          <Box p={[-0.13, 0.52, -0.86]} s={[0.07, 0.07, 0.04]} c="#111" />
          <Box p={[0.13, 0.52, -0.86]} s={[0.07, 0.07, 0.04]} c="#111" />
          {/* Big corgi ears */}
          <Box p={[-0.17, 0.85, -0.55]} s={[0.18, 0.4, 0.08]} c={tan} r={[0.1, 0, -0.25]} />
          <Box p={[0.17, 0.85, -0.55]} s={[0.18, 0.4, 0.08]} c={tan} r={[0.1, 0, 0.25]} />
          {/* Short legs */}
          {[[-0.2, -0.45], [0.2, -0.45], [-0.2, 0.45], [0.2, 0.45]].map(([x, z], i) => (
            <Box key={i} p={[x, -0.32, z]} s={[0.14, 0.25, 0.14]} c="#ffffff" />
          ))}
          <Box p={[0, 0.15, 0.7]} s={[0.18, 0.18, 0.18]} c={tan} />
          {/* Pink collar */}
          <Box p={[0, 0.25, -0.38]} s={[0.52, 0.1, 0.12]} c="#ec4899" />
        </group>
      </group>
      <group ref={stars} position={[0, 1.9, 0]} visible={false}>
        {[0, 1, 2].map(i => (
          <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 3) * 0.5, 0, Math.sin((i * Math.PI * 2) / 3) * 0.5]}>
            <octahedronGeometry args={[0.15]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        ))}
      </group>
      <Html position={[0, 2.3, 0]} center wrapperClass="pointer-events-none" zIndexRange={[20, 0]}>
        <div className="text-[10px] font-black text-pink-200 [text-shadow:0_1px_2px_#000] tracking-wider">PENNY</div>
      </Html>
    </group>
  );
}

function TurkeyModel({ color, boss }: { color: string; boss: boolean }) {
  const fan = ['#5b3a24', '#a0703f', '#5b3a24', '#a0703f', '#5b3a24', '#a0703f', '#5b3a24'];
  return (
    <group scale={boss ? 1.25 : 1}>
      {/* Legs */}
      <Box p={[-0.18, 0.25, 0]} s={[0.08, 0.5, 0.08]} c="#d97706" />
      <Box p={[0.18, 0.25, 0]} s={[0.08, 0.5, 0.08]} c="#d97706" />
      {/* Body */}
      <Box p={[0, 0.8, 0.05]} s={[0.75, 0.65, 0.95]} c={color} />
      {/* Neck and head */}
      <Box p={[0, 1.25, -0.42]} s={[0.22, 0.5, 0.22]} c="#c7b8a8" />
      <Box p={[0, 1.52, -0.5]} s={[0.3, 0.28, 0.32]} c="#93c5fd" />
      <Box p={[0, 1.5, -0.72]} s={[0.1, 0.08, 0.16]} c="#facc15" />
      {/* Snood and wattle */}
      <Box p={[0.05, 1.42, -0.72]} s={[0.06, 0.25, 0.06]} c="#dc2626" />
      <Box p={[0, 1.32, -0.6]} s={[0.12, 0.18, 0.08]} c="#dc2626" />
      {/* Angry eyes */}
      <Box p={[-0.1, 1.6, -0.66]} s={[0.07, 0.07, 0.02]} c="#111" />
      <Box p={[0.1, 1.6, -0.66]} s={[0.07, 0.07, 0.02]} c="#111" />
      <Box p={[-0.1, 1.68, -0.67]} s={[0.12, 0.03, 0.02]} c="#111" r={[0, 0, -0.4]} />
      <Box p={[0.1, 1.68, -0.67]} s={[0.12, 0.03, 0.02]} c="#111" r={[0, 0, 0.4]} />
      {/* Tail fan */}
      <group position={[0, 1.0, 0.5]} name="fan">
        {fan.map((c, i) => {
          const a = ((i - 3) / 3) * 1.1;
          return (
            <group key={i} rotation={[0, 0, a]}>
              <Box p={[0, 0.45, 0]} s={[0.22, 0.85, 0.06]} c={c} />
              <Box p={[0, 0.9, 0]} s={[0.22, 0.1, 0.07]} c="#f5f5f4" />
            </group>
          );
        })}
      </group>
    </group>
  );
}

function Turkey({ index }: { index: number }) {
  const def = TURKEYS[index];
  const ref = useRef<Group>(null);
  const body = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLDivElement>(null);

  useFrame((state, dt) => {
    const t = world.turkeys[index];
    const g = ref.current;
    if (!t || !g) return;
    g.position.set(t.pos.x, 0, t.pos.z);
    g.rotation.y = smoothAngle(g.rotation.y, t.facing + FACE_OFFSET, Math.min(1, dt * 10));
    const time = state.clock.elapsedTime;
    const moving = t.state !== 'gloat' && t.state !== 'puff' && t.state !== 'timeout';
    if (body.current) {
      body.current.position.y = moving ? Math.abs(Math.sin(time * 14 + index)) * 0.1 : 0;
      const s = t.puffScale;
      body.current.scale.set(s, s, s);
      // Scared turkeys flash pale during Turkey Time.
      body.current.visible = !(world.powerLeft > 0 && world.powerLeft < 2 && Math.floor(time * 8) % 2 === 0);
    }
    const escaping = t.state === 'escape' || t.state === 'squeeze';
    if (ring.current) {
      ring.current.visible = escaping || world.powerLeft > 0;
      (ring.current.material as any).color.set(world.powerLeft > 0 ? '#60a5fa' : '#ef4444');
      ring.current.scale.setScalar(1 + Math.sin(time * 8) * 0.15);
    }
    if (status.current) {
      let text = '';
      if (t.state === 'squeeze') text = 'ESCAPING!';
      else if (t.state === 'escape') text = 'sneaking off';
      else if (t.state === 'puff') text = 'PUFF!';
      else if (t.state === 'alert') text = '!';
      else if (t.state === 'timeout') text = 'time-out';
      if (status.current.textContent !== text) status.current.textContent = text;
    }
    if (bar.current) {
      bar.current.style.display = t.state === 'squeeze' ? 'block' : 'none';
      (bar.current.firstChild as HTMLDivElement).style.width = `${Math.round(t.squeeze * 100)}%`;
    }
    if (label.current) label.current.style.opacity = t.state === 'timeout' ? '0.5' : '1';
  });

  return (
    <group ref={ref}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} visible={false}>
        <ringGeometry args={[0.8, 1.05, 24]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
      </mesh>
      <group ref={body}>
        <TurkeyModel color={def.color} boss={def.personality === 'boss'} />
      </group>
      <Html position={[0, 2.6, 0]} center wrapperClass="pointer-events-none" zIndexRange={[20, 0]}>
        <div ref={label} className="flex flex-col items-center whitespace-nowrap">
          <div className="text-[10px] font-black text-white [text-shadow:0_1px_2px_#000] tracking-wider uppercase">{def.name}</div>
          <div ref={status} className="text-[10px] font-black text-amber-300 [text-shadow:0_1px_2px_#000]" />
          <div ref={bar} className="w-12 h-1.5 bg-black/60 rounded-full overflow-hidden mt-0.5" style={{ display: 'none' }}>
            <div className="h-full bg-red-500" style={{ width: '0%', transition: `width ${SQUEEZE_SECONDS / 20}s linear` }} />
          </div>
        </div>
      </Html>
    </group>
  );
}

export function Turkeys() {
  return <>{TURKEYS.map((_, i) => <Turkey key={i} index={i} />)}</>;
}

export function Wallace() {
  const ref = useRef<Group>(null);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const w = world.wallace;
    g.position.set(w.pos.x, 0, w.pos.z);
    g.rotation.y = smoothAngle(g.rotation.y, w.facing, Math.min(1, dt * 6));
    g.children[0].position.y = Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.06;
  });

  return (
    <group ref={ref}>
      <group scale={1.2}>
        <Box p={[-0.17, 0.45, 0]} s={[0.22, 0.9, 0.24]} c="#3b5998" />
        <Box p={[0.17, 0.45, 0]} s={[0.22, 0.9, 0.24]} c="#3b5998" />
        <Box p={[0, 1.3, 0]} s={[0.7, 0.85, 0.4]} c="#16a34a" />
        <Box p={[-0.47, 1.3, 0]} s={[0.2, 0.75, 0.22]} c="#16a34a" />
        <Box p={[0.47, 1.3, 0]} s={[0.2, 0.75, 0.22]} c="#16a34a" />
        <Box p={[0, 1.95, 0]} s={[0.45, 0.45, 0.42]} c="#f1c27d" />
        {/* Flat cap */}
        <Box p={[0, 2.22, 0.05]} s={[0.5, 0.12, 0.5]} c="#78716c" />
        <Box p={[0, 2.18, 0.32]} s={[0.46, 0.06, 0.18]} c="#78716c" />
      </group>
      <Html position={[0, 3.4, 0]} center wrapperClass="pointer-events-none" zIndexRange={[20, 0]}>
        <div className="text-[10px] font-black text-green-200 [text-shadow:0_1px_2px_#000] tracking-wider">WALLACE</div>
      </Html>
    </group>
  );
}

export function Treats() {
  const refs = useRef<(Group | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    world.treats.forEach((tr, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.visible = tr.active;
      g.position.set(tr.pos.x, 0.35 + Math.sin(t * 3 + i) * 0.08, tr.pos.z);
      g.rotation.y = t * 1.5 + i;
    });
  });
  return (
    <>
      {world.treats.map((_, i) => (
        <group key={i} ref={el => { refs.current[i] = el; }}>
          {/* Dog biscuit bone */}
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.14, 0.16]} />
            <meshStandardMaterial color="#c08552" />
          </mesh>
          {[[-0.27, -0.09], [-0.27, 0.09], [0.27, -0.09], [0.27, 0.09]].map(([x, z], j) => (
            <mesh key={j} position={[x, 0, z]} castShadow>
              <sphereGeometry args={[0.12, 8, 6]} />
              <meshStandardMaterial color="#c08552" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

export function Bucket() {
  const ref = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  useFrame((state) => {
    const b = world.bucket;
    if (label.current) label.current.style.display = b.active ? 'block' : 'none';
    const g = ref.current;
    if (!g) return;
    g.visible = b.active;
    const t = state.clock.elapsedTime;
    // Blink in the last 3 seconds before it disappears.
    if (b.active && b.life < 3) g.visible = Math.floor(t * 6) % 2 === 0;
    g.position.set(b.pos.x, 0, b.pos.z);
    g.children[0].position.y = 0.4 + Math.sin(t * 4) * 0.12;
    if (ring.current) ring.current.scale.setScalar(1 + (t % 1) * 0.6);
  });
  return (
    <group ref={ref} visible={false}>
      <group>
        <mesh castShadow>
          <cylinderGeometry args={[0.45, 0.35, 0.6, 12]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.31, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.05, 12]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      </group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.9, 1.1, 28]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.6} />
      </mesh>
      <Html position={[0, 1.6, 0]} center wrapperClass="pointer-events-none" zIndexRange={[20, 0]}>
        <div ref={label} style={{ display: 'none' }} className="text-[10px] font-black text-yellow-300 [text-shadow:0_1px_2px_#000] whitespace-nowrap">FEED BUCKET</div>
      </Html>
    </group>
  );
}
