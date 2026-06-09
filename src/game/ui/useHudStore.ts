import { create } from 'zustand';

import type { TelemetrySnapshot } from '../core/types';
import { HIGH_SCORE_STORAGE_KEY, readAndNormalizeHighScore } from './highScore';

const defaultTelemetry: TelemetrySnapshot = {
  shipName: 'Venture Cruiser',
  hull: 180,
  maxHull: 180,
  armor: 120,
  maxArmor: 120,
  shield: 95,
  maxShield: 95,
  speed: 0,
  asteroidCount: 0,
  turretCount: 2,
};

// Initial high score is read once at module load. Poisoned or missing
// keys are normalized in-place by `readAndNormalizeHighScore` (see
// issue #6), so the in-memory baseline always agrees with storage.
const getStoredHighScore = (): number => readAndNormalizeHighScore();

interface HudStore {
  gameState: 'menu' | 'playing' | 'gameover';
  autoTurretsEnabled: boolean;
  telemetry: TelemetrySnapshot;
  asteroidsDestroyed: number;
  highScore: number;
  setAutoTurrets: (enabled: boolean) => void;
  toggleAutoTurrets: () => void;
  updateTelemetry: (telemetry: TelemetrySnapshot) => void;
  setGameState: (state: 'menu' | 'playing' | 'gameover') => void;
  incrementAsteroidsDestroyed: () => void;
  resetScore: () => void;
}

export const useHudStore = create<HudStore>((set) => ({
  gameState: 'menu',
  autoTurretsEnabled: true,
  telemetry: defaultTelemetry,
  asteroidsDestroyed: 0,
  highScore: getStoredHighScore(),
  setAutoTurrets: (enabled) => set({ autoTurretsEnabled: enabled }),
  toggleAutoTurrets: () =>
    set((state) => ({
      autoTurretsEnabled: !state.autoTurretsEnabled,
    })),
  updateTelemetry: (telemetry) => set({ telemetry }),
  setGameState: (state) =>
    set(() => {
      const updates: Partial<HudStore> = { gameState: state };
      if (state === 'playing') {
        updates.asteroidsDestroyed = 0;
      }
      return updates;
    }),
  incrementAsteroidsDestroyed: () =>
    set((state) => {
      const nextScore = state.asteroidsDestroyed + 1;
      const nextHighScore = Math.max(state.highScore, nextScore);
      if (nextHighScore > state.highScore && typeof window !== 'undefined') {
        localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(nextHighScore));
      }
      return {
        asteroidsDestroyed: nextScore,
        highScore: nextHighScore,
      };
    }),
  resetScore: () => set({ asteroidsDestroyed: 0 }),
}));
