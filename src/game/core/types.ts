import type * as RAPIER from '@dimforge/rapier3d-compat';
import type { Vector3 } from 'three';

export interface HullBlueprint {
  maxHull: number;
  mass: number;
  radius: number;
  dimensions: [width: number, height: number, length: number];
  color: string;
  accentColor: string;
}

export interface ArmorBlueprint {
  maxArmor: number;
  mitigation: number;
  shellThickness: number;
  color: string;
}

export interface ShieldBlueprint {
  maxShield: number;
  rechargePerSecond: number;
  rechargeDelay: number;
  color: string;
}

export interface EngineBlueprint {
  mainThrust: number;
  reverseThrust: number;
  maxSpeed: number;
  nozzleCount: number;
}

export interface ThrusterBlueprint {
  strafeThrust: number;
  yawRate: number;
  dodgeImpulse: number;
}

export interface TurretBlueprint {
  id: string;
  label: string;
  mount: [x: number, y: number, z: number];
  range: number;
  cooldown: number;
  projectileSpeed: number;
  damage: number;
  color: string;
}

export interface ShipBlueprint {
  id: string;
  label: string;
  description: string;
  hull: HullBlueprint;
  armor: ArmorBlueprint;
  shield: ShieldBlueprint;
  engines: EngineBlueprint;
  thrusters: ThrusterBlueprint;
  turrets: TurretBlueprint[];
}

export interface InputSnapshot {
  forward: boolean;
  backward: boolean;
  strafeLeft: boolean;
  strafeRight: boolean;
  yawLeft: boolean;
  yawRight: boolean;
  fire: boolean;
  toggleAutoTurrets: boolean;
}

export interface ShipRuntimeState {
  blueprint: ShipBlueprint;
  hull: number;
  armor: number;
  shield: number;
  shieldDelay: number;
  manualCooldown: number;
  turretCooldowns: number[];
  autoTurrets: boolean;
}

export interface AsteroidRuntimeState {
  hitPoints: number;
  size: number;
}

export interface ProjectileRuntimeState {
  ttl: number;
  damage: number;
  owner: 'player' | 'turret';
  color: string;
  /**
   * World-space position at the end of the previous physics step, used
   * by `resolveProjectileHits` to build the swept sphere for the
   * current step. Seeded with the muzzle position at spawn time so the
   * very first frame has a zero-length segment (no spurious hit at
   * the muzzle). Refreshed by `createProjectileSystems.captureStep`
   * at the start of every step, immediately before `physics.step()`.
   */
  lastPosition: Vector3;
}

export interface GameEntity {
  id: string;
  kind: 'ship' | 'asteroid' | 'projectile';
  body: RAPIER.RigidBody;
  radius: number;
  renderColor: string;
  ship?: ShipRuntimeState;
  asteroid?: AsteroidRuntimeState;
  projectile?: ProjectileRuntimeState;
}

export interface TelemetrySnapshot {
  shipName: string;
  hull: number;
  maxHull: number;
  armor: number;
  maxArmor: number;
  shield: number;
  maxShield: number;
  speed: number;
  asteroidCount: number;
  turretCount: number;
}

export const EMPTY_INPUT: InputSnapshot = {
  forward: false,
  backward: false,
  strafeLeft: false,
  strafeRight: false,
  yawLeft: false,
  yawRight: false,
  fire: false,
  toggleAutoTurrets: false,
};
