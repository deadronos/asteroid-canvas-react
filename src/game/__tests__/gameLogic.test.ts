import { describe, it, expect, beforeEach } from 'vitest';
import { wrapPosition, sphereCollision, initGame } from '../gameUtils';
import { WORLD, SHIP, ASTEROID, BULLET, PARTICLE, CAMERA, GAME, COLORS } from '../constants';
import type { Vector3 } from './types';

describe('wrapPosition', () => {
  it('should wrap x within world bounds', () => {
    const result = wrapPosition({ x: WORLD.width / 2 + 5, y: 0, z: 0 });
    expect(result.x).toBe(-WORLD.width / 2 + 5);
  });

  it('should wrap x when exiting left edge', () => {
    const result = wrapPosition({ x: -WORLD.width / 2 - 5, y: 0, z: 0 });
    expect(result.x).toBe(WORLD.width / 2 - 5);
  });

  it('should wrap y within world bounds', () => {
    const result = wrapPosition({ x: 0, y: WORLD.height / 2 + 3, z: 0 });
    expect(result.y).toBe(-WORLD.height / 2 + 3);
  });

  it('should wrap z within world bounds', () => {
    const result = wrapPosition({ x: 0, y: 0, z: WORLD.depth / 2 + 2 });
    expect(result.z).toBe(-WORLD.depth / 2 + 2);
  });

  it('should leave position unchanged when within bounds', () => {
    const pos = { x: 5, y: -3, z: 2 };
    const result = wrapPosition(pos);
    expect(result.x).toBe(5);
    expect(result.y).toBe(-3);
    expect(result.z).toBe(2);
  });

  it('should handle negative positions', () => {
    const result = wrapPosition({ x: -25, y: -25, z: -15 });
    // After wrapping, should be in positive range
    expect(Math.abs(result.x)).toBeLessThanOrEqual(WORLD.width / 2);
    expect(Math.abs(result.y)).toBeLessThanOrEqual(WORLD.height / 2);
    expect(Math.abs(result.z)).toBeLessThanOrEqual(WORLD.depth / 2);
  });

  it('should handle very large values', () => {
    const result = wrapPosition({ x: 1000, y: 1000, z: 1000 });
    expect(Math.abs(result.x)).toBeLessThanOrEqual(WORLD.width / 2);
    expect(Math.abs(result.y)).toBeLessThanOrEqual(WORLD.height / 2);
    expect(Math.abs(result.z)).toBeLessThanOrEqual(WORLD.depth / 2);
  });

  it('should wrap correctly at exact boundary', () => {
    const result = wrapPosition({ x: WORLD.width / 2, y: WORLD.height / 2, z: WORLD.depth / 2 });
    expect(result.x).toBe(-WORLD.width / 2);
    expect(result.y).toBe(-WORLD.height / 2);
    expect(result.z).toBe(-WORLD.depth / 2);
  });
});

describe('sphereCollision', () => {
  it('should detect collision when spheres overlap', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1.5, y: 0, z: 0 };
    expect(sphereCollision(a, 1, b, 1)).toBe(true);
  });

  it('should detect no collision when spheres are separate', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 5, y: 0, z: 0 };
    expect(sphereCollision(a, 1, b, 1)).toBe(false);
  });

  it('should detect collision at exact touch distance', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 2, y: 0, z: 0 };
    expect(sphereCollision(a, 1, b, 1)).toBe(false); // Exactly touching, no overlap
    expect(sphereCollision(a, 1, b, 1.001)).toBe(true); // Overlap
  });

  it('should detect collision with Z axis separation', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 1.9 };
    expect(sphereCollision(a, 1, b, 1)).toBe(true);
  });

  it('should detect no collision with Z axis separation', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 5 };
    expect(sphereCollision(a, 1, b, 1)).toBe(false);
  });

  it('should detect collision in 3D space with all axes separated', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1, y: 1, z: 1 };
    expect(sphereCollision(a, 1.5, b, 1.5)).toBe(true);
  });

  it('should handle near-zero radius', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0.5, y: 0, z: 0 };
    expect(sphereCollision(a, 0.5, b, 0.001)).toBe(true); // Very small radius still collides
  });

  it('should handle equal positions', () => {
    const a = { x: 5, y: 5, z: 5 };
    expect(sphereCollision(a, 1, a, 1)).toBe(true); // Same point, any radius > 0 collides
  });

  it('should handle asymmetric radii', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 3.5, y: 0, z: 0 };
    expect(sphereCollision(a, 3, b, 1)).toBe(true);  // sqrt(12.25)=3.5 < 4, overlap
    expect(sphereCollision(a, 2, b, 1)).toBe(false); // sqrt(12.25)=3.5 > 3, no overlap
  });
});

