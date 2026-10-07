import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Color, PCFShadowMap } from 'three';
import Farm from './Farm';
import { Bucket, Penny, Treats, Turkeys, Wallace } from './Characters';
import { resetWorld, step, world, type GameEvent } from '../../game/sim';
import { useUI } from '../../game/store';
import { sfx } from '../../game/audio';
import { HEART_BONUS, ROUND_SECONDS } from '../../game/config';

const CAMERA_POS: [number, number, number] = [0, 36, 30];
let shake = 0;

function handleEvent(e: GameEvent) {
  const ui = useUI.getState();
  switch (e.type) {
    case 'treat':
      sfx.treat(e.combo);
      if (e.combo >= 2) ui.toast(`Combo x${e.combo}! +${e.points}`, 'good');
      break;
    case 'shoo':
      sfx.shoo();
      ui.toast(`Shooed ${e.name} back! +25`, 'good');
      break;
    case 'tag':
      sfx.tag();
      ui.toast(`${e.name} sent to the pen! +50`, 'good');
      break;
    case 'caught':
      sfx.gobble();
      sfx.ouch();
      shake = 0.6;
      ui.toast(`${e.name} pecked Penny!`, 'bad');
      break;
    case 'escaped':
      sfx.lose();
      shake = 0.4;
      ui.toast(`${e.name} escaped!`, 'bad');
      ui.say(`Got you, ${e.name}! Back in the pen.`);
      break;
    case 'escaping':
      sfx.gobble();
      ui.say(`Penny! ${e.name} is heading for the ${e.gap.toLowerCase()}!`);
      break;
    case 'stunned':
      ui.toast('Puffed! Penny is dizzy', 'bad');
      break;
    case 'puff':
      sfx.puff();
      break;
    case 'bucketSpawn':
      sfx.bucket();
      ui.say('Penny! Grab the feed bucket!');
      break;
    case 'bucketGrab':
      sfx.power();
      ui.toast('TURKEY TIME! Chase them!', 'good');
      ui.say('Ha! Now they are scared of you!');
      break;
    case 'dash':
      sfx.bark();
      break;
    case 'end': {
      if (e.won) sfx.win(); else sfx.lose();
      const bonus = e.won ? world.hearts * HEART_BONUS : 0;
      ui.finish({
        won: e.won,
        score: world.score,
        finalScore: world.score + bonus,
        heartsLeft: world.hearts,
        ...world.stats,
      });
      break;
    }
  }
}

// Runs the simulation each frame and pushes HUD values to the UI store a few times a second.
function Driver() {
  const { camera } = useThree();
  const lastSync = useRef(0);

  useEffect(() => {
    resetWorld();
    camera.position.set(...CAMERA_POS);
  }, [camera]);

  useFrame((state, dt) => {
    const ui = useUI.getState();
    if (ui.status === 'playing') step(world, dt);

    while (world.events.length) handleEvent(world.events.shift()!);

    // Sky shifts toward sunset as the round goes on.
    const k = Math.min(1, world.elapsed / ROUND_SECONDS);
    const bg = state.scene.background as Color | null;
    if (bg) bg.setRGB(0.38 + 0.5 * k, 0.65 - 0.25 * k, 0.98 - 0.55 * k);

    if (shake > 0) {
      shake = Math.max(0, shake - dt);
      camera.position.x = (Math.random() - 0.5) * shake * 1.5;
    } else if (camera.position.x !== 0) {
      camera.position.x = 0;
    }

    const now = state.clock.elapsedTime;
    if (now - lastSync.current > 0.1) {
      lastSync.current = now;
      ui.syncHud({
        score: world.score,
        hearts: world.hearts,
        timeLeft: Math.max(0, Math.ceil(ROUND_SECONDS - world.elapsed)),
        stamina: Math.round(world.stamina),
        powerLeft: Math.ceil(world.powerLeft),
        combo: world.elapsed - world.lastTreatAt <= 2.5 ? world.combo : 0,
        escaping: world.turkeys.filter(t => t.state === 'escape' || t.state === 'squeeze').map(t => t.def.name),
      });
    }
  });
  return null;
}

function GroundInput() {
  const down = useRef(false);
  const setPointer = (e: ThreeEvent<PointerEvent>) => {
    world.pointer.x = e.point.x;
    world.pointer.z = e.point.z;
  };
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      onPointerDown={(e) => { down.current = true; setPointer(e); }}
      onPointerUp={() => { down.current = false; }}
      onPointerLeave={() => { down.current = false; }}
      onPointerMove={(e) => { if (down.current || e.pointerType === 'touch') setPointer(e); }}
    >
      <planeGeometry args={[80, 80]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

function Lights() {
  const low = useUI(s => s.lowGraphics);
  return (
    <>
      <ambientLight intensity={0.75} color="#e0f0ff" />
      <hemisphereLight args={['#bfe3ff', '#6B8E23', 0.5]} />
      <directionalLight
        castShadow={!low}
        position={[10, 22, 10]}
        intensity={1.8}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={60}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
    </>
  );
}

export default function Scene() {
  const roundId = useUI(s => s.roundId);
  return (
    // Created once and kept across rounds: rebuilding the WebGL context per round crashes phone GPUs.
    <Canvas
      shadows={{ type: PCFShadowMap }}
      dpr={[1, 1.5]}
      onCreated={({ scene }) => { scene.background = new Color('#60a5fa'); }}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        target.setPointerCapture?.(e.pointerId);
      }}
    >
      <PerspectiveCamera makeDefault position={CAMERA_POS} fov={45} rotation={[-0.95, 0, 0]} />
      <Lights />
      <Farm />
      <GroundInput />
      <group key={roundId}>
        <Driver />
        <Penny />
        <Turkeys />
        <Wallace />
        <Treats />
        <Bucket />
      </group>
    </Canvas>
  );
}
