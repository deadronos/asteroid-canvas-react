import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

import type { GameEntity } from '../core/types';
import { syncObjectTransform } from './syncObjectTransform';

function getEngineOffsets(engineCount: number, width: number) {
  return Array.from({ length: engineCount }, (_, index) => {
    if (engineCount === 1) {
      return 0;
    }

    return ((index / (engineCount - 1)) * 2 - 1) * (width * 0.26);
  });
}

export default function ShipMesh({ entity }: { entity: GameEntity }) {
  const groupRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    syncObjectTransform(groupRef.current, entity);

    if (shieldRef.current && entity.ship) {
      const shieldRatio = entity.ship.shield / entity.ship.blueprint.shield.maxShield;
      shieldRef.current.visible = shieldRatio > 0.01;
      shieldRef.current.scale.setScalar(1 + shieldRatio * 0.08);

      const material = shieldRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.04 + shieldRatio * 0.18;
    }
  });

  if (!entity.ship) {
    return null;
  }

  const blueprint = entity.ship.blueprint;
  const [width, height, length] = blueprint.hull.dimensions;
  const engineOffsets = getEngineOffsets(blueprint.engines.nozzleCount, width);

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[width, height, length * 0.72]} />
        <meshStandardMaterial color={blueprint.hull.color} metalness={0.35} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0, -length * 0.43]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[width * 0.46, length * 0.58, 6]} />
        <meshStandardMaterial color={blueprint.hull.accentColor} metalness={0.28} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.18, 0.1]}>
        <boxGeometry
          args={[
            width + blueprint.armor.shellThickness,
            height + blueprint.armor.shellThickness,
            length * 0.58,
          ]}
        />
        <meshStandardMaterial
          color={blueprint.armor.color}
          metalness={0.62}
          roughness={0.5}
          transparent
          opacity={0.62}
        />
      </mesh>
      {blueprint.turrets.map((turret) => (
        <group key={turret.id} position={turret.mount}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.28, 12]} />
            <meshStandardMaterial color="#d9ebff" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.1, -0.38]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.7, 10]} />
            <meshStandardMaterial color={turret.color} emissive={turret.color} emissiveIntensity={0.75} />
          </mesh>
        </group>
      ))}
      {engineOffsets.map((offset, index) => (
        <mesh
          key={`${blueprint.id}-engine-${index}`}
          position={[offset, -0.1, length * 0.36]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[0.18, 0.5, 10]} />
          <meshStandardMaterial color="#ff9f62" emissive="#ff8f3f" emissiveIntensity={1.05} />
        </mesh>
      ))}
      <mesh ref={shieldRef} scale={1.02}>
        <sphereGeometry args={[blueprint.hull.radius + 0.34, 18, 18]} />
        <meshBasicMaterial color={blueprint.shield.color} transparent opacity={0.14} wireframe />
      </mesh>
    </group>
  );
}