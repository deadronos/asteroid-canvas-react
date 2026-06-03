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

  it('routes the turret toggle through the zustand HUD store', () => {
    useHudStore.setState((state) => ({
      ...state,
      autoTurretsEnabled: false,
    }));
    session = createGameSession();

    session.step(1 / 60, {
      ...EMPTY_INPUT,
      toggleAutoTurrets: true,
    });

    expect(useHudStore.getState().autoTurretsEnabled).toBe(true);
  });

  it('does not apply damage and ignores input fire when gameState is menu', () => {
    useHudStore.setState((state) => ({
      ...state,
      gameState: 'menu',
    }));
    session = createGameSession();

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
    applyShipDamage(ship, 50);
    expect(ship.ship!.hull).toBe(maxHull);
  });

  it('transitions to gameover state when hull drops to 0 or below during playing state', () => {
    session = createGameSession();
    const ship = session.getPlayerShip()!;

    applyShipDamage(ship, 1000); // Exceeds ship max hull/shield/armor

    expect(useHudStore.getState().gameState).toBe('gameover');
  });
});
