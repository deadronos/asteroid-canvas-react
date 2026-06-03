import { copyBodyTranslation, getForward, projectLocalPoint } from '../spatial';
import type { EntityStore, SpawnApi } from '../sessionTypes';
import type { GameEntity, InputSnapshot } from '../types';

export function fireManualWeapons(shipEntity: GameEntity, spawnApi: SpawnApi) {
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
}

export function fireAutoTurrets(shipEntity: GameEntity, store: EntityStore, spawnApi: SpawnApi) {
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
      const asteroidPosition = copyBodyTranslation(asteroid.body);
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

    const direction = copyBodyTranslation(bestTarget.body).sub(mountWorld).normalize();

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
}

export function updateShipWeapons(
  shipEntity: GameEntity,
  dt: number,
  input: InputSnapshot,
  store: EntityStore,
  spawnApi: SpawnApi,
  isPlaying: boolean,
) {
  if (!shipEntity.ship) {
    return;
  }

  if (isPlaying && input.fire && shipEntity.ship.manualCooldown === 0) {
    fireManualWeapons(shipEntity, spawnApi);
  }

  if (isPlaying) {
    fireAutoTurrets(shipEntity, store, spawnApi);
  }
}
