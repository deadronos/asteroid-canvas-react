import { World as ECSWorld } from 'miniplex';

import type { GameEventBus } from './events';
import { RAPIER } from './rapier';
import { toRapierVector } from './vectorMath';
import type { EntityStore, GameQueries } from './sessionTypes';
import type { GameEntity } from './types';

export function createEntityStore(eventBus: GameEventBus): EntityStore {
  const ecs = new ECSWorld<GameEntity>();
  const physics = new RAPIER.World(toRapierVector(0, 0, 0));
  const queries: GameQueries = {
    ships: ecs.with('ship', 'body'),
    asteroids: ecs.with('asteroid', 'body'),
    projectiles: ecs.with('projectile', 'body'),
  };
  const structureListeners = new Set<() => void>();
  let structureRevision = 0;
  // Optional hook invoked after clearTransientEntities finishes. Wired
  // by createGameSession to let createAsteroidField reset its respawn
  // timer (so a restart cannot cause a single-tick re-population of
  // the field).
  let onClearTransient: (() => void) | undefined;

  const markStructureChanged = () => {
    structureRevision += 1;

    for (const listener of structureListeners) {
      listener();
    }
  };

  const addEntity = (entity: GameEntity) => {
    ecs.add(entity);
    markStructureChanged();
    return entity;
  };

  const removeEntity = (entity: GameEntity) => {
    physics.removeRigidBody(entity.body);
    ecs.remove(entity);
    markStructureChanged();
  };

  const getPlayerShip = () => Array.from(queries.ships)[0] ?? null;

  const subscribeStructure = (listener: () => void) => {
    structureListeners.add(listener);

    return () => {
      structureListeners.delete(listener);
    };
  };

  const dispose = () => {
    physics.free();
    structureListeners.clear();
  };

  const clearTransientEntities = () => {
    for (const asteroid of Array.from(queries.asteroids)) {
      removeEntity(asteroid);
    }
    for (const projectile of Array.from(queries.projectiles)) {
      removeEntity(projectile);
    }
    onClearTransient?.();
  };

  const setOnClearTransient = (hook: (() => void) | undefined) => {
    onClearTransient = hook;
  };

  return {
    ecs,
    physics,
    queries,
    eventBus,
    addEntity,
    removeEntity,
    getPlayerShip,
    subscribeStructure,
    getStructureRevision: () => structureRevision,
    dispose,
    clearTransientEntities,
    setOnClearTransient,
  };
}
