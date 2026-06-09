import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useHudStore } from '../ui/useHudStore';
import { ensureRapierReady } from './rapier';
import { EMPTY_INPUT } from './types';
import { createGameSession } from './createGameSession';
import { applyShipDamage } from './shipState';

describe('createGameSession', () => {
  let session: ReturnType<typeof createGameSession> | null = null;

  beforeEach(async () => {
    await ensureRapierReady();

    useHudStore.setState((state) => ({
      ...state,
      gameState: 'playing',
      autoTurretsEnabled: true,
    }));
  });

  afterEach(() => {
    session?.dispose();
    session = null;
  });

  it('spawns the cruiser and the initial asteroid field', () => {
    session = createGameSession();

    const ship = session.getPlayerShip();

    expect(ship?.ship?.blueprint.id).toBe('cruiser');
    expect(Array.from(session.queries.asteroids)).toHaveLength(12);
  });

  it('fires the manual cannon when the player presses fire', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'playing' });

    expect(Array.from(session.queries.projectiles)).toHaveLength(0);

    session.step(1 / 60, {
      ...EMPTY_INPUT,
      fire: true,
    });

    expect(Array.from(session.queries.projectiles).length).toBeGreaterThan(0);
  });

  it('can advance repeated movement inputs without hitting rapier aliasing errors', () => {
    session = createGameSession();
    const currentSession = session;

    expect(() => {
      for (let index = 0; index < 45; index += 1) {
        currentSession.step(1 / 60, {
          ...EMPTY_INPUT,
          forward: true,
          yawLeft: index % 2 === 0,
        });
      }
    }).not.toThrow();
  });

  it('toggles autoTurrets in session config and syncs to zustand via event bus', () => {
    session = createGameSession();

    // Subscribe to events to forward to zustand (mirrors useGameEvents hook)
    session.eventBus.on('gameStateChange', ({ state }) => {
      useHudStore.getState().setGameState(state);
    });

    // Set initial state via config
    session.setConfig({ autoTurretsEnabled: false });
    // Sync initial value to zustand
    useHudStore.setState({ autoTurretsEnabled: false });

    session.step(1 / 60, {
      ...EMPTY_INPUT,
      toggleAutoTurrets: true,
    });

    expect(session.config.autoTurretsEnabled).toBe(true);
  });

  it('does not apply damage and ignores input fire when gameState is menu', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'menu' });

    const ship = session.getPlayerShip()!;
    const maxHull = ship.ship!.hull;

    // Try to fire manual cannon - should NOT fire because not playing
    session.step(1 / 60, {
      ...EMPTY_INPUT,
      fire: true,
    });
    const projectiles = Array.from(session.queries.projectiles);
    const manualProjectiles = projectiles.filter((p) => p.projectile?.owner === 'player');
    expect(manualProjectiles).toHaveLength(0);

    // Try to apply damage - should NOT apply because not playing
    applyShipDamage(ship, 50, session.config, session.eventBus);
    expect(ship.ship!.hull).toBe(maxHull);
  });

  it('emits gameStateChange event when hull drops to 0', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'playing' });

    let emittedState: string | null = null;
    session.eventBus.on('gameStateChange', ({ state }) => {
      emittedState = state;
      useHudStore.getState().setGameState(state);
    });

    const ship = session.getPlayerShip()!;
    applyShipDamage(ship, 1000, session.config, session.eventBus);

    expect(emittedState).toBe('gameover');
    expect(useHudStore.getState().gameState).toBe('gameover');
  });

  it('updates session.config.gameState to "gameover" when hull drops to 0 (Bug #1)', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'playing' });

    const ship = session.getPlayerShip()!;
    applyShipDamage(ship, 1000, session.config, session.eventBus);

    // The core config is the source of truth for simulation systems.
    // Without this sync, damage gates and weapon guards would never
    // observe the game-over transition and the ship could keep taking
    // damage in an infinite loop.
    expect(session.config.gameState).toBe('gameover');
  });

  it('does not re-emit gameStateChange on subsequent damage after gameover (Bug #1)', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'playing' });

    const events: string[] = [];
    session.eventBus.on('gameStateChange', ({ state }) => {
      events.push(state);
    });

    const ship = session.getPlayerShip()!;
    applyShipDamage(ship, 1000, session.config, session.eventBus);
    expect(events).toEqual(['gameover']);
    expect(session.config.gameState).toBe('gameover');

    // After the ship is reset (hull restored to max in applyShipDamage
    // when hull hits 0), applyShipDamage should NOT re-trigger a
    // gameover event because gameState is no longer 'playing'.
    applyShipDamage(ship, 1000, session.config, session.eventBus);
    expect(events).toEqual(['gameover']);
  });

  it('setConfig propagates autoTurretsEnabled to the simulation (Bug #3)', () => {
    session = createGameSession();
    expect(session.config.autoTurretsEnabled).toBe(true);

    session.setConfig({ autoTurretsEnabled: false });
    expect(session.config.autoTurretsEnabled).toBe(false);

    // After a step, the ship's runtime autoTurrets property should mirror
    // the updated config (see shipStatusSystem.updateCooldowns).
    const ship = session.getPlayerShip()!;
    session.step(1 / 60, EMPTY_INPUT);
    expect(ship.ship!.autoTurrets).toBe(false);
  });

  it('emits telemetryUpdate events during step', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'playing' });

    const telemetrySnapshots: Array<{ speed: number; asteroidCount: number }> = [];
    session.eventBus.on('telemetryUpdate', (telemetry) => {
      telemetrySnapshots.push({
        speed: telemetry.speed,
        asteroidCount: telemetry.asteroidCount,
      });
    });

    session.step(1 / 60, { ...EMPTY_INPUT, forward: true });
    session.step(1 / 60, { ...EMPTY_INPUT, forward: true });

    expect(telemetrySnapshots.length).toBeGreaterThanOrEqual(2);
    expect(telemetrySnapshots[0].asteroidCount).toBe(12);
  });

  it('emits asteroidDestroyed events when a projectile destroys an asteroid', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'playing' });

    let destroyCount = 0;
    session.eventBus.on('asteroidDestroyed', () => {
      destroyCount += 1;
    });

    // Teleport ship close to an asteroid and fire repeatedly
    const ship = session.getPlayerShip()!;
    const asteroids = Array.from(session.queries.asteroids);
    const target = asteroids[0];

    // Move ship near the target asteroid
    const targetPos = target.body.translation();
    ship.body.setTranslation({ x: targetPos.x, y: targetPos.y, z: targetPos.z + 3 }, true);

    // Fire many times to guarantee a hit
    for (let i = 0; i < 200; i++) {
      session.step(1 / 60, { ...EMPTY_INPUT, fire: true });
    }

    expect(destroyCount).toBeGreaterThan(0);
  });

  // ── Bug #1: configChange event emitted on toggle ──────────────────────

  it('emits configChange when keyboard T toggles autoTurretsEnabled (Bug #1)', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'playing' });

    const events: boolean[] = [];
    session.eventBus.on('configChange', ({ autoTurretsEnabled }) => {
      events.push(autoTurretsEnabled);
    });

    // Initial state is true. Pressing T should toggle to false.
    session.step(1 / 60, { ...EMPTY_INPUT, toggleAutoTurrets: true });
    expect(events).toEqual([false]);
    expect(session.config.autoTurretsEnabled).toBe(false);

    // Pressing T again should toggle back to true.
    session.step(1 / 60, { ...EMPTY_INPUT, toggleAutoTurrets: true });
    expect(events).toEqual([false, true]);
    expect(session.config.autoTurretsEnabled).toBe(true);
  });

  it('emits configChange when setConfig changes autoTurretsEnabled (Bug #1)', () => {
    session = createGameSession();

    const events: boolean[] = [];
    session.eventBus.on('configChange', ({ autoTurretsEnabled }) => {
      events.push(autoTurretsEnabled);
    });

    session.setConfig({ autoTurretsEnabled: false });
    expect(events).toEqual([false]);

    session.setConfig({ autoTurretsEnabled: true });
    expect(events).toEqual([false, true]);
  });

  it('does NOT emit configChange when setConfig is called with the same autoTurretsEnabled value', () => {
    session = createGameSession();

    const events: boolean[] = [];
    session.eventBus.on('configChange', ({ autoTurretsEnabled }) => {
      events.push(autoTurretsEnabled);
    });

    // Default is true, setting true again should NOT emit.
    session.setConfig({ autoTurretsEnabled: true });
    expect(events).toEqual([]);

    // Toggling emits, then setting the same value again should NOT emit.
    session.setConfig({ autoTurretsEnabled: false });
    expect(events).toEqual([false]);
    session.setConfig({ autoTurretsEnabled: false });
    expect(events).toEqual([false]);
  });

  // ── Bug #2: clearTransientEntities ────────────────────────────────────

  it('clearTransientEntities removes all asteroids and projectiles', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });

    // Sanity: initial asteroids exist.
    expect(Array.from(session.queries.asteroids).length).toBeGreaterThan(0);

    // Fire to create a projectile.
    const ship = session.getPlayerShip()!;
    ship.ship!.manualCooldown = 0;
    session.step(1 / 60, { ...EMPTY_INPUT, fire: true });
    expect(Array.from(session.queries.projectiles).length).toBeGreaterThan(0);

    session.clearTransientEntities();

    expect(Array.from(session.queries.asteroids)).toHaveLength(0);
    expect(Array.from(session.queries.projectiles)).toHaveLength(0);
    // The ship should still be present.
    expect(session.getPlayerShip()).not.toBeNull();
  });

  // ── Bug #5: clearTransientEntities must reset asteroidRespawnTimer ────
  //
  // Before the fix, createAsteroidField kept `asteroidRespawnTimer` in a
  // closure. clearTransientEntities deleted the asteroids but never reset
  // the timer, so the very next maintainAsteroids step would re-populate
  // ASTEROID_TARGET_COUNT asteroids in a single tick (the while-loop is
  // gated only by `if (asteroidRespawnTimer > 0) return;`). New asteroids
  // are seeded at the ship's position, so they spawned directly on top of
  // the freshly-reset ship — re-introducing the collision the previous
  // PR was meant to prevent.

  it('clearTransientEntities resets the asteroid respawn timer (Bug #5)', () => {
    session = createGameSession();
    session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });

    // Establish a "well-played" state where the respawn timer is well
    // below zero (the closure's local variable is decremented every
    // step in createAsteroidField.maintainAsteroids). We can confirm
    // this indirectly by stepping a few times — the field will stay
    // topped up at ASTEROID_TARGET_COUNT because the timer keeps
    // getting reset to ASTEROID_RESPAWN_DELAY inside the while-loop.
    const _ship = session.getPlayerShip()!;
    for (let i = 0; i < 5; i += 1) {
      session.step(1 / 60, EMPTY_INPUT);
    }
    expect(Array.from(session.queries.asteroids)).toHaveLength(12);

    // Wipe the field (simulating a restart).
    session.clearTransientEntities();
    expect(Array.from(session.queries.asteroids)).toHaveLength(0);

    // One step after the wipe. The timer must NOT allow the field to
    // re-populate to ASTEROID_TARGET_COUNT in this single tick — the
    // contract is "zero or one new asteroid per step after a clear",
    // never a full re-population. The ship should also be far enough
    // away from any newly-spawned asteroid that no immediate collision
    // occurs (spawnAsteroid places new bodies outside the inner radius).
    session.step(1 / 60, EMPTY_INPUT);

    const asteroidsAfterOneStep = Array.from(session.queries.asteroids).length;
    expect(asteroidsAfterOneStep).toBeLessThan(12);
  });
});
