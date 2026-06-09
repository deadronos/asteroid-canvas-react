/**
 * Owns the localStorage key for the high-score value.
 *
 * Issue #6: a poisoned key (non-numeric, negative, or from a different
 * app / older schema) used to silently fall back to 0 in memory while
 * the bad value stayed in storage indefinitely — `incrementAsteroidsDestroyed`
 * only writes when the score strictly improves, so a stored "0" could
 * never beat itself. This module normalizes storage on read: if the
 * stored value is missing or invalid, we rewrite it to "0" so subsequent
 * reads return a consistent, valid baseline.
 */

export const HIGH_SCORE_STORAGE_KEY = 'asteroid_highscore';

/**
 * A score is "valid" only when the stored string is a literal
 * non-negative integer (e.g. "0", "42"). We deliberately reject
 * `Number('') === 0` and `Number('   ') === 0` (both real JS quirks
 * that would otherwise let a poisoned key pass validation), and we
 * reject negative values, NaN, Infinity, and non-integer floats —
 * the high score is a count of destroyed asteroids, always an int.
 */
const VALID_STORED_SCORE = /^(0|[1-9][0-9]*)$/;

const isValidStoredScore = (raw: string | null): boolean => {
  if (raw === null) {
    return false;
  }
  return VALID_STORED_SCORE.test(raw);
};

/**
 * Reads the high score from localStorage, normalizes the stored value
 * to a valid non-negative integer (rewriting a poisoned key to "0"),
 * and returns the canonical value. Safe to call in non-browser
 * environments (returns 0 without touching storage).
 */
export const readAndNormalizeHighScore = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
  if (isValidStoredScore(raw)) {
    return Number(raw);
  }

  // Repair the poisoned key so the next read is consistent.
  localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '0');
  return 0;
};
