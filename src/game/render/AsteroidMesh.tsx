import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';

import type { GameEntity } from '../core/types';
import { syncObjectTransform } from './syncObjectTransform';

export default function AsteroidMesh({ entity }: { entity: GameEntity }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    syncObjectTransform(meshRef.current, entity);
  });

  if (!entity.asteroid) {
    return null;
  }

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <icosahedronGeometry args={[entity.asteroid.size, 1]} />
      <meshStandardMaterial
        color={entity.renderColor}
        roughness={0.95}
        metalness={0.04}
        flatShading
      />
    </mesh>
  );
}
