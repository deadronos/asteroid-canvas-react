import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from './constants';
import type { Ship } from './types';
import type { KeyboardState } from './useKeyboard';

interface ShipProps {
  ship: Ship;
  keysRef: React.MutableRefObject<KeyboardState>;
}

export function ShipMesh({ ship, keysRef }: ShipProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Elongated octahedron — two pyramids base-to-base, stretched on Y
  const geometry = useMemo(() => {
    const geo = new THREE.OctahedronGeometry(1, 0);
    geo.scale(0.8, 2, 0.8);
    return geo;
  }, []);

  const wireframeGeo = useMemo(() => new THREE.WireframeGeometry(geometry), [geometry]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: COLORS.ship,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  // Engine glow position (tail of ship)
  const enginePosition = useMemo(() => new THREE.Vector3(0, -1.8, 0), []);

  useFrame(() => {
    if (!meshRef.current) return;

    // Update position
    meshRef.current.position.set(ship.position.x, ship.position.y, ship.position.z);

    // Rotate to face direction (yaw around Y)
    meshRef.current.rotation.set(0, ship.rotation, 0);

    // Visibility (blink when invulnerable)
    meshRef.current.visible = !ship.invulnerable || Math.floor(Date.now() / 100) % 2 === 0;
  });

  // Dispose Three.js resources on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      geometry.dispose();
      wireframeGeo.dispose();
      material.dispose();
    };
  }, [geometry, wireframeGeo, material]);

  return (
    <group>
      <lineSegments ref={meshRef as any} geometry={wireframeGeo} material={material} />
    </group>
  );
}