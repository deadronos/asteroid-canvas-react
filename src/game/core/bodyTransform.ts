/**
 * Helpers that read or mutate a Rapier rigid body and return values
 * the rest of the simulation can consume (Three.js vectors,
 * quaternions, plain numbers, etc.).
 *
 * Renamed from `spatial.ts` to reflect what it actually contains —
 * body-transform helpers, not a spatial index. The `spatial.ts` name
 * is reserved for a future real spatial index (see issue #7).
 */
import * as THREE from 'three';

import { RAPIER } from './rapier';
import { toRapierVector } from './vectorMath';

const FORWARD_VECTOR = new THREE.Vector3(0, 0, -1);
const RIGHT_VECTOR = new THREE.Vector3(1, 0, 0);

export function copyBodyTranslation(body: RAPIER.RigidBody) {
  const { x, y, z } = body.translation();

  return new THREE.Vector3(x, y, z);
}

export function copyBodyQuaternion(body: RAPIER.RigidBody) {
  const { x, y, z, w } = body.rotation();

  return new THREE.Quaternion(x, y, z, w);
}

export function copyBodyLinvel(body: RAPIER.RigidBody) {
  const { x, y, z } = body.linvel();

  return { x, y, z };
}

export function countEntities(entities: Iterable<unknown>) {
  let count = 0;

  for (const _ of entities) {
    count += 1;
  }

  return count;
}

export function getForward(body: RAPIER.RigidBody) {
  return FORWARD_VECTOR.clone().applyQuaternion(copyBodyQuaternion(body)).setY(0).normalize();
}

export function getRight(body: RAPIER.RigidBody) {
  return RIGHT_VECTOR.clone().applyQuaternion(copyBodyQuaternion(body)).setY(0).normalize();
}

export function projectLocalPoint(body: RAPIER.RigidBody, localPoint: [number, number, number]) {
  const translation = copyBodyTranslation(body);

  return new THREE.Vector3(localPoint[0], localPoint[1], localPoint[2])
    .applyQuaternion(copyBodyQuaternion(body))
    .add(translation);
}

export function capHorizontalVelocity(body: RAPIER.RigidBody, maxSpeed: number) {
  const { x: linvelX, y: linvelY, z: linvelZ } = copyBodyLinvel(body);
  const horizontal = new THREE.Vector2(linvelX, linvelZ);

  if (horizontal.lengthSq() <= maxSpeed * maxSpeed) {
    return;
  }

  horizontal.setLength(maxSpeed);
  body.setLinvel(toRapierVector(horizontal.x, linvelY, horizontal.y), true);
}
