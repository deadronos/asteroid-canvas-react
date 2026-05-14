export type GameState = 'START' | 'PLAYING' | 'SHIP_DESTROYED' | 'LEVEL_CLEAR' | 'GAME_OVER';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Ship {
  position: Vector3;
  velocity: Vector3;
  rotation: number; // yaw in radians
  invulnerable: boolean;
  invulnerableTimer: number;
}

export interface Asteroid {
  id: number;
  position: Vector3;
  velocity: Vector3;
  angularVelocity: Vector3;
  size: 'large' | 'medium' | 'small';
  radius: number;
  vertices: Vector3[]; // for procedural mesh
}

export interface Bullet {
  id: number;
  position: Vector3;
  velocity: Vector3;
  lifetime: number;
}

export interface Particle {
  id: number;
  position: Vector3;
  velocity: Vector3;
  lifetime: number;
  maxLifetime: number;
}

export interface GameData {
  state: GameState;
  score: number;
  lives: number;
  level: number;
  ship: Ship;
  asteroids: Asteroid[];
  bullets: Bullet[];
  particles: Particle[];
  nextAsteroidId: number;
  nextBulletId: number;
  nextParticleId: number;
  levelClearTimer: number;
}