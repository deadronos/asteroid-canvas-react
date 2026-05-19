import * as THREE from 'three';

import { useHudStore } from '../ui/useHudStore';
import { RAPIER } from './rapier';
import {
  ASTEROID_SPAWN_RADIUS_MAX,
  ASTEROID_SPAWN_RADIUS_MIN,
  PROJECTILE_TTL,
} from './sessionConstants';
import { makeId, randomBetween, toRapierVector } from './spatial';
import type { EntityStore, SpawnApi } from './sessionTypes';
import type { ShipBlueprint } from './types';

export function createSpawnApi(store: EntityStore): SpawnApi {
  const { addEntity, physics } = store;

  const spawnShip = (blueprint: ShipBlueprint) => {
    const [width, height, length] = blueprint.hull.dimensions;
    const body = physics.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(0, 0, 0)
        .enabledTranslations(true, false, true)
        .enabledRotations(false, true, false)
        .setLinearDamping(2.9)
        .setAngularDamping(5.4)
        .setAdditionalMass(blueprint.hull.mass),
    );

    physics.createCollider(
      RAPIER.ColliderDesc.cuboid(width / 2, height / 2, length / 2).setMass(blueprint.hull.mass),
      body,
    );

    return addEntity({
      id: makeId('ship'),
      kind: 'ship',
      body,
      radius: blueprint.hull.radius,
      renderColor: blueprint.hull.color,
      ship: {
        blueprint,
        hull: blueprint.hull.maxHull,
        armor: blueprint.armor.maxArmor,
        shield: blueprint.shield.maxShield,
        shieldDelay: 0,
        manualCooldown: 0,
        turretCooldowns: blueprint.turrets.map(() => 0),
        autoTurrets: useHudStore.getState().autoTurretsEnabled,
      },
    });
  };

  const spawnAsteroid = (center: THREE.Vector3) => {
    const distance = randomBetween(ASTEROID_SPAWN_RADIUS_MIN, ASTEROID_SPAWN_RADIUS_MAX);
    const angle = randomBetween(0, Math.PI * 2);
    const size = randomBetween(1.1, 3.2);
    const translation = new THREE.Vector3(
      center.x + Math.cos(angle) * distance,
      randomBetween(-3, 3),
      center.z + Math.sin(angle) * distance,
    );
    const travelDirection = center
      .clone()
      .sub(translation)
      .normalize()
      .multiplyScalar(randomBetween(4.8, 9.4))
      .add(
        new THREE.Vector3(
          randomBetween(-0.8, 0.8),
          randomBetween(-0.2, 0.2),
          randomBetween(-0.8, 0.8),
        ),
      );
    const body = physics.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(translation.x, translation.y, translation.z)
        .setLinearDamping(0.08)
        .setAngularDamping(0.15),
    );

    physics.createCollider(RAPIER.ColliderDesc.ball(size).setMass(size * 4.5), body);
    body.setLinvel(toRapierVector(travelDirection.x, travelDirection.y, travelDirection.z), true);
    body.setAngvel(
      toRapierVector(randomBetween(-0.6, 0.6), randomBetween(-0.6, 0.6), randomBetween(-0.6, 0.6)),
      true,
    );

    return addEntity({
      id: makeId('asteroid'),
      kind: 'asteroid',
      body,
      radius: size,
      renderColor: '#7f6958',
      asteroid: {
        hitPoints: 26 + size * 18,
        size,
      },
    });
  };

  const spawnProjectile = (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number,
    owner: 'player' | 'turret',
    color: string,
  ) => {
    const body = physics.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(origin.x, origin.y, origin.z)
        .setLinearDamping(0),
    );

    physics.createCollider(RAPIER.ColliderDesc.ball(0.16).setSensor(true), body);
    body.setLinvel(
      toRapierVector(direction.x * speed, direction.y * speed, direction.z * speed),
      true,
    );

    return addEntity({
      id: makeId('projectile'),
      kind: 'projectile',
      body,
      radius: 0.22,
      renderColor: color,
      projectile: {
        ttl: PROJECTILE_TTL,
        damage,
        owner,
        color,
      },
    });
  };

  return {
    spawnShip,
    spawnAsteroid,
    spawnProjectile,
  };
}
