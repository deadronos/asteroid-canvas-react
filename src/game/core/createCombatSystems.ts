import { randomBetween, toRapierVector, toThreeVector } from './spatial';
import type { EntityStore } from './sessionTypes';
import type { GameEntity } from './types';

export function createCombatSystems(
  store: EntityStore,
  applyShipDamage: (shipEntity: GameEntity, damage: number) => void,
) {
  const resolveProjectileHits = () => {
    const projectiles = Array.from(store.queries.projectiles);
    const asteroids = Array.from(store.queries.asteroids);
    const spentProjectiles = new Set<GameEntity>();
    const destroyedAsteroids = new Set<GameEntity>();

    for (const projectile of projectiles) {
      const projectilePosition = toThreeVector(projectile.body.translation());

      for (const asteroid of asteroids) {
        const asteroidPosition = toThreeVector(asteroid.body.translation());
        const impactDistance = projectile.radius + asteroid.radius;

        if (projectilePosition.distanceToSquared(asteroidPosition) > impactDistance * impactDistance) {
          continue;
        }

        if (asteroid.asteroid && projectile.projectile) {
          asteroid.asteroid.hitPoints -= projectile.projectile.damage;
        }

        spentProjectiles.add(projectile);

        if (asteroid.asteroid && asteroid.asteroid.hitPoints <= 0) {
          destroyedAsteroids.add(asteroid);
        }

        break;
      }
    }

    destroyedAsteroids.forEach((asteroid) => store.removeEntity(asteroid));
    spentProjectiles.forEach((projectile) => store.removeEntity(projectile));
  };

  const resolveShipAsteroidHits = (shipEntity: GameEntity) => {
    if (!shipEntity.ship) {
      return;
    }

    const shipPosition = toThreeVector(shipEntity.body.translation());

    for (const asteroid of Array.from(store.queries.asteroids)) {
      const asteroidPosition = toThreeVector(asteroid.body.translation());
      const combinedRadius = shipEntity.radius + asteroid.radius;

      if (shipPosition.distanceToSquared(asteroidPosition) > combinedRadius * combinedRadius) {
        continue;
      }

      const impactForce = (asteroid.asteroid?.size ?? 1) * 14;
      const separation = asteroidPosition.clone().sub(shipPosition).normalize();
      const newPosition = shipPosition.clone().add(separation.multiplyScalar(shipEntity.radius + asteroid.radius + 10));
      const retreat = shipPosition.clone().sub(newPosition).normalize().multiplyScalar(randomBetween(7, 11));

      applyShipDamage(shipEntity, impactForce);
      asteroid.body.setTranslation(toRapierVector(newPosition.x, newPosition.y, newPosition.z), true);
      asteroid.body.setLinvel(toRapierVector(retreat.x, retreat.y, retreat.z), true);
    }
  };

  return {
    resolveProjectileHits,
    resolveShipAsteroidHits,
  };
}