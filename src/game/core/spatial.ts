import * as THREE from 'three';

import { RAPIER } from './rapier';

const FORWARD_VECTOR = new THREE.Vector3(0, 0, -1);
const RIGHT_VECTOR = new THREE.Vector3(1, 0, 0);

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
