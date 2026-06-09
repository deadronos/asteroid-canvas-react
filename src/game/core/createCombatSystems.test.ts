import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';

import { createGameSession } from './createGameSession';
import { ensureRapierReady, RAPIER } from './rapier';
import type { GameSession } from './sessionTypes';

describe('createCombatSystems', () => {
  let session: GameSession | null = null;

  beforeEach(async () => {
    await ensureRapierReady();
  });

  afterEach(() => {
    session?.dispose();
    session = null;
  });

  /**
   * Helper: spawn a single dynamic asteroid at a given position and
   * register it with the session. Returns the registered entity so
   * tests can read its body / hit points.
   */
  function spawnTestAsteroid(
    target: GameSession,
    id: string,
    x: number,
    y: number,
    z: number,
    size = 0.5,
    hitPoints = 1,
  ) {
    const body = target.physics.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, y, z)
        .setLinearDamping(0)
        .setAngularDamping(0),
    );
    target.physics.createCollider(RAPIER.ColliderDesc.ball(size).setMass(1), body);
    return target.addEntity({
      id,
      kind: 'asteroid',
      body,
      radius: size,
      renderColor: '#ffffff',
      asteroid: { hitPoints, size },
    });
  }

  /**
   * Build a manual-cannon-style InputSnapshot with `fire` set to the
   * provided value. All other fields default to false.
   */
  function input(fire: boolean) {
    return {
      forward: false,
      backward: false,
      strafeLeft: false,
      strafeRight: false,
      yawLeft: false,
      yawRight: false,
      fire,
      toggleAutoTurrets: false,
    };
  }

  /**
   * Remove every asteroid currently in the session. Tests in this file
   * add their own controlled asteroids; the respawn logic in
   * `createAsteroidField.maintainAsteroids` will replace any destroyed
   * or cleared asteroids with new ones around the ship on the next
   * step, but those respawned bodies are placed far enough from the
   * muzzle / ship that they do not interfere with the specific
   * collision assertions below.
   */
  function clearAsteroids(target: GameSession) {
    for (const asteroid of Array.from(target.queries.asteroids)) {
      target.removeEntity(asteroid);
    }
  }

  /**
   * Spawn a fast-moving projectile at the given position with the given
   * linear velocity. Mirrors `spawnTestAsteroid` for the projectile case;
   * lets us set a custom speed and a known starting position so a single
   * `session.step()` produces a known prev -> curr segment.
   */
  function spawnTestProjectile(
    target: GameSession,
    id: string,
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
  ) {
    const body = target.physics.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, y, z)
        .setLinearDamping(0)
        .setAngularDamping(0),
    );
    target.physics.createCollider(
      RAPIER.ColliderDesc.ball(0.16).setSensor(true).setMass(0.01),
      body,
    );
    body.setLinvel({ x: vx, y: vy, z: vz }, true);
    return target.addEntity({
      id,
      kind: 'projectile',
      body,
      radius: 0.22,
      renderColor: '#ffffff',
      // Seed lastPosition to the spawn point so the swept-sphere
      // segment collapses to zero length on the first frame, which
      // is the same contract `createSpawnApi.spawnProjectile` uses.
      projectile: {
        ttl: 5,
        damage: 50,
        owner: 'player',
        color: '#ffffff',
        lastPosition: new THREE.Vector3(x, y, z),
      },
    });
  }

  describe('resolveProjectileHits (Bug #5: no double-counted kills)', () => {
    it('emits exactly one asteroidDestroyed event for a single kill', () => {
      session = createGameSession();
      session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });
      clearAsteroids(session);

      const ship = session.getPlayerShip()!;
      ship.ship!.hull = 10000;
      const hullLength = ship.ship!.blueprint.hull.dimensions[2];
      const muzzleOffset = -hullLength * 0.72;
      // Ship faces -Z; muzzle sits at z = ship.z + muzzleOffset.
      // Place ship so muzzle is at z=0; target sits further along -Z.
      ship.body.setTranslation({ x: 0, y: 0, z: -muzzleOffset }, true);
      spawnTestAsteroid(session, 'single-kill-target', 0, 0, -1, 0.5, 1);

      const destroyedCounts: number[] = [];
      session.eventBus.on('asteroidDestroyed', ({ count }) => {
        destroyedCounts.push(count);
      });

      // Fire one projectile toward the target.
      ship.ship!.manualCooldown = 0;
      session.step(1 / 60, input(true));

      // The asteroid should be destroyed and exactly one event emitted.
      expect(destroyedCounts).toEqual([1]);
    });

    it('emits one event per unique destroyed asteroid (not per projectile)', () => {
      session = createGameSession();
      session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });
      clearAsteroids(session);

      const ship = session.getPlayerShip()!;
      ship.ship!.hull = 10000;
      const hullLength = ship.ship!.blueprint.hull.dimensions[2];
      const muzzleOffset = -hullLength * 0.72;
      ship.body.setTranslation({ x: 0, y: 0, z: -muzzleOffset }, true);

      // Two independent targets placed in a line in front of the muzzle.
      // The cannon fires forward (-Z) so place targets at increasing -Z.
      spawnTestAsteroid(session, 'target-A', 0, 0, -3, 0.5, 1);
      spawnTestAsteroid(session, 'target-B', 0, 0, -6, 0.5, 1);

      const destroyedCounts: number[] = [];
      session.eventBus.on('asteroidDestroyed', ({ count }) => {
        destroyedCounts.push(count);
      });

      // Fire one shot per frame until both are destroyed. Each step
      // resolves at most one projectile vs each asteroid, so we should
      // get exactly two events total.
      for (let i = 0; i < 30; i += 1) {
        ship.ship!.manualCooldown = 0;
        session.step(1 / 60, input(true));
      }

      expect(destroyedCounts).toEqual([1, 2]);
    });
  });

  describe('resolveShipAsteroidHits (Bug #2: retreat vector points away from ship)', () => {
    it('pushes the asteroid away from the ship with positive velocity along the separation direction', () => {
      session = createGameSession();
      session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });
      clearAsteroids(session);

      const ship = session.getPlayerShip()!;
      // Make the ship nearly invincible so the collision damage doesn't
      // kill it and trigger a game-over before the asteroid is moved.
      ship.ship!.hull = 100000;
      ship.body.setTranslation({ x: 0, y: 0, z: 0 }, true);
      ship.body.setLinvel({ x: 0, y: 0, z: 0 }, true);

      // Asteroid overlaps the ship (distance < combined radius). Placing
      // it strictly inside the combined radius avoids floating-point
      // edge cases at the exact boundary.
      const combinedRadius = ship.radius + 0.3;
      const asteroid = spawnTestAsteroid(
        session,
        'retreat-asteroid',
        combinedRadius - 0.5, // 0.5 units inside the ship
        0,
        0,
        0.3,
        1000,
      );

      // Snapshot pre-step state for comparison.
      const beforeX = asteroid.body.translation().x;
      expect(beforeX).toBeLessThan(ship.radius + 0.3); // overlapping

      session.step(1 / 60, input(false));

      const afterPos = asteroid.body.translation();
      const linvel = asteroid.body.linvel();

      // The asteroid should be teleported further along +X (away from
      // the ship at origin).
      expect(afterPos.x).toBeGreaterThan(beforeX);
      // And given a velocity in the +X direction.
      expect(linvel.x).toBeGreaterThan(0);
    });

    it('teleports the asteroid to at least ship.radius + asteroid.radius + 10 away from the ship', () => {
      session = createGameSession();
      session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });
      clearAsteroids(session);

      const ship = session.getPlayerShip()!;
      ship.ship!.hull = 100000;
      ship.body.setTranslation({ x: 0, y: 0, z: 0 }, true);
      ship.body.setLinvel({ x: 0, y: 0, z: 0 }, true);

      const asteroidSize = 0.3;
      const combinedRadius = ship.radius + asteroidSize;
      const asteroid = spawnTestAsteroid(
        session,
        'separation-asteroid',
        combinedRadius - 0.5, // overlap by 0.5 units
        0,
        0,
        asteroidSize,
        1000,
      );

      session.step(1 / 60, input(false));

      const newX = asteroid.body.translation().x;
      // The code adds (ship.radius + asteroid.radius + 10) of separation
      // beyond the original position, so the asteroid should be at least
      // (ship.radius + asteroid.radius + 10) away from the ship.
      const expectedMinX = ship.radius + asteroidSize + 10;
      expect(newX).toBeGreaterThanOrEqual(expectedMinX - 0.5); // tolerate FP error
    });
  });

  describe('resolveProjectileHits (Issue #7: swept-sphere collision)', () => {
    /**
     * Acceptance criterion from issue #7: a fast projectile (e.g.
     * 100 m/s for 1 tick) cannot pass through a small asteroid (e.g.
     * 0.3 m radius) at close range. The previous static radius check
     * in `resolveProjectileHits` is exactly the bug — it would let the
     * projectile tunnel because the per-tick travel distance
     * (100 m/s × 1/60 s ≈ 1.67 m) is far larger than the 0.3 m
     * asteroid radius and 0.22 m projectile radius combined.
     *
     * Geometry: muzzle at z = 0, projectile starts at z = 0 and
     * travels -Z. Place a 0.3 m asteroid at z = -0.5. After one
     * 1/60 s step the projectile's new z is roughly -1.67. Static
     * distance from projectile to asteroid is ~1.17 m, which is
     * greater than the combined 0.52 m radius — a static test misses.
     * The swept sphere from (0,0,0) to (0,0,-1.67) passes through
     * (0,0,-0.5), so the swept test hits.
     */
    it('detects a tunneling hit that the static radius check would miss', () => {
      session = createGameSession();
      session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });
      clearAsteroids(session);

      const ship = session.getPlayerShip()!;
      ship.ship!.hull = 10000;
      ship.body.setTranslation({ x: 0, y: 0, z: 0 }, true);
      ship.body.setLinvel({ x: 0, y: 0, z: 0 }, true);

      // 100 m/s projectile heading down -Z from origin.
      spawnTestProjectile(session, 'fast-shot', 0, 0, 0, 0, 0, -100);
      // 0.3 m asteroid sitting 0.5 m down -Z (in the path).
      spawnTestAsteroid(session, 'tunnel-target', 0, 0, -0.5, 0.3, 1);

      const destroyedCounts: number[] = [];
      session.eventBus.on('asteroidDestroyed', ({ count }) => {
        destroyedCounts.push(count);
      });

      // One step: projectile moves ~1.67 m, the static radius check
      // would put it well past the asteroid (tunnel). With the swept
      // sphere the hit is detected.
      session.step(1 / 60, input(false));

      expect(destroyedCounts).toEqual([1]);
      // The projectile that tunneled through is also consumed.
      expect(
        Array.from(session.queries.projectiles).find((p) => p.id === 'fast-shot'),
      ).toBeUndefined();
    });

    it('does not false-positive on a projectile that narrowly misses', () => {
      session = createGameSession();
      session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });
      clearAsteroids(session);

      const ship = session.getPlayerShip()!;
      ship.ship!.hull = 10000;
      ship.body.setTranslation({ x: 0, y: 0, z: 0 }, true);
      ship.body.setLinvel({ x: 0, y: 0, z: 0 }, true);

      // Projectile on a +X trajectory that passes 2 m to the side of
      // the asteroid at the origin. Combined radius is 0.52 m, so
      // even a swept sphere should not register a hit.
      spawnTestProjectile(session, 'miss-shot', -5, 0, 0, 100, 0, 0);
      spawnTestAsteroid(session, 'side-asteroid', 0, 0, 0, 0.3, 1000);

      const destroyedCounts: number[] = [];
      session.eventBus.on('asteroidDestroyed', ({ count }) => {
        destroyedCounts.push(count);
      });

      session.step(1 / 60, input(false));

      expect(destroyedCounts).toEqual([]);
      expect(
        Array.from(session.queries.projectiles).find((p) => p.id === 'miss-shot'),
      ).toBeDefined();
    });
  });
});
