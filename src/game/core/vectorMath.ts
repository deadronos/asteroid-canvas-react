/**
 * Pure math helpers that do not depend on Rapier or Three.js state:
 * id generation, random ranges, and Rapier <-> Three.js vector /
 * quaternion conversion.
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
