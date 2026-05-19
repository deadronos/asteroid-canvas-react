import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useHudStore } from '../ui/useHudStore';
import { ensureRapierReady } from './rapier';
import { EMPTY_INPUT } from './types';
import { createGameSession } from './createGameSession';

describe('createGameSession', () => {
  let session: ReturnType<typeof createGameSession> | null = null;

  beforeEach(async () => {
    await ensureRapierReady();

    useHudStore.setState((state) => ({
      ...state,
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
});
