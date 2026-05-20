import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHudStore } from './useHudStore';

describe('useHudStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useHudStore.setState({
      gameState: 'menu',
      autoTurretsEnabled: true,
      asteroidsDestroyed: 0,
      highScore: 0,
    });
    localStorage.clear();
  });

  it('has correct initial values', () => {
    const state = useHudStore.getState();
    expect(state.gameState).toBe('menu');
    expect(state.autoTurretsEnabled).toBe(true);
    expect(state.asteroidsDestroyed).toBe(0);
    expect(state.highScore).toBe(0);
  });

  it('sets and toggles autoTurretsEnabled', () => {
    useHudStore.getState().setAutoTurrets(false);
    expect(useHudStore.getState().autoTurretsEnabled).toBe(false);

    useHudStore.getState().toggleAutoTurrets();
    expect(useHudStore.getState().autoTurretsEnabled).toBe(true);
  });

  it('updates telemetry', () => {
    const testTelemetry = {
      shipName: 'Test Vessel',
      hull: 100,
      maxHull: 100,
      armor: 50,
      maxArmor: 50,
      shield: 30,
      maxShield: 30,
      speed: 15.5,
      asteroidCount: 5,
      turretCount: 4,
    };

    useHudStore.getState().updateTelemetry(testTelemetry);
    expect(useHudStore.getState().telemetry).toEqual(testTelemetry);
  });

  it('transitions game state and resets score on playing state', () => {
    useHudStore.setState({ asteroidsDestroyed: 10 });

    useHudStore.getState().setGameState('gameover');
    expect(useHudStore.getState().gameState).toBe('gameover');
    expect(useHudStore.getState().asteroidsDestroyed).toBe(10);

    useHudStore.getState().setGameState('playing');
    expect(useHudStore.getState().gameState).toBe('playing');
    expect(useHudStore.getState().asteroidsDestroyed).toBe(0);
  });

  it('increments asteroids destroyed and updates high score/localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    useHudStore.getState().incrementAsteroidsDestroyed();
    expect(useHudStore.getState().asteroidsDestroyed).toBe(1);
    expect(useHudStore.getState().highScore).toBe(1);
    expect(setItemSpy).toHaveBeenCalledWith('asteroid_highscore', '1');

    // Increment again
    useHudStore.getState().incrementAsteroidsDestroyed();
    expect(useHudStore.getState().asteroidsDestroyed).toBe(2);
    expect(useHudStore.getState().highScore).toBe(2);
    expect(setItemSpy).toHaveBeenCalledWith('asteroid_highscore', '2');

    // Set score to 0 and increment again but score < highscore
    useHudStore.setState({ asteroidsDestroyed: 0 });
    setItemSpy.mockClear();
    useHudStore.getState().incrementAsteroidsDestroyed();
    expect(useHudStore.getState().asteroidsDestroyed).toBe(1);
    expect(useHudStore.getState().highScore).toBe(2); // High score remains 2
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('resets score', () => {
    useHudStore.setState({ asteroidsDestroyed: 5 });
    useHudStore.getState().resetScore();
    expect(useHudStore.getState().asteroidsDestroyed).toBe(0);
  });
});
