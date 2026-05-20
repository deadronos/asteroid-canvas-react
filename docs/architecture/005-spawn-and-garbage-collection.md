# Architectural Decision Record (ADR): Dynamic Spawning & Entity Garbage Collection

## Status

Accepted

## Context

A flight simulator allows players to travel in any direction indefinitely. Spawning all asteroids at startup would limit the gameplay region. Conversely, spawning asteroids continually without clean-up leads to memory leaks, oversized physics databases, and slow rendering loops.

Similarly, projectiles (fired from the ship or auto-turrets) travel indefinitely unless they hit an object. Left unchecked, they clutter the entity store and waste physics solver cycles.

## Decision

We implemented a dynamic, zone-based entity management system combining projectile time-to-live thresholds and relative-distance checks for asteroids.

```
                  ┌──────────────────────┐
                  │   Ship Position      │
                  └──────────┬───────────┘
            ┌────────────────┴────────────────┐
            ▼ (Ahead of Ship)                 ▼ (Behind Ship / Too Far)
      [ Active Spawn Zone ]              [ Garbage Collection Zone ]
   - Spawns ahead of travel vector    - Checks distance > max radius
   - Maintains ASTEROID_TARGET_COUNT  - Reclaims and deletes bodies
```

### Reclamation Rules

1. **Asteroid Field Management (`createAsteroidField.ts`)**:
   - The field system tracks active asteroid counts.
   - If the count drops below a target (e.g., due to destructions), it spawns new asteroids in a forward hemisphere relative to the ship's current position and forward vector.
   - On each step, it calculates the distance between the ship and each asteroid. If an asteroid is further than `MAX_ASTEROID_DISTANCE` (e.g. 500 meters), it is removed from the ECS store and its Rapier rigid body is destroyed.
2. **Projectile Lifecycle (`createProjectileSystems.ts`)**:
   - Every spawned projectile starts with a configurable `ttl` (Time to Live) in seconds.
   - Each simulation step decrements the projectile's `ttl` by the frame delta.
   - Once `ttl <= 0`, the projectile is removed and its physics body is cleaned up.

## Consequences

- **Constant Density**: The player always experiences a consistent field density of obstacles, no matter how far or fast they fly.
- **Bound Complexity**: Active entity counts remain bounded under a strict limit (e.g., 20 asteroids, 50 projectiles), keeping CPU and GPU overhead predictable.
- **Resource Cleanup**: Deleting bodies from the Rapier physics world is safely synced with Miniplex ECS removals, preventing phantom collisions or memory leaks.
