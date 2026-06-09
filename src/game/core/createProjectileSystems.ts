import { copyBodyTranslation } from './bodyTransform';
import { DESPAWN_DISTANCE } from './sessionConstants';
import type { EntityStore } from './sessionTypes';
import type { GameEntity } from './types';

export function createProjectileSystems(store: EntityStore) {
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
    updateProjectiles,
  };
}
