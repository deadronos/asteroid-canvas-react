import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { copyBodyTranslation } from '../core/spatial';
import type { GameSession } from '../core/sessionTypes';
import { useHudStore } from '../ui/useHudStore';

const ORBIT_POINT_OFFSET = new THREE.Vector3(0, 1.35, 0);

export default function ChaseCamera({ session }: { session: GameSession }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const desiredTarget = useRef(new THREE.Vector3());
  const targetDelta = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const gameState = useHudStore((state) => state.gameState);

  useFrame((_, delta) => {
    const ship = session.getPlayerShip();
    const controls = controlsRef.current;

    if (!ship || !controls || !ship.body.isValid()) {
      return;
    }

    const followDamping = 1 - Math.exp(-delta * 6);

    desiredTarget.current.copy(copyBodyTranslation(ship.body)).add(ORBIT_POINT_OFFSET);

    if (!initialized.current) {
      initialized.current = true;
      controls.target.copy(desiredTarget.current);
      camera.lookAt(desiredTarget.current);
      controls.update();
      return;
    }

    targetDelta.current
      .copy(desiredTarget.current)
      .sub(controls.target)
      .multiplyScalar(followDamping);

    camera.position.add(targetDelta.current);
    controls.target.add(targetDelta.current);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.12}
      enablePan={false}
      minDistance={6}
      maxDistance={28}
      maxPolarAngle={Math.PI / 2.05}
      rotateSpeed={0.8}
      zoomSpeed={0.9}
      autoRotate={gameState !== 'playing'}
      autoRotateSpeed={0.6}
    />
  );
}
