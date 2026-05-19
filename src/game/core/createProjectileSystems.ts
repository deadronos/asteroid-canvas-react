import { DESPAWN_DISTANCE } from './sessionConstants';
import type { EntityStore } from './sessionTypes';
import type { GameEntity } from './types';

export function createProjectileSystems(store: EntityStore) {
  const updateProjectiles = (dt: number) => {
    const expiredProjectiles: GameEntity[] = [];

    for (const projectile of store.queries.projectiles) {
      if (!projectile.projectile) {
        continue;
      }

      projectile.projectile.ttl -= dt;
      const position = projectile.body.translation();
      const distance = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);

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
