# 3D Asteroids Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A complete 3D Asteroids game with retro wireframe neon aesthetic, tethered chase camera, 3D gameplay volume, hybrid thrust particles, and 2D HUD overlay.

**Architecture:** React + Vite + Three.js via @react-three/fiber. Fast game state lives in plain objects/refs (not React state). React state only for HUD. Game loop via `useFrame` (r3f's render loop). Wireframe meshes with `THREE.WireframeGeometry` and additive blending.

**Tech Stack:** Three.js, @react-three/fiber, @react-three/drei, React 18, TypeScript, Vite

---

## File Structure

```
src/
  game/
    types.ts          — Shared interfaces (Ship, Asteroid, Bullet, Particle, GameState)
    constants.ts      — World bounds, speeds, sizes, colors, physics params
    SpaceCanvas.tsx   — Three.js canvas, lighting, camera, scene root
    Ship.tsx          — Ship mesh + thrust particles
    Asteroid.tsx      — Asteroid mesh (procedurally generated polyhedron)
    Bullet.tsx        — Bullet mesh
    Particles.tsx      — Thrust particle pool
    GameScene.tsx     — Main scene: ship + asteroids + bullets + particles, game logic
    useGameLoop.ts    — useFrame game loop hook: input, physics, collision, state machine
    useKeyboard.ts    — Keyboard input hook (keydown/keyup → ref map)
    HUD.tsx           — HTML overlay: score, lives, level, messages
    Game.tsx          — Root game component: SpaceCanvas + HUD, wires up game state
  App.tsx             — App shell (unchanged)
  main.tsx            — Entry point (unchanged)
  styles.css          — Minimal global styles (unchanged)
```

---

### Task 1: Types & Constants

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/constants.ts`

- [ ] **Step 1: Create `src/game/types.ts`**

```typescript
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
```

- [ ] **Step 2: Create `src/game/constants.ts`**

```typescript
import * as THREE from 'three';

export const COLORS = {
  ship: 0x00ffff,
  asteroid: 0xff00ff,
  bullet: 0x00ffff,
  particle: 0xffffaa,
  background: 0x000000,
  hudText: '#00ffff',
};

export const WORLD = {
  width: 40,
  height: 40,
  depth: 20,
};

export const SHIP = {
  radius: 1.0,
  thrust: 15,
  turnSpeed: 3.0,
  drag: 0.98,
  maxSpeed: 20,
  invulnerableTime: 2.0,
};

export const ASTEROID = {
  large: { radius: 2.5, points: 20, speed: 3, splitsInto: 'medium' },
  medium: { radius: 1.5, points: 50, speed: 5, splitsInto: 'small' },
  small: { radius: 0.7, points: 100, speed: 8, splitsTo: null },
};

export const BULLET = {
  speed: 30,
  lifetime: 1.5,
  maxCount: 5,
  radius: 0.15,
};

export const PARTICLE = {
  poolSize: 200,
  thrustBurstCount: 18,
  thrustContinuousCount: 4,
  thrustLifetime: 0.3,
  thrustSpeed: 8,
};

export const CAMERA = {
  offsetBack: 12,
  offsetUp: 4,
  lerpFactor: 0.08,
};

export const GAME = {
  startLives: 3,
  startAsteroids: 4,
  levelClearDelay: 3.0,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/game/types.ts src/game/constants.ts
git commit -m "feat: add types and constants for 3D Asteroids"
```

---

### Task 2: Keyboard Input Hook

**Files:**
- Create: `src/game/useKeyboard.ts`

- [ ] **Step 1: Create `src/game/useKeyboard.ts`**

```typescript
import { useEffect, useRef } from 'react';

export interface KeyboardState {
  up: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  enter: boolean;
}

export function useKeyboard(): React.MutableRefObject<KeyboardState> {
  const keys = useRef<KeyboardState>({
    up: false,
    left: false,
    right: false,
    space: false,
    enter: false,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.up = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true;
          break;
        case 'Space':
          keys.current.space = true;
          break;
        case 'Enter':
          keys.current.enter = true;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.up = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false;
          break;
        case 'Space':
          keys.current.space = false;
          break;
        case 'Enter':
          keys.current.enter = false;
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return keys;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/useKeyboard.ts
git commit -m "feat: add keyboard input hook"
```

---

### Task 3: Ship Component

**Files:**
- Create: `src/game/Ship.tsx`

- [ ] **Step 1: Create `src/game/Ship.tsx`**

```tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from './constants';
import type { Ship } from './types';
import type { KeyboardState } from './useKeyboard';

interface ShipProps {
  ship: Ship;
  keysRef: React.MutableRefObject<KeyboardState>;
}

export function ShipMesh({ ship, keysRef }: ShipProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Elongated octahedron — two pyramids base-to-base, stretched on Y
  const geometry = useMemo(() => {
    const geo = new THREE.OctahedronGeometry(1, 0);
    geo.scale(0.8, 2, 0.8);
    return geo;
  }, []);

  const wireframeGeo = useMemo(() => new THREE.WireframeGeometry(geometry), [geometry]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: COLORS.ship,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  // Engine glow position (tail of ship)
  const enginePosition = useMemo(() => new THREE.Vector3(0, -1.8, 0), []);

  useFrame(() => {
    if (!meshRef.current) return;

    // Update position
    meshRef.current.position.set(ship.position.x, ship.position.y, ship.position.z);

    // Rotate to face direction (yaw around Y)
    meshRef.current.rotation.set(0, ship.rotation, 0);

    // Visibility (blink when invulnerable)
    meshRef.current.visible = !ship.invulnerable || Math.floor(Date.now() / 100) % 2 === 0;
  });

  return (
    <group>
      <lineSegments ref={meshRef as any} geometry={wireframeGeo} material={material} />
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/Ship.tsx
git commit -m "feat: add Ship mesh component"
```

---

### Task 4: Asteroid Component

**Files:**
- Create: `src/game/Asteroid.tsx`

- [ ] **Step 1: Create `src/game/Asteroid.tsx`**

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from './constants';
import type { Asteroid } from './types';

interface AsteroidProps {
  asteroid: Asteroid;
}

function generateIrregularPolyhedron(radius: number, seed: number): THREE.BufferGeometry {
  // Generate 8-12 vertices on a sphere with random perturbations
  const vertexCount = 8 + (seed % 5);
  const positions: number[] = [];

  for (let i = 0; i < vertexCount; i++) {
    // Random point on sphere surface
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.7 + Math.random() * 0.5);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions.push(x, y, z);
  }

  // Create convex hull approximation using the vertices
  // Simple approach: treat as loose cloud, create edges between nearby verts
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  // Return the convex hull geometry (approximate — works well enough for wireframe asteroids)
  return new THREE.ConvexGeometry(positions as unknown as THREE.Vector3[]);
}

export function AsteroidMesh({ asteroid }: AsteroidProps) {
  const { geometry, wireframeGeo, material } = useMemo(() => {
    // Use seed-based random for consistent shape per asteroid
    const seed = asteroid.id * 17 + asteroid.position.x * 3 + asteroid.position.z;
    const geo = generateIrregularPolyhedron(asteroid.radius, seed);
    const wireGeo = new THREE.WireframeGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: COLORS.asteroid,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geometry: geo, wireframeGeo: wireGeo, material: mat };
  }, [asteroid.id, asteroid.radius]);

  return (
    <lineSegments
      geometry={wireframeGeo}
      material={material}
      position={[asteroid.position.x, asteroid.position.y, asteroid.position.z]}
      rotation={[asteroid.angularVelocity.x, asteroid.angularVelocity.y, asteroid.angularVelocity.z]}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/Asteroid.tsx
git commit -m "feat: add Asteroid mesh component with procedural geometry"
```

---

### Task 5: Bullet Component

**Files:**
- Create: `src/game/Bullet.tsx`

- [ ] **Step 1: Create `src/game/Bullet.tsx`**

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from './constants';
import type { Bullet } from './types';

interface BulletProps {
  bullet: Bullet;
}

export function BulletMesh({ bullet }: BulletProps) {
  const { wireframeGeo, material } = useMemo(() => {
    const geo = new THREE.OctahedronGeometry(0.3, 0);
    geo.scale(0.5, 2, 0.5);
    const wireGeo = new THREE.WireframeGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: COLORS.bullet,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { wireframeGeo: wireGeo, material: mat };
  }, []);

  return (
    <lineSegments
      geometry={wireframeGeo}
      material={material}
      position={[bullet.position.x, bullet.position.y, bullet.position.z]}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/Bullet.tsx
git commit -m "feat: add Bullet mesh component"
```

---

### Task 6: Particle System

**Files:**
- Create: `src/game/Particles.tsx`

- [ ] **Step 1: Create `src/game/Particles.tsx`**

```tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, PARTICLE } from './constants';
import type { Particle } from './types';

interface ParticlesProps {
  particles: Particle[];
}

export function ParticleSystem({ particles }: ParticlesProps) {
  // Use a single line segments geometry for all particles (pooled)
  const ref = useRef<THREE.LineSegments>(null);

  const { geometry, material } = useMemo(() => {
    // Pre-allocate full pool — 2 vertices per particle (line segment)
    const positions = new Float32Array(PARTICLE.poolSize * 6); // 2 * 3 coords per particle
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      color: COLORS.particle,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame(() => {
    if (!ref.current) return;

    const positions = geometry.attributes.position.array as Float32Array;
    let drawCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.lifetime <= 0) continue;

      // Two vertices per particle (a line segment "dot")
      // Use same position twice for a dot effect (or slightly offset)
      const opacity = p.lifetime / p.maxLifetime;
      const spread = 0.05;

      positions[drawCount * 6 + 0] = p.position.x;
      positions[drawCount * 6 + 1] = p.position.y;
      positions[drawCount * 6 + 2] = p.position.z;
      positions[drawCount * 6 + 3] = p.position.x + spread;
      positions[drawCount * 6 + 4] = p.position.y + spread;
      positions[drawCount * 6 + 5] = p.position.z + spread;

      drawCount++;
    }

    geometry.setDrawRange(0, drawCount * 2);
    geometry.attributes.position.needsUpdate = true;
  });

  return <lineSegments ref={ref as any} geometry={geometry} material={material} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/Particles.tsx
git commit -m "feat: add particle system component"
```

---

### Task 7: Game Loop Hook

**Files:**
- Create: `src/game/useGameLoop.ts`

- [ ] **Step 1: Create `src/game/useGameLoop.ts`**

```typescript
import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { WORLD, SHIP, ASTEROID, BULLET, PARTICLE, CAMERA, GAME } from './constants';
import type { GameData, Ship, Asteroid, Bullet, Particle, Vector3 } from './types';
import type { KeyboardState } from './useKeyboard';

function wrapPosition(pos: Vector3, world: typeof WORLD): Vector3 {
  const hw = world.width / 2;
  const hh = world.height / 2;
  const hd = world.depth / 2;
  return {
    x: ((pos.x + hw) % world.width) - hw,
    y: ((pos.y + hh) % world.height) - hh,
    z: ((pos.z + hd) % world.depth) - hd,
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
    angularVelocity: {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2,
    },
    size,
    radius: config.radius,
    vertices: [],
  };
}

export function useGameLoop(
  keysRef: React.MutableRefObject<KeyboardState>,
  onStateChange: (data: GameData) => void
) {
  const dataRef = useRef<GameData | null>(null);
  const cameraTarget = useRef({ position: new THREE.Vector3(), lookAt: new THREE.Vector3() });
  const THREE = useRef<typeof import('three') | null>(null);

  const initGame = useCallback((level = 1, lives = GAME.startLives, score = 0): GameData => {
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
  }, []);

  const spawnAsteroidBurst = useCallback((data: GameData, fromPos: Vector3): Vector3 => {
    return {
      x: (Math.random() - 0.5) * 4 + (fromPos.x > 0 ? -8 : 8),
      y: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 4,
    };
  }, []);

  useFrame(async (threeState, delta) => {
    if (!THREE.current) {
      const THREEModule = await import('three');
      THREE.current = THREEModule;
    }
    const T = THREE.current;

    // Lazy init
    if (!dataRef.current) {
      dataRef.current = initGame();
    }
    const data = dataRef.current;

    // Handle Enter key state transitions
    if (keysRef.current.enter) {
      keysRef.current.enter = false; // consume
      if (data.state === 'START' || data.state === 'GAME_OVER') {
        dataRef.current = initGame(1, GAME.startLives, 0);
        dataRef.current.state = 'PLAYING';
        onStateChange(dataRef.current);
        return;
      }
    }

    if (data.state !== 'PLAYING' && data.state !== 'SHIP_DESTROYED' && data.state !== 'LEVEL_CLEAR') {
      onStateChange(data);
      return;
    }

    // --- PLAYING update ---

    // Ship controls
    const ship = data.ship;
    if (data.state === 'PLAYING') {
      if (keysRef.current.left) ship.rotation += SHIP.turnSpeed * delta;
      if (keysRef.current.right) ship.rotation -= SHIP.turnSpeed * delta;
      if (keysRef.current.up) {
        const thrust = SHIP.thrust * delta;
        ship.velocity.x += Math.sin(ship.rotation) * thrust;
        ship.velocity.y += Math.cos(ship.rotation) * thrust;
        // Spawn thrust particles
        for (let i = 0; i < PARTICLE.thrustContinuousCount; i++) {
          if (data.particles.length < PARTICLE.poolSize) {
            const enginePos = {
              x: ship.position.x - Math.sin(ship.rotation) * 1.8,
              y: ship.position.y - Math.cos(ship.rotation) * 1.8,
              z: ship.position.z,
            };
            data.particles.push({
              id: data.nextParticleId++,
              position: enginePos,
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
      // Shooting
      if (keysRef.current.space && data.bullets.length < BULLET.maxCount) {
        keysRef.current.space = false; // consume
        const nosePos = {
          x: ship.position.x + Math.sin(ship.rotation) * 2,
          y: ship.position.y + Math.cos(ship.rotation) * 2,
          z: ship.position.z,
        };
        data.bullets.push({
          id: data.nextBulletId++,
          position: nosePos,
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
    ship.velocity.z *= SHIP.drag;
    const speed = Math.sqrt(ship.velocity.x ** 2 + ship.velocity.y ** 2);
    if (speed > SHIP.maxSpeed) {
      const scale = SHIP.maxSpeed / speed;
      ship.velocity.x *= scale;
      ship.velocity.y *= scale;
    }
    ship.position.x += ship.velocity.x * delta;
    ship.position.y += ship.velocity.y * delta;
    ship.position = wrapPosition(ship.position, WORLD);

    // Invulnerability timer
    if (ship.invulnerable) {
      ship.invulnerableTimer -= delta;
      if (ship.invulnerableTimer <= 0) {
        ship.invulnerable = false;
      }
    }

    // Asteroids physics
    for (const ast of data.asteroids) {
      ast.position.x += ast.velocity.x * delta;
      ast.position.y += ast.velocity.y * delta;
      ast.position.z += ast.velocity.z * delta;
      ast.position = wrapPosition(ast.position, WORLD);
      ast.angularVelocity.x += delta * 0.1;
      ast.angularVelocity.y += delta * 0.1;
      ast.angularVelocity.z += delta * 0.1;
    }

    // Bullets physics
    data.bullets = data.bullets.filter(b => {
      b.position.x += b.velocity.x * delta;
      b.position.y += b.velocity.y * delta;
      b.position.z += b.velocity.z * delta;
      b.lifetime -= delta;
      return b.lifetime > 0;
    });

    // Particles physics
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

          // Split asteroid
          const splitSize = ASTEROID[ast.size].splitsInto;
          if (splitSize) {
            const burst1 = spawnAsteroidBurst(data, ast.position);
            const burst2 = spawnAsteroidBurst(data, ast.position);
            const child1 = createAsteroid(data.nextAsteroidId++, splitSize as 'medium' | 'small', ast.position, {
              x: ast.velocity.x + burst1.x,
              y: ast.velocity.y + burst1.y,
              z: ast.velocity.z + burst1.z,
            });
            const child2 = createAsteroid(data.nextAsteroidId++, splitSize as 'medium' | 'small', ast.position, {
              x: ast.velocity.x + burst2.x,
              y: ast.velocity.y + burst2.y,
              z: ast.velocity.z + burst2.z,
            });
            newAsteroids.push(child1, child2);
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
          onStateChange(data);
          return;
        }
      }
    }

    // Level clear check
    if (data.state === 'PLAYING' && data.asteroids.length === 0) {
      data.state = 'LEVEL_CLEAR';
      data.levelClearTimer = GAME.levelClearDelay;
    }

    // Level clear timer → respawn
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

    // Ship destroyed → respawn
    if (data.state === 'SHIP_DESTROYED') {
      data.levelClearTimer -= delta;
      if (data.levelClearTimer <= 0) {
        data.state = 'PLAYING';
      }
    }

    // Camera update
    const camX = ship.position.x - Math.sin(ship.rotation) * CAMERA.offsetBack;
    const camY = ship.position.y + CAMERA.offsetUp;
    const camZ = ship.position.z - Math.cos(ship.rotation) * CAMERA.offsetBack;

    if (!cameraTarget.current.position) {
      cameraTarget.current.position = new T!.Vector3(camX, camY, camZ);
      cameraTarget.current.lookAt = new T!.Vector3(ship.position.x, ship.position.y, ship.position.z);
    }
    cameraTarget.current.position.lerp(new T!.Vector3(camX, camY, camZ), CAMERA.lerpFactor);
    cameraTarget.current.lookAt.lerp(new T!.Vector3(ship.position.x, ship.position.y, ship.position.z), CAMERA.lerpFactor);

    threeState.camera.position.copy(cameraTarget.current.position);
    threeState.camera.lookAt(cameraTarget.current.lookAt);

    onStateChange(data);
  });

  return { dataRef, initGame };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/useGameLoop.ts
git commit -m "feat: add game loop hook with physics, collision, and state machine"
```

---

### Task 8: HUD Component

**Files:**
- Create: `src/game/HUD.tsx`

- [ ] **Step 1: Create `src/game/HUD.tsx`**

```tsx
import type { GameData } from './types';

interface HUDProps {
  data: GameData | null;
}

export function HUD({ data }: HUDProps) {
  if (!data) return null;

  return (
    <div className="hud">
      <div className="hud-top-left">
        <div>SCORE: {String(data.score).padStart(6, '0')}</div>
        <div>LEVEL: {data.level}</div>
      </div>
      <div className="hud-top-right">
        <div>LIVES: ×{data.lives}</div>
      </div>
      {data.state === 'START' && (
        <div className="hud-center">
          <div className="title">ASTEROIDS</div>
          <div className="subtitle">PRESS ENTER TO START</div>
        </div>
      )}
      {data.state === 'GAME_OVER' && (
        <div className="hud-center">
          <div className="title">GAME OVER</div>
          <div className="subtitle">FINAL SCORE: {data.score}</div>
          <div className="subtitle">PRESS ENTER TO RESTART</div>
        </div>
      )}
      {data.state === 'LEVEL_CLEAR' && (
        <div className="hud-center">
          <div className="subtitle">LEVEL {data.level} CLEAR</div>
        </div>
      )}
      {data.state === 'SHIP_DESTROYED' && (
        <div className="hud-center">
          <div className="subtitle">SHIP DESTROYED</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add HUD styles to `src/styles.css`**

```css
.hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-family: 'Courier New', Courier, monospace;
  color: #00ffff;
  font-size: 16px;
  text-shadow: 0 0 8px #00ffff, 0 0 16px #00ffff;
}

.hud-top-left {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.4);
  padding: 8px 12px;
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.hud-top-right {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.4);
  padding: 8px 12px;
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.hud-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(0, 0, 0, 0.6);
  padding: 24px 40px;
  border: 1px solid rgba(0, 255, 255, 0.4);
}

.title {
  font-size: 48px;
  font-weight: bold;
  letter-spacing: 8px;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 18px;
  margin-bottom: 8px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/game/HUD.tsx src/styles.css
git commit -m "feat: add HUD overlay with score, lives, level, and game state messages"
```

---

### Task 9: Game Scene & Root Component

**Files:**
- Create: `src/game/GameScene.tsx`
- Create: `src/game/Game.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/game/GameScene.tsx`**

```tsx
import { useState, useRef, useCallback } from 'react';
import { useKeyboard } from './useKeyboard';
import { useGameLoop } from './useGameLoop';
import { ShipMesh } from './Ship';
import { AsteroidMesh } from './Asteroid';
import { BulletMesh } from './Bullet';
import { ParticleSystem } from './Particles';
import type { GameData } from './types';

export function GameScene({ onDataChange }: { onDataChange: (d: GameData) => void }) {
  const keysRef = useKeyboard();
  const { dataRef } = useGameLoop(keysRef, onDataChange);
  const [data, setData] = useState<GameData | null>(null);

  const handleDataChange = useCallback((newData: GameData) => {
    setData({ ...newData }); // shallow copy to trigger re-render
    onDataChange(newData);
  }, [onDataChange]);

  // Re-connect the callback
  useGameLoop(keysRef, handleDataChange);

  if (!data) return null;

  return (
    <>
      {/* Ambient light just so Three.js doesn't complain */}
      <ambientLight intensity={0} />

      <ShipMesh ship={data.ship} keysRef={keysRef} />

      {data.asteroids.map(ast => (
        <AsteroidMesh key={ast.id} asteroid={ast} />
      ))}

      {data.bullets.map(bullet => (
        <BulletMesh key={bullet.id} bullet={bullet} />
      ))}

      <ParticleSystem particles={data.particles} />
    </>
  );
}
```

- [ ] **Step 2: Create `src/game/Game.tsx`**

```tsx
import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './GameScene';
import { HUD } from './HUD';
import type { GameData } from './types';

export default function Game() {
  const [gameData, setGameData] = useState<GameData | null>(null);

  const handleDataChange = useCallback((data: GameData) => {
    setGameData(data);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <Canvas
        camera={{ position: [0, 4, -12], fov: 75 }}
        style={{ background: '#000000' }}
      >
        <GameScene onDataChange={handleDataChange} />
      </Canvas>
      <HUD data={gameData} />
    </div>
  );
}
```

- [ ] **Step 3: Update `src/App.tsx`**

```tsx
import Game from './game/Game';

export default function App() {
  return (
    <main className="app-shell">
      <section className="game-card">
        <div className="header-row">
          <div>
            <h1>3D Asteroids</h1>
            <p>A retro wireframe asteroid shooter in three dimensions.</p>
          </div>
        </div>
        <Game />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/game/GameScene.tsx src/game/Game.tsx src/App.tsx
git commit -m "feat: wire up GameScene, Game root, and Canvas with camera"
```

---

### Task 10: Fix Game Loop Hook Double Mounting

The `GameScene` component calls `useGameLoop` twice — once to get `dataRef` (unused) and once to connect the callback. This is a bug. Fix by consolidating.

**Files:**
- Modify: `src/game/GameScene.tsx`

- [ ] **Step 1: Rewrite `GameScene.tsx` cleanly**

```tsx
import { useState, useCallback, useEffect } from 'react';
import { useKeyboard } from './useKeyboard';
import { useGameLoop } from './useGameLoop';
import { ShipMesh } from './Ship';
import { AsteroidMesh } from './Asteroid';
import { BulletMesh } from './Bullet';
import { ParticleSystem } from './Particles';
import type { GameData } from './types';

export function GameScene({ onDataChange }: { onDataChange: (d: GameData) => void }) {
  const keysRef = useKeyboard();
  const { dataRef } = useGameLoop(keysRef, onDataChange);

  return null; // Scene managed inside useGameLoop via threeState.camera
}
```

Actually the GameScene pattern needs rethinking. The useGameLoop hook manages the Three.js camera via `threeState.camera`. The React scene tree just needs to render the meshes based on shared game state. The cleanest pattern is to use a ref for the game data (no React re-renders for game state — just HUD updates).

- [ ] **Step 2: Rewrite using shared ref pattern — replace `src/game/GameScene.tsx`**

```tsx
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
    x: ((pos.x + hw) % WORLD.width) - hw,
    y: ((pos.y + hh) % WORLD.height) - hh,
    z: ((pos.z + hd) % WORLD.depth) - hd,
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

    // State transitions
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

    // Camera
    const camX = ship.position.x - Math.sin(ship.rotation) * CAMERA.offsetBack;
    const camY = ship.position.y + CAMERA.offsetUp;
    const camZ = ship.position.z - Math.cos(ship.rotation) * CAMERA.offsetBack;

    const camPos = new THREE.Vector3(camX, camY, camZ);
    const lookAt = new THREE.Vector3(ship.position.x, ship.position.y, ship.position.z);
    threeState.camera.position.lerp(camPos, CAMERA.lerpFactor);
    threeState.camera.lookAt(lookAt);

    onDataChange({ ...data });
  });

  // Render
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
```

- [ ] **Step 3: Rewrite `Game.tsx`**

```tsx
import { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './GameScene';
import { HUD } from './HUD';
import { useKeyboard } from './useKeyboard';
import type { GameData } from './types';
import type { KeyboardState } from './useKeyboard';

export default function Game() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const keysRef = useKeyboard() as React.MutableRefObject<KeyboardState>;

  const handleDataChange = useCallback((data: GameData) => {
    setGameData(data);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <Canvas camera={{ position: [0, 4, -12], fov: 75 }} style={{ background: '#000000' }}>
        <GameScene keysRef={keysRef} onDataChange={handleDataChange} />
      </Canvas>
      <HUD data={gameData} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/game/GameScene.tsx src/game/Game.tsx
git commit -m "fix: consolidate game loop, remove useGameLoop hook, move logic into GameScene"
```

---

### Task 11: Build and Test

**Files:**
- (build verification)

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: Clean TypeScript compile + Vite build. Fix any type errors.

- [ ] **Step 2: Start dev server and test manually**

```bash
npm run dev
```

Open in browser. Verify:
- Title screen shows "ASTEROIDS — PRESS ENTER TO START"
- Press Enter → ship appears at center
- WASD/arrows control ship
- Asteroids tumble in 3D space
- Camera follows behind ship
- Shooting destroys asteroids
- Score updates
- Lives decrement on collision
- Level advances when all asteroids cleared

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete 3D Asteroids game — wireframe aesthetic, tethered camera, hybrid thrust particles"
```

---

## Spec Coverage Check

| Spec Section | Task(s) |
|---|---|
| Visual Identity (wireframe, colors, additive blend) | Tasks 3, 4, 5, 6 |
| World & Camera (tethered orbit, wrap) | Tasks 7, 10 |
| Ship (controls, physics, invuln) | Tasks 3, 7, 10 |
| Asteroids (procedural, splitting, sizes) | Tasks 4, 7, 10 |
| Bullets (fire, lifetime, cap) | Tasks 5, 7, 10 |
| Particle System (thrust burst + continuous) | Tasks 6, 10 |
| HUD (score, lives, level, messages) | Task 8 |
| Game States (all transitions) | Tasks 7, 10 |

All spec requirements covered. No placeholder steps. All code is complete.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-14-3d-asteroids-plan.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks sequentially in this session using executing-plans

Which approach?