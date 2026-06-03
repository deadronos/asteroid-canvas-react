# Architectural Decision Record (ADR): Rapier3D and Miniplex ECS Integration

## Status

Accepted

## Context

A space-flight simulation requires physical rigid bodies (mass, force, torque, linear velocity, angular dampening) and complex entity management (weapons tracking, projectile lifecycles, health stats, spawning bounds).

Coupling physics directly to visual components (e.g. using React declarations like `<Physics>` and `<RigidBody>`) mixes the presentation layer with the simulation layer. This makes headless automated testing impossible, limits deterministic execution, and creates state sync lags between React renders and the animation loop.

## Decision

We chose to decouple the simulation core entirely from React and Three.js by running a pure-JS simulation loop using **Miniplex** (ECS) and **Rapier3D** (physics).

```
 ┌────────────────────────────────────────────────────────┐
 │                   GameSession Core                     │
 │                                                        │
 │   Miniplex ECS Entity Database                         │
 │     { id: 1, ship: {...}, body: RigidBodyHandle }      │
 │                                                        │
 │   Rapier3D Physics World                               │
 │     [ RigidBody (ship) ] <---> [ RigidBody (asteroid) ]│
 └──────────────────────────┬─────────────────────────────┘
                            │ (Reads spatial values)
                            ▼
           [ Scene / Mesh Render Loop (R3F) ]
```

### Key Practices

1. **Headless Engine**: The entire gameplay engine is instantiated inside `createGameSession.ts`. It runs completely fine in headless environments (like our Vitest suite) with no DOM or WebGL requirements.
2. **Body Components**: Rapier rigid bodies are stored directly as component fields on ECS entities:
   ```typescript
   export interface GameEntity {
     id: number;
     body: RigidBody; // Rapier reference
     ship?: ShipRuntimeState;
     asteroid?: AsteroidRuntimeState;
     projectile?: ProjectileRuntimeState;
     radius: number;
   }
   ```
3. **Double-Ended Sync**:
   - Before the step: Ship systems read user inputs and apply force/torque impulses directly to the Rapier `body`.
   - During the step: Rapier solves physics collisions and advances translations.
   - After the step: Combat systems check swept bounding radii to resolve hits and apply damage, while meshes synchronize their positions to match the physical body positions.

## Consequences

- **Testability**: Gameplay features (thrust, steering, weapons firing, shield delays, combat hits, and gameover conditions) can be thoroughly tested with unit tests in milliseconds.
- **Single Source of Truth**: All positions, angles, velocities, and collisions reside in the Rapier physics world, avoiding conflicting state states.
- **Swept Radius Collisions**: High-velocity projectile collisions are detected using simple math based on bounding spheres and velocities, preventing projectiles from passing through fast-moving asteroids.
