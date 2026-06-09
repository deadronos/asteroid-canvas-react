import type * as Rapier from '@dimforge/rapier3d-compat';
import type { World as ECSWorld } from 'miniplex';
import type * as THREE from 'three';

import type { GameEventBus } from './events';
import type { GameEntity, InputSnapshot, ShipBlueprint } from './types';

export interface GameQueries {
  ships: Iterable<GameEntity>;
  asteroids: Iterable<GameEntity>;
  projectiles: Iterable<GameEntity>;
}

export interface SessionConfig {
  autoTurretsEnabled: boolean;
  gameState: 'menu' | 'playing' | 'gameover';
}

export interface EntityStore {
  ecs: ECSWorld<GameEntity>;
  physics: Rapier.World;
  queries: GameQueries;
  eventBus: GameEventBus;
  addEntity: (entity: GameEntity) => GameEntity;
  removeEntity: (entity: GameEntity) => void;
  getPlayerShip: () => GameEntity | null;
  subscribeStructure: (listener: () => void) => () => void;
  getStructureRevision: () => number;
  dispose: () => void;
  clearTransientEntities: () => void;
  setOnClearTransient: (hook: (() => void) | undefined) => void;
}

export interface SpawnApi {
  spawnShip: (blueprint: ShipBlueprint, autoTurretsEnabled: boolean) => GameEntity;
  spawnAsteroid: (center: THREE.Vector3) => GameEntity;
  spawnProjectile: (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number,
    owner: 'player' | 'turret',
    color: string,
  ) => GameEntity;
}

export interface GameSession {
  ecs: ECSWorld<GameEntity>;
  physics: Rapier.World;
  queries: GameQueries;
  eventBus: GameEventBus;
  config: SessionConfig;
  step: (dt: number, input?: InputSnapshot) => void;
  setConfig: (updates: Partial<SessionConfig>) => void;
  dispose: () => void;
  getPlayerShip: () => GameEntity | null;
  subscribeStructure: (listener: () => void) => () => void;
  getStructureRevision: () => number;
  addEntity: (entity: GameEntity) => GameEntity;
  removeEntity: (entity: GameEntity) => void;
  clearTransientEntities: () => void;
  setOnClearTransient: (hook: (() => void) | undefined) => void;
}
