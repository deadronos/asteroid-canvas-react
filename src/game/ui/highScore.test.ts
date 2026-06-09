import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readAndNormalizeHighScore, HIGH_SCORE_STORAGE_KEY } from './highScore';

describe('highScore (Issue #6: poisoned localStorage repair)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns 0 and rewrites the stored key when the value is non-numeric', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, 'garbage');

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const value = readAndNormalizeHighScore();

    expect(value).toBe(0);
    // The poisoned key MUST be repaired to "0" on read, not deferred
    // until the next valid increment. See issue #6.
    expect(setItemSpy).toHaveBeenCalledWith(HIGH_SCORE_STORAGE_KEY, '0');
    expect(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe('0');
  });

  it('returns 0 and rewrites the stored key for an empty string', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '');

    const value = readAndNormalizeHighScore();

    expect(value).toBe(0);
    expect(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe('0');
  });

  it('returns the stored numeric value unchanged when it is a non-negative integer', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '42');

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const value = readAndNormalizeHighScore();

    expect(value).toBe(42);
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe('42');
  });

  it('returns 0 and rewrites the stored key for negative numeric values', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '-5');

    const value = readAndNormalizeHighScore();

    expect(value).toBe(0);
    expect(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe('0');
  });

  it('returns 0 and rewrites the stored key for NaN-shaped inputs (e.g. whitespace)', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '   ');

    const value = readAndNormalizeHighScore();

    expect(value).toBe(0);
    expect(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe('0');
  });

  it('returns 0 (and does not throw) when localStorage is missing (SSR / no window)', () => {
    const originalWindow = globalThis.window;
    // Simulate a non-browser environment.
    // @ts-expect-error - intentionally removing window for the test
    delete (globalThis as { window?: unknown }).window;

    try {
      expect(readAndNormalizeHighScore()).toBe(0);
    } finally {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
  });
});
