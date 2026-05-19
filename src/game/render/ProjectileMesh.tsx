import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';

import type { GameEntity } from '../core/types';
import { syncObjectTransform } from './syncObjectTransform';

export default function ProjectileMesh({ entity }: { entity: GameEntity }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    syncObjectTransform(meshRef.current, entity);
  });

  if (!entity.projectile) {
    return null;
  }

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.17, 10, 10]} />
      <meshStandardMaterial
        color={entity.projectile.color}
        emissive={entity.projectile.color}
        emissiveIntensity={1.25}
        roughness={0.1}
      />
    </mesh>
  );
}