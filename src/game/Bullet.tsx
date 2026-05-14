import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { COLORS } from './constants';
import type { Bullet } from './types';

interface BulletProps {
  bullet: Bullet;
}

export function BulletMesh({ bullet }: BulletProps) {
  const { wireframeGeo, material } = useMemo(() => {
    const geo = new THREE.OctahedronGeometry(0.3, 0);
    geo.scale(0.5, 2, 0.5);
    const wireGeo = new THREE.WireframeGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: COLORS.bullet,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { wireframeGeo: wireGeo, material: mat, geo };
  }, []);

  useEffect(() => {
    return () => {
      wireframeGeo.dispose();
      material.dispose();
    };
  }, [wireframeGeo, material]);

  return (
    <lineSegments
      geometry={wireframeGeo}
      material={material}
      position={[bullet.position.x, bullet.position.y, bullet.position.z]}
    />
  );
}