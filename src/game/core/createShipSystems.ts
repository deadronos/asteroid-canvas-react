import { useHudStore } from '../ui/useHudStore';

import { applyShipDamage } from './shipState';
import {
  capHorizontalVelocity,
  getForward,
  getRight,
  projectLocalPoint,
  toThreeVector,
} from './spatial';
import type { EntityStore, SpawnApi } from './sessionTypes';
import type { GameEntity, InputSnapshot } from './types';

export function createShipSystems(store: EntityStore, spawnApi: SpawnApi) {
  const fireManualWeapons = (shipEntity: GameEntity) => {
    if (!shipEntity.ship) {
      return;
    }

    const primaryTurret = shipEntity.ship.blueprint.turrets[0];

    if (!primaryTurret) {
      return;
    }

    const forward = getForward(shipEntity.body);
    const muzzle = projectLocalPoint(shipEntity.body, [
      0,
      0.1,
      -shipEntity.ship.blueprint.hull.dimensions[2] * 0.72,
    ]);

    spawnApi.spawnProjectile(
      muzzle,
      forward,
      primaryTurret.projectileSpeed + 10,
      primaryTurret.damage,
      'player',
      '#fff0b8',
    );
    shipEntity.ship.manualCooldown = 0.18;
  };

  const fireAutoTurrets = (shipEntity: GameEntity) => {
    if (!shipEntity.ship || !shipEntity.ship.autoTurrets) {
      return;
    }

    const asteroids = Array.from(store.queries.asteroids);

    if (asteroids.length === 0) {
      return;
    }

    shipEntity.ship.blueprint.turrets.forEach((turret, index) => {
      if (shipEntity.ship && shipEntity.ship.turretCooldowns[index] > 0) {
        return;
      }

      const mountWorld = projectLocalPoint(shipEntity.body, turret.mount);
      let bestTarget: GameEntity | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const asteroid of asteroids) {
        const asteroidPosition = toThreeVector(asteroid.body.translation());
        const distance = mountWorld.distanceTo(asteroidPosition);

        if (distance > turret.range || distance >= bestDistance) {
          continue;
        }

        bestDistance = distance;
        bestTarget = asteroid;
      }

      if (!bestTarget) {
        return;
      }

      const direction = toThreeVector(bestTarget.body.translation()).sub(mountWorld).normalize();

      spawnApi.spawnProjectile(
        mountWorld,
        direction,
        turret.projectileSpeed,
        turret.damage,
        'turret',
        turret.color,
      );

      if (shipEntity.ship) {
        shipEntity.ship.turretCooldowns[index] = turret.cooldown;
      }
    });
  };

  const updateShip = (shipEntity: GameEntity, dt: number, input: InputSnapshot) => {
    if (!shipEntity.ship) {
      return;
    }

    const forward = getForward(shipEntity.body);
    const right = getRight(shipEntity.body);
    const thrustInput = Number(input.forward) - Number(input.backward);
    const strafeInput = Number(input.strafeRight) - Number(input.strafeLeft);
    const yawInput = Number(input.yawLeft) - Number(input.yawRight);
    const blueprint = shipEntity.ship.blueprint;
    const thrustForce =
      thrustInput >= 0 ? blueprint.engines.mainThrust : blueprint.engines.reverseThrust;

    if (thrustInput !== 0) {
      const thrustVector = forward.multiplyScalar(thrustForce * thrustInput * dt);
      shipEntity.body.applyImpulse({ x: thrustVector.x, y: 0, z: thrustVector.z }, true);
    }

    if (strafeInput !== 0) {
      const dodgeVector = right.multiplyScalar(blueprint.thrusters.strafeThrust * strafeInput * dt);
      shipEntity.body.applyImpulse({ x: dodgeVector.x, y: 0, z: dodgeVector.z }, true);
    }

    shipEntity.body.setAngvel({ x: 0, y: yawInput * blueprint.thrusters.yawRate, z: 0 }, true);
    capHorizontalVelocity(shipEntity.body, blueprint.engines.maxSpeed);

    shipEntity.ship.manualCooldown = Math.max(0, shipEntity.ship.manualCooldown - dt);
    shipEntity.ship.turretCooldowns = shipEntity.ship.turretCooldowns.map((cooldown) =>
      Math.max(0, cooldown - dt),
    );
    shipEntity.ship.shieldDelay = Math.max(0, shipEntity.ship.shieldDelay - dt);
    shipEntity.ship.autoTurrets = useHudStore.getState().autoTurretsEnabled;

    if (shipEntity.ship.shieldDelay === 0 && shipEntity.ship.shield < blueprint.shield.maxShield) {
      shipEntity.ship.shield = Math.min(
        blueprint.shield.maxShield,
        shipEntity.ship.shield + blueprint.shield.rechargePerSecond * dt,
      );
    }

    if (input.fire && shipEntity.ship.manualCooldown === 0) {
      fireManualWeapons(shipEntity);
    }

    fireAutoTurrets(shipEntity);
  };

  return {
    applyShipDamage,
    updateShip,
  };
}
