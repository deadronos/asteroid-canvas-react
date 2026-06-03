import * as THREE from 'three';

import { cruiserBlueprint } from '../config/ships';
import { createAsteroidField } from './createAsteroidField';
import { createCombatSystems } from './createCombatSystems';
import { createEntityStore } from './createEntityStore';
import { createGameEventBus } from './events';
import { createProjectileSystems } from './createProjectileSystems';
import { createShipSystems } from './createShipSystems';
import { createSpawnApi } from './createSpawnApi';
import { assertRapierReady } from './rapier';
import { ASTEROID_TARGET_COUNT } from './sessionConstants';
import { countEntities } from './spatial';
import type { GameSession, SessionConfig } from './sessionTypes';
import { syncTelemetry } from './telemetry';
import { EMPTY_INPUT } from './types';
import type { InputSnapshot } from './types';

export function createGameSession(): GameSession {
  assertRapierReady();

  const eventBus = createGameEventBus();
  const config: SessionConfig = {
    autoTurretsEnabled: true,
    gameState: 'menu',
  };

  const store = createEntityStore(eventBus);
  const spawnApi = createSpawnApi(store);
  const shipSystems = createShipSystems(store, spawnApi, config, eventBus);
  const combatSystems = createCombatSystems(store, shipSystems.applyShipDamage, eventBus);
  const projectileSystems = createProjectileSystems(store);
  const asteroidField = createAsteroidField(store, spawnApi);

  const step = (dt: number, input: InputSnapshot = EMPTY_INPUT) => {
    const clampedDt = Math.min(dt, 1 / 20);
    const shipEntity = store.getPlayerShip();

    if (!shipEntity || clampedDt <= 0) {
      return;
    }

    if (input.toggleAutoTurrets) {
      config.autoTurretsEnabled = !config.autoTurretsEnabled;
    }

    shipSystems.updateShip(shipEntity, clampedDt, input);
    store.physics.timestep = clampedDt;
    store.physics.step();
    combatSystems.resolveProjectileHits();
    combatSystems.resolveShipAsteroidHits(shipEntity);
    projectileSystems.updateProjectiles(clampedDt, shipEntity);
    asteroidField.maintainAsteroids(shipEntity, clampedDt);
    syncTelemetry(shipEntity, countEntities(store.queries.asteroids), eventBus);
  };

  spawnApi.spawnShip(cruiserBlueprint, config.autoTurretsEnabled);

  for (let index = 0; index < ASTEROID_TARGET_COUNT; index += 1) {
    spawnApi.spawnAsteroid(new THREE.Vector3(0, 0, 0));
  }

  return {
    ecs: store.ecs,
    physics: store.physics,
    queries: store.queries,
    eventBus,
    config,
    step,
    setConfig: (updates) => {
      Object.assign(config, updates);
    },
    dispose: store.dispose,
    getPlayerShip: store.getPlayerShip,
    subscribeStructure: store.subscribeStructure,
    getStructureRevision: store.getStructureRevision,
    addEntity: store.addEntity,
    removeEntity: store.removeEntity,
  };
}
