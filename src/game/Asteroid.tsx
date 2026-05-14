import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
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
  const vectors: THREE.Vector3[] = [];

  for (let i = 0; i < vertexCount; i++) {
    // Random point on sphere surface
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = radius * (0.7 + random() * 0.5);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    vectors.push(new THREE.Vector3(x, y, z));
  }

  // Return the convex hull geometry (approximate — works well enough for wireframe asteroids)
  return new ConvexGeometry(vectors);
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

  useEffect(() => {
    return () => {
      geometry.dispose();
      wireframeGeo.dispose();
      material.dispose();
    };
  }, [geometry, wireframeGeo, material]);

  return (
    <lineSegments
      geometry={wireframeGeo}
      material={material}
      position={[asteroid.position.x, asteroid.position.y, asteroid.position.z]}
      rotation={[asteroid.angularVelocity.x, asteroid.angularVelocity.y, asteroid.angularVelocity.z]}
    />
  );
}