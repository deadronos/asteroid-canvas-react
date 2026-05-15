import { WORLD, SHIP, ASTEROID, GAME } from './constants';
import type { GameData, Ship, Asteroid, Vector3 } from './types';

export function wrapPosition(pos: Vector3): Vector3 {
  const hw = WORLD.width / 2;
  const hh = WORLD.height / 2;
  const hd = WORLD.depth / 2;
  return {
    x: ((pos.x + hw) % WORLD.width + WORLD.width) % WORLD.width - hw,
    y: ((pos.y + hh) % WORLD.height + WORLD.height) % WORLD.height - hh,
    z: ((pos.z + hd) % WORLD.depth + WORLD.depth) % WORLD.depth - hd,
  };
}

export function sphereCollision(a: Vector3, ra: number, b: Vector3, rb: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) < ra + rb;
}

export function createAsteroid(
  id: number,
  size: 'large' | 'medium' | 'small',
  position?: Vector3,
  velocity?: Vector3
): Asteroid {
  const config = ASTEROID[size];
  const pos = position || {
    x: (Math.random() - 0.5) * WORLD.width * 0.8,
    y: (Math.random() - 0.5) * WORLD.height * 0.8,
    z: (Math.random() - 0.5) * WORLD.depth * 0.6,
  };
  const speed = config.speed;
  const vel = velocity || {
    x: (Math.random() - 0.5) * speed * 2,
    y: (Math.random() - 0.5) * speed * 2,
    z: (Math.random() - 0.5) * speed * 1.5,
  };
  return {
    id,
    position: pos,
    velocity: vel,
    angularVelocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 },
    size,
    radius: config.radius,
    vertices: [],
  };
}

export function spawnBurst(): Vector3 {
  return {
    x: (Math.random() - 0.5) * 4 + (Math.random() > 0.5 ? -8 : 8),
    y: (Math.random() - 0.5) * 4,
    z: (Math.random() - 0.5) * 4,
  };
}

export function initGame(level = 1, lives = GAME.startLives, score = 0): GameData {
  const asteroids: Asteroid[] = [];
  const count = GAME.startAsteroids + (level - 1);
  for (let i = 0; i < count; i++) {
    asteroids.push(createAsteroid(i, 'large'));
  }
  const ship: Ship = {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: 0,
    invulnerable: false,
    invulnerableTimer: 0,
  };
  return {
    state: 'START',
    score,
    lives,
    level,
    ship,
    asteroids,
    bullets: [],
    particles: [],
    nextAsteroidId: count,
    nextBulletId: 0,
    nextParticleId: 0,
    levelClearTimer: 0,
  };
}