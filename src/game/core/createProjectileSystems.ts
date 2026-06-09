import { copyBodyTranslation } from './bodyTransform';
import { DESPAWN_DISTANCE } from './sessionConstants';
import type { EntityStore } from './sessionTypes';
import type { GameEntity } from './types';

export function createProjectileSystems(store: EntityStore) {
  /**
   * Snapshots each live projectile's current world position into
   * `projectile.lastPosition`. Must be called immediately before
   * `physics.step()` so the next `resolveProjectileHits` call has
   * the prev->curr segment it needs to run the swept-sphere test.
   *
   * (See issue #7: the static radius test tunneled fast projectiles
   * through small asteroids at close range.)
   */
  const captureProjectilePrevPositions = () => {
    for (const projectile of store.queries.projectiles) {
      if (!projectile.projectile) {
        continue;
      }
      projectile.projectile.lastPosition = copyBodyTranslation(projectile.body);
    }
  };

  const updateProjectiles = (dt: number, shipEntity: GameEntity) => {
    const shipPosition = copyBodyTranslation(shipEntity.body);
    const expiredProjectiles: GameEntity[] = [];

    for (const projectile of store.queries.projectiles) {
      if (!projectile.projectile) {
        continue;
      }

      projectile.projectile.ttl -= dt;
      const position = copyBodyTranslation(projectile.body);
      const distance = position.distanceTo(shipPosition);

      if (projectile.projectile.ttl <= 0 || distance > DESPAWN_DISTANCE) {
        expiredProjectiles.push(projectile);
      }
    }

    expiredProjectiles.forEach((projectile) => store.removeEntity(projectile));
  };

  return {
    captureProjectilePrevPositions,
    updateProjectiles,
  };
}
