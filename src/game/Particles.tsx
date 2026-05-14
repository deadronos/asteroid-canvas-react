import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, PARTICLE } from './constants';
import type { Particle } from './types';

interface ParticlesProps {
  particles: Particle[];
}

const SPREAD = 0.05;

export function ParticleSystem({ particles }: ParticlesProps) {
  // Use a single line segments geometry for all particles (pooled)
  const ref = useRef<THREE.LineSegments>(null);

  const { geometry, material } = useMemo(() => {
    // Pre-allocate full pool — 2 vertices per particle (line segment)
    const positions = new Float32Array(PARTICLE.poolSize * 6); // 2 * 3 coords per particle
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      color: COLORS.particle,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(() => {
    if (!ref.current) return;

    const positions = geometry.attributes.position.array as Float32Array;
    let drawCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.lifetime <= 0) continue;

      // Fade opacity based on remaining lifetime
      const fade = Math.max(0, p.lifetime / p.maxLifetime);
      material.opacity = 0.8 * fade;

      // Two vertices per particle (a line segment "dot")
      // Use same position twice for a dot effect (or slightly offset)

      positions[drawCount * 6 + 0] = p.position.x;
      positions[drawCount * 6 + 1] = p.position.y;
      positions[drawCount * 6 + 2] = p.position.z;
      positions[drawCount * 6 + 3] = p.position.x + SPREAD;
      positions[drawCount * 6 + 4] = p.position.y + SPREAD;
      positions[drawCount * 6 + 5] = p.position.z + SPREAD;

      drawCount++;
    }

    geometry.setDrawRange(0, drawCount * 2);
    geometry.attributes.position.needsUpdate = true;
  });

  return <lineSegments ref={ref as any} geometry={geometry} material={material} />;
}