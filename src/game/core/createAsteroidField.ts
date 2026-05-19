import {
  ASTEROID_RESPAWN_DELAY,
  ASTEROID_TARGET_COUNT,
  DESPAWN_DISTANCE,
} from './sessionConstants';
import { copyBodyTranslation, countEntities } from './spatial';
import type { EntityStore, SpawnApi } from './sessionTypes';
import type { GameEntity } from './types';

export function createAsteroidField(store: EntityStore, spawnApi: SpawnApi) {
  let asteroidRespawnTimer = 0;

  const maintainAsteroids = (shipEntity: GameEntity, dt: number) => {
    const shipPosition = copyBodyTranslation(shipEntity.body);
    const asteroidsToRemove: GameEntity[] = [];

    for (const asteroid of store.queries.asteroids) {
      const asteroidPosition = copyBodyTranslation(asteroid.body);

      if (asteroidPosition.distanceTo(shipPosition) > DESPAWN_DISTANCE) {
        asteroidsToRemove.push(asteroid);
      }
    }

    asteroidsToRemove.forEach((asteroid) => store.removeEntity(asteroid));

    asteroidRespawnTimer -= dt;

    if (asteroidRespawnTimer > 0) {
      return;
    }

    while (countEntities(store.queries.asteroids) < ASTEROID_TARGET_COUNT) {
      spawnApi.spawnAsteroid(shipPosition);
      asteroidRespawnTimer = ASTEROID_RESPAWN_DELAY;
    }
  };

  return {
    maintainAsteroids,
  };
}
