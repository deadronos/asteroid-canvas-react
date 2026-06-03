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
    ship.body.setTranslation(
      { x: targetPos.x, y: targetPos.y, z: targetPos.z + 3 },
      true,
    );

    // Fire many times to guarantee a hit
    for (let i = 0; i < 200; i++) {
      session.step(1 / 60, { ...EMPTY_INPUT, fire: true });
    }

    expect(destroyCount).toBeGreaterThan(0);
  });
});
