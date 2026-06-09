/**
 * Pure math helpers that do not depend on Rapier or Three.js state:
 * id generation, random ranges, Rapier <-> Three.js vector / quaternion
 * conversion, and a squared point-to-segment distance used by the
 * swept-sphere collision test in `createCombatSystems`.
 *
 * Split out from `bodyTransform.ts` (formerly `spatial.ts`) so that
 * helpers that operate on Rapier `body` instances live separately
 * from generic math utilities. See issue #7.
 */
import * as THREE from 'three';

import { RAPIER } from './rapier';

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function toRapierVector(x: number, y: number, z: number): RAPIER.Vector {
  return { x, y, z };
}

export function toThreeVector(vector: RAPIER.Vector) {
  return new THREE.Vector3(vector.x, vector.y, vector.z);
}

export function toThreeQuaternion(rotation: RAPIER.Rotation) {
  return new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
}

/**
 * Returns the squared distance from `point` to the line segment
 * `a -> b` in 3D space. The segment is treated as a finite line (not
 * an infinite line) — when the projection of `point` onto the
 * segment's parametric line falls outside `[0, 1]`, the distance is
 * measured to the closer endpoint instead.
 *
 * The squared form is used to avoid an unnecessary `sqrt` in the
 * hot path of `resolveProjectileHits`, which compares against the
 * squared combined radius of the projectile and asteroid.
 */
export function distancePointToSegmentSquared(
  point: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const abLenSq = abx * abx + aby * aby + abz * abz;

  // Degenerate segment (a === b): distance to the single point.
  if (abLenSq === 0) {
    const dx = point.x - a.x;
    const dy = point.y - a.y;
    const dz = point.z - a.z;
    return dx * dx + dy * dy + dz * dz;
  }

  // Project (point - a) onto (b - a), clamped to [0, 1].
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const apz = point.z - a.z;
  let t = (apx * abx + apy * aby + apz * abz) / abLenSq;
  if (t < 0) {
    t = 0;
  } else if (t > 1) {
    t = 1;
  }

  const cx = a.x + abx * t;
  const cy = a.y + aby * t;
  const cz = a.z + abz * t;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const dz = point.z - cz;

  return dx * dx + dy * dy + dz * dz;
}
