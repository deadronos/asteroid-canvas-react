import * as THREE from 'three';

import { cruiserBlueprint } from '../config/ships';
import { useHudStore } from '../ui/useHudStore';
import { createAsteroidField } from './createAsteroidField';
import { createCombatSystems } from './createCombatSystems';
import { createEntityStore } from './createEntityStore';
import { createProjectileSystems } from './createProjectileSystems';
import { createShipSystems } from './createShipSystems';
import { createSpawnApi } from './createSpawnApi';
import { assertRapierReady } from './rapier';
import { ASTEROID_TARGET_COUNT } from './sessionConstants';
import { countEntities } from './spatial';
import type { GameSession } from './sessionTypes';
import { syncTelemetry } from './telemetry';
import { EMPTY_INPUT } from './types';
import type { InputSnapshot } from './types';

export function createGameSession(): GameSession {
  assertRapierReady();

  const store = createEntityStore();
  const spawnApi = createSpawnApi(store);
  const shipSystems = createShipSystems(store, spawnApi);
  const combatSystems = createCombatSystems(store, shipSystems.applyShipDamage);
  const projectileSystems = createProjectileSystems(store);
  const asteroidField = createAsteroidField(store, spawnApi);

  const step = (dt: number, input: InputSnapshot = EMPTY_INPUT) => {
    const clampedDt = Math.min(dt, 1 / 20);
    const shipEntity = store.getPlayerShip();

    if (!shipEntity || clampedDt <= 0) {
      return;
    }

    if (input.toggleAutoTurrets) {
      useHudStore.getState().toggleAutoTurrets();
    }

    shipSystems.updateShip(shipEntity, clampedDt, input);
    store.physics.timestep = clampedDt;
    store.physics.step();
    combatSystems.resolveProjectileHits();
    combatSystems.resolveShipAsteroidHits(shipEntity);
    projectileSystems.updateProjectiles(clampedDt);
    asteroidField.maintainAsteroids(shipEntity, clampedDt);
    syncTelemetry(shipEntity, countEntities(store.queries.asteroids));
  };

  spawnApi.spawnShip(cruiserBlueprint);

  for (let index = 0; index < ASTEROID_TARGET_COUNT; index += 1) {
    spawnApi.spawnAsteroid(new THREE.Vector3(0, 0, 0));
  }

  return {
    ecs: store.ecs,
    physics: store.physics,
    queries: store.queries,
    step,
    dispose: store.dispose,
    getPlayerShip: store.getPlayerShip,
    subscribeStructure: store.subscribeStructure,
    getStructureRevision: store.getStructureRevision,
  };
}