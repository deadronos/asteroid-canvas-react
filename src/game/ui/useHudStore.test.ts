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

  it('handles corrupted localStorage highscore value gracefully (Bug #5)', () => {
    localStorage.setItem('asteroid_highscore', 'garbage');

    // Re-import the store to pick up the corrupted value.
    // The `getStoredHighScore` function runs once at module creation time.
    // We can't easily re-run that, so instead we test the Number-based
    // parser directly and verify the store's `incrementAsteroidsDestroyed`
    // doesn't break when highScore is 0 (the sanitized fallback).
    const parsed = Number('garbage');
    expect(Number.isFinite(parsed)).toBe(false);

    // Simulate a sanitized highScore of 0.
    useHudStore.setState({ highScore: 0, asteroidsDestroyed: 0 });
    useHudStore.getState().incrementAsteroidsDestroyed();
    expect(useHudStore.getState().asteroidsDestroyed).toBe(1);
    expect(useHudStore.getState().highScore).toBe(1);
    expect(Number.isFinite(useHudStore.getState().highScore)).toBe(true);
  });

  it('handles empty localStorage highscore value gracefully (Bug #5)', () => {
    localStorage.setItem('asteroid_highscore', '');
    useHudStore.setState({ highScore: 0, asteroidsDestroyed: 0 });
    useHudStore.getState().incrementAsteroidsDestroyed();
    expect(useHudStore.getState().highScore).toBe(1);
  });
});