describe('initGame', () => {
  it('should return START state on initialization', () => {
    const game = initGame();
    expect(game.state).toBe('START');
  });

  it('should start with 3 lives by default', () => {
    const game = initGame();
    expect(game.lives).toBe(GAME.startLives);
  });

  it('should start with score 0 by default', () => {
    const game = initGame();
    expect(game.score).toBe(0);
  });

  it('should start at level 1 by default', () => {
    const game = initGame();
    expect(game.level).toBe(1);
  });

  it('should create 4 large asteroids at level 1', () => {
    const game = initGame();
    expect(game.asteroids.length).toBe(GAME.startAsteroids);
    expect(game.asteroids.every(a => a.size === 'large')).toBe(true);
  });

  it('should create N+3 large asteroids at level N', () => {
    const game = initGame(3);
    expect(game.asteroids.length).toBe(GAME.startAsteroids + 2);
  });

  it('should create ship at origin', () => {
    const game = initGame();
    expect(game.ship.position.x).toBe(0);
    expect(game.ship.position.y).toBe(0);
    expect(game.ship.position.z).toBe(0);
  });

  it('should create ship with zero velocity', () => {
    const game = initGame();
    expect(game.ship.velocity.x).toBe(0);
    expect(game.ship.velocity.y).toBe(0);
    expect(game.ship.velocity.z).toBe(0);
  });

  it('should create ship with invulnerable false', () => {
    const game = initGame();
    expect(game.ship.invulnerable).toBe(false);
  });

  it('should initialize empty bullets array', () => {
    const game = initGame();
    expect(game.bullets).toEqual([]);
  });

  it('should initialize empty particles array', () => {
    const game = initGame();
    expect(game.particles).toEqual([]);
  });

  it('should use custom lives and score', () => {
    const game = initGame(2, 5, 1000);
    expect(game.lives).toBe(5);
    expect(game.score).toBe(1000);
    expect(game.level).toBe(2);
  });

  it('should assign unique IDs to asteroids', () => {
    const game = initGame();
    const ids = game.asteroids.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('constants', () => {
  describe('WORLD', () => {
    it('should have positive dimensions', () => {
      expect(WORLD.width).toBeGreaterThan(0);
      expect(WORLD.height).toBeGreaterThan(0);
      expect(WORLD.depth).toBeGreaterThan(0);
    });

    it('should have depth smaller than width/height (flat play area)', () => {
      expect(WORLD.depth).toBeLessThan(WORLD.width);
      expect(WORLD.depth).toBeLessThan(WORLD.height);
    });
  });

  describe('SHIP', () => {
    it('should have valid physics parameters', () => {
      expect(SHIP.thrust).toBeGreaterThan(0);
      expect(SHIP.turnSpeed).toBeGreaterThan(0);
      expect(SHIP.drag).toBeGreaterThan(0);
      expect(SHIP.drag).toBeLessThan(1); // Drag should be damping
      expect(SHIP.maxSpeed).toBeGreaterThan(0);
      expect(SHIP.radius).toBeGreaterThan(0);
    });

    it('should have invulnerableTime as positive value', () => {
      expect(SHIP.invulnerableTime).toBeGreaterThan(0);
    });
  });

  describe('ASTEROID', () => {
    it('should have three size tiers', () => {
      expect(ASTEROID.large).toBeDefined();
      expect(ASTEROID.medium).toBeDefined();
      expect(ASTEROID.small).toBeDefined();
    });

    it('should have decreasing radii from large to small', () => {
      expect(ASTEROID.large.radius).toBeGreaterThan(ASTEROID.medium.radius);
      expect(ASTEROID.medium.radius).toBeGreaterThan(ASTEROID.small.radius);
    });

    it('should have increasing speed from large to small', () => {
      expect(ASTEROID.small.speed).toBeGreaterThan(ASTEROID.medium.speed);
      expect(ASTEROID.medium.speed).toBeGreaterThan(ASTEROID.large.speed);
    });

    it('should have increasing points from large to small', () => {
      expect(ASTEROID.small.points).toBeGreaterThan(ASTEROID.medium.points);
      expect(ASTEROID.medium.points).toBeGreaterThan(ASTEROID.large.points);
    });

    it('should have splitsInto chain: large → medium → small → null', () => {
      expect(ASTEROID.large.splitsInto).toBe('medium');
      expect(ASTEROID.medium.splitsInto).toBe('small');
      expect(ASTEROID.small.splitsInto).toBeNull();
    });
  });

  describe('BULLET', () => {
    it('should have positive speed and lifetime', () => {
      expect(BULLET.speed).toBeGreaterThan(0);
      expect(BULLET.lifetime).toBeGreaterThan(0);
    });

    it('should have maxCount of 5', () => {
      expect(BULLET.maxCount).toBe(5);
    });

    it('should have positive radius', () => {
      expect(BULLET.radius).toBeGreaterThan(0);
    });
  });

  describe('PARTICLE', () => {
    it('should have positive pool size', () => {
      expect(PARTICLE.poolSize).toBeGreaterThan(0);
    });

    it('should have positive thrust parameters', () => {
      expect(PARTICLE.thrustContinuousCount).toBeGreaterThan(0);
      expect(PARTICLE.thrustLifetime).toBeGreaterThan(0);
      expect(PARTICLE.thrustSpeed).toBeGreaterThan(0);
    });
  });

  describe('CAMERA', () => {
    it('should have positive offset values', () => {
      expect(CAMERA.offsetBack).toBeGreaterThan(0);
      expect(CAMERA.offsetUp).toBeGreaterThan(0);
    });

    it('should have lerpFactor between 0 and 1', () => {
      expect(CAMERA.lerpFactor).toBeGreaterThan(0);
      expect(CAMERA.lerpFactor).toBeLessThan(1);
    });
  });

  describe('GAME', () => {
    it('should have startLives as positive integer', () => {
      expect(GAME.startLives).toBeGreaterThan(0);
      expect(Number.isInteger(GAME.startLives)).toBe(true);
    });

    it('should have positive startAsteroids', () => {
      expect(GAME.startAsteroids).toBeGreaterThan(0);
    });

    it('should have positive levelClearDelay', () => {
      expect(GAME.levelClearDelay).toBeGreaterThan(0);
    });
  });

  describe('COLORS', () => {
    it('should have numeric color values', () => {
      expect(typeof COLORS.ship).toBe('number');
      expect(typeof COLORS.asteroid).toBe('number');
      expect(typeof COLORS.bullet).toBe('number');
      expect(typeof COLORS.particle).toBe('number');
    });

    it('should have string hudText', () => {
      expect(typeof COLORS.hudText).toBe('string');
    });
  });
});

describe('types', () => {
  it('should accept valid GameState values', () => {
    const states: import('./types').GameState[] = ['START', 'PLAYING', 'SHIP_DESTROYED', 'LEVEL_CLEAR', 'GAME_OVER'];
    states.forEach(state => expect(state).toBeDefined());
  });

  it('should accept valid Vector3 objects', () => {
    const vec: Vector3 = { x: 1, y: -2, z: 3 };
    expect(vec.x).toBe(1);
    expect(vec.y).toBe(-2);
    expect(vec.z).toBe(3);
  });

  it('should accept valid Ship object', () => {
    const ship: import('./types').Ship = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: 0,
      invulnerable: false,
      invulnerableTimer: 0,
    };
    expect(ship.position.x).toBe(0);
    expect(ship.invulnerable).toBe(false);
  });

  it('should accept valid Asteroid object', () => {
    const asteroid: import('./types').Asteroid = {
      id: 1,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      size: 'large',
      radius: 2.5,
      vertices: [],
    };
    expect(asteroid.size).toBe('large');
    expect(asteroid.radius).toBe(2.5);
  });

  it('should accept valid Bullet object', () => {
    const bullet: import('./types').Bullet = {
      id: 1,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      lifetime: 1.5,
    };
    expect(bullet.lifetime).toBe(1.5);
  });

  it('should accept valid Particle object', () => {
    const particle: import('./types').Particle = {
      id: 1,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      lifetime: 0.3,
      maxLifetime: 0.3,
    };
    expect(particle.lifetime).toBe(0.3);
    expect(particle.maxLifetime).toBe(0.3);
  });

  it('should accept valid GameData object', () => {
    const game: import('./types').GameData = {
      state: 'START',
      score: 0,
      lives: 3,
      level: 1,
      ship: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: 0,
        invulnerable: false,
        invulnerableTimer: 0,
      },
      asteroids: [],
      bullets: [],
      particles: [],
      nextAsteroidId: 0,
      nextBulletId: 0,
      nextParticleId: 0,
      levelClearTimer: 0,
    };
    expect(game.state).toBe('START');
    expect(game.lives).toBe(3);
  });
});