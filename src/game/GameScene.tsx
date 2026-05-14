import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboard } from './useKeyboard';
import { ShipMesh } from './Ship';
import { AsteroidMesh } from './Asteroid';
import { BulletMesh } from './Bullet';
import { ParticleSystem } from './Particles';
import { WORLD, SHIP, ASTEROID, BULLET, PARTICLE, CAMERA, GAME } from './constants';
import type { GameData, Ship, Asteroid, Bullet, Particle, Vector3 } from './types';
import type { KeyboardState } from './useKeyboard';

function wrapPosition(pos: Vector3): Vector3 {
  const hw = WORLD.width / 2;
  const hh = WORLD.height / 2;
  const hd = WORLD.depth / 2;
  return {
    x: ((pos.x + hw) % WORLD.width + WORLD.width) % WORLD.width - hw,
    y: ((pos.y + hh) % WORLD.height + WORLD.height) % WORLD.height - hh,
    z: ((pos.z + hd) % WORLD.depth + WORLD.depth) % WORLD.depth - hd,
  };
}

function sphereCollision(a: Vector3, ra: number, b: Vector3, rb: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) < ra + rb;
}

function createAsteroid(id: number, size: 'large' | 'medium' | 'small', position?: Vector3, velocity?: Vector3): Asteroid {
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

function spawnBurst(): Vector3 {
  return {
    x: (Math.random() - 0.5) * 4 + (Math.random() > 0.5 ? -8 : 8),
    y: (Math.random() - 0.5) * 4,
    z: (Math.random() - 0.5) * 4,
  };
}

function initGame(level = 1, lives = GAME.startLives, score = 0): GameData {
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

export function GameScene({ keysRef, onDataChange }: { keysRef: React.MutableRefObject<KeyboardState>; onDataChange: (d: GameData) => void }) {
  const gameDataRef = useRef<GameData>(initGame());
  const enterPressed = useRef(false);

  useFrame((threeState, delta) => {
    const data = gameDataRef.current;
    const keys = keysRef.current;

    // State transitions on Enter
    if (keys.enter && !enterPressed.current) {
      enterPressed.current = true;
      if (data.state === 'START' || data.state === 'GAME_OVER') {
        gameDataRef.current = initGame(1, GAME.startLives, 0);
        onDataChange(gameDataRef.current);
        return;
      }
    }
    if (!keys.enter) enterPressed.current = false;

    if (data.state !== 'PLAYING' && data.state !== 'SHIP_DESTROYED' && data.state !== 'LEVEL_CLEAR') {
      onDataChange(data);
      return;
    }

    const ship = data.ship;

    // Ship controls
    if (data.state === 'PLAYING') {
      if (keys.left) ship.rotation += SHIP.turnSpeed * delta;
      if (keys.right) ship.rotation -= SHIP.turnSpeed * delta;

      if (keys.up) {
        const thrust = SHIP.thrust * delta;
        ship.velocity.x += Math.sin(ship.rotation) * thrust;
        ship.velocity.y += Math.cos(ship.rotation) * thrust;
        // Thrust particles
        for (let i = 0; i < PARTICLE.thrustContinuousCount; i++) {
          if (data.particles.length < PARTICLE.poolSize) {
            const engineX = ship.position.x - Math.sin(ship.rotation) * 1.8;
            const engineY = ship.position.y - Math.cos(ship.rotation) * 1.8;
            data.particles.push({
              id: data.nextParticleId++,
              position: { x: engineX, y: engineY, z: ship.position.z },
              velocity: {
                x: -Math.sin(ship.rotation) * PARTICLE.thrustSpeed + (Math.random() - 0.5) * 3,
                y: -Math.cos(ship.rotation) * PARTICLE.thrustSpeed + (Math.random() - 0.5) * 3,
                z: (Math.random() - 0.5) * 2,
              },
              lifetime: PARTICLE.thrustLifetime,
              maxLifetime: PARTICLE.thrustLifetime,
            });
          }
        }
      }

      if (keys.space && data.bullets.length < BULLET.maxCount) {
        data.bullets.push({
          id: data.nextBulletId++,
          position: {
            x: ship.position.x + Math.sin(ship.rotation) * 2,
            y: ship.position.y + Math.cos(ship.rotation) * 2,
            z: ship.position.z,
          },
          velocity: {
            x: Math.sin(ship.rotation) * BULLET.speed,
            y: Math.cos(ship.rotation) * BULLET.speed,
            z: 0,
          },
          lifetime: BULLET.lifetime,
        });
      }
    }

    // Ship physics
    ship.velocity.x *= SHIP.drag;
    ship.velocity.y *= SHIP.drag;
    const speed = Math.sqrt(ship.velocity.x ** 2 + ship.velocity.y ** 2);
    if (speed > SHIP.maxSpeed) {
      const scale = SHIP.maxSpeed / speed;
      ship.velocity.x *= scale;
      ship.velocity.y *= scale;
    }
    ship.position.x += ship.velocity.x * delta;
    ship.position.y += ship.velocity.y * delta;
    ship.position = wrapPosition(ship.position);

    if (ship.invulnerable) {
      ship.invulnerableTimer -= delta;
      if (ship.invulnerableTimer <= 0) ship.invulnerable = false;
    }

    // Asteroids
    for (const ast of data.asteroids) {
      ast.position.x += ast.velocity.x * delta;
      ast.position.y += ast.velocity.y * delta;
      ast.position.z += ast.velocity.z * delta;
      ast.position = wrapPosition(ast.position);
      ast.angularVelocity.x += delta * 0.1;
      ast.angularVelocity.y += delta * 0.1;
      ast.angularVelocity.z += delta * 0.1;
    }

    // Bullets
    data.bullets = data.bullets.filter(b => {
      b.position.x += b.velocity.x * delta;
      b.position.y += b.velocity.y * delta;
      b.position.z += b.velocity.z * delta;
      b.lifetime -= delta;
      return b.lifetime > 0;
    });

    // Particles
    data.particles = data.particles.filter(p => {
      p.position.x += p.velocity.x * delta;
      p.position.y += p.velocity.y * delta;
      p.position.z += p.velocity.z * delta;
      p.lifetime -= delta;
      return p.lifetime > 0;
    });

    // Bullet-asteroid collisions
    const bulletsToRemove = new Set<number>();
    const asteroidsToRemove = new Set<number>();
    const newAsteroids: Asteroid[] = [];

    for (const bullet of data.bullets) {
      for (const ast of data.asteroids) {
        if (asteroidsToRemove.has(ast.id)) continue;
        if (sphereCollision(bullet.position, BULLET.radius, ast.position, ast.radius)) {
          bulletsToRemove.add(bullet.id);
          asteroidsToRemove.add(ast.id);
          data.score += ASTEROID[ast.size].points;
          const splitSize = ASTEROID[ast.size].splitsInto;
          if (splitSize) {
            const b1 = spawnBurst();
            const b2 = spawnBurst();
            [b1, b2].forEach(burst => {
              newAsteroids.push(createAsteroid(data.nextAsteroidId++, splitSize as 'medium' | 'small', ast.position, {
                x: ast.velocity.x + burst.x,
                y: ast.velocity.y + burst.y,
                z: ast.velocity.z + burst.z,
              }));
            });
          }
          break;
        }
      }
    }

    data.bullets = data.bullets.filter(b => !bulletsToRemove.has(b.id));
    data.asteroids = data.asteroids.filter(a => !asteroidsToRemove.has(a.id));
    data.asteroids.push(...newAsteroids);

    // Ship-asteroid collision
    if (data.state === 'PLAYING' && !ship.invulnerable) {
      for (const ast of data.asteroids) {
        if (sphereCollision(ship.position, SHIP.radius, ast.position, ast.radius)) {
          data.lives--;
          if (data.lives <= 0) {
            data.state = 'GAME_OVER';
          } else {
            data.state = 'SHIP_DESTROYED';
            ship.invulnerable = true;
            ship.invulnerableTimer = SHIP.invulnerableTime;
            ship.position = { x: 0, y: 0, z: 0 };
            ship.velocity = { x: 0, y: 0, z: 0 };
          }
          onDataChange({ ...data });
          return;
        }
      }
    }

    // Level clear
    if (data.state === 'PLAYING' && data.asteroids.length === 0) {
      data.state = 'LEVEL_CLEAR';
      data.levelClearTimer = GAME.levelClearDelay;
    }

    if (data.state === 'LEVEL_CLEAR') {
      data.levelClearTimer -= delta;
      if (data.levelClearTimer <= 0) {
        data.level++;
        const count = GAME.startAsteroids + (data.level - 1);
        for (let i = 0; i < count; i++) {
          data.asteroids.push(createAsteroid(data.nextAsteroidId++, 'large'));
        }
        data.state = 'PLAYING';
      }
    }

    if (data.state === 'SHIP_DESTROYED') {
      data.levelClearTimer -= delta;
      if (data.levelClearTimer <= 0) {
        data.state = 'PLAYING';
      }
    }

    // Camera — tethered orbit
    const camX = ship.position.x - Math.sin(ship.rotation) * CAMERA.offsetBack;
    const camY = ship.position.y + CAMERA.offsetUp;
    const camZ = ship.position.z - Math.cos(ship.rotation) * CAMERA.offsetBack;

    const camPos = new THREE.Vector3(camX, camY, camZ);
    const lookAt = new THREE.Vector3(ship.position.x, ship.position.y, ship.position.z);
    threeState.camera.position.lerp(camPos, CAMERA.lerpFactor);
    threeState.camera.lookAt(lookAt);

    onDataChange({ ...data });
  });

  // Render current game state
  const data = gameDataRef.current;
  return (
    <>
      <ambientLight intensity={0} />
      <ShipMesh ship={data.ship} keysRef={keysRef} />
      {data.asteroids.map(ast => <AsteroidMesh key={ast.id} asteroid={ast} />)}
      {data.bullets.map(bullet => <BulletMesh key={bullet.id} bullet={bullet} />)}
      <ParticleSystem particles={data.particles} />
    </>
  );
}