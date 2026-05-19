import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

import type { GameSession } from '../core/sessionTypes';

export default function ChaseCamera({ session }: { session: GameSession }) {
  const { camera } = useThree();
  const smoothedLookAt = useRef(new THREE.Vector3());
  const desiredCameraPosition = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const ship = session.getPlayerShip();

    if (!ship) {
      return;
    }

    const translation = ship.body.translation();
    const rotation = ship.body.rotation();
    const shipPosition = new THREE.Vector3(translation.x, translation.y, translation.z);
    const shipQuaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    const followOffset = new THREE.Vector3(0, 4.8, 13.5).applyQuaternion(shipQuaternion);
    const lookOffset = new THREE.Vector3(0, 1.35, -12).applyQuaternion(shipQuaternion);
    const damping = 1 - Math.exp(-delta * 4.2);

    desiredCameraPosition.current.copy(shipPosition).add(followOffset);
    smoothedLookAt.current.lerp(shipPosition.clone().add(lookOffset), damping);
    camera.position.lerp(desiredCameraPosition.current, damping);
    camera.lookAt(smoothedLookAt.current);
  });

  return null;
}
