import type { GameEventBus } from './events';
import { copyBodyTranslation } from './bodyTransform';
import { randomBetween, toRapierVector } from './vectorMath';
import type { EntityStore } from './sessionTypes';
import type { GameEntity } from './types';

export function createCombatSystems(
  store: EntityStore,
  applyShipDamage: (shipEntity: GameEntity, damage: number) => void,
  eventBus: GameEventBus,
) {
  let asteroidsDestroyed = 0;

  const resolveProjectileHits = () => {
    const projectiles = Array.from(store.queries.projectiles);
    const asteroids = Array.from(store.queries.asteroids);
    const spentProjectiles = new Set<GameEntity>();
    const destroyedAsteroids = new Set<GameEntity>();

    for (const projectile of projectiles) {
      const projectilePosition = copyBodyTranslation(projectile.body);

      for (const asteroid of asteroids) {
        const asteroidPosition = copyBodyTranslation(asteroid.body);
        const impactDistance = projectile.radius + asteroid.radius;

        if (
          projectilePosition.distanceToSquared(asteroidPosition) >
          impactDistance * impactDistance
        ) {
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

    // Count and emit one destruction event per unique asteroid, regardless
    // of how many projectiles hit it in the same frame. The previous
    // implementation incremented per-projectile, double-counting kills when
    // multiple projectiles connected with the same asteroid.
    for (const _asteroid of destroyedAsteroids) {
      asteroidsDestroyed += 1;
      eventBus.emit('asteroidDestroyed', { count: asteroidsDestroyed });
    }

    destroyedAsteroids.forEach((asteroid) => store.removeEntity(asteroid));
    spentProjectiles.forEach((projectile) => store.removeEntity(projectile));
  };

  const resolveShipAsteroidHits = (shipEntity: GameEntity) => {
    if (!shipEntity.ship) {
      return;
    }

    const shipPosition = copyBodyTranslation(shipEntity.body);

    for (const asteroid of Array.from(store.queries.asteroids)) {
      const asteroidPosition = copyBodyTranslation(asteroid.body);
      const combinedRadius = shipEntity.radius + asteroid.radius;

      if (shipPosition.distanceToSquared(asteroidPosition) > combinedRadius * combinedRadius) {
        continue;
      }

      const impactForce = (asteroid.asteroid?.size ?? 1) * 14;
      const separation = asteroidPosition.clone().sub(shipPosition).normalize();
      const newPosition = shipPosition
        .clone()
        .add(separation.multiplyScalar(shipEntity.radius + asteroid.radius + 10));
      // Push the asteroid AWAY from the ship (newPosition -> shipPosition direction).
      // The previous code subtracted in the wrong order, sending the asteroid
      // straight back into the ship and triggering immediate re-collision.
      const retreat = newPosition
        .clone()
        .sub(shipPosition)
        .normalize()
        .multiplyScalar(randomBetween(7, 11));

      applyShipDamage(shipEntity, impactForce);
      asteroid.body.setTranslation(
        toRapierVector(newPosition.x, newPosition.y, newPosition.z),
        true,
      );
      asteroid.body.setLinvel(toRapierVector(retreat.x, retreat.y, retreat.z), true);
    }
  };

  return {
    resolveProjectileHits,
    resolveShipAsteroidHits,
  };
}
