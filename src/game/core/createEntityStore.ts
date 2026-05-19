import { World as ECSWorld } from 'miniplex';

import { RAPIER } from './rapier';
import { toRapierVector } from './spatial';
import type { EntityStore, GameQueries } from './sessionTypes';
import type { GameEntity } from './types';

export function createEntityStore(): EntityStore {
  const ecs = new ECSWorld<GameEntity>();
  const physics = new RAPIER.World(toRapierVector(0, 0, 0));
  const queries: GameQueries = {
    ships: ecs.with('ship', 'body'),
    asteroids: ecs.with('asteroid', 'body'),
    projectiles: ecs.with('projectile', 'body'),
  };
  const structureListeners = new Set<() => void>();
  let structureRevision = 0;

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

  return {
    ecs,
    physics,
    queries,
    addEntity,
    removeEntity,
    getPlayerShip,
    subscribeStructure,
    getStructureRevision: () => structureRevision,
    dispose,
  };
}
