import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from './constants';
import type { Asteroid } from './types';

interface AsteroidProps {
  asteroid: Asteroid;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateIrregularPolyhedron(radius: number, seed: number): THREE.BufferGeometry {
  // Generate 8-12 vertices on a sphere with random perturbations
  const random = seededRandom(seed);
  const vertexCount = 8 + (seed % 5);
  const positions: number[] = [];

  for (let i = 0; i < vertexCount; i++) {
    // Random point on sphere surface
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = radius * (0.7 + random() * 0.5);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions.push(x, y, z);
  }

  // Create convex hull approximation using the vertices
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  // Return the convex hull geometry (approximate — works well enough for wireframe asteroids)
  return new THREE.ConvexGeometry(positions as unknown as THREE.Vector3[]);
}

export function AsteroidMesh({ asteroid }: AsteroidProps) {
  const { geometry, wireframeGeo, material } = useMemo(() => {
    // Use seed-based random for consistent shape per asteroid
    const seed = asteroid.id * 17 + asteroid.position.x * 3 + asteroid.position.z;
    const geo = generateIrregularPolyhedron(asteroid.radius, seed);
    const wireGeo = new THREE.WireframeGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: COLORS.asteroid,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geometry: geo, wireframeGeo: wireGeo, material: mat };
  }, [asteroid.id, asteroid.radius]);

  return (
    <lineSegments
      geometry={wireframeGeo}
      material={material}
      position={[asteroid.position.x, asteroid.position.y, asteroid.position.z]}
      rotation={[asteroid.angularVelocity.x, asteroid.angularVelocity.y, asteroid.angularVelocity.z]}
    />
  );
}